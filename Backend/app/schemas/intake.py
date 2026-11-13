from datetime import date

from pydantic import BaseModel, Field


class SupatasIntakeIn(BaseModel):
    orgao_solicitante: str = Field(default="SUPATAS", max_length=150)
    nome_responsavel_encaminhamento: str = Field(
        ..., min_length=1, max_length=150
    )
    data_encaminhamento: date
    especie: str | None = Field(default=None, max_length=50)
    especie_outro: str | None = Field(default=None, max_length=100)
    sexo: str | None = Field(default=None, max_length=10)
    nome_animal: str | None = Field(default=None, max_length=100)
    situacao_animal: str | None = Field(
        default=None, max_length=20
    )
    situacao_animal_outros_desc: str | None = Field(
        default=None, max_length=255
    )
    local_recolhimento: str | None = Field(
        default=None, max_length=255
    )
    nome_resgatista: str | None = Field(default=None, max_length=150)
    relatorio: str | None = None
    recebido_por: str | None = Field(default=None, max_length=150)
    data_recebimento: date | None = None
    cpf_responsavel_supatas: str | None = Field(default=None, max_length=20)
    assinatura_responsavel_supatas: str | None = None
    assinatura_recebimento_ardap: str | None = None


class SupatasIntakeOut(BaseModel):
    id: int
    orgao_solicitante: str | None
    nome_responsavel_encaminhamento: str | None
    data_encaminhamento: date | None
    especie: str | None
    especie_outro: str | None
    sexo: str | None
    nome_animal: str | None
    situacao_animal: str | None
    situacao_animal_outros_desc: str | None
    local_recolhimento: str | None
    nome_resgatista: str | None
    relatorio: str | None
    recebido_por: str | None
    data_recebimento: date | None
    cpf_responsavel_supatas: str | None
    assinatura_responsavel_supatas: str | None
    assinatura_recebimento_ardap: str | None

    class Config:
        from_attributes = True
