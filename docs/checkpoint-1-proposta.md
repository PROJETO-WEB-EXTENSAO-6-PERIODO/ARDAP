# Checkpoint 1 — Proposta do recurso de IA (ARDAP)

**Atividade:** Projeto Integrador — IA Aplicada ao Desenvolvimento Web
**Curso:** Bacharelado em Sistemas de Informação — 6º período
**Equipe:** ARDAP

| Integrante | GitHub |
|---|---|
 Guilherme Matheus Silva Oliveira
 Pedro Victor Correia de Souza Santos
 Erivelton Brasil Batista
 Victor Hugo Sousa Oliveira
 Rubriel Luan Marques de Lima

**Repositório:** https://github.com/PROJETO-WEB-EXTENSAO-6-PERIODO/ARDAP

## Sistema

O ARDAP digitaliza os formulários em papel da Associação Recanto dos Animais em
Perigo (Paulo Afonso/BA). O sistema terá login por papel (Admin/Funcionário),
cadastro e histórico dos animais, controle de resgates e relatório mensal para a
prefeitura. Stack: FastAPI + MySQL no backend e React (Vite) no frontend.

## Problema

A ONG resgata mais animais do que consegue divulgar. A escolha de quais animais
priorizar na divulgação (feiras, redes sociais, contato com adotantes) é feita
por intuição, e animais com perfil mais difícil — idosos, porte grande, condições
de saúde — acabam ficando mais tempo no abrigo. Não há hoje nenhuma estimativa
de chance de adoção para apoiar essa decisão.

**Usuário:** funcionário/admin da ONG responsável pela divulgação.

## Recurso de IA

Classificação binária: **probabilidade de o animal ser adotado em até 30 dias**.

- No perfil do animal, um cartão com a probabilidade, a faixa (alta/média/baixa)
  e os fatores que mais pesaram na estimativa.
- Uma tela **"Prioridade de divulgação"** que ordena os animais pelo score e
  destaca os que estão há mais tempo no abrigo com baixa chance.
- Página **"Sobre o modelo"** explicando o que a IA faz, quais dados usa e quais
  são os limites.

**Onde entra no sistema:** o ARDAP já tem os módulos de animais (`/animais`), entrada
de resgates (`supatas_intake`) e termos de adoção (`termo_adocao`). O recurso entra
como uma seção nova dentro do módulo de animais, com um endpoint
`POST /api/ia/adocao/{animal_id}` no backend, reaproveitando os campos que o
cadastro já coleta (espécie, raça, sexo, idade, porte, cor, castrado, temperamento).

## Técnica

Classificação supervisionada em dados tabulares, comparando:

1. Baseline (classe majoritária) — referência mínima;
2. Regressão Logística com `class_weight="balanced"` — interpretável;
3. Random Forest e Gradient Boosting — capturam interações não lineares.

O melhor modelo é escolhido na validação por F1 macro e o threshold é ajustado
para equilibrar precisão e recall. A interpretação usa permutation importance,
que alimenta os "fatores" mostrados na interface. Tudo em scikit-learn, com
semente fixa e script reprodutível.

**Por que não uma API de IA externa:** a atividade exige componente próprio, e um
modelo tabular simples resolve o problema com custo baixo e resultado explicável.

## Dados

**Austin Animal Center — Intakes e Outcomes** (dados abertos da cidade de Austin,
domínio público, API Socrata sem autenticação). ~150 mil entradas com espécie,
raça, sexo, idade, cor, tipo de entrada, condição de saúde e desfecho.

Alvo construído a partir do desfecho: adotado em até 30 dias (1) ou não (0).
Animais sem desfecho dentro da janela são tratados como censurados e removidos.

**Limitação declarada:** a base é estrangeira; será revalidada com o histórico da
ONG quando o ARDAP tiver dados próprios.

## Entregas previstas

| Data | Entrega |
|---|---|
| 22/11 | Proposta (este documento) + modelo treinado com primeiras métricas |
| 25/11 | Endpoint e tela integrados ao sistema |
| 26/11 | README com a seção de IA, relatório técnico e vídeo |
| 27/11 | Entrega final no AVA até 15h |

## Eixo

**Machine Learning** (principal), com apoio de **Data Science** no dashboard de
indicadores do relatório mensal.
