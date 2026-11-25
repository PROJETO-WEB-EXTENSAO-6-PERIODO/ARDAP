"""Tabela hipossuficiencia_anexos (documentos das declaracoes)."""

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class HipossuficienciaAnexo(Base):
    __tablename__ = "hipossuficiencia_anexos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    hipossuficiencia_id: Mapped[int] = mapped_column(
        ForeignKey("hipossuficiencia.id"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    # chave no armazenamento, ex.: hipossuficiencia/<uuid>.pdf
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at = mapped_column(DateTime, server_default=func.now())
