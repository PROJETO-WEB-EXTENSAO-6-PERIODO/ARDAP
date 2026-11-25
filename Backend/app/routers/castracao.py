"""Registro de termos de castracao."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.animal_vinculo import validar_animal
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.castracao import Castracao
from app.models.user import User
from app.schemas.castracao import CastracaoIn, CastracaoOut

router = APIRouter(tags=["castracoes"])


@router.post(
    "/castracoes",
    response_model=CastracaoOut,
    status_code=status.HTTP_201_CREATED,
)
def create_castracao(
    data: CastracaoIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    validar_animal(db, data.animal_id)
    castracao = Castracao(
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
    db.add(castracao)
    db.commit()
    db.refresh(castracao)
    return castracao


@router.get("/castracoes", response_model=list[CastracaoOut])
def list_castracoes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Castracao).order_by(Castracao.id.desc())
    return db.scalars(stmt).all()


@router.get("/castracoes/{castracao_id}", response_model=CastracaoOut)
def get_castracao(
    castracao_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    castracao = db.get(Castracao, castracao_id)
    if castracao is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Termo de castracao nao encontrado.")
    return castracao
