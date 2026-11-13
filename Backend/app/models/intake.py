"""Tabela supatas_intake (registro de entrada)."""

from datetime import date

from sqlalchemy import Date, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy import DateTime

from app.core.database import Base


class SupatasIntake(Base):
    __tablename__ = "supatas_intake"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    animal_id: Mapped[int | None] = mapped_column(nullable=True)
    funcionario_id: Mapped[int | None] = mapped_column(nullable=True)
    orgao_solicitante: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    nome_responsavel_encaminhamento: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    data_encaminhamento: Mapped[date | None] = mapped_column(Date, nullable=True)
    especie: Mapped[str | None] = mapped_column(String(50), nullable=True)
    especie_outro: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    sexo: Mapped[str | None] = mapped_column(
        Enum("macho", "femea", name="sexo_intake_enum"),
        nullable=True,
    )
    nome_animal: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    situacao_animal: Mapped[str | None] = mapped_column(
        Enum("acidentado", "doente", "castracao", "outros",
             name="situacao_enum"),
        nullable=True,
    )
    situacao_animal_outros_desc: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    local_recolhimento: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    nome_resgatista: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    relatorio: Mapped[str | None] = mapped_column(Text, nullable=True)
    recebido_por: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )
    data_recebimento: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    cpf_responsavel_supatas: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    assinatura_responsavel_supatas: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    assinatura_recebimento_ardap: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_at = mapped_column(DateTime, server_default=func.now())
