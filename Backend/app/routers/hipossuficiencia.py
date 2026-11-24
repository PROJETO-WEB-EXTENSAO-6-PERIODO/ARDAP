"""Registro de declaracoes de hipossuficiencia."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.hipossuficiencia import Hipossuficiencia
from app.models.user import User
from app.schemas.hipossuficiencia import (
    HipossuficienciaIn,
    HipossuficienciaOut,
)

router = APIRouter(tags=["hipossuficiencias"])


@router.post(
    "/hipossuficiencias",
    response_model=HipossuficienciaOut,
    status_code=status.HTTP_201_CREATED,
)
def create_hipossuficiencia(
    data: HipossuficienciaIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    hipossuficiencia = Hipossuficiencia(
        nome_representante=data.nome_representante,
        documento_representante=data.documento_representante,
        tipo_documento_representante=data.tipo_documento_representante,
        email_representante=data.email_representante,
        nome_imigrante=data.nome_imigrante,
        documento_imigrante=data.documento_imigrante,
        tipo_documento_imigrante=data.tipo_documento_imigrante,
        email_imigrante=data.email_imigrante,
        nao_possui_trabalho_remunerado=data.nao_possui_trabalho_remunerado,
        nao_possui_renda=data.nao_possui_renda,
        renda_ate_meio_salario_per_capita=data.renda_ate_meio_salario_per_capita,
        outro_motivo=data.outro_motivo,
        local_declaracao=data.local_declaracao,
        data_declaracao=data.data_declaracao,
        assinatura_representante=data.assinatura_representante,
        anexo_documentos=data.anexo_documentos,
        funcionario_id=user.id,
    )
    db.add(hipossuficiencia)
    db.commit()
    db.refresh(hipossuficiencia)
    return hipossuficiencia


@router.get("/hipossuficiencias", response_model=list[HipossuficienciaOut])
def list_hipossuficiencias(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Hipossuficiencia).order_by(Hipossuficiencia.id.desc())
    return db.scalars(stmt).all()


@router.get("/hipossuficiencias/{hipossuficiencia_id}", response_model=HipossuficienciaOut)
def get_hipossuficiencia(
    hipossuficiencia_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    h = db.get(Hipossuficiencia, hipossuficiencia_id)
    if h is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Declaracao de hipossuficiencia nao encontrada.")
    return h
