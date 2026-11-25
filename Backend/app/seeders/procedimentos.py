"""Regra comum de castracao e cirurgia, que usam o mesmo termo."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.seeders.comum import (
    ESPECIES,
    animais_semeados,
    dias_atras,
    primeiro_funcionario,
)


def semear_procedimentos(db: Session, modelo, registros: list[tuple]) -> int:
    """Cada registro: responsavel, cpf, endereco, numero, bairro, telefone,
    animal semeado (ou dict com os dados de um animal sem vinculo),
    procedimento, dias atras.
    """
    animais = animais_semeados(db)
    funcionario_id = primeiro_funcionario(db)
    existentes = set(db.scalars(select(modelo.proprietario_responsavel)))
    criados = 0
    for (responsavel, cpf, endereco, numero, bairro, telefone, animal,
         procedimento, dias) in registros:
        if responsavel in existentes:
            continue
        if isinstance(animal, dict):
            dados = {"animal_id": None, **animal}
        else:
            a = animais[animal]
            dados = {
                "animal_id": a.id, "nome_animal": a.nome,
                "idade_real": str(a.idade_estimada),
                "especie": ESPECIES[a.especie], "raca": a.raca,
                "pelagem": a.cor_pelo, "sexo": a.sexo,
            }
        data = dias_atras(dias)
        db.add(modelo(
            **dados, funcionario_id=funcionario_id,
            proprietario_responsavel=responsavel, cpf_cnpj=cpf,
            endereco=endereco, numero=numero, bairro=bairro,
            ba_telefones=telefone, email=f"teste{cpf[-3:]}@example.com",
            procedimento=procedimento, assinatura_responsavel=responsavel,
            local_assinatura="Paulo Afonso", data_assinatura=data.date(),
            created_at=data,
        ))
        criados += 1
    db.flush()
    return criados
