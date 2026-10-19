"""Testes do CRUD de usuarios - issue #FEATURE0007 (RF02 + RF12).

Cobre a guarda de papel no servidor (só admin gerencia), a validacao de
entrada, o hash de senha (RNF02) e os verbos REST.

Roda com:  cd Backend && pytest -v
"""

import pytest

SENHA_FORTE = "Segura123!"


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client, email: str, senha: str) -> dict:
    r = client.post("/auth/login", json={"email": email, "password": senha})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture()
def token_admin(client, cria_usuario):
    cria_usuario(senha=SENHA_FORTE, role="admin")
    return login(client, "admin@ardap.org", SENHA_FORTE)["access_token"]


@pytest.fixture()
def token_func(client, cria_usuario):
    cria_usuario(email="func@ardap.org", senha=SENHA_FORTE, role="funcionario")
    return login(client, "func@ardap.org", SENHA_FORTE)["access_token"]


# ---------------------------------------------------------------------------
# RF12 - a guarda roda no SERVIDOR
# ---------------------------------------------------------------------------


def test_lista_sem_token_retorna_401(client):
    assert client.get("/usuarios").status_code == 401


def test_cria_sem_token_retorna_401(client):
    r = client.post("/usuarios", json={"first_name": "A", "second_name": "B",
                                       "email": "a@b.org", "password": SENHA_FORTE,
                                       "role": "funcionario"})
    assert r.status_code == 401


def test_funcionario_nao_lista_retorna_403(client, token_func):
    assert client.get("/usuarios", headers=auth(token_func)).status_code == 403


def test_funcionario_nao_cria_retorna_403(client, token_func):
    r = client.post(
        "/usuarios",
        headers=auth(token_func),
        json={"first_name": "A", "second_name": "B", "email": "a@b.org",
              "password": SENHA_FORTE, "role": "funcionario"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "Acesso de admin"


def test_funcionario_nao_remove_retorna_403(client, token_func, cria_usuario):
    outro = cria_usuario(email="outro@ardap.org", role="funcionario")
    assert (
        client.delete(f"/usuarios/{outro}", headers=auth(token_func)).status_code
        == 403
    )


# ---------------------------------------------------------------------------
# POST /usuarios - criacao
# ---------------------------------------------------------------------------


def test_admin_cria_usuario_e_retorna_201(client, token_admin):
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "Maria", "second_name": "Souza",
              "email": "maria@ardap.org", "password": SENHA_FORTE,
              "role": "funcionario"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["id"] > 0
    assert body["email"] == "maria@ardap.org"
    assert body["role"] == "funcionario"
    assert "password" not in body


def test_senha_grava_como_hash_nunca_texto_puro(client, token_admin, get_user):
    client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "Maria", "second_name": "Souza",
              "email": "maria@ardap.org", "password": SENHA_FORTE,
              "role": "funcionario"},
    )

    guardado = get_user("maria@ardap.org").password
    assert guardado != SENHA_FORTE
    assert guardado.startswith("$2")


def test_role_padrao_e_funcionario(client, token_admin):
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "Ana", "second_name": "Silva",
              "email": "ana@ardap.org", "password": SENHA_FORTE},
    )
    assert r.status_code == 201
    assert r.json()["role"] == "funcionario"


def test_admin_pode_criar_outro_admin(client, token_admin):
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "Chefe", "second_name": "ARDAP",
              "email": "chefe@ardap.org", "password": SENHA_FORTE,
              "role": "admin"},
    )
    assert r.status_code == 201
    assert r.json()["role"] == "admin"


def test_email_duplicado_retorna_409(client, token_admin, cria_usuario):
    cria_usuario(email="duplicado@ardap.org", role="funcionario")
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "Outro", "second_name": "Duplicado",
              "email": "duplicado@ardap.org", "password": SENHA_FORTE,
              "role": "funcionario"},
    )
    assert r.status_code == 409


def test_role_invalida_retorna_422(client, token_admin):
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "A", "second_name": "B", "email": "a@b.org",
              "password": SENHA_FORTE, "role": "superusuario"},
    )
    assert r.status_code == 422


def test_senha_curta_retorna_422(client, token_admin):
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "A", "second_name": "B", "email": "a@b.org",
              "password": "123", "role": "funcionario"},
    )
    assert r.status_code == 422


def test_campos_obrigatorios_ausentes_retornam_422(client, token_admin):
    r = client.post("/usuarios", headers=auth(token_admin), json={"email": "x@y.org"})
    assert r.status_code == 422
    campos = [erro["loc"][-1] for erro in r.json()["detail"]]
    assert "first_name" in campos and "password" in campos


# ---------------------------------------------------------------------------
# GET
# ---------------------------------------------------------------------------


def test_lista_mostra_os_usuarios_sem_a_senha(client, token_admin, cria_usuario):
    cria_usuario(email="func@ardap.org", role="funcionario")

    r = client.get("/usuarios", headers=auth(token_admin))
    assert r.status_code == 200
    emails = [u["email"] for u in r.json()]
    assert "admin@ardap.org" in emails
    assert "func@ardap.org" in emails
    for usuario in r.json():
        assert "password" not in usuario


def test_detalha_usuario_existente(client, token_admin):
    # o fixture token_admin ja criou admin@ardap.org - nao crie de novo
    id_admin = [
        u["id"]
        for u in client.get("/usuarios", headers=auth(token_admin)).json()
        if u["email"] == "admin@ardap.org"
    ][0]

    r = client.get(f"/usuarios/{id_admin}", headers=auth(token_admin))
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_detalha_id_inexistente_retorna_404(client, token_admin):
    assert client.get("/usuarios/999999", headers=auth(token_admin)).status_code == 404


# ---------------------------------------------------------------------------
# PUT
# ---------------------------------------------------------------------------


def test_atualiza_nome_e_role(client, token_admin, cria_usuario):
    id_alvo = cria_usuario(email="alvo@ardap.org", role="funcionario")

    r = client.put(
        f"/usuarios/{id_alvo}",
        headers=auth(token_admin),
        json={"first_name": "Renomeado", "role": "admin"},
    )
    assert r.status_code == 200
    assert r.json()["first_name"] == "Renomeado"
    assert r.json()["role"] == "admin"
    # nao veio no corpo -> nao mudou
    assert r.json()["email"] == "alvo@ardap.org"


def test_atualiza_senha_grava_como_hash(client, token_admin, cria_usuario, get_user):
    id_alvo = cria_usuario(email="alvo@ardap.org", senha=SENHA_FORTE, role="funcionario")

    nova = "OutraSenha456!"
    r = client.put(
        f"/usuarios/{id_alvo}",
        headers=auth(token_admin),
        json={"password": nova},
    )
    assert r.status_code == 200
    assert "password" not in r.json()

    guardado = get_user("alvo@ardap.org").password
    assert guardado != nova
    assert guardado.startswith("$2")


def test_atualiza_para_email_ja_usado_retorna_409(client, token_admin, cria_usuario):
    cria_usuario(email="ocupado@ardap.org", role="funcionario")
    id_alvo = cria_usuario(email="livre@ardap.org", role="funcionario")

    r = client.put(
        f"/usuarios/{id_alvo}",
        headers=auth(token_admin),
        json={"email": "ocupado@ardap.org"},
    )
    assert r.status_code == 409


def test_atualiza_id_inexistente_retorna_404(client, token_admin):
    r = client.put(
        "/usuarios/999999", headers=auth(token_admin), json={"first_name": "X"}
    )
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------


def test_remove_usuario(client, token_admin, cria_usuario):
    id_alvo = cria_usuario(email="sai@ardap.org", role="funcionario")

    assert client.delete(f"/usuarios/{id_alvo}", headers=auth(token_admin)).status_code == 200
    # sumiu de verdade
    assert client.get(f"/usuarios/{id_alvo}", headers=auth(token_admin)).status_code == 404


def test_nao_permite_o_admin_se_excluir(client, token_admin):
    """Evita deixar o sistema sem ninguem com permissao de criar usuario."""
    # o fixture token_admin ja criou admin@ardap.org - nao crie de novo
    id_admin = [
        u["id"]
        for u in client.get("/usuarios", headers=auth(token_admin)).json()
        if u["email"] == "admin@ardap.org"
    ][0]

    r = client.delete(f"/usuarios/{id_admin}", headers=auth(token_admin))
    assert r.status_code == 409
    assert client.get(f"/usuarios/{id_admin}", headers=auth(token_admin)).status_code == 200


def test_remove_id_inexistente_retorna_404(client, token_admin):
    assert client.delete("/usuarios/999999", headers=auth(token_admin)).status_code == 404


# ---------------------------------------------------------------------------
# RF02 ponta a ponta: o usuario criado consegue logar
# ---------------------------------------------------------------------------


def test_usuario_criado_pelo_admin_consegue_logar(client, token_admin, cria_usuario):
    r = client.post(
        "/usuarios",
        headers=auth(token_admin),
        json={"first_name": "Novo", "second_name": "Funcionario",
              "email": "novo@ardap.org", "password": SENHA_FORTE,
              "role": "funcionario"},
    )
    assert r.status_code == 201

    corpo = login(client, "novo@ardap.org", SENHA_FORTE)
    assert "access_token" in corpo

    # e o papel veio certo
    me = client.get("/users/me", headers=auth(corpo["access_token"]))
    assert me.json()["role"] == "funcionario"
