"""ARDAP API — esqueleto (FEATURE0002)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import adocao, animais, auth, castracao, cirurgia, contagens, eutanasia, hipossuficiencia, relatorio_atividades, relatorios, supatas, users

# a documentacao interativa so existe em desenvolvimento
app = FastAPI(
    title="ARDAP API",
    version="0.1.0",
    docs_url=None if settings.em_producao else "/docs",
    redoc_url=None if settings.em_producao else "/redoc",
    openapi_url=None if settings.em_producao else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origens_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Saude da API — use para testar se o servidor esta no ar."""
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(contagens.router)
app.include_router(castracao.router)
app.include_router(cirurgia.router)
app.include_router(eutanasia.router)
app.include_router(hipossuficiencia.router)
app.include_router(relatorios.router)
app.include_router(relatorio_atividades.router)
app.include_router(users.router)
app.include_router(supatas.router)
app.include_router(animais.router)
app.include_router(adocao.router)
