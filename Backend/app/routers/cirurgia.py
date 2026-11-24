"""Registro de termos de cirurgia."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.cirurgia import Cirurgia
from app.models.user import User
from app.schemas.cirurgia import CirurgiaIn, CirurgiaOut

router = APIRouter(tags=["cirurgias"])


@router.post(
    "/cirurgias",
    response_model=CirurgiaOut,
    status_code=status.HTTP_201_CREATED,
)
def create_cirurgia(
    data: CirurgiaIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cirurgia = Cirurgia(
        animal_id=data.animal_id,
        funcionario_id=user.id,
        proprietario_responsavel=data.proprietario_responsavel,
        cpf_cnpj=data.cpf_cnpj,
        endereco=data.endereco,
        numero=data.numero,
        complemento=data.complemento,
        bairro=data.bairro,
        ba_telefones=data.ba_telefones,
        email=data.email,
        nome_animal=data.nome_animal,
        idade_real=data.idade_real,
        especie=data.especie,
        raca=data.raca,
        pelagem=data.pelagem,
        sexo=data.sexo,
        procedimento=data.procedimento,
        assinatura_responsavel=data.assinatura_responsavel,
        local_assinatura=data.local_assinatura,
        data_assinatura=data.data_assinatura,
    )
    db.add(cirurgia)
    db.commit()
    db.refresh(cirurgia)
    return cirurgia


@router.get("/cirurgias", response_model=list[CirurgiaOut])
def list_cirurgias(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Cirurgia).order_by(Cirurgia.id.desc())
    return db.scalars(stmt).all()


@router.get("/cirurgias/{cirurgia_id}", response_model=CirurgiaOut)
def get_cirurgia(
    cirurgia_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cirurgia = db.get(Cirurgia, cirurgia_id)
    if cirurgia is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Termo de cirurgia nao encontrado.")
    return cirurgia
