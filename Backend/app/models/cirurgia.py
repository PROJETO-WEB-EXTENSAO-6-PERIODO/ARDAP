"""Tabela cirurgia (termo de autorizacao para procedimento cirurgico)."""

from datetime import date

from sqlalchemy import Date, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.animal import Animal
from app.models.user import User


class Cirurgia(Base):
    __tablename__ = "cirurgia"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    animal_id: Mapped[int | None] = mapped_column(nullable=True)
    # somente leitura: o vinculo e gravado por animal_id
    animal: Mapped[Animal | None] = relationship(
        primaryjoin=lambda: foreign(Cirurgia.animal_id) == Animal.id,
        viewonly=True,
        lazy="joined",
    )
    funcionario_id: Mapped[int | None] = mapped_column(nullable=True)
    # somente leitura: a autoria e gravada por funcionario_id
    funcionario: Mapped[User | None] = relationship(
        primaryjoin=lambda: foreign(Cirurgia.funcionario_id) == User.id,
        viewonly=True,
        lazy="joined",
    )

    proprietario_responsavel: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    cpf_cnpj: Mapped[str | None] = mapped_column(String(20), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    numero: Mapped[str | None] = mapped_column(String(10), nullable=True)
    complemento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ba_telefones: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)

    nome_animal: Mapped[str | None] = mapped_column(String(100), nullable=True)
    idade_real: Mapped[str | None] = mapped_column(String(50), nullable=True)
    especie: Mapped[str | None] = mapped_column(String(50), nullable=True)
    raca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pelagem: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sexo: Mapped[str | None] = mapped_column(
        Enum("macho", "femea", name="sexo_cirurgia_enum"), nullable=True
    )

    procedimento: Mapped[str | None] = mapped_column(String(255), nullable=True)

    assinatura_responsavel: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_assinatura: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
