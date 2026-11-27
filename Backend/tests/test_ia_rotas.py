"""Rotas /ia: integracao de ponta a ponta com banco SQLite e login simulado."""

from app.ia import modelo
from tests.conftest import adotar, criar_animal, eutanasiar, registrar_supatas

SIMULACAO = {
    "especie": "gato", "sexo": "femea", "castrado": True, "idade_anos": 1,
    "raca": "SRD", "cor_pelo": "Cinza", "origem": "tutor", "condicao": "saudavel",
}


def test_simular_ok(cliente):
    r = cliente.post("/ia/adocao/simular", json=SIMULACAO)
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["faixa"] in ("baixa", "media", "alta")
    assert 0 <= corpo["probabilidade"] <= 1


def test_simular_campos_vazios_geram_mensagens_claras(cliente):
    r = cliente.post("/ia/adocao/simular", json={})
    assert r.status_code == 422
    detalhe = r.json()["detail"]
    for trecho in ("espécie", "sexo", "idade", "origem", "condição"):
        assert trecho in detalhe


def test_simular_idade_fora_do_limite(cliente):
    r = cliente.post("/ia/adocao/simular", json={**SIMULACAO, "idade_anos": 99})
    assert r.status_code == 422
    assert "entre 0 e 30" in r.json()["detail"]


def test_simular_tipo_errado(cliente):
    r = cliente.post("/ia/adocao/simular", json={**SIMULACAO, "idade_anos": "três"})
    assert r.status_code == 422


def test_sem_login_retorna_401(cliente_sem_login):
    assert cliente_sem_login.post("/ia/adocao/simular", json=SIMULACAO).status_code == 401
    assert cliente_sem_login.get("/ia/prioridade").status_code == 401


def test_prever_animal_cadastrado(cliente, db):
    animal = criar_animal(db, idade_estimada=0)
    r = cliente.post(f"/ia/adocao/{animal.id}")
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["animal_id"] == animal.id
    assert corpo["dias_no_abrigo"] > 0
    assert corpo["faixa"] == "alta"


def test_supatas_acidentado_reduz_a_chance(cliente, db):
    saudavel = criar_animal(db, nome="A")
    ferido = criar_animal(db, nome="B")
    registrar_supatas(db, ferido, "acidentado")
    p_saudavel = cliente.post(f"/ia/adocao/{saudavel.id}").json()["probabilidade"]
    p_ferido = cliente.post(f"/ia/adocao/{ferido.id}").json()["probabilidade"]
    assert p_ferido < p_saudavel


def test_animal_inexistente_404(cliente):
    r = cliente.post("/ia/adocao/9999")
    assert r.status_code == 404
    assert r.json()["detail"] == "Animal não encontrado."


def test_animal_adotado_ou_eutanasiado_409(cliente, db):
    adotado = criar_animal(db, nome="Adotado")
    adotar(db, adotado)
    falecido = criar_animal(db, nome="Falecido")
    eutanasiar(db, falecido)
    assert cliente.post(f"/ia/adocao/{adotado.id}").status_code == 409
    assert cliente.post(f"/ia/adocao/{falecido.id}").status_code == 409


def test_prioridade_ordena_e_filtra(cliente, db):
    idoso = criar_animal(db, nome="Idoso", idade_estimada=13)
    filhote = criar_animal(db, nome="Filhote", idade_estimada=0)
    adotado = criar_animal(db, nome="Adotado")
    adotar(db, adotado)

    r = cliente.get("/ia/prioridade")
    assert r.status_code == 200
    itens = r.json()
    ids = [i["animal_id"] for i in itens]
    assert adotado.id not in ids
    # menor chance primeiro: o idoso precisa de mais divulgacao
    assert ids == [idoso.id, filhote.id]
    assert itens[0]["atencao"] is True
    assert itens[1]["atencao"] is False


def test_sobre_o_modelo(cliente):
    r = cliente.get("/ia/modelo")
    assert r.status_code == 200
    assert r.json()["teste"]["roc_auc"] > 0.7


def test_modelo_indisponivel_503(cliente, monkeypatch):
    def falhar():
        raise modelo.ModeloIndisponivel("arquivo ausente")

    monkeypatch.setattr(modelo, "carregar", falhar)
    r = cliente.post("/ia/adocao/simular", json=SIMULACAO)
    assert r.status_code == 503
    assert "não está disponível" in r.json()["detail"]
