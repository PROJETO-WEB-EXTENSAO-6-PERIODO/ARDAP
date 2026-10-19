"""CRUD de usuarios - RF02 + RF12 (issue #FEATURE0007).

Toda a rota roda atras de `require_admin`: apenas papel `admin` gerencia
usuarios. Funcionario autenticado le 403, sem token le 401.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.core.security import hash_password
from app.models.user import User
from app.schemas.usuarios import UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"],
    # guarda aplicada a TODA a rota - RF12: so admin gerencia usuarios
    dependencies=[Depends(require_admin)],
)


def _acha(db: Session, usuario_id: int) -> User:
    user = db.get(User, usuario_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario nao encontrado")
    return user


def _email_livre(db: Session, email: str, exceto: int | None = None) -> None:
    dono = db.scalar(select(User).where(User.email == email))
    if dono is not None and dono.id != exceto:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Ja existe um usuario com esse e-mail"
        )


@router.get("", response_model=list[UsuarioOut])
def lista(db: Session = Depends(get_db)):
    return db.scalars(select(User).order_by(User.id)).all()


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def cria(data: UsuarioCreate, db: Session = Depends(get_db)):
    _email_livre(db, data.email)

    user = User(
        first_name=data.first_name,
        second_name=data.second_name,
        email=data.email,
        # hash no servidor, nunca texto puro (RNF02)
        password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{usuario_id}", response_model=UsuarioOut)
def detalha(usuario_id: int, db: Session = Depends(get_db)):
    return _acha(db, usuario_id)


@router.put("/{usuario_id}", response_model=UsuarioOut)
def atualiza(usuario_id: int, data: UsuarioUpdate, db: Session = Depends(get_db)):
    user = _acha(db, usuario_id)

    campos = data.model_dump(exclude_unset=True)

    if "email" in campos:
        _email_livre(db, campos["email"], exceto=usuario_id)

    if "password" in campos and campos["password"]:
        user.password = hash_password(campos.pop("password"))
    campos.pop("password", None)

    for nome, valor in campos.items():
        setattr(user, nome, valor)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{usuario_id}", status_code=status.HTTP_200_OK)
def remove(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    # Evita o administrador se apagar e deixar o sistema sem ninguem com
    # permissao de criar usuario de novo.
    if admin.id == usuario_id:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Nao e possivel excluir o proprio usuario",
        )

    user = _acha(db, usuario_id)
    db.delete(user)
    db.commit()
    return {"msg": "Usuario excluido"}
