"""Restaura uma copia em um banco NOVO. Nunca sobrescreve um banco com tabelas.

Rodar, dentro de Backend/:
  python -m app.scripts.restaurar ultimo --banco ardap_restaurado
  python -m app.scripts.restaurar copia.json.gz --banco ardap_restaurado
  python -m app.scripts.restaurar ultimo --banco ardap_restaurado --arquivos pasta

"ultimo" baixa a copia mais recente do bucket de backup. Com --arquivos, baixa
tambem as fotos e os anexos para a pasta indicada.
"""

import argparse
import re
from pathlib import Path

import pymysql

from app.core.config import settings
from app.core.database import connect_args
from app.scripts.copia import (
    PASTA_ARQUIVOS,
    PASTA_BANCO,
    abrir,
    cliente_backup,
    contagens,
    listar,
)


def ler_copia(origem: str) -> bytes:
    if origem != "ultimo":
        return Path(origem).read_bytes()
    cliente = cliente_backup()
    bucket = settings.BACKUP_R2_BUCKET
    chaves = listar(cliente, bucket, PASTA_BANCO)
    if not chaves:
        raise SystemExit("Nenhuma copia no bucket de backup.")
    chave = max(chaves)  # o nome comeca pela data
    print("Copia:", chave)
    return cliente.get_object(Bucket=bucket, Key=chave)["Body"].read()


def sem_nomes_de_fk(estrutura: str) -> str:
    """O TiDB repete nomes (fk_1) entre tabelas, e o MySQL nao aceita.

    Sem o nome, o proprio banco gera um.
    """
    return re.sub(r"(?m)^(\s*)CONSTRAINT `[^`]+` FOREIGN KEY", r"\1FOREIGN KEY", estrutura)


def restaurar_banco(copia: dict, banco: str) -> None:
    conexao = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        charset="utf8mb4",
        **connect_args,
    )
    try:
        with conexao.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{banco}`")
            cursor.execute(f"USE `{banco}`")
            cursor.execute("SHOW TABLES")
            if cursor.fetchall():
                raise SystemExit(f"O banco {banco} ja tem tabelas: nada foi alterado.")
            # as tabelas referenciam umas as outras
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            for tabela in copia["tabelas"]:
                cursor.execute(sem_nomes_de_fk(tabela["estrutura"]))
            for tabela in copia["tabelas"]:
                if not tabela["linhas"]:
                    continue
                colunas = ", ".join(f"`{c}`" for c in tabela["colunas"])
                valores = ", ".join(["%s"] * len(tabela["colunas"]))
                cursor.executemany(
                    f"INSERT INTO `{tabela['nome']}` ({colunas}) VALUES ({valores})",
                    tabela["linhas"],
                )
            conexao.commit()
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            for nome, esperado in contagens(copia).items():
                cursor.execute(f"SELECT COUNT(*) FROM `{nome}`")
                total = cursor.fetchone()[0]
                if total != esperado:
                    raise SystemExit(f"{nome}: {total} linha(s), esperado {esperado}.")
                print(f"  {nome}: {total}")
    finally:
        conexao.close()


def restaurar_arquivos(pasta: Path) -> None:
    cliente = cliente_backup()
    bucket = settings.BACKUP_R2_BUCKET
    raiz = pasta.resolve()
    chaves = listar(cliente, bucket, PASTA_ARQUIVOS)
    for chave in chaves:
        destino = (raiz / chave.removeprefix(PASTA_ARQUIVOS)).resolve()
        if not destino.is_relative_to(raiz):
            raise SystemExit(f"Caminho invalido no backup: {chave}")
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(cliente.get_object(Bucket=bucket, Key=chave)["Body"].read())
    print(f"Arquivos baixados: {len(chaves)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Restaura um backup do ARDAP.")
    parser.add_argument("origem", help='"ultimo" ou o caminho de uma copia')
    parser.add_argument("--banco", required=True, help="banco novo, sem tabelas")
    parser.add_argument("--arquivos", type=Path, help="pasta para fotos e anexos")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_]{1,64}", args.banco):
        parser.error("--banco aceita apenas letras, numeros e _")

    copia = abrir(ler_copia(args.origem))
    print(f"Gerada em {copia['gerado_em']}. Restaurando em {args.banco}, {settings.DB_HOST}")
    restaurar_banco(copia, args.banco)
    if args.arquivos:
        restaurar_arquivos(args.arquivos)
    print("Restauracao concluida.")


if __name__ == "__main__":
    main()
