"""Validacao do vinculo entre um procedimento e um animal cadastrado."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.animal import Animal


def validar_animal(db: Session, animal_id: int | None) -> None:
    """Sem vinculo e permitido; com vinculo, o animal precisa existir."""
    if animal_id is not None and db.get(Animal, animal_id) is None:
        raise HTTPException(
            status_code=404, detail="Animal vinculado não encontrado."
        )
