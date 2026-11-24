"""Tabela eutanasia (termo de consentimento para eutanasia)."""

from datetime import date

from sqlalchemy import Boolean, Date, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Eutanasia(Base):
    __tablename__ = "eutanasia"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    animal_id: Mapped[int | None] = mapped_column(nullable=True)
    funcionario_id: Mapped[int | None] = mapped_column(nullable=True)

    nome_animal: Mapped[str | None] = mapped_column(String(100), nullable=True)
    especie: Mapped[str | None] = mapped_column(String(50), nullable=True)
    raca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sexo: Mapped[str | None] = mapped_column(
        Enum("macho", "femea", name="sexo_eutanasia_enum"), nullable=True
    )
    idade: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pelagem: Mapped[str | None] = mapped_column(String(100), nullable=True)
    crmv_veterinario: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )

    nome_responsavel: Mapped[str] = mapped_column(String(150), nullable=False)
    rg: Mapped[str | None] = mapped_column(String(30), nullable=True)
    cpf: Mapped[str | None] = mapped_column(String(20), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    telefone_email: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    declaracao_aceite: Mapped[bool] = mapped_column(Boolean, default=False)
    local_declaracao: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    data_declaracao: Mapped[date | None] = mapped_column(Date, nullable=True)
    assinatura_responsavel: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
