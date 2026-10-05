"""Login e logout JWT (RF01 + RNF02)."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import bearer, get_current_user
from app.core.security import (
    DUMMY_HASH,
    create_access_token,
    revoke_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginIn, LogoutOut, TokenOut, UserOut

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = db.scalar(select(User).where(User.email == data.email))

    # SEMPRE roda o bcrypt.checkpw(), mesmo quando o e-mail nao existe (ai ele
    # compara contra o hash fantasma). Assim o tempo de resposta e identico nos
    # dois casos e nao da para descobrir quem e cadastrado medindo a latencia.
    senha_certa = verify_password(
        data.password, user.password if user is not None else DUMMY_HASH
    )

    if user is None or not senha_certa:
        # Mensagem unica: nao revela se o problema foi o e-mail ou a senha.
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "E-mail ou senha invalidos"
        )

    return TokenOut(access_token=create_access_token(user.id))


@router.post("/auth/logout", response_model=LogoutOut)
def logout(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    _user: User = Depends(get_current_user),
) -> LogoutOut:
    """Encerra a sessao revogando o token atual (RF01).

    Exige um token valido. Se o token ja foi revogado ou expirou, o cliente
    recebe 401 — para ele isso significa "ja estou deslogado": limpe o estado
    local e va para a tela de login.
    """
    if credentials is None:  # inalcancavel: _user acima ja exigiu o token
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token ausente")
    revoke_token(credentials.credentials)
    return LogoutOut(msg="Sessao encerrada")


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(
        id=user.id, email=user.email, role=user.role,
        first_name=user.first_name,
    )
