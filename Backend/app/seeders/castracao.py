"""Seeder de castracoes (dados ficticios).

Rodar, dentro de Backend/:  python -m app.seeders.castracao
"""

from sqlalchemy.orm import Session

from app.models.castracao import Castracao
from app.seeders.comum import executar
from app.seeders.procedimentos import semear_procedimentos

REGISTROS = [
    ("Gabriel Nunes (teste)", "00000000011", "Rua A", "12", "Centro", "(75) 90000-0011", "Thor", "Orquiectomia", 120),
    ("Helena Cruz (teste)", "00000000012", "Rua B", "45", "Centenário", "(75) 90000-0012", "Nina", "Ovariohisterectomia", 35),
    ("Igor Santos (teste)", "00000000013", "Rua C", "7", "Tancredo Neves", "(75) 90000-0013", "Simba", "Orquiectomia", 20),
    ("Júlia Reis (teste)", "00000000014", "Rua D", "90", "Jardim Bahia", "(75) 90000-0014",
     {"nome_animal": "Pipoca", "idade_real": "2", "especie": "Gato", "raca": "SRD", "pelagem": "Branco", "sexo": "femea"},
     "Ovariohisterectomia", 75),
    ("Kauã Prado (teste)", "00000000015", "Rua E", "31", "Moxotó", "(75) 90000-0015",
     {"nome_animal": "Tobias", "idade_real": "4", "especie": "Cão", "raca": "SRD", "pelagem": "Marrom", "sexo": "macho"},
     "Orquiectomia", 5),
]


def semear_castracoes(db: Session) -> int:
    return semear_procedimentos(db, Castracao, REGISTROS)


if __name__ == "__main__":
    executar("castracao", semear_castracoes, len(REGISTROS))
