"""Edicao dos registros dos formularios."""

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.animal_vinculo import validar_animal
from app.models.user import User


def editar_registro(
    db: Session, registro, data: BaseModel, user: User
):
    """Aplica os dados do formulario e registra quem alterou.

    O autor do cadastro (funcionario_id) nao muda.
    """
    novos = data.model_dump()
    # So valida o vinculo quando ele muda: um registro antigo continua
    # editavel mesmo que o animal tenha passado por eutanasia depois.
    if "animal_id" in novos and novos["animal_id"] != registro.animal_id:
        validar_animal(db, novos["animal_id"])
    for campo, valor in novos.items():
        setattr(registro, campo, valor)
    registro.alterado_por_id = user.id
    db.commit()
    db.refresh(registro)
    return registro
