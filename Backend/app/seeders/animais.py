"""Animais ficticios, com foto quando ela existir em Backend/uploads/seeders.

As fotos ficam fora do git: sem elas, o animal e criado sem foto.
"""

from dataclasses import dataclass
from random import Random

from sqlalchemy.orm import Session

from app.core import armazenamento
from app.models.animal import Animal
from app.seeders.comum import momento, usuarios

PASTA_FOTOS = armazenamento.UPLOADS_DIR / "seeders"


@dataclass(frozen=True)
class Ficha:
    nome: str
    especie: str
    raca: str
    sexo: str
    idade: int
    porte: str
    cor: str
    peso: float
    temperamento: str
    origem: str
    # dias desde o cadastro
    dias: int
    castrado: bool = False
    vermifugado: bool = True
    vacinado: bool = True
    medicacao: str | None = None
    foto: str | None = None
    observacoes: str | None = None


FICHAS = [
    Ficha("Sombra", "cao", "SRD", "macho", 8, "medio", "Preto e branco", 17.2, "docil", "Estrada de terra, zona rural", 348, castrado=True, foto="cao-01.jpg", observacoes="Focinho grisalho, idoso e calmo."),
    Ficha("Bonita", "cao", "SRD", "femea", 0, "pequeno", "Bege e cinza", 3.1, "docil", "Caixa deixada na calçada, Centro", 331, foto="cao-02.jpg", observacoes="Encontrada dentro de uma caixa de frutas."),
    Ficha("Tigrinha", "gato", "SRD", "femea", 3, "pequeno", "Marrom tigrado", 3.9, "medroso", "Bairro Tancredo Neves", 312, castrado=True, foto="gato-01.jpg"),
    Ficha("Negão", "cao", "SRD", "macho", 5, "grande", "Preto e caramelo", 24.6, "docil", "Calçadão do Centro", 296, castrado=True, foto="cao-03.jpg"),
    Ficha("Laranjinha", "gato", "SRD", "macho", 2, "pequeno", "Laranja", 4.4, "arisco", "Bairro Centenário", 283, castrado=True, foto="gato-03.jpg"),
    Ficha("Duque", "cao", "Pastor Alemão", "macho", 14, "grande", "Preto e marrom", 29.5, "docil", "Bairro Moxotó", 268, castrado=True, medicacao="Anti-inflamatório, 1 vez ao dia"),
    Ficha("Pipoca", "cao", "SRD", "femea", 0, "pequeno", "Caramelo e branco", 2.8, "docil", "Bairro Jardim Bahia", 251, foto="cao-04.jpg"),
    Ficha("Cinzento", "gato", "SRD", "macho", 5, "medio", "Cinza tigrado", 5.3, "agressivo", "Galpão abandonado", 236, vacinado=False, foto="gato-02.jpg", observacoes="Precisa de manejo com cuidado."),
    Ficha("Caramelo", "cao", "SRD", "macho", 4, "medio", "Caramelo", 15.8, "docil", "Porta de um restaurante, Centro", 219, castrado=True, foto="cao-05.jpg"),
    Ficha("Estrelinha", "gato", "SRD", "femea", 1, "pequeno", "Branco, preto e laranja", 2.6, "medroso", "Terreno baldio, Vila Nobre", 202, medicacao="Colírio, 3 vezes ao dia por 10 dias", foto="gato-04.jpg"),
    Ficha("Amendoim", "cao", "SRD", "macho", 0, "pequeno", "Caramelo", 3.6, "docil", "Povoado Malhada Grande", 187, vacinado=False, foto="cao-06.jpg"),
    Ficha("Orelhudo", "outro", "Outra", "macho", 2, "pequeno", "Branco", 1.9, "docil", "Entregue pelo antigo tutor", 171, vacinado=False, observacoes="Coelho."),
    Ficha("Simba", "gato", "SRD", "macho", 4, "medio", "Laranja e branco", 5.8, "docil", "Entregue pelo antigo tutor", 158, castrado=True, foto="gato-05.jpg"),
    Ficha("Faísca", "cao", "SRD", "femea", 3, "medio", "Caramelo", 13.9, "medroso", "Rodoviária", 141, foto="cao-07.jpg"),
    Ficha("Mimi", "gato", "SRD", "femea", 16, "pequeno", "Cinza", 2.9, "docil", "Bairro Centro", 128, castrado=True, medicacao="Soro subcutâneo"),
    Ficha("Dourado", "cao", "Golden Retriever", "macho", 3, "grande", "Dourado", 27.4, "docil", "Às margens da BR-110", 113, castrado=True, foto="cao-08.jpg"),
    Ficha("Juju", "gato", "SRD", "femea", 0, "pequeno", "Marrom tigrado", 1.4, "arisco", "Garagem de residência, Moxotó", 96, vermifugado=False, vacinado=False, foto="gato-06.jpg", observacoes="Resgatada junto com a irmã."),
    Ficha("Pantera", "cao", "SRD", "femea", 2, "medio", "Preto e branco", 14.7, "desconhecido", "Praça das Mangueiras", 79, foto="cao-09.jpg"),
    Ficha("Fofão", "gato", "SRD", "macho", 2, "medio", "Branco e tigrado", 4.9, "docil", "Bairro Jardim Bahia", 61, castrado=True, foto="gato-07.jpg"),
    Ficha("Mil Grau", "cao", "SRD", "macho", 4, "grande", "Caramelo", 22.3, "docil", "Pizzaria no Centro", 43, castrado=True, foto="cao-10.jpg", observacoes="Muito sociável e apaixonado por pizza."),
    Ficha("Malhada", "cao", "SRD", "femea", 6, "medio", "Branco e marrom", 16.1, "docil", "Bairro Centenário", 24, castrado=True, medicacao="Condroprotetor, 1 comprimido por dia", foto="cao-11.jpg"),
    Ficha("Louro", "outro", "Outra", "macho", 7, "pequeno", "Verde", 0.4, "arisco", "Entregue voluntariamente", 9, vermifugado=False, vacinado=False, observacoes="Papagaio."),
]


def salvar_foto(nome: str | None) -> str | None:
    if nome is None:
        return None
    arquivo = PASTA_FOTOS / nome
    if not arquivo.is_file():
        return None
    conteudo = arquivo.read_bytes()
    extensao = armazenamento.identificar(conteudo)
    if extensao not in armazenamento.IMAGENS:
        raise SystemExit(f"{arquivo.name} nao e JPG, PNG ou WebP.")
    return armazenamento.salvar("animais", conteudo, extensao)


def semear_animais(db: Session, sorteio: Random, arquivos: list[str]) -> dict[str, Animal]:
    """Cria os animais e os devolve por nome. `arquivos` recebe as chaves salvas."""
    equipe = usuarios(db)
    animais: dict[str, Animal] = {}
    for f in FICHAS:
        foto_path = salvar_foto(f.foto)
        if foto_path:
            arquivos.append(foto_path)
        quando = momento(sorteio, f.dias)
        animais[f.nome] = Animal(
            nome=f.nome, especie=f.especie, raca=f.raca, sexo=f.sexo,
            idade_estimada=f.idade, porte=f.porte, cor_pelo=f.cor, peso=f.peso,
            castrado=f.castrado, vermifugado=f.vermifugado, vacinado=f.vacinado,
            temperamento=f.temperamento,
            medicacao_necessaria=f.medicacao is not None,
            medicacao_desc=f.medicacao, origem_resgate=f.origem,
            observacoes=f.observacoes, foto_path=foto_path,
            funcionario_id=sorteio.choice(equipe),
            created_at=quando, updated_at=quando,
        )
        db.add(animais[f.nome])
    db.flush()
    return animais
