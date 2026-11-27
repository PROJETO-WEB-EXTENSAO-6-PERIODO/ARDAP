"""Avalia as faixas (baixa/media/alta) e a ordenacao usadas na interface.

A tela mostra a probabilidade em tres faixas e ordena os animais pela chance.
Este script confere, no MESMO conjunto de teste do treino (semente 42), se:

1. as faixas separam de fato animais com taxas reais de adocao diferentes;
2. a probabilidade esta calibrada (o modelo usa class_weight="balanced", que
   tende a superestimar a classe positiva);
3. a ordenacao funciona: entre os 10%/20% com MENOR probabilidade, quantos
   realmente nao foram adotados em 30 dias (sao eles que a lista prioriza).

Uso:
    python ai-model/scripts/avaliar_faixas.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).resolve().parent))

from treinar import (  # noqa: E402
    PASTA_FIGURAS,
    PASTA_MODELOS,
    PASTA_RELATORIOS,
    SEMENTE,
    carregar_dados,
    montar_base,
    preparar_features,
)

# Mesmos limites de Backend/app/ia/modelo.py
FAIXA_BAIXA = 0.40
FAIXA_ALTA = 0.60


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    pacote = joblib.load(PASTA_MODELOS / "modelo.joblib")
    modelo = pacote["pipeline"]

    intakes, outcomes = carregar_dados()
    base = montar_base(intakes, outcomes)
    X = preparar_features(base)
    y = base["y"].astype(int)

    # mesma divisao do treino: o teste continua inedito para o modelo
    _, X_resto, _, y_resto = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=SEMENTE
    )
    _, X_te, _, y_te = train_test_split(
        X_resto, y_resto, test_size=0.50, stratify=y_resto, random_state=SEMENTE
    )

    prob = modelo.predict_proba(X_te)[:, 1]
    faixa = np.select(
        [prob < FAIXA_BAIXA, prob < FAIXA_ALTA], ["baixa", "media"], default="alta"
    )
    tabela = (
        pd.DataFrame({"faixa": faixa, "y": y_te.to_numpy(), "prob": prob})
        .groupby("faixa")
        .agg(animais=("y", "size"), taxa_real=("y", "mean"), prob_media=("prob", "mean"))
        .reindex(["baixa", "media", "alta"])
    )
    tabela["participacao"] = tabela["animais"] / len(y_te)

    # ordenacao: a lista de prioridade mostra primeiro quem tem MENOS chance
    ordem = np.argsort(prob)
    taxa_base_nao = float(1 - y_te.mean())
    topo = {}
    for fracao in (0.10, 0.20):
        k = int(len(ordem) * fracao)
        nao_adotados = float(1 - y_te.to_numpy()[ordem[:k]].mean())
        topo[f"{int(fracao * 100)}%"] = {
            "animais": k,
            "nao_adotados": round(nao_adotados, 4),
            "lift": round(nao_adotados / taxa_base_nao, 3),
        }

    real, previsto = calibration_curve(y_te, prob, n_bins=10, strategy="quantile")
    brier = float(brier_score_loss(y_te, prob))
    brier_base = float(brier_score_loss(y_te, np.full(len(y_te), y_te.mean())))

    resultado = {
        "limites": {"baixa": FAIXA_BAIXA, "alta": FAIXA_ALTA},
        "faixas": {
            nome: {
                "animais": int(linha.animais),
                "participacao": round(float(linha.participacao), 4),
                "taxa_real": round(float(linha.taxa_real), 4),
                "prob_media": round(float(linha.prob_media), 4),
            }
            for nome, linha in tabela.iterrows()
        },
        "taxa_base": round(float(y_te.mean()), 4),
        "ordenacao_menor_chance": topo,
        "calibracao": {
            "brier": round(brier, 4),
            "brier_baseline": round(brier_base, 4),
            "previsto": [round(float(v), 4) for v in previsto],
            "real": [round(float(v), 4) for v in real],
        },
    }
    (PASTA_RELATORIOS / "faixas.json").write_text(
        json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # figura: taxa real por faixa + curva de calibracao
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
    cores = ["#c62828", "#f9a825", "#2e7d32"]
    ax1.bar(tabela.index, tabela["taxa_real"] * 100, color=cores)
    ax1.axhline(y_te.mean() * 100, ls="--", color="gray", label="taxa base")
    for i, (valor, n) in enumerate(zip(tabela["taxa_real"], tabela["animais"])):
        ax1.text(i, valor * 100, f"{valor:.0%}\n({n:,} animais)".replace(",", "."),
                 ha="center", va="bottom", fontsize=8)
    ax1.set_ylim(0, 85)
    ax1.set_ylabel("% adotados em 30 dias (real)")
    ax1.set_title("Taxa real de adocao por faixa (teste)")
    ax1.legend(fontsize=8)

    ax2.plot([0, 1], [0, 1], "--", color="gray", label="calibracao perfeita")
    ax2.plot(previsto, real, marker="o", color="#1565c0", label="Gradient Boosting")
    ax2.set_xlabel("Probabilidade prevista")
    ax2.set_ylabel("Fracao real de adotados")
    ax2.set_title("Curva de calibracao (teste)")
    ax2.legend(fontsize=8)
    fig.tight_layout()
    PASTA_FIGURAS.mkdir(parents=True, exist_ok=True)
    fig.savefig(PASTA_FIGURAS / "09_faixas_calibracao.png", dpi=150, bbox_inches="tight")
    plt.close(fig)

    print(tabela.round(3).to_string())
    print("ordenacao (menor chance primeiro):", topo)
    print(f"Brier: {brier:.4f} (baseline {brier_base:.4f})")
    print("-> ai-model/relatorios/faixas.json")
    print("-> ai-model/relatorios/figuras/09_faixas_calibracao.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
