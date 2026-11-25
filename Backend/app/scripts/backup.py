"""Copia o banco e os arquivos para o bucket de backup.

Rodar, dentro de Backend/:  python -m app.scripts.backup
Roda todo dia pelo GitHub Actions (.github/workflows/backup.yml).
O log mostra so contagens, nunca os dados.
"""

from datetime import datetime, timedelta

from app.core.armazenamento import cliente_r2
from app.core.config import settings
from app.core.database import engine
from app.core.horario import agora
from app.scripts.copia import (
    PASTA_ARQUIVOS,
    PASTA_BANCO,
    abrir,
    cliente_backup,
    contagens,
    gerar,
    listar,
)

DIAS_GUARDADOS = 30
MINIMO_GUARDADO = 7
FORMATO_NOME = "%Y-%m-%d_%H-%M-%S"
SUFIXO = ".json.gz"


def copiar_banco(destino, bucket: str) -> None:
    conexao = engine.raw_connection()
    try:
        conteudo = gerar(conexao)
    finally:
        conexao.close()
    totais = contagens(abrir(conteudo))
    # um banco sem usuarios indica que algo esta errado na origem
    if not totais.get("users"):
        raise SystemExit("A tabela users esta vazia ou nao existe: backup recusado.")

    chave = f"{PASTA_BANCO}{agora().strftime(FORMATO_NOME)}{SUFIXO}"
    destino.put_object(
        Bucket=bucket, Key=chave, Body=conteudo, ContentType="application/gzip"
    )
    # confere o que ficou guardado, nao o que foi enviado
    guardado = destino.get_object(Bucket=bucket, Key=chave)["Body"].read()
    if guardado != conteudo:
        # uma copia ruim nao pode ficar como a mais recente
        destino.delete_object(Bucket=bucket, Key=chave)
        raise SystemExit("O backup guardado difere do gerado.")
    print(f"Banco: {chave} ({len(conteudo)} bytes)")
    for nome, total in totais.items():
        print(f"  {nome}: {total}")


def copiar_arquivos(origem, bucket_origem: str, destino, bucket: str) -> None:
    """Copia o que falta. O que sai da origem continua no backup."""
    existentes = listar(origem, bucket_origem)
    copiados = listar(destino, bucket, PASTA_ARQUIVOS)
    novos = [
        chave
        for chave, tamanho in existentes.items()
        if copiados.get(PASTA_ARQUIVOS + chave) != tamanho
    ]
    ignorados = 0
    for chave in novos:
        try:
            objeto = origem.get_object(Bucket=bucket_origem, Key=chave)
        except origem.exceptions.NoSuchKey:
            # apagado pelo sistema entre a listagem e a copia
            ignorados += 1
            continue
        destino.put_object(
            Bucket=bucket,
            Key=PASTA_ARQUIVOS + chave,
            Body=objeto["Body"].read(),
            ContentType=objeto.get("ContentType", "application/octet-stream"),
        )
    print(
        f"Arquivos: {len(existentes)} na origem, "
        f"{len(novos) - ignorados} copiado(s) agora"
    )


def apagar_antigos(destino, bucket: str) -> None:
    """So mexe nas copias do banco, e sempre deixa as mais recentes."""
    limite = agora() - timedelta(days=DIAS_GUARDADOS)
    datas: dict[str, datetime] = {}
    for chave in listar(destino, bucket, PASTA_BANCO):
        nome = chave.removeprefix(PASTA_BANCO).removesuffix(SUFIXO)
        try:
            datas[chave] = datetime.strptime(nome, FORMATO_NOME)
        except ValueError:
            continue
    recentes = sorted(datas, key=datas.__getitem__, reverse=True)
    antigos = [c for c in recentes[MINIMO_GUARDADO:] if datas[c] < limite]
    for chave in antigos:
        destino.delete_object(Bucket=bucket, Key=chave)
    print(f"Copias do banco guardadas: {len(recentes) - len(antigos)}")


def main() -> None:
    if not settings.usa_r2:
        raise SystemExit("Defina as variaveis R2_* do bucket de arquivos.")
    if settings.BACKUP_R2_BUCKET == settings.R2_BUCKET:
        raise SystemExit("O backup precisa de um bucket separado.")
    destino = cliente_backup()
    bucket = settings.BACKUP_R2_BUCKET
    origem = cliente_r2(settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY)
    copiar_banco(destino, bucket)
    copiar_arquivos(origem, settings.R2_BUCKET, destino, bucket)
    # por ultimo: so apaga copias antigas se a nova deu certo
    apagar_antigos(destino, bucket)
    print("Backup concluido.")


if __name__ == "__main__":
    main()
