"""Formatos de entrada/saida de termos de eutanasia."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class EutanasiaIn(BaseModel):
    animal_id: int | None = None

    nome_animal: str | None = Field(default=None, max_length=100)
    especie: str | None = Field(default=None, max_length=50)
    raca: str | None = Field(default=None, max_length=100)
    sexo: Literal["macho", "femea"] | None = None
    idade: str | None = Field(default=None, max_length=50)
    pelagem: str | None = Field(default=None, max_length=100)
    crmv_veterinario: str | None = Field(default=None, max_length=30)

    nome_responsavel: str = Field(min_length=1, max_length=150)
    rg: str | None = Field(default=None, max_length=30)
    cpf: str | None = Field(default=None, max_length=20)
    endereco: str | None = Field(default=None, max_length=255)
    bairro: str | None = Field(default=None, max_length=100)
    cidade: str | None = Field(default=None, max_length=100)
    telefone_email: str | None = Field(default=None, max_length=150)

    declaracao_aceite: bool = False
    local_declaracao: str | None = Field(default=None, max_length=100)
    data_declaracao: date | None = None
    assinatura_responsavel: str | None = None


class EutanasiaOut(BaseModel):
    id: int
    animal_id: int | None
    nome_animal: str | None
    especie: str | None
    raca: str | None
    sexo: str | None
    idade: str | None
    pelagem: str | None
    crmv_veterinario: str | None
    nome_responsavel: str
    rg: str | None
    cpf: str | None
    endereco: str | None
    bairro: str | None
    cidade: str | None
    telefone_email: str | None
    declaracao_aceite: bool
    local_declaracao: str | None
    data_declaracao: date | None
    assinatura_responsavel: str | None

    class Config:
        from_attributes = True
