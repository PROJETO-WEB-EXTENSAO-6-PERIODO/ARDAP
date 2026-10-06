"""ARDAP API — esqueleto (FEATURE0002)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import animais, auth

app = FastAPI(title="ARDAP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Saude da API — use para testar se o servidor esta no ar."""
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(animais.router)
