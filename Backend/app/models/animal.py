"""Tabela animais (espelho do banco)."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy import DateTime

from app.core.database import Base


class Animal(Base):
    __tablename__ = "animais"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    especie: Mapped[str] = mapped_column(String(50))
    raca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sexo: Mapped[str] = mapped_column(
        Enum("macho", "femea", name="sexo_enum")
    )
    data_nascimento_estimada: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    idade_estimada: Mapped[int | None] = mapped_column(nullable=True)
    porte: Mapped[str | None] = mapped_column(
        Enum("pequeno", "medio", "grande", name="porte_enum"), nullable=True
    )
    cor_pelo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    peso: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    castrado: Mapped[bool] = mapped_column(Boolean, default=False)
    vermifugado: Mapped[bool] = mapped_column(Boolean, default=False)
    vacinado: Mapped[bool] = mapped_column(Boolean, default=False)
    temperamento: Mapped[str] = mapped_column(
        Enum(
            "docil", "medroso", "arisco", "agressivo", "desconhecido",
            name="temperamento_enum",
        ),
        default="desconhecido",
    )
    medicacao_necessaria: Mapped[bool] = mapped_column(Boolean, default=False)
    medicacao_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    origem_resgate: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
