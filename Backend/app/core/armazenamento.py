"""Arquivos enviados: Cloudflare R2 ou, em desenvolvimento, Backend/uploads.

O banco guarda apenas a chave do arquivo, ex.: animais/<uuid>.jpg

Fotos de animais ganham duas versoes reduzidas em WebP ao lado do original
(animais/<uuid>_mini.webp e animais/<uuid>_media.webp). O navegador baixa
essas versoes direto do bucket, por URLs assinadas e temporarias, sem passar
pela API.
"""

import hashlib
import hmac
import io
import logging
import time
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

import boto3
from PIL import Image, ImageOps
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)

# Backend/uploads (fora do git), independente da pasta de execucao
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_BYTES = 5 * 1024 * 1024

TIPOS = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}
IMAGENS = (".jpg", ".png", ".webp")

# lado maior, em pixels: mini para listas e cartoes, media para o perfil
VARIANTES = {"mini": 320, "media": 1024}
QUALIDADE_WEBP = 80
# a imagem decodificada nao pode passar disso (protege contra "bombas")
Image.MAX_IMAGE_PIXELS = 40_000_000

# A URL assinada vale por 1 hora e e reaproveitada por 30 minutos, para que o
# navegador encontre a foto no cache em vez de baixa-la de novo.
VALIDADE_URL = 60 * 60
REUSO_URL = 30 * 60
# cada upload gera chaves novas: o conteudo de uma chave nunca muda
CACHE_IMUTAVEL = "private, max-age=31536000, immutable"


def identificar(conteudo: bytes) -> str | None:
    """Extensao pelo conteudo, nao pelo nome do arquivo."""
    if conteudo.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if conteudo.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return ".webp"
    if conteudo.startswith(b"%PDF-"):
        return ".pdf"
    return None


def tipo_da_chave(chave: str) -> str:
    return TIPOS.get(Path(chave).suffix, "application/octet-stream")


def cliente_r2(access_key_id: str, secret_access_key: str):
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        region_name="auto",
        config=Config(
            connect_timeout=5,
            read_timeout=20,
            retries={"max_attempts": 3},
            # o R2 nao aceita todos os checksums que o boto3 envia por padrao
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )


@lru_cache
def _r2():
    return cliente_r2(settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY)


def _indisponivel(erro: Exception) -> HTTPException:
    logger.error("Falha no armazenamento de arquivos: %s", erro)
    return HTTPException(
        status_code=503,
        detail="Armazenamento de arquivos indisponível. Tente novamente.",
    )


def _gravar(chave: str, conteudo: bytes, cache: str | None = None) -> None:
    if settings.usa_r2:
        extras = {"CacheControl": cache} if cache else {}
        try:
            _r2().put_object(
                Bucket=settings.R2_BUCKET,
                Key=chave,
                Body=conteudo,
                ContentType=tipo_da_chave(chave),
                **extras,
            )
        except (BotoCoreError, ClientError) as erro:
            raise _indisponivel(erro) from erro
        return
    destino = UPLOADS_DIR / chave
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(conteudo)


def salvar(pasta: str, conteudo: bytes, extensao: str) -> str:
    """Grava o arquivo e devolve a chave."""
    chave = f"{pasta}/{uuid4().hex}{extensao}"
    _gravar(chave, conteudo)
    return chave


# ---------------------------------------------------------------------------
# Fotos: versoes reduzidas
# ---------------------------------------------------------------------------
class ImagemInvalida(ValueError):
    """O conteudo nao pode ser lido como imagem."""


def chave_variante(chave: str, nome: str) -> str:
    """animais/abc.jpg -> animais/abc_mini.webp"""
    return f"{chave.rsplit('.', 1)[0]}_{nome}.webp"


def gerar_variantes(conteudo: bytes) -> dict[str, bytes]:
    """Versoes reduzidas em WebP, ja na orientacao certa (EXIF do celular)."""
    try:
        with Image.open(io.BytesIO(conteudo)) as original:
            imagem = ImageOps.exif_transpose(original)
            imagem = imagem.convert("RGBA" if "A" in imagem.getbands() else "RGB")
            variantes = {}
            for nome, lado in VARIANTES.items():
                copia = imagem.copy()
                copia.thumbnail((lado, lado), Image.Resampling.LANCZOS)
                saida = io.BytesIO()
                copia.save(saida, "WEBP", quality=QUALIDADE_WEBP, method=4)
                variantes[nome] = saida.getvalue()
            return variantes
    except (OSError, ValueError, Image.DecompressionBombError) as erro:
        raise ImagemInvalida(str(erro)) from erro


def salvar_variantes(chave: str, conteudo: bytes) -> None:
    for nome, dados in gerar_variantes(conteudo).items():
        _gravar(chave_variante(chave, nome), dados, CACHE_IMUTAVEL)


def salvar_foto(pasta: str, conteudo: bytes, extensao: str) -> str:
    """Grava a foto original e as versoes reduzidas; devolve a chave."""
    variantes = gerar_variantes(conteudo)  # valida antes de gravar qualquer coisa
    chave = salvar(pasta, conteudo, extensao)
    try:
        for nome, dados in variantes.items():
            _gravar(chave_variante(chave, nome), dados, CACHE_IMUTAVEL)
    except Exception:
        apagar_foto(chave)
        raise
    return chave


def apagar_foto(chave: str) -> None:
    """Apaga a foto original e as versoes reduzidas."""
    apagar(chave)
    for nome in VARIANTES:
        apagar(chave_variante(chave, nome))


def existe(chave: str) -> bool:
    if settings.usa_r2:
        try:
            _r2().head_object(Bucket=settings.R2_BUCKET, Key=chave)
            return True
        except ClientError as erro:
            if erro.response["Error"]["Code"] in ("NoSuchKey", "404", "NotFound"):
                return False
            raise _indisponivel(erro) from erro
        except BotoCoreError as erro:
            raise _indisponivel(erro) from erro
    return (UPLOADS_DIR / chave).is_file()


# ---------------------------------------------------------------------------
# URLs assinadas
# ---------------------------------------------------------------------------
_urls: dict[str, tuple[str, float]] = {}


def _assinatura(chave: str, expira: int) -> str:
    mensagem = f"{chave}:{expira}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), mensagem, hashlib.sha256).hexdigest()


def assinatura_valida(chave: str, expira: int, assinatura: str) -> bool:
    if expira < time.time():
        return False
    return hmac.compare_digest(_assinatura(chave, expira), assinatura)


def url_assinada(chave: str) -> str:
    """Link temporario para o navegador baixar o arquivo sem passar pela API.

    Com R2, e uma URL pre-assinada do bucket (que continua privado). Sem R2,
    e a rota /arquivos da propria API, assinada com a SECRET_KEY.
    """
    agora = time.time()
    guardada = _urls.get(chave)
    if guardada and agora - guardada[1] < REUSO_URL:
        return guardada[0]

    if settings.usa_r2:
        try:
            url = _r2().generate_presigned_url(
                "get_object",
                # o cabecalho de cache vem do proprio objeto (gravado com
                # CACHE_IMUTAVEL em salvar_foto/salvar_variantes)
                Params={"Bucket": settings.R2_BUCKET, "Key": chave},
                ExpiresIn=VALIDADE_URL,
            )
        except (BotoCoreError, ClientError) as erro:
            raise _indisponivel(erro) from erro
    else:
        expira = int(agora) + VALIDADE_URL
        assinatura = _assinatura(chave, expira)
        url = f"/arquivos/{quote(chave)}?expira={expira}&assinatura={assinatura}"

    if len(_urls) > 5000:
        _urls.clear()
    _urls[chave] = (url, agora)
    return url


def url_foto(chave: str | None, variante: str) -> str | None:
    """URL da versao reduzida de uma foto, ou None se nao houver foto."""
    return url_assinada(chave_variante(chave, variante)) if chave else None


def ler(chave: str) -> bytes | None:
    """Conteudo do arquivo, ou None se ele nao existir."""
    if settings.usa_r2:
        try:
            resposta = _r2().get_object(Bucket=settings.R2_BUCKET, Key=chave)
            return resposta["Body"].read()
        except ClientError as erro:
            if erro.response["Error"]["Code"] in ("NoSuchKey", "404"):
                return None
            raise _indisponivel(erro) from erro
        except BotoCoreError as erro:
            raise _indisponivel(erro) from erro
    arquivo = UPLOADS_DIR / chave
    return arquivo.read_bytes() if arquivo.is_file() else None


def apagar(chave: str) -> None:
    """Uma falha aqui so deixa um arquivo sobrando: registra e segue."""
    try:
        if settings.usa_r2:
            _r2().delete_object(Bucket=settings.R2_BUCKET, Key=chave)
        else:
            (UPLOADS_DIR / chave).unlink(missing_ok=True)
    except (BotoCoreError, ClientError, OSError) as erro:
        logger.warning("Arquivo %s nao foi apagado: %s", chave, erro)
