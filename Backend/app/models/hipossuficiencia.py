"""Tabela hipossuficiencia (declaracao de hipossuficiencia economica)."""

from datetime import date

from sqlalchemy import Boolean, Date, DateTime, String, Text
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.hipossuficiencia_anexo import HipossuficienciaAnexo
from app.models.user import User


class Hipossuficiencia(Base):
    __tablename__ = "hipossuficiencia"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    nome_representante: Mapped[str] = mapped_column(String(150), nullable=False)
    documento_representante: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    tipo_documento_representante: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    email_representante: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    nome_imigrante: Mapped[str] = mapped_column(String(150), nullable=False)
    documento_imigrante: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    tipo_documento_imigrante: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    email_imigrante: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    nao_possui_trabalho_remunerado: Mapped[bool] = mapped_column(
        Boolean, default=False
    )
    nao_possui_renda: Mapped[bool] = mapped_column(Boolean, default=False)
    renda_ate_meio_salario_per_capita: Mapped[bool] = mapped_column(
        Boolean, default=False
    )
    outro_motivo: Mapped[str | None] = mapped_column(Text, nullable=True)

    local_declaracao: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    data_declaracao: Mapped[date | None] = mapped_column(Date, nullable=True)

    assinatura_representante: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # legado: registros antigos so tem os nomes dos arquivos
    anexo_documentos: Mapped[str | None] = mapped_column(Text, nullable=True)
    anexos: Mapped[list[HipossuficienciaAnexo]] = relationship(
        cascade="all, delete-orphan",
        order_by=HipossuficienciaAnexo.id,
        lazy="selectin",
    )

    funcionario_id: Mapped[int | None] = mapped_column(nullable=True)
    # somente leitura: a autoria e gravada por funcionario_id
    funcionario: Mapped[User | None] = relationship(
        primaryjoin=lambda: foreign(Hipossuficiencia.funcionario_id) == User.id,
        viewonly=True,
        lazy="joined",
    )
    alterado_por_id: Mapped[int | None] = mapped_column(nullable=True)
    alterado_por: Mapped[User | None] = relationship(
        primaryjoin=lambda: foreign(Hipossuficiencia.alterado_por_id) == User.id,
        viewonly=True,
        lazy="joined",
    )

    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
