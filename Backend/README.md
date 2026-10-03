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
uvicorn app.main:app --reload
```
