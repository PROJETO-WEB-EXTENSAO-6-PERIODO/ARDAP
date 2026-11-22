# Componente de IA — Priorização de divulgação

Etapa de IA do Projeto Integrador (ARDAP). O modelo estima a **probabilidade de um
animal ser adotado em até 30 dias** para apoiar a decisão de quem divulgar primeiro.

Status: **Checkpoint 2** — modelo treinado e avaliado. A integração com o backend e
o frontend entra na próxima etapa.

## Problema e usuário

A ONG resgata mais animais do que consegue divulgar. A escolha de quem priorizar na
divulgação (feiras, redes sociais, contato com adotantes) é feita por intuição, e
animais com perfil mais difícil acabam ficando mais tempo no abrigo.

**Usuário:** funcionário/admin responsável pela divulgação.
**Decisão apoiada:** qual animal divulgar primeiro nesta semana.

## Recurso

1. No perfil do animal: probabilidade, faixa (alta/média/baixa) e os fatores que
   mais pesaram.
2. Tela **Prioridade de divulgação**: animais ordenados pelo score, destacando quem
   está há mais tempo no abrigo com baixa chance.
3. Página **Sobre o modelo**: o que a IA faz, quais dados usa e quais são os limites.

## Técnica

Classificação binária em dados tabulares, comparando quatro abordagens:

| Modelo | Papel |
|---|---|
| Baseline (classe majoritária) | Referência mínima; mostra se o modelo aprendeu algo |
| Regressão Logística (`class_weight="balanced"`) | Interpretável, boa linha de base |
| Random Forest | Captura interações não lineares |
| Gradient Boosting | Melhor desempenho esperado em dados tabulares |

O modelo é escolhido na validação por **F1 macro** (a base é desbalanceada, então
acurácia engana). O threshold é ajustado na validação para equilibrar precisão e
recall, e o teste é usado **uma única vez**, no final.

**Por que não rede neural:** a base é tabular, de tamanho médio, e o ganho não
justificaria a perda de interpretabilidade. **Por que não uma API externa:** a
atividade exige componente próprio e o problema não é de linguagem.

A interpretação usa `permutation_importance` (queda no ROC-AUC ao embaralhar cada
coluna), que alimenta os "fatores" exibidos na interface.

## Dados

Austin Animal Center — Intakes e Outcomes (dados abertos de Austin/EUA, domínio
público, API Socrata sem autenticação). Detalhes e licença em
[`datasets/README.md`](../datasets/README.md).

**Alvo:** `1` se o primeiro desfecho após a entrada foi `Adoption` em até 30 dias;
`0` para qualquer outro desfecho, adoção tardia ou permanência além de 30 dias.
Entradas sem desfecho e ainda dentro da janela são **censuradas** e removidas.

**Mapeamento para o cadastro do ARDAP:**

| Austin | ARDAP (`animais` / `supatas_intake`) |
|---|---|
| `animal_type` | `especie` |
| `breed` | `raca` |
| `sex_upon_intake` | `sexo` + `castrado` |
| `age_upon_intake` | `idade_estimada` / `data_nascimento_estimada` |
| `color` | `cor_pelo` |
| `intake_type` | `origem_resgate` |
| `intake_condition` | situação de saúde no resgate |

`porte`, `peso`, `temperamento`, `vacinado` e `vermifugado` existem no ARDAP mas não
na base pública; entram quando o modelo for re-treinado com dados da ONG.

## Pipeline

```
datasets/raw/*.csv
      │
      ├─ baixar_dados.py   → download reprodutível (Socrata)
      ├─ treinar.py        → base + alvo + features + treino + avaliação
      ▼
ai-model/models/modelo.joblib        (pipeline + threshold + lista de features)
ai-model/relatorios/metricas.json    (todas as métricas)
ai-model/relatorios/checkpoint-2.md  (relatório gerado automaticamente)
ai-model/relatorios/figuras/*.png    (gráficos)
```

## Como rodar

```bash
python -m pip install -r ai-model/requirements.txt

python ai-model/scripts/baixar_dados.py     # ~50 MB em datasets/raw (fora do Git)
python ai-model/scripts/treinar.py          # treina, avalia e salva tudo
```

Para um teste rápido: `python ai-model/scripts/treinar.py --limite 30000`.

Notebook com a mesma análise, passo a passo: `ai-model/notebooks/01_treino.ipynb`.

## Resultados

Base: **173.341 entradas** (10/2013 a 05/2025), **32,2% positivos** (adotados em até
30 dias). Divisão 121.338 / 26.001 / 26.002 (treino / validação / teste).

| Modelo (validação) | F1 macro | ROC-AUC | PR-AUC | Precisão | Recall |
|---|---|---|---|---|---|
| Baseline (classe majoritária) | 0,404 | 0,500 | 0,322 | 0,000 | 0,000 |
| Regressão Logística | 0,642 | 0,744 | 0,527 | 0,475 | 0,740 |
| Random Forest | 0,694 | 0,804 | 0,627 | 0,526 | 0,812 |
| **Gradient Boosting** | **0,701** | **0,815** | **0,642** | 0,534 | 0,814 |

**Teste (usado uma vez), Gradient Boosting com threshold 0,49:**

| Métrica | Valor |
|---|---|
| F1 macro | **0,697** |
| F1 da classe "adotado" | 0,643 |
| ROC-AUC | **0,815** |
| PR-AUC | 0,648 |
| Precisão | 0,528 |
| Recall | 0,825 |
| Acurácia | 0,706 |

Matriz de confusão (linhas = real, colunas = previsto): `[[11464, 6175], [1467, 6896]]`.

**Experimento de melhoria:** quatro modelos + ajuste de threshold na validação
(0,49 em vez de 0,50). O Gradient Boosting superou o Random Forest por 0,007 de F1
macro e o baseline por **0,293**. A escolha do threshold privilegia recall: é melhor
colocar na lista de divulgação um animal que talvez não fosse adotado do que deixar
de fora um que seria. O custo do falso positivo é baixo (divulgar um animal a mais).

**Fatores mais relevantes** (queda no ROC-AUC ao embaralhar): idade (0,159),
tipo de entrada (0,050), sexo (0,034), raça (0,030) e condição de saúde na entrada
(0,029). Filhotes e animais entregues pelo tutor têm mais chance; idosos e resgates
de rua têm menos — o que faz sentido no domínio e serve de base para os "fatores"
exibidos na tela.

Relatório completo: [`relatorios/checkpoint-2.md`](relatorios/checkpoint-2.md).
Gráficos: [`relatorios/figuras/`](relatorios/figuras).
Métricas em formato de máquina: [`relatorios/metricas.json`](relatorios/metricas.json).

## Limitações

- Base dos EUA: perfis de adoção, raças e sazonalidade diferem de Paulo Afonso/BA.
  Os números são referência metodológica, não previsão da realidade local.
- Janela fixa de 30 dias: outras janelas mudam a taxa base e as métricas.
- Censura à direita: animais recentes sem desfecho são removidos.
- O modelo **apoia** a decisão de divulgação; não decide sozinho e não deve ser usado
  para negar cuidado a nenhum animal.

## Próximos passos

1. `POST /api/ia/adocao/{animal_id}` no backend, carregando o `.joblib` uma vez.
2. Cartão no perfil do animal + tela de prioridade.
3. Página "Sobre o modelo".
4. Re-treino com o histórico do ARDAP quando houver volume suficiente.
