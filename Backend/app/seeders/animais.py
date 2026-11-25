"""Seeder de animais (dados ficticios para desenvolvimento).

Rodar, dentro de Backend/:  python -m app.seeders.animais
Pode rodar mais de uma vez: animais ja semeados nao sao duplicados.
"""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.animal import Animal

# Identifica os registros criados por este seeder.
MARCADOR = "[seeder]"

# nome, especie, raca, sexo, idade, porte, cor, peso, castrado, vermifugado,
# vacinado, temperamento, medicacao, origem, dias desde o cadastro
ANIMAIS = [
    ("Caramelo", "cao", "SRD", "macho", 3, "medio", "Caramelo", 14.5, True, True, True, "docil", None, "Av. Apolônio Sales", 160),
    ("Mel", "cao", "SRD", "femea", 2, "pequeno", "Bege", 7.2, True, True, True, "docil", None, "Bairro Centenário", 150),
    ("Thor", "cao", "Pit Bull", "macho", 5, "grande", "Cinza", 28.0, False, True, True, "arisco", None, "BR-110", 140),
    ("Luna", "gato", "SRD", "femea", 1, "pequeno", "Preto", 3.1, True, True, False, "medroso", None, "Centro", 125),
    ("Frajola", "gato", "SRD", "macho", 4, "pequeno", "Preto e branco", 4.6, True, True, True, "docil", None, "Bairro Tancredo Neves", 110),
    ("Pretinha", "cao", "SRD", "femea", 8, "medio", "Preto", 16.3, True, True, True, "docil", "Condroprotetor, 1 comprimido por dia", "Feira livre", 100),
    ("Bob", "cao", "Poodle", "macho", 6, "pequeno", "Branco", 6.8, False, False, True, "docil", None, "Entregue pelo antigo tutor", 85),
    ("Mia", "gato", "Siamês", "femea", 2, "pequeno", "Creme", 3.8, False, True, True, "docil", None, "Bairro Jardim Bahia", 70),
    ("Rex", "cao", "Pastor Alemão", "macho", 7, "grande", "Preto e marrom", 32.4, True, True, True, "agressivo", None, "Bairro Moxotó", 55),
    ("Nina", "cao", "SRD", "femea", 0, "pequeno", "Tigrado", 2.4, False, True, False, "medroso", None, "Terreno baldio no Centro", 40),
    ("Simba", "gato", "SRD", "macho", 1, "pequeno", "Laranja", 3.9, False, False, False, "arisco", None, "Mercado municipal", 25),
    ("Amora", "cao", "SRD", "femea", 4, "medio", "Marrom", 13.0, True, False, True, "docil", "Pomada cicatrizante, 2 vezes ao dia", "Bairro Vila Nobre", 10),
]


def semear_animais(db: Session) -> int:
    """Insere os animais que faltam e devolve quantos foram criados."""
    existentes = set(
        db.scalars(select(Animal.nome).where(Animal.observacoes == MARCADOR))
    )
    agora = datetime.now()
    criados = 0
    for (nome, especie, raca, sexo, idade, porte, cor, peso, castrado,
         vermifugado, vacinado, temperamento, medicacao, origem, dias) in ANIMAIS:
        if nome in existentes:
            continue
        db.add(Animal(
            nome=nome, especie=especie, raca=raca, sexo=sexo,
            idade_estimada=idade, porte=porte, cor_pelo=cor, peso=peso,
            castrado=castrado, vermifugado=vermifugado, vacinado=vacinado,
            temperamento=temperamento,
            medicacao_necessaria=medicacao is not None,
            medicacao_desc=medicacao, origem_resgate=origem,
            observacoes=MARCADOR,
            created_at=agora - timedelta(days=dias),
        ))
        criados += 1
    db.flush()
    return criados


if __name__ == "__main__":
    with SessionLocal() as db:
        total = semear_animais(db)
        db.commit()
    print(f"animais: {total} criado(s), {len(ANIMAIS) - total} ja existia(m).")
