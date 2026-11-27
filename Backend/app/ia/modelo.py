"""Carrega o modelo treinado em ai-model/ e gera as previsoes.

O arquivo .joblib e lido uma unica vez (na primeira chamada ou ao iniciar a
API) e mantido em memoria. O frontend nunca acessa o modelo: ele so recebe a
probabilidade, a faixa e os fatores calculados aqui.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

from app.core.config import settings

log = logging.getLogger(__name__)

RAIZ_REPO = Path(__file__).resolve().parents[3]
CAMINHO_PADRAO_MODELO = RAIZ_REPO / "ai-model" / "models" / "modelo.joblib"
CAMINHO_PADRAO_METRICAS = RAIZ_REPO / "ai-model" / "relatorios" / "metricas.json"
CAMINHO_PADRAO_FAIXAS = RAIZ_REPO / "ai-model" / "relatorios" / "faixas.json"

# Faixas de probabilidade mostradas ao usuario. Escolhidas olhando a taxa real
# de adocao em cada faixa no conjunto de teste (ai-model/scripts/avaliar_faixas.py).
FAIXA_BAIXA = 0.40
FAIXA_ALTA = 0.60

# Animal de referencia usado para explicar cada previsao: 1 ano, nao castrado,
# resgatado da rua, saudavel, sem raca e cor definidas. O impacto de um fator
# e quanto a probabilidade muda ao trocar o valor do animal pelo de referencia.
REFERENCIA = {
    "idade_dias": 365.0,
    "idade_ausente": 0,
    "esterilizado": "Nao esterilizado",
    "tipo_entrada": "Stray",
    "condicao_entrada": "Normal",
    "raca_principal": "Desconhecida",
    "misto": 1,
    "cor_principal": "Desconhecida",
}
# fator -> colunas trocadas juntas
GRUPOS_FATOR = {
    "idade": ("idade_dias", "idade_ausente"),
    "castracao": ("esterilizado",),
    "origem": ("tipo_entrada",),
    "saude": ("condicao_entrada",),
    "raca": ("raca_principal", "misto"),
    "cor": ("cor_principal",),
}
# abaixo disso (2 pontos percentuais) o fator nao e mostrado
IMPACTO_MINIMO = 0.02


class ModeloIndisponivel(RuntimeError):
    """O arquivo do modelo nao existe ou nao pode ser lido."""


@dataclass(frozen=True)
class ModeloCarregado:
    pipeline: object
    threshold: float
    features: list[str]
    janela_dias: int


def _caminho(valor: str, padrao: Path) -> Path:
    return Path(valor) if valor else padrao


@lru_cache(maxsize=1)
def carregar() -> ModeloCarregado:
    caminho = _caminho(settings.IA_MODELO_PATH, CAMINHO_PADRAO_MODELO)
    if not caminho.exists():
        raise ModeloIndisponivel(
            f"Modelo nao encontrado em {caminho}. "
            "Rode: python ai-model/scripts/treinar.py"
        )
    try:
        pacote = joblib.load(caminho)
    except Exception as erro:  # arquivo corrompido ou versao incompativel
        raise ModeloIndisponivel(f"Nao foi possivel ler o modelo: {erro}") from erro
    log.info("modelo de IA carregado de %s", caminho)
    return ModeloCarregado(
        pipeline=pacote["pipeline"],
        threshold=float(pacote["threshold"]),
        features=list(pacote["features"]),
        janela_dias=int(pacote.get("janela_dias", 30)),
    )


def faixa(probabilidade: float) -> str:
    if probabilidade >= FAIXA_ALTA:
        return "alta"
    if probabilidade >= FAIXA_BAIXA:
        return "media"
    return "baixa"


def _probabilidades(modelo: ModeloCarregado, linhas: list[dict]) -> list[float]:
    tabela = pd.DataFrame(linhas, columns=modelo.features)
    return [float(p) for p in modelo.pipeline.predict_proba(tabela)[:, 1]]


def prever_varios(linhas: list[dict]) -> list[float]:
    """Probabilidade de adocao em ate 30 dias para cada linha de features."""
    if not linhas:
        return []
    return _probabilidades(carregar(), linhas)


def explicar(linha: dict) -> dict:
    """Previsao de um animal com os fatores que mais pesaram.

    Os fatores mostram associacoes aprendidas na base, nao causas: por isso
    nao sugerimos acoes ("castre para aumentar a chance").
    """
    modelo = carregar()

    # monta todas as variacoes e preve tudo de uma vez
    variacoes: list[tuple[str, dict]] = [("animal", linha)]
    for nome, colunas in GRUPOS_FATOR.items():
        if all(linha[c] == REFERENCIA[c] for c in colunas):
            continue
        alterada = dict(linha)
        for coluna in colunas:
            alterada[coluna] = REFERENCIA[coluna]
        variacoes.append((nome, alterada))

    probs = dict(
        zip(
            [nome for nome, _ in variacoes],
            _probabilidades(modelo, [v for _, v in variacoes]),
        )
    )
    probabilidade = probs.pop("animal")

    fatores = [
        {"fator": nome, "impacto": round(probabilidade - p_ref, 4)}
        for nome, p_ref in probs.items()
        if abs(probabilidade - p_ref) >= IMPACTO_MINIMO
    ]
    fatores.sort(key=lambda f: abs(f["impacto"]), reverse=True)

    return {
        "probabilidade": round(probabilidade, 4),
        "faixa": faixa(probabilidade),
        "previsao_adotado": probabilidade >= modelo.threshold,
        "threshold": round(modelo.threshold, 2),
        "janela_dias": modelo.janela_dias,
        "fatores": fatores[:4],
    }


def _ler_json(caminho: Path) -> dict | None:
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


@lru_cache(maxsize=1)
def resumo() -> dict:
    """Metricas e dados do treino para a pagina "Sobre o modelo"."""
    modelo = carregar()
    metricas = _ler_json(
        _caminho(settings.IA_METRICAS_PATH, CAMINHO_PADRAO_METRICAS)
    ) or {}
    faixas = _ler_json(CAMINHO_PADRAO_FAIXAS) or {}
    melhor = metricas.get("melhor_modelo")
    teste = metricas.get("teste", {})

    def enxuto(r: dict) -> dict:
        chaves = ("f1", "f1_macro", "roc_auc", "pr_auc", "precisao", "recall", "acuracia")
        return {k: round(r[k], 3) for k in chaves if k in r}

    return {
        "algoritmo": melhor,
        "threshold": round(modelo.threshold, 2),
        "janela_dias": modelo.janela_dias,
        "faixas": {"baixa": FAIXA_BAIXA, "alta": FAIXA_ALTA},
        "base": metricas.get("base"),
        "validacao": {
            nome: enxuto(r) for nome, r in metricas.get("validacao", {}).items()
        },
        "teste": enxuto(teste[melhor]) if melhor in teste else None,
        "matriz_confusao": teste.get(melhor, {}).get("matriz_confusao"),
        "importancia": [
            {"feature": i["feature"], "valor": round(i["importancia_media"], 4)}
            for i in metricas.get("importancia", [])[:6]
        ],
        "taxa_real_por_faixa": faixas.get("faixas"),
    }
