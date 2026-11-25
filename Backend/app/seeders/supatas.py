"""Seeder de solicitacoes SUPATAS (dados ficticios).

Rodar, dentro de Backend/:  python -m app.seeders.supatas
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.intake import SupatasIntake
from app.seeders.comum import (
    animais_semeados,
    dias_atras,
    executar,
    primeiro_funcionario,
)

# responsavel, cpf, animal semeado (ou dict sem vinculo), situacao, descricao
# quando "outros", local, resgatista, relatorio, dias atras
REGISTROS = [
    ("Paula Gomes (teste)", "000.000.000-31", "Thor", "acidentado", None, "BR-110", "Equipe 1 (teste)", "Atropelamento, com escoriações leves.", 140),
    ("Rafael Teles (teste)", "000.000.000-32", "Luna", "doente", None, "Centro", "Equipe 2 (teste)", "Sinais de desidratação.", 125),
    ("Sabrina Luz (teste)", "000.000.000-33", "Nina", "castracao", None, "Terreno baldio no Centro", "Equipe 1 (teste)", "Encaminhada para castração.", 40),
    ("Tiago Brito (teste)", "000.000.000-34", "Simba", "outros", "Abandono", "Mercado municipal", "Equipe 3 (teste)", "Deixado em caixa de papelão.", 25),
    ("Úrsula Maia (teste)", "000.000.000-35",
     {"nome_animal": "Trovão", "especie": "outro", "especie_outro": "Equino", "sexo": "macho"},
     "acidentado", None, "Rodovia de acesso ao Moxotó", "Equipe 2 (teste)", "Ferimento na pata dianteira.", 60),
    ("Vitor Paz (teste)", "000.000.000-36",
     {"nome_animal": None, "especie": "gato", "especie_outro": None, "sexo": "femea"},
     "doente", None, "Bairro Centenário", "Equipe 3 (teste)", "Animal sem identificação.", 8),
]


def semear_supatas(db: Session) -> int:
    animais = animais_semeados(db)
    funcionario_id = primeiro_funcionario(db)
    existentes = set(
        db.scalars(select(SupatasIntake.nome_responsavel_encaminhamento))
    )
    criados = 0
    for (responsavel, cpf, animal, situacao, descricao, local, resgatista,
         relatorio, dias) in REGISTROS:
        if responsavel in existentes:
            continue
        if isinstance(animal, dict):
            dados = {"animal_id": None, **animal}
        else:
            a = animais[animal]
            dados = {
                "animal_id": a.id, "nome_animal": a.nome,
                "especie": a.especie, "especie_outro": None, "sexo": a.sexo,
            }
        data = dias_atras(dias)
        db.add(SupatasIntake(
            **dados, funcionario_id=funcionario_id,
            orgao_solicitante="SUPATAS – Superintendência de Proteção e Bem-Estar Animal",
            nome_responsavel_encaminhamento=responsavel,
            data_encaminhamento=data.date(), situacao_animal=situacao,
            situacao_animal_outros_desc=descricao, local_recolhimento=local,
            nome_resgatista=resgatista, relatorio=relatorio,
            recebido_por="ARDAP (teste)", data_recebimento=data.date(),
            cpf_responsavel_supatas=cpf,
            assinatura_responsavel_supatas=responsavel,
            assinatura_recebimento_ardap="ARDAP (teste)", created_at=data,
        ))
        criados += 1
    db.flush()
    return criados


if __name__ == "__main__":
    executar("supatas_intake", semear_supatas, len(REGISTROS))
