"""Formatos de entrada/saida do CRUD de usuarios (issue #FEATURE0007)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["admin", "funcionario"]


class UsuarioCreate(BaseModel):
    """Campos da tabela users: primeiro nome, segundo nome, email, senha, role."""

    first_name: str = Field(min_length=1, max_length=100)
    second_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=6, max_length=128)
    role: Role = "funcionario"


class UsuarioUpdate(BaseModel):
    """Todos opcionais: so o que vier no corpo e alterado."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    second_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, min_length=3, max_length=150)
    password: str | None = Field(default=None, min_length=6, max_length=128)
    role: Role | None = None


class UsuarioOut(BaseModel):
    """A senha NUNCA sai daqui - e so hash e, mesmo assim, fica interna."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    second_name: str
    email: str
    role: str
