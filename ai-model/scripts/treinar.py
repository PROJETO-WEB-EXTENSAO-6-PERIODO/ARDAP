"""Treina e avalia o modelo de priorizacao de adocao do ARDAP.

Problema: a ONG resgata mais animais do que consegue divulgar. O modelo estima a
probabilidade de um animal ser adotado em ate 30 dias, para apoiar a decisao de
quem divulgar primeiro.

Pipeline reprodutivel (semente fixa = 42):
  1. carrega entradas e desfechos do Austin Animal Center;
  2. monta o alvo binario "adotado em ate 30 dias";
  3. treina baseline, regressao logistica, random forest e gradient boosting;
  4. seleciona o melhor modelo na validacao e reporta no teste;
  5. salva modelo, metricas, figuras e um relatorio em markdown.

Uso:
    python ai-model/scripts/baixar_dados.py
    python ai-model/scripts/treinar.py
    python ai-model/scripts/treinar.py --limite 30000 --sem-figuras   # teste rapido
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

SEMENTE = 42
JANELA_ADOCAO = 30  # dias

RAIZ = Path(__file__).resolve().parents[2]
PASTA_DADOS = RAIZ / "datasets" / "raw"
PASTA_MODELOS = RAIZ / "ai-model" / "models"
PASTA_RELATORIOS = RAIZ / "ai-model" / "relatorios"
PASTA_FIGURAS = PASTA_RELATORIOS / "figuras"

NUMERICAS = ["idade_dias", "mes_entrada"]
CATEGORICAS = [
    "especie",
    "sexo",
    "esterilizado",
    "raca_principal",
    "cor_principal",
    "tipo_entrada",
    "condicao_entrada",
]
BINARIAS = ["idade_ausente", "misto"]


# ---------------------------------------------------------------------------
# Dados
# ---------------------------------------------------------------------------
def carregar_dados(pasta: Path = PASTA_DADOS) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Le os CSVs baixados por baixar_dados.py."""
    caminho_intakes = pasta / "intakes.csv"
    caminho_outcomes = pasta / "outcomes.csv"
    if not caminho_intakes.exists() or not caminho_outcomes.exists():
        raise FileNotFoundError(
            f"dados nao encontrados em {pasta}. Rode: python ai-model/scripts/baixar_dados.py"
        )
    intakes = pd.read_csv(caminho_intakes)
    outcomes = pd.read_csv(caminho_outcomes)
    return intakes, outcomes


def idade_em_dias(valor: object) -> float:
    """Converte '7 years', '3 months', '2 weeks', '5 days' em dias."""
    if not isinstance(valor, str):
        return np.nan
    achado = re.search(r"(\d+)\s*(year|month|week|day)", valor.lower())
    if not achado:
        return np.nan
    quantidade = int(achado.group(1))
    fator = {"year": 365, "month": 30, "week": 7, "day": 1}[achado.group(2)]
    return float(quantidade * fator)


def separar_sexo(valor: object) -> tuple[str, str]:
    """Separa 'Spayed Female' em (sexo, esterilizado)."""
    texto = str(valor).lower()
    if "spayed" in texto or "neutered" in texto:
        esterilizado = "Esterilizado"
    elif "intact" in texto:
        esterilizado = "Nao esterilizado"
    else:
        esterilizado = "Desconhecido"

    if "female" in texto:
        sexo = "Femea"
    elif "male" in texto:
        sexo = "Macho"
    else:
        sexo = "Desconhecido"
    return sexo, esterilizado


def montar_base(
    intakes: pd.DataFrame,
    outcomes: pd.DataFrame,
    janela: int = JANELA_ADOCAO,
) -> pd.DataFrame:
    """Junta cada entrada ao primeiro desfecho posterior e cria o alvo.

    Regra do alvo (y):
      1 -> adotado em ate `janela` dias;
      0 -> qualquer outro desfecho, adocao tardia ou ainda no abrigo apos a janela;
      descartado -> sem desfecho e dentro da janela (dado censurado).
    """
    entradas = intakes.dropna(subset=["animal_id", "datetime"]).copy()
    saidas = outcomes.dropna(subset=["animal_id", "datetime", "outcome_type"]).copy()

    entradas["datetime"] = pd.to_datetime(
        entradas["datetime"], format="ISO8601", errors="coerce", utc=True
    )
    saidas["datetime"] = pd.to_datetime(
        saidas["datetime"], format="ISO8601", errors="coerce", utc=True
    )
    entradas = entradas.dropna(subset=["datetime"])
    entradas["datetime"] = entradas["datetime"].dt.tz_localize(None)
    saidas["datetime"] = saidas["datetime"].dt.tz_localize(None)

    # a conversao pode gerar NaT em datas invalidas
    entradas = entradas.dropna(subset=["datetime"])
    saidas = saidas.dropna(subset=["datetime"])

    # Junta cada entrada com TODOS os desfechos do mesmo animal e fica com o
    # primeiro desfecho que aconteceu depois da entrada (merge_asof com `by`
    # nao se mostrou confiavel nesta base).
    entradas = entradas.reset_index(drop=True)
    entradas["entrada_id"] = np.arange(len(entradas))

    desfechos = saidas[["animal_id", "datetime", "outcome_type"]].rename(
        columns={"datetime": "data_desfecho", "outcome_type": "desfecho"}
    )
    pares = entradas[["entrada_id", "animal_id", "datetime"]].merge(
        desfechos, on="animal_id", how="left"
    )
    pares = pares[
        pares["data_desfecho"].isna() | (pares["data_desfecho"] >= pares["datetime"])
    ]
    pares = pares.sort_values(["entrada_id", "data_desfecho"])
    primeiro = pares.drop_duplicates("entrada_id", keep="first")

    base = entradas.merge(
        primeiro[["entrada_id", "data_desfecho", "desfecho"]],
        on="entrada_id",
        how="left",
    )

    base["dias_ate_desfecho"] = (base["data_desfecho"] - base["datetime"]).dt.days

    data_corte = max(entradas["datetime"].max(), saidas["datetime"].max())
    base["dias_desde_entrada"] = (data_corte - base["datetime"]).dt.days

    tem_desfecho = base["data_desfecho"].notna()
    adotado = base["desfecho"].eq("Adoption")
    dentro_da_janela = base["dias_ate_desfecho"].le(janela)

    base["y"] = np.where(
        tem_desfecho,
        (adotado & dentro_da_janela).astype(int),
        0,  # sem desfecho e fora da janela = nao adotado no periodo
    )

    # Remove censura (sem desfecho e ainda dentro da janela) e erros de data.
    censurado = (~tem_desfecho) & (base["dias_desde_entrada"] <= janela)
    invalido = base["dias_ate_desfecho"].notna() & (
        (base["dias_ate_desfecho"] < 0) | (base["dias_ate_desfecho"] > 3650)
    )
    base = base[~censurado & ~invalido].copy()

    base["data_corte"] = data_corte
    return base


def preparar_features(base: pd.DataFrame) -> pd.DataFrame:
    """Seleciona e deriva as features usadas pelo modelo."""
    X = pd.DataFrame(index=base.index)

    X["especie"] = base["animal_type"].fillna("Desconhecido")
    sexo_esteril = base["sex_upon_intake"].map(separar_sexo)
    X["sexo"] = [item[0] for item in sexo_esteril]
    X["esterilizado"] = [item[1] for item in sexo_esteril]

    X["idade_dias"] = base["age_upon_intake"].map(idade_em_dias)
    X["idade_ausente"] = X["idade_dias"].isna().astype(int)

    raca = base["breed"].fillna("Desconhecida").astype(str)
    X["raca_principal"] = raca.str.split("/").str[0].str.strip()
    X["misto"] = raca.str.contains("Mix", case=False, na=False).astype(int)

    X["cor_principal"] = (
        base["color"].fillna("Desconhecida").astype(str).str.split("/").str[0].str.strip()
    )
    X["tipo_entrada"] = base["intake_type"].fillna("Desconhecido")
    X["condicao_entrada"] = base["intake_condition"].fillna("Desconhecida")
    X["mes_entrada"] = base["datetime"].dt.month

    return X


def construir_preprocessamento() -> ColumnTransformer:
    return ColumnTransformer(
        [
            (
                "numericas",
                Pipeline(
                    [
                        ("imputar", SimpleImputer(strategy="median")),
                        ("padronizar", StandardScaler()),
                    ]
                ),
                NUMERICAS,
            ),
            (
                "categoricas",
                OneHotEncoder(
                    handle_unknown="ignore",
                    min_frequency=25,
                    sparse_output=False,
                ),
                CATEGORICAS,
            ),
            ("binarias", "passthrough", BINARIAS),
        ]
    )


# ---------------------------------------------------------------------------
# Modelos e avaliacao
# ---------------------------------------------------------------------------
def construir_modelos() -> dict[str, object]:
    return {
        "Baseline (classe majoritaria)": DummyClassifier(strategy="most_frequent"),
        "Regressao Logistica": LogisticRegression(
            max_iter=2000, class_weight="balanced", random_state=SEMENTE
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300,
            min_samples_leaf=5,
            class_weight="balanced_subsample",
            n_jobs=-1,
            random_state=SEMENTE,
        ),
        "Gradient Boosting": HistGradientBoostingClassifier(
            max_iter=300,
            learning_rate=0.08,
            class_weight="balanced",
            random_state=SEMENTE,
        ),
    }


def avaliar(modelo, X: pd.DataFrame, y: pd.Series, threshold: float = 0.5) -> dict:
    probabilidade = modelo.predict_proba(X)[:, 1]
    predicao = (probabilidade >= threshold).astype(int)
    return {
        "threshold": float(threshold),
        "acuracia": float(accuracy_score(y, predicao)),
        "precisao": float(precision_score(y, predicao, zero_division=0)),
        "recall": float(recall_score(y, predicao, zero_division=0)),
        "f1": float(f1_score(y, predicao, zero_division=0)),
        "f1_macro": float(f1_score(y, predicao, average="macro", zero_division=0)),
        "roc_auc": float(roc_auc_score(y, probabilidade)),
        "pr_auc": float(average_precision_score(y, probabilidade)),
        "matriz_confusao": confusion_matrix(y, predicao, labels=[0, 1]).tolist(),
        "n": int(len(y)),
        "positivos": int(y.sum()),
    }


def melhor_threshold(modelo, X: pd.DataFrame, y: pd.Series) -> tuple[float, float]:
    """Varre thresholds na validacao e escolhe o de maior F1 para a classe 1."""
    probabilidade = modelo.predict_proba(X)[:, 1]
    melhor_t, melhor_f1 = 0.5, -1.0
    for t in np.arange(0.05, 0.96, 0.01):
        predicao = (probabilidade >= t).astype(int)
        valor = f1_score(y, predicao, zero_division=0)
        if valor > melhor_f1:
            melhor_t, melhor_f1 = float(t), float(valor)
    return melhor_t, melhor_f1


# ---------------------------------------------------------------------------
# Figuras
# ---------------------------------------------------------------------------
def _salvar(fig, nome: str) -> None:
    PASTA_FIGURAS.mkdir(parents=True, exist_ok=True)
    caminho = PASTA_FIGURAS / nome
    fig.tight_layout()
    fig.savefig(caminho, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  figura -> {caminho.relative_to(RAIZ)}")


def gerar_figuras(base, resultados_valid, resultados_test, modelos, melhor_nome, X_te, y_te, importancias):
    # 1. Distribuicao das classes
    fig, ax = plt.subplots(figsize=(5, 3.5))
    contagem = base["y"].value_counts().sort_index()
    ax.bar(["Nao adotado em 30d", "Adotado em 30d"], contagem.values, color=["#b0b0b0", "#2e7d32"])
    for indice, valor in enumerate(contagem.values):
        ax.text(indice, valor, f"{valor:,}".replace(",", "."), ha="center", va="bottom")
    ax.set_title("Distribuicao do alvo")
    ax.set_ylabel("Animais")
    _salvar(fig, "01_distribuicao_classes.png")

    # 2. Taxa de adocao por especie
    fig, ax = plt.subplots(figsize=(6, 3.5))
    taxa = base.groupby("animal_type")["y"].agg(["mean", "size"]).sort_values("size", ascending=False)
    taxa = taxa[taxa["size"] >= 200].head(5)
    ax.bar(taxa.index, taxa["mean"] * 100, color="#2e7d32")
    ax.set_title("Taxa de adocao em 30 dias por especie")
    ax.set_ylabel("% adotados")
    for indice, valor in enumerate(taxa["mean"] * 100):
        ax.text(indice, valor, f"{valor:.1f}%", ha="center", va="bottom")
    _salvar(fig, "02_taxa_por_especie.png")

    # 3. Taxa de adocao por faixa de idade
    faixas = pd.cut(
        base["age_upon_intake"].map(idade_em_dias),
        bins=[-1, 90, 365, 3 * 365, 7 * 365, 100 * 365],
        labels=["ate 3 meses", "3-12 meses", "1-3 anos", "3-7 anos", "7+ anos"],
    )
    fig, ax = plt.subplots(figsize=(7, 3.5))
    taxa_idade = base.assign(faixa=faixas).groupby("faixa", observed=True)["y"].mean() * 100
    ax.bar(taxa_idade.index.astype(str), taxa_idade.values, color="#1565c0")
    ax.set_title("Taxa de adocao em 30 dias por faixa de idade")
    ax.set_ylabel("% adotados")
    ax.tick_params(axis="x", rotation=20)
    for indice, valor in enumerate(taxa_idade.values):
        ax.text(indice, valor, f"{valor:.1f}%", ha="center", va="bottom")
    _salvar(fig, "03_taxa_por_idade.png")

    # 4. Comparacao dos modelos (F1 macro)
    fig, ax = plt.subplots(figsize=(7.5, 3.8))
    nomes = list(resultados_valid)
    valores = [resultados_valid[n]["f1_macro"] for n in nomes]
    ordem = np.argsort(valores)
    ax.barh([nomes[i] for i in ordem], [valores[i] for i in ordem], color="#6a1b9a")
    ax.set_xlabel("F1 macro (validacao)")
    ax.set_title("Comparacao dos modelos")
    for i, indice in enumerate(ordem):
        ax.text(valores[indice], i, f" {valores[indice]:.3f}", va="center")
    _salvar(fig, "04_comparacao_modelos.png")

    # 5. Curvas ROC
    fig, ax = plt.subplots(figsize=(5.5, 5))
    for nome, modelo in modelos.items():
        probabilidade = modelo.predict_proba(X_te)[:, 1]
        fpr, tpr, _ = roc_curve(y_te, probabilidade)
        auc = roc_auc_score(y_te, probabilidade)
        ax.plot(fpr, tpr, label=f"{nome} (AUC {auc:.3f})")
    ax.plot([0, 1], [0, 1], "--", color="gray", label="Aleatorio")
    ax.set_xlabel("Falsos positivos")
    ax.set_ylabel("Verdadeiros positivos")
    ax.set_title("Curva ROC no conjunto de teste")
    ax.legend(fontsize=8, loc="lower right")
    _salvar(fig, "05_curva_roc.png")

    # 6. Matriz de confusao do melhor modelo
    matriz = np.array(resultados_test[melhor_nome]["matriz_confusao"])
    fig, ax = plt.subplots(figsize=(4.5, 4))
    ConfusionMatrixDisplay(matriz, display_labels=["Nao", "Sim"]).plot(ax=ax, colorbar=False, cmap="Greens")
    ax.set_title(f"Matriz de confusao - {melhor_nome}")
    _salvar(fig, "06_matriz_confusao.png")

    # 7. Importancia das features
    top = importancias.head(12).iloc[::-1]
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.barh(top["feature"], top["importancia_media"], color="#ef6c00")
    ax.set_xlabel("Queda media no ROC-AUC ao embaralhar")
    ax.set_title("Fatores mais relevantes para a adocao")
    _salvar(fig, "07_importancia_features.png")

    # 8. Volume mensal de entradas (contexto para o dashboard)
    fig, ax = plt.subplots(figsize=(8, 3.5))
    serie = base.set_index("datetime").resample("MS").size()
    serie = serie.tail(24)
    ax.plot(serie.index, serie.values, marker="o", color="#00838f")
    ax.set_title("Entradas por mes (ultimos 24 meses da base)")
    ax.set_ylabel("Animais")
    ax.tick_params(axis="x", rotation=45)
    _salvar(fig, "08_entradas_por_mes.png")


# ---------------------------------------------------------------------------
# Relatorio
# ---------------------------------------------------------------------------
def _tabela(resultados: dict[str, dict]) -> str:
    linhas = [
        "| Modelo | F1 (classe 1) | F1 macro | ROC-AUC | PR-AUC | Precisao | Recall |",
        "|---|---|---|---|---|---|---|",
    ]
    for nome, r in resultados.items():
        linhas.append(
            f"| {nome} | {r['f1']:.3f} | {r['f1_macro']:.3f} | {r['roc_auc']:.3f} | "
            f"{r['pr_auc']:.3f} | {r['precisao']:.3f} | {r['recall']:.3f} |"
        )
    return "\n".join(linhas)


def gerar_relatorio(contexto: dict) -> Path:
    PASTA_RELATORIOS.mkdir(parents=True, exist_ok=True)
    caminho = PASTA_RELATORIOS / "checkpoint-2.md"
    melhor = contexto["melhor_modelo"]
    teste = contexto["resultados_test"][melhor]
    base = contexto["resumo_base"]
    top = contexto["importancias"].head(5)

    texto = f"""# Checkpoint 2 - Modelo de priorizacao de adocao (ARDAP)

Gerado automaticamente por `ai-model/scripts/treinar.py` em {contexto["gerado_em"]}.
Semente: {SEMENTE}. Reprodutivel: mesmo comando, mesmos numeros.

## Base de dados

- Fonte: Austin Animal Center (dados abertos da cidade de Austin, dominio publico).
- Entradas analisadas: {base["linhas"]:,} registros.
- Periodo: {base["periodo"]}.
- Alvo: adotado em ate {JANELA_ADOCAO} dias = 1.
- Positivos: {base["positivos"]:,} ({base["taxa_positivos"]:.1%}).
- Descartados por censura/erro de data: {base["descartados"]:,}.
- Divisao: {base["divisao"]}.

## Comparacao dos modelos (validacao)

{_tabela(contexto["resultados_valid"])}

## Melhor modelo no teste

**{melhor}**, threshold {teste["threshold"]:.2f}:

- F1 (classe 1): **{teste["f1"]:.3f}**
- F1 macro: **{teste["f1_macro"]:.3f}**
- ROC-AUC: **{teste["roc_auc"]:.3f}**
- PR-AUC: **{teste["pr_auc"]:.3f}**
- Precisao: {teste["precisao"]:.3f} | Recall: {teste["recall"]:.3f}
- Matriz de confusao (linhas = real, colunas = previsto): {teste["matriz_confusao"]}

Baseline (classe majoritaria) no teste: F1 macro {contexto["resultados_test"]["Baseline (classe majoritaria)"]["f1_macro"]:.3f}.

## Fatores mais relevantes (permutation importance)

| Feature | Importancia media |
|---|---|
""" + "\n".join(
        f"| {linha.feature} | {linha.importancia_media:.4f} |" for linha in top.itertuples()
    ) + f"""

## Leitura dos resultados

{contexto["leitura"]}

## Limitacoes

- A base e de Austin (EUA). Perfis de adocao, racas e sazonalidade nao sao iguais
  aos de Paulo Afonso/BA; os numeros servem como referencia metodologica, nao como
  previsao da realidade local.
- O alvo usa apenas 30 dias e trata adocao tardia como negativa. Outras janelas
  mudam a taxa base e as metricas.
- Animais sem desfecho recente sao censurados e removidos; isso pode subestimar
  casos ainda em abrigo.
- O modelo apoia a decisao de divulgacao; nao decide sozinho e nao deve ser usado
  para negar cuidado a nenhum animal.

## Como reproduzir

```bash
python ai-model/scripts/baixar_dados.py
python ai-model/scripts/treinar.py
```
"""
    caminho.write_text(texto, encoding="utf-8")
    return caminho


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dados", type=Path, default=PASTA_DADOS)
    parser.add_argument("--limite", type=int, default=None, help="usa apenas N entradas")
    parser.add_argument("--sem-figuras", action="store_true")
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    for pasta in (PASTA_MODELOS, PASTA_RELATORIOS, PASTA_FIGURAS):
        pasta.mkdir(parents=True, exist_ok=True)

    print("1/6 carregando dados...")
    intakes, outcomes = carregar_dados(args.dados)
    if args.limite:
        intakes = intakes.head(args.limite)
    print(f"  entradas: {len(intakes):,} | desfechos: {len(outcomes):,}")

    print("2/6 montando a base e o alvo...")
    base = montar_base(intakes, outcomes)
    if base.empty:
        raise SystemExit("base vazia apos o filtro; verifique os dados")
    X = preparar_features(base)
    y = base["y"].astype(int)
    print(f"  base: {len(base):,} | positivos: {y.mean():.1%}")

    print("3/6 dividindo treino/validacao/teste...")
    X_tr, X_resto, y_tr, y_resto = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=SEMENTE
    )
    X_val, X_te, y_val, y_te = train_test_split(
        X_resto, y_resto, test_size=0.50, stratify=y_resto, random_state=SEMENTE
    )
    print(f"  treino {len(X_tr):,} | validacao {len(X_val):,} | teste {len(X_te):,}")

    print("4/6 treinando modelos...")
    modelos: dict[str, Pipeline] = {}
    resultados_valid: dict[str, dict] = {}
    for nome, estimador in construir_modelos().items():
        pipeline = Pipeline([("preparo", construir_preprocessamento()), ("modelo", estimador)])
        pipeline.fit(X_tr, y_tr)
        modelos[nome] = pipeline
        resultados_valid[nome] = avaliar(pipeline, X_val, y_val)
        print(f"  {nome}: F1 macro {resultados_valid[nome]['f1_macro']:.3f}")

    melhor_nome = max(resultados_valid, key=lambda n: resultados_valid[n]["f1_macro"])
    melhor = modelos[melhor_nome]
    threshold, _ = melhor_threshold(melhor, X_val, y_val)
    print(f"  melhor: {melhor_nome} (threshold ajustado {threshold:.2f})")

    resultados_test = {nome: avaliar(modelo, X_te, y_te) for nome, modelo in modelos.items()}
    resultados_test[melhor_nome] = avaliar(melhor, X_te, y_te, threshold)

    print("5/6 interpretando o modelo...")
    amostra = X_te.sample(n=min(4000, len(X_te)), random_state=SEMENTE)
    alvo_amostra = y_te.loc[amostra.index]
    importancia = permutation_importance(
        melhor,
        amostra,
        alvo_amostra,
        n_repeats=5,
        random_state=SEMENTE,
        scoring="roc_auc",
        n_jobs=-1,
    )
    importancias = (
        pd.DataFrame(
            {
                "feature": amostra.columns,
                "importancia_media": importancia.importances_mean,
                "desvio": importancia.importances_std,
            }
        )
        .sort_values("importancia_media", ascending=False)
        .reset_index(drop=True)
    )
    importancias.to_csv(PASTA_RELATORIOS / "importancia_features.csv", index=False)

    if not args.sem_figuras:
        gerar_figuras(
            base,
            resultados_valid,
            resultados_test,
            modelos,
            melhor_nome,
            X_te,
            y_te,
            importancias,
        )

    print("6/6 salvando modelo e relatorio...")
    PASTA_MODELOS.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": melhor,
            "threshold": threshold,
            "features": list(X.columns),
            "janela_dias": JANELA_ADOCAO,
            "semente": SEMENTE,
            "metricas_teste": resultados_test[melhor_nome],
        },
        PASTA_MODELOS / "modelo.joblib",
    )

    melhor_teste = resultados_test[melhor_nome]
    baseline = resultados_test["Baseline (classe majoritaria)"]
    leitura = (
        f"O melhor modelo supera o baseline em F1 macro "
        f"({melhor_teste['f1_macro']:.3f} contra {baseline['f1_macro']:.3f}) e atinge "
        f"ROC-AUC de {melhor_teste['roc_auc']:.3f}, o que indica capacidade real de "
        f"separar animais com maior e menor chance de adocao. O ganho sobre o baseline "
        f"mostra que ha sinal nos atributos do cadastro; o recall de "
        f"{melhor_teste['recall']:.3f} indica quanto dos animais que seriam adotados em "
        f"30 dias o modelo consegue priorizar. Como a taxa base e de "
        f"{y.mean():.1%}, acuracia sozinha seria enganosa, por isso o foco em F1 macro, "
        f"ROC-AUC e PR-AUC."
    )

    contexto = {
        "gerado_em": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "melhor_modelo": melhor_nome,
        "resultados_valid": resultados_valid,
        "resultados_test": resultados_test,
        "importancias": importancias,
        "leitura": leitura,
        "resumo_base": {
            "linhas": int(len(base)),
            "positivos": int(y.sum()),
            "taxa_positivos": float(y.mean()),
            "descartados": int(len(intakes) - len(base)),
            "periodo": f"{base['datetime'].min():%m/%Y} a {base['datetime'].max():%m/%Y}",
            "divisao": f"{len(X_tr):,} treino / {len(X_val):,} validacao / {len(X_te):,} teste".replace(",", "."),
        },
    }

    (PASTA_RELATORIOS / "metricas.json").write_text(
        json.dumps(
            {
                "configuracao": {
                    "semente": SEMENTE,
                    "janela_dias": JANELA_ADOCAO,
                    "features": list(X.columns),
                },
                "base": contexto["resumo_base"],
                "validacao": resultados_valid,
                "teste": resultados_test,
                "melhor_modelo": melhor_nome,
                "threshold": threshold,
                "importancia": importancias.to_dict(orient="records"),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    caminho_relatorio = gerar_relatorio(contexto)
    print(f"  modelo -> ai-model/models/modelo.joblib")
    print(f"  relatorio -> {caminho_relatorio.relative_to(RAIZ)}")

    amostra_csv = RAIZ / "datasets" / "amostra.csv"
    colunas = [
        "animal_id",
        "datetime",
        "animal_type",
        "sex_upon_intake",
        "age_upon_intake",
        "breed",
        "color",
        "intake_type",
        "intake_condition",
        "desfecho",
        "dias_ate_desfecho",
        "y",
    ]
    base.sample(n=min(3000, len(base)), random_state=SEMENTE)[colunas].to_csv(
        amostra_csv, index=False
    )
    print(f"  amostra -> {amostra_csv.relative_to(RAIZ)}")

    print("\nResumo (teste):")
    print(
        classification_report(
            y_te,
            (melhor.predict_proba(X_te)[:, 1] >= threshold).astype(int),
            target_names=["nao adotado", "adotado"],
            digits=3,
            zero_division=0,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
