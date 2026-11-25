"""Relatorio de atividades para prestacao de contas."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.relatorio_atividades import Chave, gerar, planilha
from app.models.user import User

router = APIRouter(tags=["relatorios"])

MAX_DIAS = 366 * 5
ANO_MINIMO = 2000


def _relatorio(
    inicio: date,
    fim: date,
    modulos: Annotated[list[Chave], Query(min_length=1)],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if inicio > fim:
        raise HTTPException(422, "A data inicial deve vir antes da final.")
    if inicio.year < ANO_MINIMO or fim.year > 2100:
        raise HTTPException(422, "Informe um período válido.")
    if (fim - inicio).days > MAX_DIAS:
        raise HTTPException(422, "O período deve ter no máximo 5 anos.")
    return gerar(db, inicio, fim, modulos, f"{user.first_name} {user.second_name}")


@router.get("/relatorios/atividades")
def get_relatorio(relatorio: dict = Depends(_relatorio)):
    return relatorio


@router.get("/relatorios/atividades/excel")
def get_planilha(relatorio: dict = Depends(_relatorio)):
    return Response(
        planilha(relatorio),
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Cache-Control": "private, no-store"},
    )
