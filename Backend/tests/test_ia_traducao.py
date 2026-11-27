"""Traducao do cadastro do ARDAP para o vocabulario da base de treino."""

from datetime import date

import pytest

from app.ia import traducao as t


@pytest.mark.parametrize(
    ("texto", "especie", "esperado"),
    [
        ("Preto e branco", "cao", "Black"),
        ("Caramelo", "cao", "Tan"),
        ("Marrom tigrado", "gato", "Brown Tabby"),
        ("Cinza tigrado", "gato", "Gray Tabby"),
        ("Preto e caramelo rajado", "cao", "Black Brindle"),
        ("Branco, preto e laranja", "gato", "Calico"),
        ("Tricolor", "cao", "Tricolor"),
        ("Escaminha", "gato", "Tortie"),
        ("LARANJA", "gato", "Orange"),
        ("", "cao", "Desconhecida"),
        (None, "gato", "Desconhecida"),
        ("Verde-limão", "cao", "Desconhecida"),
    ],
)
def test_cor(texto, especie, esperado):
    assert t.cor(texto, especie) == esperado


@pytest.mark.parametrize(
    ("raca", "especie", "esperado"),
    [
        ("SRD", "cao", ("Desconhecida", 1)),
        ("Pastor Alemão", "cao", ("German Shepherd", 0)),
        ("Dachshund (Salsicha)", "cao", ("Dachshund", 0)),
        ("Fila Brasileiro", "cao", ("Desconhecida", 0)),
        ("SRD", "gato", ("Domestic Shorthair", 0)),
        ("Siamês", "gato", ("Siamese", 0)),
        ("Outra", "outro", ("Desconhecida", 0)),
    ],
)
def test_raca(raca, especie, esperado):
    assert t.raca(raca, especie) == esperado


def test_idade_zero_vira_filhote():
    assert t.idade_dias(0) == t.DIAS_FILHOTE
    assert t.idade_dias(2) == 730
    assert t.idade_dias(None) is None


@pytest.mark.parametrize(
    ("origem", "supatas", "esperado"),
    [
        ("Entregue pelo antigo tutor", False, "Owner Surrender"),
        ("Animal abandonado na praça", False, "Abandoned"),
        ("Calçadão do Centro", False, "Stray"),
        (None, False, "Stray"),
        ("Entregue pelo tutor", True, "Stray"),
    ],
)
def test_tipo_entrada(origem, supatas, esperado):
    assert t.tipo_entrada(origem, supatas) == esperado


def test_condicao_entrada():
    assert t.condicao_entrada("acidentado", False) == "Injured"
    assert t.condicao_entrada("doente", True) == "Sick"
    assert t.condicao_entrada(None, True) == "Medical"
    assert t.condicao_entrada("castracao", False) == "Normal"


def test_features_tem_todas_as_colunas_do_treino():
    from app.ia.modelo import carregar

    linha = t.features(
        t.EntradaAnimal(
            especie="gato", sexo="femea", castrado=True, idade_anos=None,
            raca="SRD", cor_pelo="Cinza", origem_resgate=None,
            medicacao_necessaria=False, situacao_supatas=None,
            veio_do_supatas=False, data_entrada=date(2026, 3, 10),
        )
    )
    assert set(linha) == set(carregar().features)
    assert linha["idade_ausente"] == 1
    assert linha["esterilizado"] == "Esterilizado"
    assert linha["mes_entrada"] == 3
