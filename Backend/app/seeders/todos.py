"""Popula um banco vazio com dados ficticios dos ultimos 12 meses.

Rodar, dentro de Backend/:  python -m app.seeders.todos

Precisa de ao menos um usuario (app.scripts.criar_admin) e se recusa a rodar
se ja houver algum registro. Tudo e gravado em uma unica transacao.
"""

from random import Random

from sqlalchemy import func, select

from app.core import armazenamento
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.adocao import Adocao
from app.models.animal import Animal
from app.models.castracao import Castracao
from app.models.cirurgia import Cirurgia
from app.models.eutanasia import Eutanasia
from app.models.hipossuficiencia import Hipossuficiencia
from app.models.intake import SupatasIntake
from app.seeders.animais import semear_animais
from app.seeders.comum import Pessoas, usuarios
from app.seeders.formularios import (
    semear_adocoes,
    semear_castracoes,
    semear_cirurgias,
    semear_declaracoes,
    semear_eutanasias,
    semear_supatas,
)

MODELOS = (
    Animal, SupatasIntake, Adocao, Castracao, Cirurgia, Eutanasia, Hipossuficiencia
)


def semear(db, arquivos: list[str]) -> dict[str, int]:
    if not usuarios(db):
        raise SystemExit("Crie antes um usuario: python -m app.scripts.criar_admin")
    ocupadas = [
        m.__tablename__ for m in MODELOS
        if db.scalar(select(func.count()).select_from(m))
    ]
    if ocupadas:
        raise SystemExit("O banco ja tem registros em: " + ", ".join(ocupadas))
    # semente fixa: os mesmos dados a cada execucao, com datas relativas a hoje
    sorteio = Random(2026)
    pessoas = Pessoas(sorteio)
    animais = semear_animais(db, sorteio, arquivos)
    return {
        "animais": len(animais),
        "supatas_intake": semear_supatas(db, sorteio, pessoas, animais),
        "termo_adocao": semear_adocoes(db, sorteio, pessoas, animais),
        "castracao": semear_castracoes(db, sorteio, pessoas, animais),
        "cirurgia": semear_cirurgias(db, sorteio, pessoas, animais),
        "eutanasia": semear_eutanasias(db, sorteio, pessoas, animais),
        "hipossuficiencia": semear_declaracoes(db, sorteio, pessoas, arquivos),
    }


def main() -> None:
    print(f"Banco: {settings.DB_NAME} em {settings.DB_HOST}")
    arquivos: list[str] = []
    with SessionLocal() as db:
        try:
            totais = semear(db, arquivos)
            db.commit()
        except BaseException:
            # sem registro no banco, os arquivos ficariam orfaos
            for chave in arquivos:
                if chave.startswith("animais/"):
                    armazenamento.apagar_foto(chave)
                else:
                    armazenamento.apagar(chave)
            raise
    for tabela, total in totais.items():
        print(f"  {tabela}: {total}")
    fotos = sum(1 for a in arquivos if a.startswith("animais/"))
    print(f"  fotos: {fotos}, anexos: {len(arquivos) - fotos}")


if __name__ == "__main__":
    main()
