"""Tabela eutanasias (termo de consentimento)."""

from datetime import date

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Eutanasia(Base):
    __tablename__ = "eutanasias"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    animal_id: Mapped[int] = mapped_column(
        ForeignKey("animais.id"), nullable=False
    )
    animal_nome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    animal_especie: Mapped[str | None] = mapped_column(String(50), nullable=True)
    animal_raca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    animal_sexo: Mapped[str | None] = mapped_column(
        Enum("macho", "femea", name="sexo_eutanasia_enum"), nullable=True
    )
    animal_idade: Mapped[str | None] = mapped_column(String(80), nullable=True)
    animal_pelagem: Mapped[str | None] = mapped_column(String(100), nullable=True)
    veterinario_nome: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    veterinario_crmv: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    responsavel_nome: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    responsavel_rg: Mapped[str | None] = mapped_column(String(30), nullable=True)
    responsavel_cpf: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    responsavel_endereco: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    responsavel_numero: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    responsavel_bairro: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    responsavel_cidade: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    responsavel_telefone_email: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    data_declaracao: Mapped[date | None] = mapped_column(Date, nullable=True)
    assinatura_responsavel: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_at = mapped_column(DateTime, server_default=func.now())
