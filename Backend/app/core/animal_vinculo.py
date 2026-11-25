"""Regras do vinculo entre um procedimento e um animal cadastrado."""

from fastapi import HTTPException
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.adocao import Adocao
from app.models.animal import Animal
from app.models.castracao import Castracao
from app.models.eutanasia import Eutanasia
from app.models.user import User


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


def animal_adotado(exceto_adocao: int | None = None):
    """Condicao SQL: o animal tem um termo de adocao vinculado."""
    condicao = exists().where(Adocao.animal_id == Animal.id)
    if exceto_adocao is not None:
        condicao = condicao.where(Adocao.id != exceto_adocao)
    return condicao


def validar_nao_adotado(db: Session, animal_id: int) -> None:
    """Um animal ja adotado nao pode ser vinculado a outra adocao."""
    if db.scalar(
        select(Animal.id).where(Animal.id == animal_id, animal_adotado())
    ):
        raise HTTPException(
            status_code=409,
            detail="Este animal já foi adotado e não pode ser vinculado a outra adoção.",
        )


def animal_com_termo_castracao():
    """Condicao SQL: o animal tem um termo de castracao vinculado."""
    return exists().where(Castracao.animal_id == Animal.id)


def marcar_castrado(db: Session, animal_id: int | None, user: User) -> None:
    """Marca o animal do termo como castrado, sem fazer commit.

    Desvincular ou trocar o animal depois nao desfaz a marcacao: ele pode ter
    sido castrado de qualquer forma.
    """
    animal = db.get(Animal, animal_id) if animal_id is not None else None
    if animal is not None and not animal.castrado:
        animal.castrado = True
        animal.alterado_por_id = user.id


def desmarcar_castrado(db: Session, castracao: Castracao, user: User) -> None:
    """Ao excluir o termo, o animal deixa de constar como castrado, a menos
    que tenha outro termo. Nao faz commit."""
    if castracao.animal_id is None:
        return
    outro = db.scalar(
        select(Castracao.id)
        .where(
            Castracao.animal_id == castracao.animal_id,
            Castracao.id != castracao.id,
        )
        .limit(1)
    )
    animal = db.get(Animal, castracao.animal_id)
    if outro is None and animal is not None and animal.castrado:
        animal.castrado = False
        animal.alterado_por_id = user.id
