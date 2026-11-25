"""Formatos de entrada/saida de termos de castracao."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.animal import AnimalResumoOut


class CastracaoIn(BaseModel):
    animal_id: int | None = None

    proprietario_responsavel: str = Field(min_length=1, max_length=150)
    cpf_cnpj: str | None = Field(default=None, max_length=20)
    endereco: str | None = Field(default=None, max_length=255)
    numero: str | None = Field(default=None, max_length=10)
    complemento: str | None = Field(default=None, max_length=100)
    bairro: str | None = Field(default=None, max_length=100)
    ba_telefones: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=150)

    nome_animal: str | None = Field(default=None, max_length=100)
    idade_real: str | None = Field(default=None, max_length=50)
    especie: str | None = Field(default=None, max_length=50)
    raca: str | None = Field(default=None, max_length=100)
    pelagem: str | None = Field(default=None, max_length=100)
    sexo: Literal["macho", "femea"] | None = None

    procedimento: str | None = Field(default=None, max_length=255)

    assinatura_responsavel: str | None = None
    local_assinatura: str | None = Field(default=None, max_length=100)
    data_assinatura: date | None = None


class CastracaoOut(BaseModel):
    id: int
    animal_id: int | None
    animal: AnimalResumoOut | None
    created_at: datetime | None
    proprietario_responsavel: str
    cpf_cnpj: str | None
    endereco: str | None
    numero: str | None
    complemento: str | None
    bairro: str | None
    ba_telefones: str | None
    email: str | None
    nome_animal: str | None
    idade_real: str | None
    especie: str | None
    raca: str | None
    pelagem: str | None
    sexo: str | None
    procedimento: str | None
    assinatura_responsavel: str | None
    local_assinatura: str | None
    data_assinatura: date | None

    class Config:
        from_attributes = True
