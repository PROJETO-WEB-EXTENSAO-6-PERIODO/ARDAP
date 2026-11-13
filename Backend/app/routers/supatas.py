"""Registro de entrada SUPATAS (encaminhamento municipal)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.intake import SupatasIntake
from app.models.user import User
from app.schemas.intake import SupatasIntakeIn, SupatasIntakeOut

router = APIRouter(tags=["supatas"])


@router.post(
    "/supatas",
    response_model=SupatasIntakeOut,
    status_code=status.HTTP_201_CREATED,
)
def create_supatas_intake(
    data: SupatasIntakeIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    intake = SupatasIntake(
        orgao_solicitante=data.orgao_solicitante,
        nome_responsavel_encaminhamento=data.nome_responsavel_encaminhamento,
        data_encaminhamento=data.data_encaminhamento,
        especie=data.especie,
        especie_outro=data.especie_outro,
        sexo=data.sexo,
        nome_animal=data.nome_animal,
        situacao_animal=data.situacao_animal,
        situacao_animal_outros_desc=data.situacao_animal_outros_desc,
        local_recolhimento=data.local_recolhimento,
        nome_resgatista=data.nome_resgatista,
        relatorio=data.relatorio,
        recebido_por=data.recebido_por,
        data_recebimento=data.data_recebimento,
        cpf_responsavel_supatas=data.cpf_responsavel_supatas,
        assinatura_responsavel_supatas=data.assinatura_responsavel_supatas,
        assinatura_recebimento_ardap=data.assinatura_recebimento_ardap,
        funcionario_id=user.id,
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)
    return intake


@router.get("/supatas", response_model=list[SupatasIntakeOut])
def list_supatas_intakes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(SupatasIntake).order_by(SupatasIntake.id.desc())
    return db.scalars(stmt).all()
