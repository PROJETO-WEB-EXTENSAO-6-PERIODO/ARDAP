"""Hash bcrypt + token JWT (RNF02)."""

import time
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


# Hash fantasma. E usado quando o e-mail NAO existe: sem ele o bcrypt.checkpw()
# nao roda e a resposta volta em ~2,4 ms em vez de ~225 ms. Essa diferenca de
# ~100x ja bastaria para descobrir quem tem cadastro no sistema medindo a
# latencia (enumeracao de usuarios) — e a issue #9 pede explicitamente
# "sem dizer se o e-mail existe ou nao".
DUMMY_HASH = hash_password("este-email-nao-tem-usuario")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def _payload(token: str) -> dict | None:
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except (JWTError, TypeError, ValueError):
        return None


def decode_token(token: str) -> int | None:
    payload = _payload(token)
    if payload is None:
        return None
    try:
        return int(payload.get("sub"))
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Revogacao de token (POST /auth/logout)
# ---------------------------------------------------------------------------
# JWT e stateless: por padrao o servidor "esquece" o login e o token continua
# valendo ate o proprio exp. Para o logout significar algo de verdade, o token
# e marcado aqui como revogado e o get_current_user() passa a recusa-lo.
#
# Limites (tambem estao no Docs/API.md — vale citar na apresentacao):
#   * e memoria e POR PROCESSO -> com `uvicorn --workers N` um worker nao ve o
#     logout feito em outro;
#   * zera no restart          -> o token volta a valer ate o exp
#     (no maximo ACCESS_TOKEN_EXPIRE_MINUTES, hoje 60 min).
# ---------------------------------------------------------------------------
_REVOKED: dict[str, float] = {}


def _prune_revoked() -> None:
    """Descarta entradas ja expiradas, para a lista nao crescer sem limite."""
    agora = time.time()
    for token in [t for t, exp in _REVOKED.items() if exp <= agora]:
        del _REVOKED[token]


def revoke_token(token: str) -> bool:
    """Marca o token como revogado. Devolve False se o token for invalido."""
    payload = _payload(token)
    if payload is None or payload.get("exp") is None:
        return False
    _prune_revoked()
    _REVOKED[token] = float(payload["exp"])
    return True


def is_revoked(token: str) -> bool:
    _prune_revoked()
    return token in _REVOKED
