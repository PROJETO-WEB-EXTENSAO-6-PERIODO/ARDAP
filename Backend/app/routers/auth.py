"""Login JWT (RF01 + RNF02)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limite_login import limpar, registrar_tentativa
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginIn, TokenOut
from app.schemas.user import UserOut

router = APIRouter(tags=["auth"])

# Conferido quando o e-mail nao existe, para o tempo de resposta nao revelar
# quais e-mails tem cadastro.
_HASH_FALSO = hash_password("usuario-inexistente")


@router.post("/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    if not registrar_tentativa(data.email):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Muitas tentativas de login. Aguarde 15 minutos e tente novamente.",
        )
    user = db.scalar(select(User).where(User.email == data.email))
    senha_ok = verify_password(
        data.password, user.password if user else _HASH_FALSO
    )
    if user is None or not senha_ok:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "E-mail ou senha invalidos"
        )
    limpar(data.email)
    return TokenOut(access_token=create_access_token(user.id))


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id, email=user.email, role=user.role,
        first_name=user.first_name, second_name=user.second_name,
    )
