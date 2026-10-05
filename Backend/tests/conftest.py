"""Fixtures da suite.

Os testes rodam num banco SEPARADO (ardap_test) para nunca mexer nos dados de
desenvolvimento. DB_NAME precisa ser definido ANTES de importar app.* — no
pydantic-settings a variavel de ambiente tem prioridade sobre o .env.
"""

import os

os.environ["DB_NAME"] = "ardap_test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete, text

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import _REVOKED, hash_password
from app.main import app
from app.models.user import User  # noqa: F401  registra a tabela no Base


@pytest.fixture(scope="session", autouse=True)
def banco_de_teste():
    """Cria o schema do banco de teste uma unica vez."""
    server_url = settings.database_url.rsplit("/", 1)[0] + "/"
    servidor = create_engine(server_url)
    with servidor.connect() as conn:
        conn.execute(
            text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME}")
        )
        conn.commit()
    servidor.dispose()

    Base.metadata.create_all(bind=engine)
    yield

    engine.dispose()
    servidor = create_engine(server_url)
    with servidor.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {settings.DB_NAME}"))
        conn.commit()
    servidor.dispose()


@pytest.fixture(autouse=True)
def estado_zerado(banco_de_teste):
    """Zera usuarios e tokens revogados antes de cada teste.

    Zera tambem _REVOKED porque dois logins no mesmo segundo geram o MESMO
    token (o payload tem sub + exp em segundos): sem zerar, o token revogado
    por um teste quebraria o teste seguinte.
    """
    db = SessionLocal()
    try:
        db.execute(delete(User))
        db.commit()
    finally:
        db.close()
    _REVOKED.clear()
    yield


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def cria_usuario():
    """Cria um usuario direto no banco e devolve o id."""

    def _cria(
        email: str = "admin@ardap.org",
        senha: str = "ardap@123",
        role: str = "admin",
    ) -> int:
        db = SessionLocal()
        try:
            user = User(
                first_name="Admin" if role == "admin" else "Func",
                second_name="ARDAP",
                email=email,
                password=hash_password(senha),
                role=role,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user.id
        finally:
            db.close()

    return _cria


@pytest.fixture()
def get_user():
    """Le um usuario do banco (usado nas assercoes de RNF02)."""

    def _get(email: str) -> User:
        db = SessionLocal()
        try:
            return db.query(User).filter(User.email == email).one()
        finally:
            db.close()

    return _get
