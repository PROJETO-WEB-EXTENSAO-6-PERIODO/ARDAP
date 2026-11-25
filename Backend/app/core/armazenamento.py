"""Arquivos enviados: Cloudflare R2 ou, em desenvolvimento, Backend/uploads.

O banco guarda apenas a chave do arquivo, ex.: animais/<uuid>.jpg
"""

import logging
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

import boto3
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


def salvar(pasta: str, conteudo: bytes, extensao: str) -> str:
    """Grava o arquivo e devolve a chave."""
    chave = f"{pasta}/{uuid4().hex}{extensao}"
    if settings.usa_r2:
        try:
            _r2().put_object(
                Bucket=settings.R2_BUCKET,
                Key=chave,
                Body=conteudo,
                ContentType=tipo_da_chave(chave),
            )
        except (BotoCoreError, ClientError) as erro:
            raise _indisponivel(erro) from erro
        return chave
    destino = UPLOADS_DIR / chave
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(conteudo)
    return chave


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
