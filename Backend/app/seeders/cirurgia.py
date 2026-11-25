"""Seeder de cirurgias (dados ficticios).

Rodar, dentro de Backend/:  python -m app.seeders.cirurgia
"""

from sqlalchemy.orm import Session

from app.models.cirurgia import Cirurgia
from app.seeders.comum import executar
from app.seeders.procedimentos import semear_procedimentos

REGISTROS = [
    ("Larissa Pinto (teste)", "00000000021", "Rua F", "18", "Centro", "(75) 90000-0021", "Rex", "Osteossíntese de fêmur", 50),
    ("Marcos Vieira (teste)", "00000000022", "Rua G", "62", "Vila Nobre", "(75) 90000-0022", "Amora", "Sutura de ferimento", 9),
    ("Natália Farias (teste)", "00000000023", "Rua H", "5", "Centenário", "(75) 90000-0023", "Pretinha", "Retirada de nódulo", 90),
    ("Otávio Leal (teste)", "00000000024", "Rua I", "110", "Moxotó", "(75) 90000-0024",
     {"nome_animal": "Fiona", "idade_real": "6", "especie": "Cão", "raca": "Poodle", "pelagem": "Branco", "sexo": "femea"},
     "Mastectomia", 130),
]


def semear_cirurgias(db: Session) -> int:
    return semear_procedimentos(db, Cirurgia, REGISTROS)


if __name__ == "__main__":
    executar("cirurgia", semear_cirurgias, len(REGISTROS))
