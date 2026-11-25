"""Horario de Brasilia, o mesmo usado nas conexoes com o banco."""

from datetime import datetime, timedelta, timezone

BRASILIA = timezone(timedelta(hours=-3))


def agora() -> datetime:
    """Sem fuso, como as colunas DATETIME."""
    return datetime.now(BRASILIA).replace(tzinfo=None)
