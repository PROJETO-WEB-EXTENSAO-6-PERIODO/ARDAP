"""Limite de tentativas de login por e-mail.

Fica em memoria: vale para um unico processo da API e zera ao reiniciar.
"""

import time
from threading import Lock

MAX_TENTATIVAS = 10
JANELA_SEGUNDOS = 15 * 60
MAX_EMAILS = 5000

_tentativas: dict[str, list[float]] = {}
_lock = Lock()


def registrar_tentativa(email: str) -> bool:
    """Conta a tentativa; False se o limite da janela ja foi atingido."""
    chave = email.strip().lower()
    agora = time.monotonic()
    with _lock:
        recentes = [
            t for t in _tentativas.get(chave, []) if agora - t < JANELA_SEGUNDOS
        ]
        if len(recentes) >= MAX_TENTATIVAS:
            _tentativas[chave] = recentes
            return False
        if chave not in _tentativas and len(_tentativas) >= MAX_EMAILS:
            # limita a memoria: descarta o e-mail mais antigo
            _tentativas.pop(next(iter(_tentativas)))
        _tentativas[chave] = recentes + [agora]
        return True


def limpar(email: str) -> None:
    with _lock:
        _tentativas.pop(email.strip().lower(), None)
