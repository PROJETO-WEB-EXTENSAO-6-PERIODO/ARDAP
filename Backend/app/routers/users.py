from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import CreateUserIn, UpdateUserIn, UserDetalheOut

router = APIRouter(tags=["users"])


def _to_out(user: User) -> UserDetalheOut:
    return UserDetalheOut.model_validate(user)


def _buscar(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "Usuário não encontrado."
        )
    return user


@router.get("/users", response_model=list[UserDetalheOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    stmt = select(User).order_by(User.first_name, User.second_name)
    return [_to_out(u) for u in db.scalars(stmt).all()]


@router.get("/users/{user_id}", response_model=UserDetalheOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return _to_out(_buscar(db, user_id))


@router.put("/users/{user_id}", response_model=UserDetalheOut)
def update_user(
    user_id: int,
    data: UpdateUserIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = _buscar(db, user_id)
    # Garante que sempre reste um admin: ninguem rebaixa a si mesmo.
    if user.id == admin.id and data.role != "admin":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Você não pode remover a sua própria permissão de administrador.",
        )
    em_uso = db.scalar(
        select(User.id).where(User.email == data.email, User.id != user.id)
    )
    if em_uso is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "E-mail já cadastrado.")
    user.first_name = data.first_name
    user.second_name = data.second_name
    user.email = data.email
    user.role = data.role
    user.alterado_por_id = admin.id
    if data.password:
        user.password = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.post(
    "/users", response_model=UserDetalheOut, status_code=status.HTTP_201_CREATED
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
        funcionario_id=admin.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_out(user)
