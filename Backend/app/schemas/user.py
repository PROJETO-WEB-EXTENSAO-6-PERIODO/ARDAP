from typing import Literal

from pydantic import BaseModel, Field


class CreateUserIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    second_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=6, max_length=255)
    role: Literal["admin", "funcionario"] = "funcionario"


class UserOut(BaseModel):
    id: int
    first_name: str
    second_name: str
    email: str
    role: str
