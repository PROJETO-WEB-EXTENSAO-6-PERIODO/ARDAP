"""Cria um administrador, pedindo os dados no terminal.

Rodar, dentro de Backend/:  python -m app.scripts.criar_admin
Use no lugar de db/seed_admin.sql no banco da ONG.
"""

from getpass import getpass

from pydantic import ValidationError
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import CreateUserIn

SENHA_MINIMA = 12


def main() -> None:
    print(f"Banco: {settings.DB_NAME} em {settings.DB_HOST}")
    nome = input("Nome: ").strip()
    sobrenome = input("Sobrenome: ").strip()
    email = input("E-mail: ").strip()
    senha = getpass("Senha (nao aparece ao digitar): ")
    if senha != getpass("Repita a senha: "):
        raise SystemExit("As senhas nao conferem.")
    if len(senha) < SENHA_MINIMA:
        raise SystemExit(f"Use ao menos {SENHA_MINIMA} caracteres na senha.")
    try:
        dados = CreateUserIn(
            first_name=nome, second_name=sobrenome, email=email,
            password=senha, role="admin",
        )
    except ValidationError as erro:
        # sem repetir os valores digitados: um deles e a senha
        campos = ", ".join(str(e["loc"][0]) for e in erro.errors())
        raise SystemExit(f"Dados invalidos: {campos}") from None

    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.email == dados.email)):
            raise SystemExit("Ja existe um usuario com este e-mail.")
        db.add(User(
            first_name=dados.first_name, second_name=dados.second_name,
            email=dados.email, password=hash_password(dados.password),
            role=dados.role,
        ))
        db.commit()
    print("Administrador criado.")


if __name__ == "__main__":
    main()
