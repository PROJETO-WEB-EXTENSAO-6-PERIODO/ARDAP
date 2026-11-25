from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field


def _cabe_no_bcrypt(senha: str) -> str:
    # o limite e em bytes: letras acentuadas ocupam dois
    if len(senha.encode()) > 72:
        raise ValueError("A senha deve ter no máximo 72 bytes.")
    return senha


Senha = Annotated[str, Field(min_length=6), AfterValidator(_cabe_no_bcrypt)]


class CreateUserIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    second_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=150)
    password: Senha
    role: Literal["admin", "funcionario"] = "funcionario"


class UpdateUserIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    second_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=150)
    role: Literal["admin", "funcionario"]
    # sem senha nova, a atual e mantida
    password: Senha | None = None


class UserOut(BaseModel):
    id: int
    first_name: str
    second_name: str
    email: str
    role: str


class AutorOut(BaseModel):
    """Quem cadastrou ou alterou um registro (sem e-mail nem permissao)."""

    id: int
    first_name: str
    second_name: str

    class Config:
        from_attributes = True


class UserDetalheOut(UserOut):
    funcionario: AutorOut | None
    created_at: datetime | None
    alterado_por: AutorOut | None
    updated_at: datetime | None

    class Config:
        from_attributes = True
