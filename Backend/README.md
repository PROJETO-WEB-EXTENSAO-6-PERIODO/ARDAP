# Backend — ARDAP (FastAPI + MySQL)

Estrutura:

```
Backend/
  app/
    main.py        # entrypoint FastAPI
    core/          # config, database, security (JWT/bcrypt)
    models/        # SQLAlchemy (users, animais, ...)
    schemas/      # Pydantic
    routers/      # endpoints (auth, animais, ...)
  requirements.txt
```

Rodar (dev):

```
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # preencha DB_* e SECRET_KEY
uvicorn app.main:app --reload
```

Banco que já existia: executar `db/alter_hipossuficiencia_anexos.sql`.

## Produção

- Variáveis: as de `.env.example`, com `AMBIENTE=producao`. A API não inicia
  se faltar `SECRET_KEY`, TLS no banco, CORS em https ou o R2.
- Banco novo: executar `db/schema_min.sql` e depois os outros `schema_*.sql`.
  Não usar os `alter_*.sql`, o `seed_admin.sql` nem os seeders.
- Primeiro administrador: `python -m app.scripts.criar_admin`.
- O bucket do R2 deve ser privado: os arquivos só saem pela API, com login.
- Iniciar: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (um processo,
  pois o limite de tentativas de login fica em memória).
- Frontend: definir `VITE_API_URL` com o endereço https da API.
