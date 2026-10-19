"""Tabela cirurgia (issue #DB0005).

⚠️ Campos A CONFIRMAR com a modelagem do draw.io, que ainda nao foi
compartilhada. Estrutura seguindo o padrao das demais tabelas de formulario.
"""

from datetime import date
from datetime import datetime as DateTime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Cirurgia(Base):
    __tablename__ = "cirurgia"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animais.id"))
    funcionario_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    tipo_cirurgia: Mapped[str | None] = mapped_column(String(150), nullable=True)
    data_cirurgia: Mapped[date | None] = mapped_column(Date, nullable=True)
    veterinario: Mapped[str | None] = mapped_column(String(150), nullable=True)
    local: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # base64 de assinatura passa de 64 KB -> LONGTEXT, nao TEXT
    assinatura_responsavel: Mapped[str | None] = mapped_column(
        Text().with_variant(LONGTEXT(), "mysql"), nullable=True
    )
    assinatura_ardap: Mapped[str | None] = mapped_column(
        Text().with_variant(LONGTEXT(), "mysql"), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
