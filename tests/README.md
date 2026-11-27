# Testes e evidências

## Testes automatizados

Os testes do recurso de IA ficam junto da API, em [`Backend/tests`](../Backend/tests),
porque importam o pacote `app` do backend. Não precisam de MySQL nem de `.env`: usam
um SQLite em memória e um usuário de teste.

```bash
cd Backend
python -m pip install -r requirements.txt pytest httpx
python -m pytest tests
```

Resultado esperado: `46 passed`.

| Arquivo | Testes | O que verifica |
|---|---|---|
| `test_ia_traducao.py` | 27 | Tradução do cadastro do ARDAP (cor, raça, idade, origem, condição) para os atributos do modelo |
| `test_ia_modelo.py` | 7 | Carregamento único do modelo, formato da saída, faixas, coerência (filhote > idoso, tutor > rua) |
| `test_ia_rotas.py` | 12 | Rotas `/ia`: sucesso, 401 sem login, 404, 409 (adotado/eutanasiado), 422 (campos inválidos), 503 (modelo ausente), ordenação da prioridade |

## Avaliação do modelo

| Script | Saída |
|---|---|
| `python ai-model/scripts/treinar.py` | `ai-model/relatorios/metricas.json`, figuras 01 a 08 |
| `python ai-model/scripts/avaliar_faixas.py` | `ai-model/relatorios/faixas.json`, figura 09 |

## Testes manuais (navegador)

Feitos com o banco de demonstração (`python -m app.seeders.todos`). Capturas em
[`docs/imagens/ia`](../docs/imagens/ia).

| Caso | Entrada | Resultado esperado | Evidência |
|---|---|---|---|
| Lista de prioridade | Abrir **Divulgação** | Animais disponíveis, menor chance primeiro, alerta "Atenção" | `01_prioridade.png` |
| Chance baixa | Perfil do Sombra (cão, 8 anos, acidentado) | Faixa baixa, fatores saúde e idade | `02b_cartao_baixa_detalhe.png` |
| Chance alta | Perfil da Juju (gata filhote) | Faixa alta, fator idade | `03b_cartao_alta_detalhe.png` |
| Erro: campos vazios | Simulador sem preencher nada | Lista de campos obrigatórios | `05_simulador_erro.png` |
| Erro: idade inválida | Simulador com idade 99 | "A idade deve ser um número inteiro entre 0 e 30 anos." | `06_simulador_idade_invalida.png` |
| Simulação válida | Gata, 0 anos, entregue pelo tutor | Faixa alta com fatores | `07_simulador_resultado.png` |
| Erro: animal adotado | Perfil de um animal com termo de adoção | "Este animal já foi adotado; a previsão não se aplica." | `08_cartao_animal_adotado.png` |
