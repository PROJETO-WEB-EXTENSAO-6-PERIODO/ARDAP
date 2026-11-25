"""Seeder de termos de eutanasia (dados ficticios).

Rodar, dentro de Backend/:  python -m app.seeders.eutanasia

Os registros sao de animais sem vinculo, para nao marcar como sacrificados
os animais do seeder que aparecem nos outros modulos.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.eutanasia import Eutanasia
from app.seeders.comum import dias_atras, executar, primeiro_funcionario

# responsavel, cpf, rg, endereco, bairro, cidade, telefone, animal, crmv, dias
REGISTROS = [
    ("Wesley Dantas (teste)", "00000000041", "000000041", "Rua J, 22", "Centro", "Paulo Afonso", "(75) 90000-0041",
     {"nome_animal": "Duque", "especie": "Cão", "raca": "Pastor Alemão", "sexo": "macho", "idade": "14", "pelagem": "Preto e marrom"}, "00001", 95),
    ("Yara Campos (teste)", "00000000042", "000000042", "Rua K, 81", "Moxotó", "Paulo Afonso", "(75) 90000-0042",
     {"nome_animal": "Mimi", "especie": "Gato", "raca": "SRD", "sexo": "femea", "idade": "16", "pelagem": "Cinza"}, "00001", 45),
    ("Zeca Moura (teste)", "00000000043", "000000043", "Rua L, 3", "Centro", "Glória", "(75) 90000-0043",
     {"nome_animal": "Barão", "especie": "Cão", "raca": "SRD", "sexo": "macho", "idade": "12", "pelagem": "Branco"}, "00002", 15),
]


def semear_eutanasias(db: Session) -> int:
    funcionario_id = primeiro_funcionario(db)
    existentes = set(db.scalars(select(Eutanasia.nome_responsavel)))
    criados = 0
    for (responsavel, cpf, rg, endereco, bairro, cidade, telefone, animal,
         crmv, dias) in REGISTROS:
        if responsavel in existentes:
            continue
        data = dias_atras(dias)
        db.add(Eutanasia(
            **animal, funcionario_id=funcionario_id, crmv_veterinario=crmv,
            nome_responsavel=responsavel, rg=rg, cpf=cpf, endereco=endereco,
            bairro=bairro, cidade=cidade, telefone_email=telefone,
            declaracao_aceite=True, local_declaracao="Paulo Afonso",
            data_declaracao=data.date(), assinatura_responsavel=responsavel,
            created_at=data,
        ))
        criados += 1
    db.flush()
    return criados


if __name__ == "__main__":
    executar("eutanasia", semear_eutanasias, len(REGISTROS))
