# Backend — ARDAP (FastAPI + MySQL)

Estrutura:

```
Backend/
  app/
    main.py        # entrypoint FastAPI
    core/          # config, database, security (JWT/bcrypt)
    models/        # SQLAlchemy (users, animais, eutanasias, ...)
    schemas/      # Pydantic
    routers/      # endpoints (auth, animais, ...)
  db/
    schema_min.sql # schema inicial do MySQL
  requirements.txt
```

Rodar (dev):

```
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
