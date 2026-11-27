"""Configuracao dos testes: banco SQLite em memoria e login simulado.

Os testes nao precisam do MySQL nem de um .env: as tabelas sao criadas num
SQLite em memoria e o usuario logado e substituido por um usuario de teste.
"""

import os
from datetime import date, datetime

os.environ.setdefault("SECRET_KEY", "teste-" + "0" * 40)
os.environ["FOTOS_VARIANTES_AO_INICIAR"] = "false"
os.environ["R2_BUCKET"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.database import Base, get_db  # noqa: E402
from app.core.deps import get_current_user  # noqa: E402
from app.main import app  # noqa: E402
from app.models.adocao import Adocao  # noqa: E402
from app.models.animal import Animal  # noqa: E402
from app.models.eutanasia import Eutanasia  # noqa: E402
from app.models.intake import SupatasIntake  # noqa: E402
from app.models.user import User  # noqa: E402

from app.models import castracao as _castracao  # noqa: E402,F401  (registra a tabela)


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    sessao = sessionmaker(bind=engine)()
    yield sessao
    sessao.close()


@pytest.fixture()
def usuario(db):
    user = User(
        first_name="Teste", second_name="IA", email="teste@ardap.local",
        password="x", role="admin",
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture()
def cliente(db, usuario):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: usuario
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def cliente_sem_login(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def criar_animal(db, **campos) -> Animal:
    dados = dict(
        nome="Rex", especie="cao", raca="SRD", sexo="macho", idade_estimada=3,
        cor_pelo="Caramelo", castrado=False, temperamento="docil",
        origem_resgate="Centro", created_at=datetime(2026, 9, 1),
    )
    dados.update(campos)
    animal = Animal(**dados)
    db.add(animal)
    db.commit()
    return animal


def adotar(db, animal: Animal) -> None:
    db.add(Adocao(
        animal_id=animal.id, nome_adotante="Fulano",
        endereco_residencial="Rua A", endereco_ficara_animal="Rua A",
    ))
    db.commit()


def eutanasiar(db, animal: Animal) -> None:
    db.add(Eutanasia(animal_id=animal.id, nome_responsavel="Fulano"))
    db.commit()


def registrar_supatas(db, animal: Animal, situacao: str) -> None:
    db.add(SupatasIntake(
        animal_id=animal.id, situacao_animal=situacao,
        data_recebimento=date(2026, 8, 15),
    ))
    db.commit()
