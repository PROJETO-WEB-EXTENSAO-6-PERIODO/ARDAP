# Checkpoint 2 - Modelo de priorizacao de adocao (ARDAP)

Gerado automaticamente por `ai-model/scripts/treinar.py` em 2026-11-22 23:17 UTC.
Semente: 42. Reprodutivel: mesmo comando, mesmos numeros.

## Base de dados

- Fonte: Austin Animal Center (dados abertos da cidade de Austin, dominio publico).
- Entradas analisadas: 173,341 registros.
- Periodo: 10/2013 a 05/2025.
- Alvo: adotado em ate 30 dias = 1.
- Positivos: 55,754 (32.2%).
- Descartados por censura/erro de data: 471.
- Divisao: 121.338 treino / 26.001 validacao / 26.002 teste.

## Comparacao dos modelos (validacao)

| Modelo | F1 (classe 1) | F1 macro | ROC-AUC | PR-AUC | Precisao | Recall |
|---|---|---|---|---|---|---|
| Baseline (classe majoritaria) | 0.000 | 0.404 | 0.500 | 0.322 | 0.000 | 0.000 |
| Regressao Logistica | 0.578 | 0.642 | 0.744 | 0.527 | 0.475 | 0.740 |
| Random Forest | 0.639 | 0.694 | 0.804 | 0.627 | 0.526 | 0.812 |
| Gradient Boosting | 0.645 | 0.701 | 0.815 | 0.642 | 0.534 | 0.814 |

## Melhor modelo no teste

**Gradient Boosting**, threshold 0.49:

- F1 (classe 1): **0.643**
- F1 macro: **0.697**
- ROC-AUC: **0.815**
- PR-AUC: **0.648**
- Precisao: 0.528 | Recall: 0.825
- Matriz de confusao (linhas = real, colunas = previsto): [[11464, 6175], [1467, 6896]]

Baseline (classe majoritaria) no teste: F1 macro 0.404.

## Fatores mais relevantes (permutation importance)

| Feature | Importancia media |
|---|---|
| idade_dias | 0.1586 |
| tipo_entrada | 0.0496 |
| sexo | 0.0339 |
| raca_principal | 0.0302 |
| condicao_entrada | 0.0290 |

## Leitura dos resultados

O melhor modelo supera o baseline em F1 macro (0.697 contra 0.404) e atinge ROC-AUC de 0.815, o que indica capacidade real de separar animais com maior e menor chance de adocao. O ganho sobre o baseline mostra que ha sinal nos atributos do cadastro; o recall de 0.825 indica quanto dos animais que seriam adotados em 30 dias o modelo consegue priorizar. Como a taxa base e de 32.2%, acuracia sozinha seria enganosa, por isso o foco em F1 macro, ROC-AUC e PR-AUC.

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
