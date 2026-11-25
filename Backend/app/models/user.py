"""Tabela users (espelho do banco)."""

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship, remote
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100))
    second_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(
        Enum("admin", "funcionario", name="role_enum"), default="funcionario"
    )
    # quem cadastrou e quem alterou por ultimo
    funcionario_id: Mapped[int | None] = mapped_column(nullable=True)
    alterado_por_id: Mapped[int | None] = mapped_column(nullable=True)
    funcionario: Mapped["User | None"] = relationship(
        primaryjoin=lambda: foreign(User.funcionario_id) == remote(User.id),
        viewonly=True,
    )
    alterado_por: Mapped["User | None"] = relationship(
        primaryjoin=lambda: foreign(User.alterado_por_id) == remote(User.id),
        viewonly=True,
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
