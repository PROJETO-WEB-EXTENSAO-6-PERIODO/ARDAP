"""Seeder de termos de adocao (dados ficticios para desenvolvimento).

Rodar, dentro de Backend/:  python -m app.seeders.termo_adocao
Cria antes os animais do seeder de animais, se faltarem. Pode rodar mais de
uma vez: animais semeados que ja tem termo de adocao sao ignorados.
"""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.adocao import Adocao
from app.models.animal import Animal
from app.models.user import User
from app.seeders.animais import MARCADOR, semear_animais

# CPFs propositalmente invalidos, para nao coincidir com pessoas reais.
# animal, adotante, cpf, endereco, bairro, cidade, telefone, tem outros
# animais (quantos), casa murada, aluguel, alimentacao, dias desde a adocao
TERMOS = [
    ("Caramelo", "Ana Souza (teste)", "00000000001", "Rua das Flores, 10", "Centro", "Paulo Afonso", "(75) 90000-0001", 0, True, False, "Ração seca", 130),
    ("Mel", "Bruno Lima (teste)", "00000000002", "Rua do Sol, 25", "Centenário", "Paulo Afonso", "(75) 90000-0002", 2, True, True, "Ração seca e sachê", 105),
    ("Luna", "Carla Dias (teste)", "00000000003", "Av. Brasil, 300", "Jardim Bahia", "Paulo Afonso", "(75) 90000-0003", 1, False, True, "Ração para gatos", 80),
    ("Frajola", "Diego Alves (teste)", "00000000004", "Rua Nova, 8", "Centro", "Glória", "(75) 90000-0004", 0, True, False, "Ração e sachê", 50),
    ("Bob", "Elisa Rocha (teste)", "00000000005", "Rua da Paz, 77", "Vila Nobre", "Paulo Afonso", "(75) 90000-0005", 0, True, False, "Ração para porte pequeno", 30),
    ("Mia", "Fábio Melo (teste)", "00000000006", "Rua do Cais, 14", "Centro", "Jatobá", "(87) 90000-0006", 3, False, False, "Ração para gatos", 12),
]


def semear_termos(db: Session) -> int:
    """Insere os termos que faltam e devolve quantos foram criados."""
    semear_animais(db)
    animais = {
        a.nome: a
        for a in db.scalars(select(Animal).where(Animal.observacoes == MARCADOR))
    }
    adotados = set(
        db.scalars(select(Adocao.animal_id).where(Adocao.animal_id.is_not(None)))
    )
    funcionario_id = db.scalar(select(User.id).order_by(User.id).limit(1))
    agora = datetime.now()
    criados = 0
    for (nome, adotante, cpf, endereco, bairro, cidade, telefone, outros,
         murada, aluguel, alimentacao, dias) in TERMOS:
        animal = animais[nome]
        if animal.id in adotados:
            continue
        data = agora - timedelta(days=dias)
        db.add(Adocao(
            animal_id=animal.id, funcionario_id=funcionario_id,
            nome_adotante=adotante, cpf=cpf, endereco_residencial=endereco,
            bairro=bairro, cidade=cidade, telefone=telefone,
            especie_adocao="felino" if animal.especie == "gato" else "canino",
            mais_animais_em_casa=outros > 0,
            quantos_mais_animais=outros or None,
            outros_animais=outros > 0, quantos_animais=outros or None,
            endereco_ficara_animal="mesmo", local_na_casa="Quintal e área interna",
            espaco_casa=True, casa_murada=murada, espaco_coberto_quintal=True,
            mora_aluguel=aluguel,
            proprietario_permite_animais=True if aluguel else None,
            viajar_quem_cuidara="Familiar", familia_sabe_adocao=True,
            alguem_alergia=False, alimentacao=alimentacao, acesso_rua=False,
            ciencia_vacinacao=True, aceite_declaracao=True, aceite_termo=True,
            assinatura_adotante=adotante, assinatura_ardap="ARDAP (teste)",
            local_assinatura="Paulo Afonso", data_assinatura=data.date(),
            created_at=data,
        ))
        criados += 1
    db.flush()
    return criados


if __name__ == "__main__":
    with SessionLocal() as db:
        total = semear_termos(db)
        db.commit()
    print(f"termo_adocao: {total} criado(s), {len(TERMOS) - total} ja existia(m).")
