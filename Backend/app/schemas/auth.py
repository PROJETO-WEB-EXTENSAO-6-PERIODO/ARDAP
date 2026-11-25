"""Formatos de entrada/saida do auth."""

from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=150)
    password: str = Field(min_length=1, max_length=255)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
