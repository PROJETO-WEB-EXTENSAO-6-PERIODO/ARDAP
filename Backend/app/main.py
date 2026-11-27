"""ARDAP API — esqueleto (FEATURE0002)."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import miniaturas
from app.core.config import settings
from app.ia import modelo as modelo_ia
from app.routers import adocao, animais, arquivos, auth, castracao, cirurgia, contagens, eutanasia, hipossuficiencia, ia, relatorio_atividades, relatorios, supatas, users

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # carrega o modelo de IA uma vez; sem ele, so as rotas /ia respondem 503
    try:
        modelo_ia.carregar()
    except modelo_ia.ModeloIndisponivel as erro:
        log.warning("IA indisponivel: %s", erro)
    # fotos enviadas antes das versoes reduzidas: gera em segundo plano
    if settings.FOTOS_VARIANTES_AO_INICIAR:
        miniaturas.gerar_em_segundo_plano()
    yield

# a documentacao interativa so existe em desenvolvimento
app = FastAPI(
    title="ARDAP API",
    version="0.1.0",
    docs_url=None if settings.em_producao else "/docs",
    redoc_url=None if settings.em_producao else "/redoc",
    openapi_url=None if settings.em_producao else "/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origens_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HEAD: monitores como o UptimeRobot checam com HEAD e mantem a API acordada
@app.api_route("/health", methods=["GET", "HEAD"])
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
app.include_router(ia.router)
app.include_router(arquivos.router)
