"""Cadastro e listagem de animais (RF03 + RF10 parcial).

POST cria o animal + o registro de entrada (intake) na mesma transacao:
funcionario logado, data de hoje e situacao 'outros'/'Cadastro via
formulario' — provisório até a tela dedicada do SUPATAS.
"""

from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.animal import Animal
from app.models.intake import SupatasIntake
from app.models.user import User
from app.schemas.animal import AnimalIn, AnimalOut

router = APIRouter(tags=["animais"])


def _to_out(a: Animal) -> AnimalOut:
    return AnimalOut(
        id=a.id, nome=a.nome, especie=a.especie, raca=a.raca, sexo=a.sexo,
        porte=a.porte, cor_pelo=a.cor_pelo, peso=a.peso,
        castrado=bool(a.castrado), vermifugado=bool(a.vermifugado),
        vacinado=bool(a.vacinado), temperamento=a.temperamento,
        medicacao_necessaria=bool(a.medicacao_necessaria),
        medicacao_desc=a.medicacao_desc, origem_resgate=a.origem_resgate,
        observacoes=a.observacoes,
    )


@router.post("/animais", response_model=AnimalOut,
             status_code=status.HTTP_201_CREATED)
def create_animal(
    data: AnimalIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    animal = Animal(
        nome=data.nome or None,
        especie=data.especie,
        raca=data.raca,
        sexo=data.sexo,
        data_nascimento_estimada=data.data_nascimento_estimada,
        idade_estimada=data.idade_estimada,
        porte=data.porte,
        cor_pelo=data.cor_pelo,
        peso=data.peso,
        castrado=data.castrado,
        vermifugado=data.vermifugado,
        vacinado=data.vacinado,
        temperamento=data.temperamento or "desconhecido",
        medicacao_necessaria=data.medicacao_necessaria,
        medicacao_desc=data.medicacao_desc,
        origem_resgate=data.origem_resgate,
        observacoes=data.observacoes,
    )
    db.add(animal)
    db.flush()
    db.add(
        SupatasIntake(
            animal_id=animal.id,
            funcionario_id=user.id,
            data_encaminhamento=date.today(),
            situacao_animal="outros",
            situacao_animal_outros_desc="Cadastro via formulario",
            local_recolhimento=data.origem_resgate,
        )
    )
    db.commit()
    db.refresh(animal)
    return _to_out(animal)


@router.get("/animais", response_model=list[AnimalOut])
def list_animais(
    especie: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Animal).order_by(Animal.id.desc())
    if especie:
        stmt = stmt.where(Animal.especie == especie)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(Animal.nome.like(like), Animal.cor_pelo.like(like))
        )
    return [_to_out(a) for a in db.scalars(stmt).all()]
