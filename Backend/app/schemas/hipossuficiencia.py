"""Formatos de entrada/saida de declaracoes de hipossuficiencia."""

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.user import AutorOut


class HipossuficienciaIn(BaseModel):
    nome_representante: str = Field(min_length=1, max_length=150)
    documento_representante: str | None = Field(default=None, max_length=50)
    tipo_documento_representante: str | None = Field(default=None, max_length=50)
    email_representante: str | None = Field(default=None, max_length=150)

    nome_imigrante: str = Field(min_length=1, max_length=150)
    documento_imigrante: str | None = Field(default=None, max_length=50)
    tipo_documento_imigrante: str | None = Field(default=None, max_length=50)
    email_imigrante: str | None = Field(default=None, max_length=150)

    nao_possui_trabalho_remunerado: bool = False
    nao_possui_renda: bool = False
    renda_ate_meio_salario_per_capita: bool = False
    outro_motivo: str | None = None

    local_declaracao: str | None = Field(default=None, max_length=100)
    data_declaracao: date | None = None

    assinatura_representante: str | None = None
    anexo_documentos: str | None = None


class HipossuficienciaOut(BaseModel):
    id: int
    created_at: datetime | None
    funcionario: AutorOut | None
    nome_representante: str
    documento_representante: str | None
    tipo_documento_representante: str | None
    email_representante: str | None
    nome_imigrante: str
    documento_imigrante: str | None
    tipo_documento_imigrante: str | None
    email_imigrante: str | None
    nao_possui_trabalho_remunerado: bool
    nao_possui_renda: bool
    renda_ate_meio_salario_per_capita: bool
    outro_motivo: str | None
    local_declaracao: str | None
    data_declaracao: date | None
    assinatura_representante: str | None
    anexo_documentos: str | None

    class Config:
        from_attributes = True
