"""Formato das copias do banco, usado por backup.py e restaurar.py.

JSON comprimido com a estrutura e as linhas de cada tabela. Datas e decimais
viram texto, que o MySQL converte de volta ao gravar.
"""

import gzip
import json
from datetime import date, datetime
from decimal import Decimal

from app.core.armazenamento import cliente_r2
from app.core.config import settings
from app.core.horario import agora

FORMATO = 1
PASTA_BANCO = "banco/"
PASTA_ARQUIVOS = "arquivos/"


def _converter(valor):
    if isinstance(valor, datetime):
        return valor.isoformat(sep=" ")
    if isinstance(valor, date):
        return valor.isoformat()
    if isinstance(valor, Decimal):
        return str(valor)
    # melhor falhar do que guardar um valor que nao volta igual
    raise TypeError(f"Tipo sem suporte no backup: {type(valor).__name__}")


def gerar(conexao) -> bytes:
    """Copia todas as tabelas de um mesmo instante."""
    with conexao.cursor() as cursor:
        cursor.execute("START TRANSACTION WITH CONSISTENT SNAPSHOT")
        cursor.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'")
        nomes = [linha[0] for linha in cursor.fetchall()]
        tabelas = []
        for nome in nomes:
            cursor.execute(f"SHOW CREATE TABLE `{nome}`")
            estrutura = cursor.fetchone()[1]
            cursor.execute(f"SELECT * FROM `{nome}`")
            tabelas.append({
                "nome": nome,
                "estrutura": estrutura,
                "colunas": [c[0] for c in cursor.description],
                "linhas": [list(linha) for linha in cursor.fetchall()],
            })
    conexao.rollback()
    copia = {
        "formato": FORMATO,
        "gerado_em": agora().isoformat(timespec="seconds"),
        "tabelas": tabelas,
    }
    texto = json.dumps(copia, ensure_ascii=False, default=_converter)
    return gzip.compress(texto.encode("utf-8"))


def abrir(conteudo: bytes) -> dict:
    copia = json.loads(gzip.decompress(conteudo))
    if copia.get("formato") != FORMATO:
        raise SystemExit("Formato de backup desconhecido.")
    return copia


def contagens(copia: dict) -> dict[str, int]:
    return {t["nome"]: len(t["linhas"]) for t in copia["tabelas"]}


def cliente_backup():
    faltando = [
        nome
        for nome in (
            "R2_ACCOUNT_ID",
            "BACKUP_R2_ACCESS_KEY_ID",
            "BACKUP_R2_SECRET_ACCESS_KEY",
            "BACKUP_R2_BUCKET",
        )
        if not getattr(settings, nome)
    ]
    if faltando:
        raise SystemExit("Defina: " + ", ".join(faltando))
    return cliente_r2(
        settings.BACKUP_R2_ACCESS_KEY_ID, settings.BACKUP_R2_SECRET_ACCESS_KEY
    )


def listar(cliente, bucket: str, prefixo: str = "") -> dict[str, int]:
    """Chave e tamanho de cada objeto."""
    objetos: dict[str, int] = {}
    token = None
    while True:
        extra = {"ContinuationToken": token} if token else {}
        pagina = cliente.list_objects_v2(Bucket=bucket, Prefix=prefixo, **extra)
        for objeto in pagina.get("Contents", []):
            objetos[objeto["Key"]] = objeto["Size"]
        if not pagina.get("IsTruncated"):
            return objetos
        token = pagina["NextContinuationToken"]
