"""Contagens de registros para os cards da Home."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.adocao import ContagemOut

router = APIRouter(tags=["contagens"])


@router.get("/castracoes/contagem", response_model=ContagemOut)
def contar_castracoes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total = db.execute(text("SELECT COUNT(*) FROM castracao")).scalar_one()
    return ContagemOut(total=total)


@router.get("/cirurgias/contagem", response_model=ContagemOut)
def contar_cirurgias(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total = db.execute(text("SELECT COUNT(*) FROM cirurgia")).scalar_one()
    return ContagemOut(total=total)
