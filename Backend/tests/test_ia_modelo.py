"""Modelo carregado do ai-model/: formato da saida e coerencia das previsoes."""

from datetime import date

from app.ia import modelo, traducao


def _linha(**campos) -> dict:
    dados = dict(
        especie="cao", sexo="macho", castrado=False, idade_anos=3, raca="SRD",
        cor_pelo="Caramelo", origem_resgate="Centro", medicacao_necessaria=False,
        situacao_supatas=None, veio_do_supatas=False, data_entrada=date(2026, 6, 1),
    )
    dados.update(campos)
    return traducao.features(traducao.EntradaAnimal(**dados))


def test_modelo_carrega_uma_vez():
    assert modelo.carregar() is modelo.carregar()
    assert 0 < modelo.carregar().threshold < 1


def test_explicar_formato():
    r = modelo.explicar(_linha())
    assert 0 <= r["probabilidade"] <= 1
    assert r["faixa"] in ("baixa", "media", "alta")
    assert r["janela_dias"] == 30
    assert r["previsao_adotado"] == (r["probabilidade"] >= r["threshold"])
    for fator in r["fatores"]:
        assert abs(fator["impacto"]) >= modelo.IMPACTO_MINIMO


def test_faixas():
    assert modelo.faixa(0.10) == "baixa"
    assert modelo.faixa(0.40) == "media"
    assert modelo.faixa(0.59) == "media"
    assert modelo.faixa(0.60) == "alta"


def test_filhote_tem_mais_chance_que_idoso():
    """Padrao mais forte da base (idade): o modelo precisa respeita-lo."""
    filhote = modelo.explicar(_linha(idade_anos=0))
    idoso = modelo.explicar(_linha(idade_anos=12))
    assert filhote["probabilidade"] > idoso["probabilidade"] + 0.2
    assert idoso["faixa"] == "baixa"
    assert any(f["fator"] == "idade" and f["impacto"] < 0 for f in idoso["fatores"])


def test_entregue_pelo_tutor_aumenta_a_chance():
    rua = modelo.explicar(_linha(especie="gato", origem_resgate="Rua"))
    tutor = modelo.explicar(_linha(especie="gato", origem_resgate="Entregue pelo tutor"))
    assert tutor["probabilidade"] > rua["probabilidade"]


def test_prever_varios_mantem_a_ordem():
    linhas = [_linha(idade_anos=0), _linha(idade_anos=12)]
    probs = modelo.prever_varios(linhas)
    assert len(probs) == 2 and probs[0] > probs[1]
    assert modelo.prever_varios([]) == []


def test_resumo_traz_metricas_do_treino():
    r = modelo.resumo()
    assert r["algoritmo"] == "Gradient Boosting"
    assert r["teste"]["f1_macro"] > r["validacao"]["Baseline (classe majoritaria)"]["f1_macro"]
    assert r["taxa_real_por_faixa"]["alta"]["taxa_real"] > r["taxa_real_por_faixa"]["baixa"]["taxa_real"]
