"""Apoio aos seeders: datas e pessoas ficticias."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.horario import agora
from app.models.user import User

NOMES = [
    "Ana", "Bruno", "Carla", "Diego", "Elisa", "Fábio", "Gabriela", "Heitor",
    "Isabela", "João", "Karina", "Lucas", "Marina", "Natan", "Olívia", "Paulo",
    "Queila", "Rafael", "Sabrina", "Tiago", "Úrsula", "Vitor", "Wesley", "Yasmin",
]
SOBRENOMES = [
    "Almeida", "Barbosa", "Cardoso", "Dantas", "Esteves", "Farias", "Gomes",
    "Henriques", "Lacerda", "Macedo", "Nogueira", "Oliveira", "Pacheco",
    "Queiroz", "Ramos", "Siqueira", "Teles", "Vasconcelos",
]
RUAS = [
    "Rua das Flores", "Rua do Sol", "Av. Brasil", "Rua Nova", "Rua da Paz",
    "Rua do Cais", "Rua das Acácias", "Av. da Cachoeira", "Rua dos Ipês",
    "Travessa do Mercado",
]
# os primeiros sao mais frequentes
BAIRROS = [
    "Centro", "Centenário", "Tancredo Neves", "Moxotó", "Jardim Bahia",
    "Vila Nobre", "Perpétuo Socorro", "Prainha",
]
PESOS_BAIRROS = [26, 18, 15, 13, 11, 8, 6, 3]
CIDADES = ["Paulo Afonso", "Glória", "Jatobá", "Delmiro Gouveia"]
PESOS_CIDADES = [78, 9, 7, 6]


def usuarios(db: Session) -> list[int]:
    return list(db.scalars(select(User.id).order_by(User.id)))


def momento(sorteio: Random, dias: int) -> datetime:
    """Horario comercial, tantos dias atras, nunca no futuro."""
    data = (agora() - timedelta(days=dias)).replace(
        hour=sorteio.randint(8, 17), minute=sorteio.randint(0, 59),
        second=0, microsecond=0,
    )
    return min(data, agora().replace(microsecond=0))


def dias_distribuidos(sorteio: Random, total: int, pesos: list[int]) -> list[int]:
    """Dias atras, pelos ultimos 12 meses; pesos[0] e o mes mais antigo.

    O mais antigo vem primeiro.
    """
    blocos = sorteio.choices(range(len(pesos)), weights=pesos, k=total)
    dias = [
        (len(pesos) - 1 - bloco) * 30 + sorteio.randint(0, 29) for bloco in blocos
    ]
    return sorted(dias, reverse=True)


@dataclass(frozen=True)
class Pessoa:
    nome: str
    # invalido de proposito, para nao coincidir com pessoas reais
    cpf: str
    rg: str
    telefone: str
    email: str
    rua: str
    numero: str
    bairro: str
    cidade: str

    @property
    def endereco(self) -> str:
        return f"{self.rua}, {self.numero}"


class Pessoas:
    """Pessoas ficticias, sem repetir nome nem documento."""

    def __init__(self, sorteio: Random):
        self.sorteio = sorteio
        combinacoes = [f"{n} {s}" for n in NOMES for s in SOBRENOMES]
        self.nomes = iter(sorteio.sample(combinacoes, len(combinacoes)))
        self.contador = 0

    def nova(self) -> Pessoa:
        self.contador += 1
        n = self.contador
        s = self.sorteio
        return Pessoa(
            nome=next(self.nomes), cpf=f"00000000{n:03d}", rg=f"000000{n:03d}",
            telefone=f"(75) 90000-{n:04d}", email=f"pessoa{n}@example.com",
            rua=s.choice(RUAS), numero=str(s.randint(1, 400)),
            bairro=s.choices(BAIRROS, PESOS_BAIRROS)[0],
            cidade=s.choices(CIDADES, PESOS_CIDADES)[0],
        )


def dados_do_animal(animal) -> dict:
    """Campos do animal que os termos repetem."""
    return {
        "nome_animal": animal.nome,
        "especie": {"cao": "Cão", "gato": "Gato"}.get(animal.especie, "Outro"),
        "raca": animal.raca,
        "pelagem": animal.cor_pelo,
        "sexo": animal.sexo,
        "idade": str(animal.idade_estimada),
    }
