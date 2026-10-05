"""Testes do fluxo de login/logout - RF01, RNF02 e RF12.

Roda com:  cd Backend && pytest -v
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

from app.core.config import settings
from app.core.deps import require_admin
from app.core.security import DUMMY_HASH, verify_password

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
# Enumeracao por tempo de resposta - o fix do timing
# ---------------------------------------------------------------------------


def test_bcrypt_roda_mesmo_quando_o_email_nao_existe(client):
    """Sem o DUMMY_HASH o checkpw nao executa e a resposta volta ~100x mais
    rapida, o que entregaria quem tem cadastro so de medir a latencia."""
    with patch("app.routers.auth.verify_password", wraps=verify_password) as spy:
        r = client.post(
            "/auth/login",
            json={"email": "ninguem@ardap.org", "password": "x"},
        )

    assert r.status_code == 401
    spy.assert_called_once()
    _, hash_usado = spy.call_args.args
    assert hash_usado == DUMMY_HASH


def test_quando_o_email_existe_compara_contra_o_hash_real(client, cria_usuario):
    cria_usuario()
    with patch("app.routers.auth.verify_password", wraps=verify_password) as spy:
        r = client.post(
            "/auth/login",
            json={"email": "admin@ardap.org", "password": "errada"},
        )

    assert r.status_code == 401
    _, hash_usado = spy.call_args.args
    assert hash_usado != DUMMY_HASH
    assert hash_usado.startswith("$2")


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
# Logout - revogacao do token
# ---------------------------------------------------------------------------


def test_logout_sem_token_retorna_401(client):
    assert client.post("/auth/logout").status_code == 401


def test_logout_encerra_a_sessao(client, cria_usuario):
    cria_usuario()
    token = login(client, "admin@ardap.org")["access_token"]

    # logado
    assert client.get("/users/me", headers=auth(token)).status_code == 200

    # logout
    r = client.post("/auth/logout", headers=auth(token))
    assert r.status_code == 200
    assert r.json()["msg"] == "Sessao encerrada"

    # o MESMO token deixa de valer
    depois = client.get("/users/me", headers=auth(token))
    assert depois.status_code == 401
    assert depois.json()["detail"] == "Sessao encerrada"


def test_segundo_logout_retorna_401(client, cria_usuario):
    """Token ja revogado nao autentica mais - nem para deslogar de novo."""
    cria_usuario()
    token = login(client, "admin@ardap.org")["access_token"]
    assert client.post("/auth/logout", headers=auth(token)).status_code == 200
    assert client.post("/auth/logout", headers=auth(token)).status_code == 401


def test_logout_de_um_usuario_nao_derruba_outro(client, cria_usuario):
    cria_usuario()
    cria_usuario(email="func@ardap.org", role="funcionario")

    token_admin = login(client, "admin@ardap.org")["access_token"]
    token_func = login(client, "func@ardap.org")["access_token"]

    client.post("/auth/logout", headers=auth(token_admin))

    assert client.get("/users/me", headers=auth(token_admin)).status_code == 401
    assert client.get("/users/me", headers=auth(token_func)).status_code == 200


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
