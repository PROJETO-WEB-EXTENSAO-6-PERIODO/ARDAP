"""Formatos de entrada/saida de termos de adocao (RF03 parcial)."""

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class AdocaoIn(BaseModel):
    animal_id: int | None = None
    especie_adocao: Literal["canino", "felino"] | None = None

    nome_adotante: str = Field(min_length=1, max_length=150)
    rg: str | None = Field(default=None, max_length=30)
    cpf: str | None = Field(default=None, max_length=20)
    endereco_residencial: str = Field(min_length=1, max_length=255)
    bairro: str | None = Field(default=None, max_length=100)
    cidade: str | None = Field(default=None, max_length=100)
    cep: str | None = Field(default=None, max_length=12)
    telefone: str | None = Field(default=None, max_length=20)
    instagram: str | None = Field(default=None, max_length=100)

    nome_animal: str | None = Field(default=None, max_length=100)
    especie: Literal["cao", "gato"] | None = None
    sexo: Literal["macho", "femea"] | None = None
    idade: str | None = Field(default=None, max_length=50)
    raca: str | None = Field(default=None, max_length=100)
    srd: bool = False
    onde_resgatou_tutor: str | None = Field(default=None, max_length=255)
    cor_pelo: str | None = Field(default=None, max_length=100)
    porte: Literal["pequeno", "medio", "grande"] | None = None
    peso: Decimal | None = Field(default=None, gt=0)
    castrado: bool | None = None
    vermifugado_3meses: Literal["sim", "nao", "sem_informacao"] | None = None
    medicamento_diario: bool = False
    mais_animais_em_casa: bool = False
    quantos_mais_animais: int | None = Field(default=None, ge=0)
    endereco_ficara_animal: Literal["mesmo", "outro"] = "mesmo"
    endereco_ficara_animal_outro: str | None = Field(default=None, max_length=255)
    local_na_casa: str | None = Field(default=None, max_length=255)

    outros_animais: bool = False
    quantos_animais: int | None = Field(default=None, ge=0)
    espaco_casa: bool = False
    casa_murada: bool = False
    espaco_coberto_quintal: bool = False
    mora_aluguel: bool = False
    proprietario_permite_animais: bool | None = None
    viajar_quem_cuidara: str | None = Field(default=None, max_length=255)
    familia_sabe_adocao: bool = False
    alguem_alergia: bool = False
    alimentacao: str | None = Field(default=None, max_length=255)
    acesso_rua: bool = False
    ciencia_vacinacao: bool = False
    aceite_declaracao: bool = False
    aceite_termo: bool = False

    assinatura_adotante: str | None = None
    assinatura_ardap: str | None = None
    local_assinatura: str | None = Field(default=None, max_length=100)
    data_assinatura: date | None = None


class AdocaoOut(BaseModel):
    id: int
    animal_id: int | None
    especie_adocao: str | None
    nome_adotante: str
    rg: str | None
    cpf: str | None
    endereco_residencial: str
    bairro: str | None
    cidade: str | None
    cep: str | None
    telefone: str | None
    instagram: str | None
    nome_animal: str | None
    especie: str | None
    sexo: str | None
    idade: str | None
    raca: str | None
    srd: bool
    onde_resgatou_tutor: str | None
    cor_pelo: str | None
    porte: str | None
    peso: Decimal | None
    castrado: bool | None
    vermifugado_3meses: str | None
    medicamento_diario: bool
    mais_animais_em_casa: bool
    quantos_mais_animais: int | None
    endereco_ficara_animal: str
    endereco_ficara_animal_outro: str | None
    local_na_casa: str | None
    outros_animais: bool
    quantos_animais: int | None
    espaco_casa: bool
    casa_murada: bool
    espaco_coberto_quintal: bool
    mora_aluguel: bool
    proprietario_permite_animais: bool | None
    viajar_quem_cuidara: str | None
    familia_sabe_adocao: bool
    alguem_alergia: bool
    alimentacao: str | None
    acesso_rua: bool
    ciencia_vacinacao: bool
    aceite_declaracao: bool
    aceite_termo: bool
    assinatura_adotante: str | None
    assinatura_ardap: str | None
    local_assinatura: str | None
    data_assinatura: date | None

    class Config:
        from_attributes = True


class ContagemOut(BaseModel):
    total: int
