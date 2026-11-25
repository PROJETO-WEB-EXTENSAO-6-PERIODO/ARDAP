"""Apoio aos seeders dos formularios."""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.animal import Animal
from app.models.user import User
from app.seeders.animais import MARCADOR, semear_animais

ESPECIES = {"cao": "Cão", "gato": "Gato"}


def animais_semeados(db: Session) -> dict[str, Animal]:
    """Garante os animais do seeder e os devolve por nome."""
    semear_animais(db)
    return {
        a.nome: a
        for a in db.scalars(select(Animal).where(Animal.observacoes == MARCADOR))
    }


def primeiro_funcionario(db: Session) -> int | None:
    return db.scalar(select(User.id).order_by(User.id).limit(1))


def dias_atras(dias: int) -> datetime:
    return datetime.now() - timedelta(days=dias)


def executar(nome: str, semear, esperado: int) -> None:
    with SessionLocal() as db:
        total = semear(db)
        db.commit()
    print(f"{nome}: {total} criado(s), {esperado - total} ja existia(m).")
