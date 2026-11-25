"""Dados ficticios: nunca rodar no banco da ONG."""

from app.core.config import settings

if settings.em_producao:
    raise SystemExit("Os seeders nao rodam com AMBIENTE=producao.")
