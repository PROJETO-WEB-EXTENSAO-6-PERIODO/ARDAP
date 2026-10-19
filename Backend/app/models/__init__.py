"""Todos os modelos do ARDAP.

Importar `app.models` registra as tabelas no `Base`, garantindo que
`Base.metadata.create_all()` (usado pela suite de testes) as crie.
"""

from app.models.adocao import Adocao  # noqa: F401
from app.models.animal import Animal  # noqa: F401
from app.models.castracao import Castracao  # noqa: F401
from app.models.cirurgia import Cirurgia  # noqa: F401
from app.models.eutanasia import Eutanasia  # noqa: F401
from app.models.hipossuficiencia import Hipossuficiencia  # noqa: F401
from app.models.intake import SupatasIntake  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "Adocao",
    "Animal",
    "Castracao",
    "Cirurgia",
    "Eutanasia",
    "Hipossuficiencia",
    "SupatasIntake",
    "User",
]
