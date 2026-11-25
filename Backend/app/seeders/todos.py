"""Roda todos os seeders em uma unica transacao.

Rodar, dentro de Backend/:  python -m app.seeders.todos
"""

from app.core.database import SessionLocal
from app.seeders.animais import semear_animais
from app.seeders.castracao import semear_castracoes
from app.seeders.cirurgia import semear_cirurgias
from app.seeders.eutanasia import semear_eutanasias
from app.seeders.hipossuficiencia import semear_hipossuficiencias
from app.seeders.supatas import semear_supatas
from app.seeders.termo_adocao import semear_termos

SEEDERS = [
    ("animais", semear_animais),
    ("supatas_intake", semear_supatas),
    ("termo_adocao", semear_termos),
    ("castracao", semear_castracoes),
    ("cirurgia", semear_cirurgias),
    ("hipossuficiencia", semear_hipossuficiencias),
    ("eutanasia", semear_eutanasias),
]


if __name__ == "__main__":
    with SessionLocal() as db:
        totais = [(nome, semear(db)) for nome, semear in SEEDERS]
        db.commit()
    for nome, total in totais:
        print(f"{nome}: {total} criado(s)")
