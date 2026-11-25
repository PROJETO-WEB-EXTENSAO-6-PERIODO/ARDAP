"""Exclusao de registros."""

from fastapi import HTTPException, status
from sqlalchemy import delete, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.adocao import Adocao
from app.models.animal import Animal
from app.models.castracao import Castracao
from app.models.cirurgia import Cirurgia
from app.models.eutanasia import Eutanasia
from app.models.hipossuficiencia import Hipossuficiencia
from app.models.intake import SupatasIntake
from app.models.user import User

# modelo e nome do modulo exibido ao usuario
COM_ANIMAL = [
    (SupatasIntake, "SUPATAS"),
    (Adocao, "Adoções"),
    (Castracao, "Castrações"),
    (Cirurgia, "Cirurgias"),
    (Eutanasia, "Eutanásias"),
]
COM_AUTORIA = [
    (Animal, "Animais"),
    *COM_ANIMAL,
    (Hipossuficiencia, "Hipossuficiência"),
    (User, "Usuários"),
]


def excluir_registro(db: Session, registro) -> None:
    try:
        db.delete(registro)
        db.commit()
    except IntegrityError as erro:
        # um vinculo pode ter surgido depois da validacao
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não é possível excluir: existem registros vinculados.",
        ) from erro


def excluir_animal(db: Session, animal: Animal) -> None:
    """Exclui o animal e todos os formularios dele, na mesma transacao."""
    for modelo, _ in COM_ANIMAL:
        db.execute(
            delete(modelo)
            .where(modelo.animal_id == animal.id)
            .execution_options(synchronize_session=False)
        )
    excluir_registro(db, animal)


def validar_exclusao_usuario(db: Session, user: User) -> None:
    """Preserva a autoria: quem cadastrou ou alterou algo nao e excluido."""
    modulos = []
    for modelo, nome in COM_AUTORIA:
        stmt = select(modelo.id).where(
            or_(
                modelo.funcionario_id == user.id,
                modelo.alterado_por_id == user.id,
            )
        )
        if modelo is User:
            # ter editado os proprios dados nao conta
            stmt = stmt.where(User.id != user.id)
        if db.scalar(stmt.limit(1)):
            modulos.append(nome)
    if modulos:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este usuário não pode ser excluído porque cadastrou ou "
            f"alterou registros em: {', '.join(modulos)}.",
        )
