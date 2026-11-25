"""Regras do vinculo entre um procedimento e um animal cadastrado."""

from fastapi import HTTPException
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.eutanasia import Eutanasia


def animal_eutanasiado():
    """Condicao SQL: o animal tem um termo de eutanasia vinculado."""
    return exists().where(Eutanasia.animal_id == Animal.id)


def validar_animal(db: Session, animal_id: int | None) -> None:
    """Sem vinculo e permitido; com vinculo, o animal precisa existir e nao
    ter passado por eutanasia."""
    if animal_id is None:
        return
    if db.get(Animal, animal_id) is None:
        raise HTTPException(
            status_code=404, detail="Animal vinculado não encontrado."
        )
    if db.scalar(
        select(Animal.id).where(Animal.id == animal_id, animal_eutanasiado())
    ):
        raise HTTPException(
            status_code=409,
            detail="Este animal já passou por eutanásia e não pode ser vinculado.",
        )
