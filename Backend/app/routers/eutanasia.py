"""Registro de termos de eutanasia."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.animal_vinculo import validar_animal
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.eutanasia import Eutanasia
from app.models.user import User
from app.schemas.eutanasia import EutanasiaIn, EutanasiaOut

router = APIRouter(tags=["eutanasias"])


@router.post(
    "/eutanasias",
    response_model=EutanasiaOut,
    status_code=status.HTTP_201_CREATED,
)
def create_eutanasia(
    data: EutanasiaIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    validar_animal(db, data.animal_id)
    eutanasia = Eutanasia(
        animal_id=data.animal_id,
        funcionario_id=user.id,
        nome_animal=data.nome_animal,
        especie=data.especie,
        raca=data.raca,
        sexo=data.sexo,
        idade=data.idade,
        pelagem=data.pelagem,
        crmv_veterinario=data.crmv_veterinario,
        nome_responsavel=data.nome_responsavel,
        rg=data.rg,
        cpf=data.cpf,
        endereco=data.endereco,
        bairro=data.bairro,
        cidade=data.cidade,
        telefone_email=data.telefone_email,
        declaracao_aceite=data.declaracao_aceite,
        local_declaracao=data.local_declaracao,
        data_declaracao=data.data_declaracao,
        assinatura_responsavel=data.assinatura_responsavel,
    )
    db.add(eutanasia)
    db.commit()
    db.refresh(eutanasia)
    return eutanasia


@router.get("/eutanasias", response_model=list[EutanasiaOut])
def list_eutanasias(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Eutanasia).order_by(Eutanasia.id.desc())
    return db.scalars(stmt).all()


@router.get("/eutanasias/{eutanasia_id}", response_model=EutanasiaOut)
def get_eutanasia(
    eutanasia_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    eutanasia = db.get(Eutanasia, eutanasia_id)
    if eutanasia is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Termo de eutanasia nao encontrado.")
    return eutanasia
