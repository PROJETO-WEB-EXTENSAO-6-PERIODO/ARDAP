from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import CreateUserIn, UserOut

router = APIRouter(tags=["users"])


@router.post(
    "/users", response_model=UserOut, status_code=status.HTTP_201_CREATED
)
def create_user(
    data: CreateUserIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    exists = db.scalar(select(User).where(User.email == data.email))
    if exists is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "E-mail ja cadastrado"
        )
    user = User(
        first_name=data.first_name,
        second_name=data.second_name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut(
        id=user.id,
        first_name=user.first_name,
        second_name=user.second_name,
        email=user.email,
        role=user.role,
    )
