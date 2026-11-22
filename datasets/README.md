# Datasets — ARDAP (etapa de IA)

## Base principal: Austin Animal Center

| Item | Informação |
|---|---|
| Origem | Portal de dados abertos da cidade de Austin, Texas (EUA) |
| Intakes | https://data.austintexas.gov/resource/wter-evkm |
| Outcomes | https://data.austintexas.gov/resource/9t4d-g238 |
| Licença | Dados públicos do governo municipal (domínio público / PDDL) |
| Acesso | API Socrata, sem autenticação e sem chave |
| Tamanho | ~150 mil entradas e ~170 mil desfechos (CSV ~30 MB no total) |
| Uso no projeto | Treinar o modelo que estima a chance de adoção em até 30 dias |

O dicionário de dados oficial está em
https://data.austintexas.gov/Government/Austin-Animal-Center-Intakes/wter-evkm

### Por que essa base

- É pública, com licença clara e download reprodutível (script no repositório).
- Tem os campos que o cadastro do ARDAP também terá: espécie, raça, sexo,
  idade, cor, tipo de entrada, condição de saúde e desfecho.
- O desfecho permite construir o alvo (adotado ou não) e o tempo até a adoção.

### Limitação importante

A base é dos EUA. Perfis de adoção, raças e sazonalidade não são iguais aos de
Paulo Afonso/BA. Os resultados servem como referência metodológica e devem ser
revalidados quando o ARDAP tiver histórico próprio. Isso está registrado no
relatório (seção "Limitações").

## Como obter os dados

```bash
python ai-model/scripts/baixar_dados.py
```

Os arquivos vão para `datasets/raw/`, que está no `.gitignore` (base grande não
entra no Git). Para uma amostra rápida:

```bash
python ai-model/scripts/baixar_dados.py --limite 20000
```

## Amostra versionada

`datasets/amostra.csv` traz 3.000 registros já tratados (features + alvo),
gerados por `ai-model/scripts/treinar.py`. Serve para testes e para inspecionar
o formato dos dados sem baixar a base completa. Não use a amostra para treinar
o modelo final.

## Bases alternativas avaliadas

| Base | Por que não foi escolhida |
|---|---|
| PetFinder.my Adoption Prediction (Kaggle) | Exige conta no Kaggle e os termos de uso são menos claros para redistribuição |
| Dados reais da ONG | Ainda estão em papel e não cobrem o volume necessário para treinar |
