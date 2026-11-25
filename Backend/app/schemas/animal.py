"""Formatos de entrada/saida de animais (RF03 + RF10 parcial)."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import Base64Bytes, BaseModel, Field

from app.schemas.user import AutorOut


class AnimalIn(BaseModel):
    nome: str | None = Field(default=None, max_length=100)
    especie: str = Field(min_length=1, max_length=50)
    raca: str | None = Field(default=None, max_length=100)
    sexo: Literal["macho", "femea"]
    data_nascimento_estimada: date | None = None
    idade_estimada: int | None = Field(default=None, ge=0, le=40)
    porte: Literal["pequeno", "medio", "grande"] | None = None
    cor_pelo: str | None = Field(default=None, max_length=100)
    peso: Decimal | None = Field(default=None, gt=0)
    castrado: bool = False
    vermifugado: bool = False
    vacinado: bool = False
    temperamento: (
        Literal["docil", "medroso", "arisco", "agressivo", "desconhecido"]
        | None
    ) = None
    medicacao_necessaria: bool = False
    medicacao_desc: str | None = None
    origem_resgate: str | None = Field(default=None, max_length=255)
    observacoes: str | None = None
    foto: Base64Bytes = Field(min_length=1)


class AnimalUpdateIn(AnimalIn):
    # sem foto nova, a atual e mantida
    foto: Base64Bytes | None = Field(default=None, min_length=1)


class AnimalOut(BaseModel):
    id: int
    nome: str | None
    especie: str
    raca: str | None
    sexo: str
    data_nascimento_estimada: date | None
    idade_estimada: int | None
    porte: str | None
    cor_pelo: str | None
    peso: Decimal | None
    castrado: bool
    vermifugado: bool
    vacinado: bool
    temperamento: str
    medicacao_necessaria: bool
    medicacao_desc: str | None
    origem_resgate: str | None
    observacoes: str | None
    tem_foto: bool
    created_at: datetime | None
    funcionario: AutorOut | None
    alterado_por: AutorOut | None
    updated_at: datetime | None


class AnimalResumoOut(BaseModel):
    id: int
    nome: str | None
    especie: str
    raca: str | None
    sexo: str
    tem_foto: bool

    class Config:
        from_attributes = True
