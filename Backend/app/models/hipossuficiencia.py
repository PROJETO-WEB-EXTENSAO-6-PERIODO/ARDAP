"""Tabela hipossuficiencia (issue #DB0006) - Declaracao de Hipossuficiencia.

Campos extraidos do formulario de papel descrito no documento de contexto:

  - nome do declarante, documento (RG/CPF), e-mail
  - motivo (checkbox): sem trabalho remunerado / sem renda /
    renda familiar ate limite / outros (com descricao livre)
  - local, data, assinatura

⚠️ RELACAO COM `adotantes` A CONFIRMAR. O modelo original do contexto previa
`adotantes 1─N hipossuficiencia_declaracoes`. A issue #36 nao criou a tabela
`adotantes`, entao a declaracao hoje fica autocontida (só o funcionario que
registrou como vinculo). Se a modelagem do draw.io trouxer `adotantes`,
precisa haver migracao.
"""

from datetime import date
from datetime import datetime as DateTime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base

MOTIVOS = (
    "sem_trabalho_remunerado",
    "sem_renda",
    "renda_ate_limite",
    "outros",
)


class Hipossuficiencia(Base):
    __tablename__ = "hipossuficiencia"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    funcionario_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    nome_declarante: Mapped[str] = mapped_column(String(150))
    documento_declarante: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    email_declarante: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    motivo: Mapped[str | None] = mapped_column(
        Enum(*MOTIVOS, name="hipossuficiencia_motivo_enum"), nullable=True
    )
    motivo_outros_desc: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    local: Mapped[str | None] = mapped_column(String(255), nullable=True)
    data_declaracao: Mapped[date | None] = mapped_column(Date, nullable=True)
    # base64 de assinatura passa de 64 KB -> LONGTEXT, nao TEXT
    assinatura: Mapped[str | None] = mapped_column(
        Text().with_variant(LONGTEXT(), "mysql"), nullable=True
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
