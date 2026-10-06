"""Login JWT (RF01 + RNF02)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.auth import LoginIn, TokenOut, UserOut

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if user is None or not verify_password(data.password, user.password):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "E-mail ou senha invalidos"
        )
    return TokenOut(access_token=create_access_token(user.id))


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id, email=user.email, role=user.role,
        first_name=user.first_name,
    )
