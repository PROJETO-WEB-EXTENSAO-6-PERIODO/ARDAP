"""Tabela adotantes (espelho do banco, conforme modelagem em draw.io).

Issue #54 - #DB0008/criacao-tabela-adotantes.

As 11 colunas abaixo sao as desenhadas em `ADOTANTES`. `id` e `created_at`
foram acrescentados pela mesma convencao das demais tabelas do projeto - o
desenho nao mostra `id` em nenhuma das 6 entidades, mas ele e necessario
para a futura FK `adotante_id` de `adocao` e `hipossuficiencia`.
"""

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Adotante(Base):
    __tablename__ = "adotantes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(150))
    rg: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cpf: Mapped[str | None] = mapped_column(String(20), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cep: Mapped[str | None] = mapped_column(String(10), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(20), nullable=True)
    instagram: Mapped[str | None] = mapped_column(String(60), nullable=True)
    profissao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at = mapped_column(DateTime, server_default=func.now())
    # `updated_at` existe no DDL das demais tabelas mas nao era espelhado nos
    # models `User`/`Animal`. Aqui espelhamos os dois, para o model e o
    # `schema_min.sql` baterem coluna a coluna (a suite verifica isso).
    updated_at = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
