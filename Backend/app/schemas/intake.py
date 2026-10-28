from datetime import date

from pydantic import BaseModel, Field


class SupatasIntakeIn(BaseModel):
    orgao_solicitante: str = Field(default="SUPATAS", max_length=150)
    nome_responsavel_encaminhamento: str = Field(
        ..., min_length=1, max_length=150
    )
    data_encaminhamento: date
    situacao_animal: str | None = Field(
        default=None, max_length=20
    )  # acidentado | doente | castracao | outros
    situacao_animal_outros_desc: str | None = Field(
        default=None, max_length=255
    )
    local_recolhimento: str | None = Field(
        default=None, max_length=255
    )
    nome_resgatista: str | None = Field(default=None, max_length=150)
    relatorio: str | None = None


class SupatasIntakeOut(BaseModel):
    id: int
    orgao_solicitante: str | None
    nome_responsavel_encaminhamento: str | None
    data_encaminhamento: date | None
    situacao_animal: str | None
    situacao_animal_outros_desc: str | None
    local_recolhimento: str | None
    nome_resgatista: str | None
    relatorio: str | None

    class Config:
        from_attributes = True
