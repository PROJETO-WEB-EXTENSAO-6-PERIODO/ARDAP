"""Formularios ficticios, todos ligados aos animais do seeder.

As datas respeitam a historia do animal: nada acontece antes do cadastro dele
nem depois da eutanasia.
"""

from random import Random

from sqlalchemy.orm import Session

from app.core import armazenamento
from app.models.adocao import Adocao
from app.models.animal import Animal
from app.models.castracao import Castracao
from app.models.cirurgia import Cirurgia
from app.models.eutanasia import Eutanasia
from app.models.hipossuficiencia import Hipossuficiencia
from app.models.hipossuficiencia_anexo import HipossuficienciaAnexo
from app.models.intake import SupatasIntake
from app.seeders.comum import (
    Pessoas,
    dados_do_animal,
    dias_distribuidos,
    momento,
    usuarios,
)

LOCAL = "Paulo Afonso"
RESPONSAVEL_ARDAP = "Equipe ARDAP"
ORGAOS = [
    "SUPATAS – Superintendência de Proteção e Bem-Estar Animal",
    "Secretaria Municipal de Saúde",
    "Corpo de Bombeiros",
    "Polícia Militar",
]
PESOS_ORGAOS = [70, 14, 10, 6]

# peso de cada mes, do mais antigo ao atual
RITMO_DECLARACOES = [1, 2, 1, 3, 2, 1, 2, 3, 2, 1, 3, 2]

# animal, dias atras do procedimento: sempre depois do cadastro
CASTRACOES = [
    ("Sombra", 330), ("Tigrinha", 290), ("Negão", 270), ("Laranjinha", 262),
    ("Cinzento", 215), ("Caramelo", 195), ("Simba", 130), ("Dourado", 92),
    ("Faísca", 75), ("Pantera", 50), ("Fofão", 40), ("Malhada", 11),
]
CIRURGIAS = [
    ("Sombra", 300, "Retirada de nódulo"),
    ("Negão", 240, "Sutura de ferimento"),
    ("Duque", 230, "Retirada de nódulo"),
    ("Cinzento", 205, "Drenagem de abscesso"),
    ("Caramelo", 190, "Sutura de ferimento"),
    ("Estrelinha", 180, "Enucleação"),
    ("Faísca", 120, "Osteossíntese de fêmur"),
    ("Mimi", 110, "Extração dentária"),
    ("Pantera", 72, "Drenagem de abscesso"),
    ("Juju", 60, "Correção de hérnia"),
    ("Malhada", 16, "Retirada de nódulo"),
]
ADOCOES = [
    ("Bonita", 285), ("Tigrinha", 250), ("Pipoca", 214), ("Caramelo", 160),
    ("Amendoim", 133), ("Simba", 101), ("Orelhudo", 84), ("Dourado", 55),
    ("Estrelinha", 33), ("Fofão", 14), ("Mil Grau", 5),
]
EUTANASIAS = [("Duque", 190), ("Mimi", 70)]
# os demais foram entregues pelos tutores, sem passar pelo SUPATAS
SUPATAS = [
    ("Sombra", "acidentado"), ("Bonita", "outros"), ("Tigrinha", "castracao"),
    ("Negão", "acidentado"), ("Laranjinha", "castracao"), ("Duque", "doente"),
    ("Pipoca", "outros"), ("Cinzento", "doente"), ("Caramelo", "doente"),
    ("Estrelinha", "doente"), ("Amendoim", "outros"), ("Faísca", "acidentado"),
    ("Dourado", "outros"), ("Juju", "castracao"), ("Pantera", "doente"),
    ("Fofão", "acidentado"), ("Mil Grau", "outros"), ("Malhada", "doente"),
]
RELATOS = {
    "acidentado": ["Atropelamento, com escoriações.", "Queda, com suspeita de fratura.", "Ferimento por arame farpado."],
    "doente": ["Sinais de desidratação.", "Infecção nos olhos.", "Muito abaixo do peso."],
    "castracao": ["Encaminhado para castração.", "Animal de colônia, para controle populacional."],
    "outros": ["Deixado em caixa de papelão.", "Encontrado amarrado.", "Perdido em via movimentada."],
}
MOTIVOS_OUTROS = ["Abandono", "Maus-tratos", "Perdido"]


def semear_supatas(db: Session, sorteio: Random, pessoas: Pessoas, animais: dict[str, Animal]) -> int:
    equipe = usuarios(db)
    casos = []
    for nome, situacao in SUPATAS:
        a = animais[nome]
        casos.append((a.created_at, situacao, {
            "animal_id": a.id, "nome_animal": a.nome, "especie": a.especie,
            "especie_outro": None, "sexo": a.sexo,
        }))
    for quando, situacao, dados in sorted(casos, key=lambda c: c[0]):
        p = pessoas.nova()
        db.add(SupatasIntake(
            **dados, funcionario_id=sorteio.choice(equipe),
            orgao_solicitante=sorteio.choices(ORGAOS, PESOS_ORGAOS)[0],
            nome_responsavel_encaminhamento=p.nome,
            data_encaminhamento=quando.date(), situacao_animal=situacao,
            situacao_animal_outros_desc=(
                sorteio.choice(MOTIVOS_OUTROS) if situacao == "outros" else None
            ),
            local_recolhimento=f"Bairro {p.bairro}",
            nome_resgatista=pessoas.nova().nome,
            relatorio=sorteio.choice(RELATOS[situacao]),
            recebido_por=RESPONSAVEL_ARDAP, data_recebimento=quando.date(),
            cpf_responsavel_supatas=p.cpf,
            assinatura_responsavel_supatas=p.nome,
            assinatura_recebimento_ardap=RESPONSAVEL_ARDAP,
            created_at=quando, updated_at=quando,
        ))
    db.flush()
    return len(casos)


def semear_adocoes(db: Session, sorteio: Random, pessoas: Pessoas, animais: dict[str, Animal]) -> int:
    equipe = usuarios(db)
    for nome, dias in ADOCOES:
        a, p, quando = animais[nome], pessoas.nova(), momento(sorteio, dias)
        outros = sorteio.choice([0, 0, 1, 1, 2, 3])
        aluguel = sorteio.random() < 0.35
        db.add(Adocao(
            animal_id=a.id, funcionario_id=sorteio.choice(equipe),
            nome_adotante=p.nome, rg=p.rg, cpf=p.cpf,
            endereco_residencial=p.endereco, bairro=p.bairro, cidade=p.cidade,
            cep="48600000", telefone=p.telefone,
            especie_adocao={"cao": "canino", "gato": "felino"}.get(a.especie),
            mais_animais_em_casa=outros > 0, quantos_mais_animais=outros or None,
            outros_animais=outros > 0, quantos_animais=outros or None,
            endereco_ficara_animal="mesmo",
            local_na_casa=sorteio.choice(["Quintal", "Dentro de casa", "Quintal e área interna"]),
            espaco_casa=True, casa_murada=sorteio.random() < 0.8,
            espaco_coberto_quintal=sorteio.random() < 0.7,
            mora_aluguel=aluguel,
            proprietario_permite_animais=True if aluguel else None,
            viajar_quem_cuidara=sorteio.choice(["Familiar", "Vizinho", "Hotel para animais"]),
            familia_sabe_adocao=True, alguem_alergia=False,
            alimentacao=sorteio.choice(["Ração seca", "Ração e sachê", "Ração e alimentação natural"]),
            acesso_rua=False, ciencia_vacinacao=True,
            aceite_declaracao=True, aceite_termo=True,
            assinatura_adotante=p.nome, assinatura_ardap=RESPONSAVEL_ARDAP,
            local_assinatura=LOCAL, data_assinatura=quando.date(),
            created_at=quando, updated_at=quando,
        ))
    db.flush()
    return len(ADOCOES)


def _procedimentos(db, sorteio, pessoas, modelo, casos) -> int:
    equipe = usuarios(db)
    for quando, animal, procedimento in sorted(casos, key=lambda c: c[0]):
        p = pessoas.nova()
        dados = dados_do_animal(animal)
        idade = dados.pop("idade")
        db.add(modelo(
            **dados, idade_real=idade, animal_id=animal.id,
            funcionario_id=sorteio.choice(equipe),
            proprietario_responsavel=p.nome, cpf_cnpj=p.cpf, endereco=p.rua,
            numero=p.numero, bairro=p.bairro, ba_telefones=p.telefone,
            email=p.email, procedimento=procedimento,
            assinatura_responsavel=p.nome, local_assinatura=LOCAL,
            data_assinatura=quando.date(), created_at=quando, updated_at=quando,
        ))
    db.flush()
    return len(casos)


def semear_castracoes(db: Session, sorteio: Random, pessoas: Pessoas, animais: dict[str, Animal]) -> int:
    casos = []
    for nome, dias in CASTRACOES:
        a = animais[nome]
        # como na API: o termo marca o animal como castrado
        a.castrado = True
        casos.append((
            momento(sorteio, dias), a,
            "Orquiectomia" if a.sexo == "macho" else "Ovariohisterectomia",
        ))
    return _procedimentos(db, sorteio, pessoas, Castracao, casos)


def semear_cirurgias(db: Session, sorteio: Random, pessoas: Pessoas, animais: dict[str, Animal]) -> int:
    casos = [
        (momento(sorteio, dias), animais[nome], procedimento)
        for nome, dias, procedimento in CIRURGIAS
    ]
    return _procedimentos(db, sorteio, pessoas, Cirurgia, casos)


def semear_eutanasias(db: Session, sorteio: Random, pessoas: Pessoas, animais: dict[str, Animal]) -> int:
    equipe = usuarios(db)
    casos = [
        (momento(sorteio, dias), animais[nome].id, dados_do_animal(animais[nome]))
        for nome, dias in EUTANASIAS
    ]
    for quando, animal_id, dados in sorted(casos, key=lambda c: c[0]):
        p = pessoas.nova()
        db.add(Eutanasia(
            **dados, animal_id=animal_id, funcionario_id=sorteio.choice(equipe),
            crmv_veterinario=sorteio.choice(["00001", "00002"]),
            nome_responsavel=p.nome, rg=p.rg, cpf=p.cpf, endereco=p.endereco,
            bairro=p.bairro, cidade=p.cidade, telefone_email=p.telefone,
            declaracao_aceite=True, local_declaracao=LOCAL,
            data_declaracao=quando.date(), assinatura_responsavel=p.nome,
            created_at=quando, updated_at=quando,
        ))
    db.flush()
    return len(casos)


def _pdf_exemplo() -> bytes:
    """PDF minimo de uma pagina, para os anexos poderem ser baixados e abertos."""
    texto = b"BT /F1 18 Tf 60 760 Td (Documento de exemplo) Tj ET"
    objetos = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(texto), texto),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    saida, posicoes = b"%PDF-1.4\n", []
    for n, objeto in enumerate(objetos, start=1):
        posicoes.append(len(saida))
        saida += b"%d 0 obj\n%s\nendobj\n" % (n, objeto)
    inicio = len(saida)
    saida += b"xref\n0 6\n0000000000 65535 f \n"
    saida += b"".join(b"%010d 00000 n \n" % p for p in posicoes)
    return saida + b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % inicio


def semear_declaracoes(
    db: Session, sorteio: Random, pessoas: Pessoas, arquivos: list[str]
) -> int:
    equipe = usuarios(db)
    total = 8
    for n, dias in enumerate(dias_distribuidos(sorteio, total, RITMO_DECLARACOES), start=1):
        representante, imigrante = pessoas.nova(), pessoas.nova()
        quando = momento(sorteio, dias)
        sem_trabalho = sorteio.random() < 0.6
        sem_renda = sorteio.random() < 0.45
        declaracao = Hipossuficiencia(
            funcionario_id=sorteio.choice(equipe),
            nome_representante=representante.nome,
            documento_representante=representante.cpf,
            tipo_documento_representante=sorteio.choices(
                ["cpf", "rg", "cnh", "outro"], [50, 25, 15, 10]
            )[0],
            email_representante=representante.email,
            nome_imigrante=imigrante.nome,
            documento_imigrante=f"TESTE{n:04d}",
            tipo_documento_imigrante=sorteio.choice(["passaporte", "rne"]),
            email_imigrante=imigrante.email,
            nao_possui_trabalho_remunerado=sem_trabalho,
            nao_possui_renda=sem_renda,
            # ao menos um motivo em cada declaracao
            renda_ate_meio_salario_per_capita=(
                not (sem_trabalho or sem_renda) or sorteio.random() < 0.3
            ),
            local_declaracao=LOCAL, data_declaracao=quando.date(),
            assinatura_representante=representante.nome,
            created_at=quando, updated_at=quando,
        )
        if sorteio.random() < 0.6:
            path = armazenamento.salvar("hipossuficiencia", _pdf_exemplo(), ".pdf")
            arquivos.append(path)
            declaracao.anexos.append(HipossuficienciaAnexo(
                nome=f"documento-exemplo-{n}.pdf", path=path, created_at=quando,
            ))
        db.add(declaracao)
    db.flush()
    return total
