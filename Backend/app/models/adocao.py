"""Tabela termo_adocao (formulario unificado de adocao)."""

from datetime import date

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, String, Text,
)
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.animal import Animal


class Adocao(Base):
    __tablename__ = "termo_adocao"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    animal_id: Mapped[int | None] = mapped_column(nullable=True)
    # somente leitura: o vinculo e gravado por animal_id
    animal: Mapped[Animal | None] = relationship(
        primaryjoin=lambda: foreign(Adocao.animal_id) == Animal.id,
        viewonly=True,
        lazy="joined",
    )
    funcionario_id: Mapped[int | None] = mapped_column(nullable=True)

    nome_adotante: Mapped[str] = mapped_column(String(150), nullable=False)
    rg: Mapped[str | None] = mapped_column(String(30), nullable=True)
    cpf: Mapped[str | None] = mapped_column(String(20), nullable=True)
    endereco_residencial: Mapped[str] = mapped_column(String(255), nullable=False)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cep: Mapped[str | None] = mapped_column(String(12), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    instagram: Mapped[str | None] = mapped_column(String(100), nullable=True)

    mais_animais_em_casa: Mapped[bool] = mapped_column(Boolean, default=False)
    quantos_mais_animais: Mapped[int | None] = mapped_column(nullable=True)
    endereco_ficara_animal: Mapped[str] = mapped_column(
        Enum("mesmo", "outro", name="endereco_ficara_enum"), default="mesmo"
    )
    endereco_ficara_animal_outro: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    local_na_casa: Mapped[str | None] = mapped_column(String(255), nullable=True)

    especie_adocao: Mapped[str | None] = mapped_column(
        Enum("canino", "felino", name="especie_form_adocao_enum"), nullable=True
    )
    outros_animais: Mapped[bool] = mapped_column(Boolean, default=False)
    quantos_animais: Mapped[int | None] = mapped_column(nullable=True)
    espaco_casa: Mapped[bool] = mapped_column(Boolean, default=False)
    casa_murada: Mapped[bool] = mapped_column(Boolean, default=False)
    espaco_coberto_quintal: Mapped[bool] = mapped_column(Boolean, default=False)
    mora_aluguel: Mapped[bool] = mapped_column(Boolean, default=False)
    proprietario_permite_animais: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    viajar_quem_cuidara: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    familia_sabe_adocao: Mapped[bool] = mapped_column(Boolean, default=False)
    alguem_alergia: Mapped[bool] = mapped_column(Boolean, default=False)
    alimentacao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    acesso_rua: Mapped[bool] = mapped_column(Boolean, default=False)
    ciencia_vacinacao: Mapped[bool] = mapped_column(Boolean, default=False)
    aceite_declaracao: Mapped[bool] = mapped_column(Boolean, default=False)
    aceite_termo: Mapped[bool] = mapped_column(Boolean, default=False)

    assinatura_adotante: Mapped[str | None] = mapped_column(Text, nullable=True)
    assinatura_ardap: Mapped[str | None] = mapped_column(Text, nullable=True)
    local_assinatura: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at = mapped_column(DateTime, server_default=func.now())
    updated_at = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
