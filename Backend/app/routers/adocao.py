from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.adocao import AdocaoContagemOut

router = APIRouter(tags=["adocoes"])


@router.get("/adocoes/contagem", response_model=AdocaoContagemOut)
def contar_termos_adocao(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total = db.execute(text("SELECT COUNT(*) FROM termo_adocao")).scalar_one()
    return AdocaoContagemOut(total=total)
