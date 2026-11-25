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

## Backup

Todo dia, `.github/workflows/backup.yml` roda `python -m app.scripts.backup`,
que copia o banco e os arquivos para um bucket **separado e privado** do R2.
Guarda as copias do banco por 30 dias (sempre ao menos as 7 ultimas).

Segredos, no ambiente `backup` do GitHub, liberado so para a `main`:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`: usuario do banco **so de leitura**.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`:
  bucket de arquivos, com chave **so de leitura**.
- `BACKUP_R2_ACCESS_KEY_ID`, `BACKUP_R2_SECRET_ACCESS_KEY`, `BACKUP_R2_BUCKET`:
  bucket de backup, com chave de leitura e escrita.

Restaurar (sempre em um banco novo; nunca sobrescreve):

```
python -m app.scripts.restaurar ultimo --banco ardap_restaurado --arquivos pasta
```

Arquivos apagados no sistema continuam no backup. Se alguem pedir a exclusao
dos dados (LGPD), apague tambem no bucket de backup.
