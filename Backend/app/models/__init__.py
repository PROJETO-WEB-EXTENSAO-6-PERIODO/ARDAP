"""Todos os modelos do ARDAP.

Importar `app.models` registra as tabelas no `Base`, garantindo que
`Base.metadata.create_all()` (usado pela suite de testes) as crie.

`User`, `Animal` e `SupatasIntake` ja eram importados pelos routers; aqui o
registro fica explicito e uniforme para quem for adicionar novos modelos.
"""

from app.models.adotante import Adotante  # noqa: F401
from app.models.animal import Animal  # noqa: F401
from app.models.intake import SupatasIntake  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = ["Adotante", "Animal", "SupatasIntake", "User"]
