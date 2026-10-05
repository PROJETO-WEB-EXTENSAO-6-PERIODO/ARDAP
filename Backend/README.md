# Backend — ARDAP (FastAPI + MySQL)

## Pré-requisitos

- Python 3.11+
- MySQL / MariaDB rodando (no XAMPP: iniciar o serviço **MySQL**)
- Git

## Setup

```bash
cd Backend

# 1. banco de dados + tabelas
mysql -u root < db/schema_min.sql
mysql -u root < db/seed_admin.sql      # admin de dev (ver abaixo)

# 2. ambiente virtual e dependencias
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt    # apenas para os testes

# 3. configuracao
copy .env.example .env
#     -> preencha SECRET_KEY (obrigatorio) e o restante se necessario
```

**Credencial de desenvolvimento:** `admin@ardap.org` / `ardap@123`
(vem de `db/seed_admin.sql` — troque antes de qualquer coisa ir para produção).

## Rodar

```bash
uvicorn app.main:app --reload
```

- API: <http://localhost:8000>
- Swagger (testar na mão): <http://localhost:8000/docs>
- Saúde: `GET /health`

## Testar

```bash
pytest -v
```

A suite cria e apaga um banco separado (`ardap_test`) — **nunca** mexe nos dados
de desenvolvimento. São 19 testes cobrindo RF01, RNF02 e RF12.

Para validar o fluxo **contra a API rodando** (bom para demonstrar na
apresentação):

```bash
uvicorn app.main:app --port 8000   # em um terminal
python verifica_fluxo.py           # em outro
```

| Bloco | O que cobre |
|---|---|
| login | credenciais válidas, senha errada, e-mail inexistente |
| enumeração | mensagem única **e** `bcrypt` rodando nos dois casos |
| RNF02 | senha gravada como hash, nunca texto puro |
| sessão | token ausente, válido, forjado e expirado |
| logout | revogação real do token |
| RF12 | restrição de papel no servidor |

## Contrato com o Frontend

👉 **[`../Docs/API.md`](../Docs/API.md)** — endpoints, payloads, códigos de erro,
exemplos e o fluxo de login/logout que o frontend deve seguir.

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/health` | — | saúde da API |
| `POST` | `/auth/login` | — | devolve JWT (60 min) — RF01 |
| `POST` | `/auth/logout` | Bearer | revoga o token — RF01 |
| `GET` | `/users/me` | Bearer | dados do usuário logado |

## Estrutura

```
Backend/
  app/
    main.py           # entrypoint FastAPI + CORS
    core/
      config.py       # Settings lidas do .env
      database.py     # engine + sessao SQLAlchemy
      security.py     # bcrypt (RNF02) + JWT + revogacao de token
      deps.py         # get_current_user / require_admin  <- RF12 mora aqui
    models/           # SQLAlchemy (users, animais, ...)
    schemas/          # Pydantic
    routers/          # endpoints (auth, ...)
  db/
    schema_min.sql    # DDL
    seed_admin.sql    # usuario inicial de dev
  tests/
    conftest.py       # banco de teste isolado
    test_auth.py      # 19 testes
  requirements.txt
  requirements-dev.txt
  pytest.ini
  .env.example
```

## Decisões de segurança (vale citar na apresentação)

1. **RNF02 — hash bcrypt.** A senha nunca é gravada nem devolvida em texto puro;
   a comparação é `bcrypt.checkpw()` (hash não é reversível, por isso dá para
   validar mas nunca "descriptografar").
2. **JWT stateless, 60 minutos** (`ACCESS_TOKEN_EXPIRE_MINUTES`), assinado com
   `SECRET_KEY` do `.env`.
3. **Mensagem única de erro no login** — não revela se o e-mail existe.
4. **Tempo de resposta constante** — o `bcrypt.checkpw()` roda mesmo quando o
   e-mail não existe (contra um `DUMMY_HASH`). Sem isso a latência seria
   ~2,4 ms vs ~225 ms e daria para descobrir quem é cadastrado medindo o tempo.
5. **Logout revoga o token** — memória, por processo; ver limites no `Docs/API.md`.
6. **RF12 no servidor** — `require_admin` devolve `403` sem depender do frontend.

## Limitações conhecidas

- A revogação de token é em memória: não funciona com `uvicorn --workers N` e
  zera no reinício (o token antigo volta a valer até o `exp`).
- `require_admin` existe, mas ainda **nenhum endpoint** o declara — não há
  gestão de usuários (RF02) nesta fase.
- `schema_min.sql` cobre as 3 tabelas iniciais (`users`, `animais`,
  `supatas_intake`); `adotantes`, `adocoes` e `hipossuficiencia_declaracoes`
  entram nas próximas fases.
