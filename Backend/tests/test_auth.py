"""Testes do fluxo de login - RF01, RNF02 e RF12.

Roda com:  cd Backend && pytest -v
"""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

from app.core.config import settings
from app.core.deps import require_admin
from app.core.security import verify_password

SENHA = "ardap@123"
MENSAGEM_UNICA = "E-mail ou senha invalidos"


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client: TestClient, email: str, senha: str = SENHA) -> dict:
    r = client.post("/auth/login", json={"email": email, "password": senha})
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------------------
# RF01 - login
# ---------------------------------------------------------------------------


def test_login_com_credenciais_validas(client, cria_usuario):
    cria_usuario()
    body = login(client, "admin@ardap.org")

    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str)
    assert len(body["access_token"]) > 20


def test_senha_errada_retorna_401(client, cria_usuario):
    cria_usuario()
    r = client.post(
        "/auth/login",
        json={"email": "admin@ardap.org", "password": "senha-errada"},
    )
    assert r.status_code == 401
    assert r.json()["detail"] == MENSAGEM_UNICA


def test_email_inexistente_retorna_401(client):
    r = client.post(
        "/auth/login",
        json={"email": "ninguem@ardap.org", "password": "qualquer-coisa"},
    )
    assert r.status_code == 401


def test_nao_revela_se_o_email_existe(client, cria_usuario):
    """A issue #9 pede: "sem dizer se o e-mail existe ou nao"."""
    cria_usuario()

    com_senha_errada = client.post(
        "/auth/login",
        json={"email": "admin@ardap.org", "password": "errada"},
    )
    sem_cadastro = client.post(
        "/auth/login",
        json={"email": "ninguem@ardap.org", "password": "errada"},
    )

    assert com_senha_errada.status_code == sem_cadastro.status_code == 401
    assert com_senha_errada.json() == sem_cadastro.json()


# ---------------------------------------------------------------------------
# RNF02 - senha com hash, nunca texto puro
# ---------------------------------------------------------------------------


def test_senha_gravada_como_hash_bcrypt(client, cria_usuario, get_user):
    senha_secreta = "minha-senha-super-secreta"
    cria_usuario(senha=senha_secreta)

    guardado = get_user("admin@ardap.org").password

    assert guardado != senha_secreta
    assert guardado.startswith("$2")
    assert verify_password(senha_secreta, guardado)
    assert not verify_password("outra-senha", guardado)


def test_login_nunca_devolve_a_senha(client, cria_usuario):
    cria_usuario()
    body = login(client, "admin@ardap.org")

    assert SENHA not in str(body)
    assert "$2" not in str(body)


# ---------------------------------------------------------------------------
# Sessao - /users/me
# ---------------------------------------------------------------------------


def test_me_sem_token_retorna_401(client):
    assert client.get("/users/me").status_code == 401


def test_me_com_token_valido_retorna_o_usuario(client, cria_usuario):
    id_admin = cria_usuario()
    token = login(client, "admin@ardap.org")["access_token"]

    r = client.get("/users/me", headers=auth(token))

    assert r.status_code == 200
    # first_name entrou na resposta no PR #15 (tela de login)
    assert r.json() == {
        "id": id_admin,
        "email": "admin@ardap.org",
        "role": "admin",
        "first_name": "Admin",
    }


def test_me_com_token_falso_retorna_401(client):
    falso = jose_jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "outra-chave-que-nao-e-a-oficial",
        algorithm="HS256",
    )
    assert client.get("/users/me", headers=auth(falso)).status_code == 401


def test_me_com_token_expirado_retorna_401(client):
    expirado = jose_jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=5)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    assert client.get("/users/me", headers=auth(expirado)).status_code == 401


# ---------------------------------------------------------------------------
# RF12 - restricao de papel roda no SERVIDOR
# ---------------------------------------------------------------------------


def test_rf12_restricao_de_papel_no_backend(client, cria_usuario):
    """A guarda de rota do React seria so UX. Aqui e que a seguranca acontece."""
    app_restrito = FastAPI()

    @app_restrito.get("/so-admin")
    def so_admin(_user=Depends(require_admin)):
        return {"ok": True}

    restrito = TestClient(app_restrito)

    cria_usuario(role="admin")
    cria_usuario(email="func@ardap.org", role="funcionario")

    token_admin = login(client, "admin@ardap.org")["access_token"]
    token_func = login(client, "func@ardap.org")["access_token"]

    assert restrito.get("/so-admin").status_code == 401
    assert restrito.get("/so-admin", headers=auth(token_func)).status_code == 403
    assert restrito.get("/so-admin", headers=auth(token_admin)).status_code == 200


@pytest.mark.parametrize("papel", ["admin", "funcionario"])
def test_papel_e_preservado_no_token(client, cria_usuario, papel):
    email = f"{papel}@ardap.org"
    cria_usuario(email=email, role=papel)
    token = login(client, email)["access_token"]

    r = client.get("/users/me", headers=auth(token))
    assert r.json()["role"] == papel
