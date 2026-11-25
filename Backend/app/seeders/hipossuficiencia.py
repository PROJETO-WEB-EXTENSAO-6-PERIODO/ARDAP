"""Seeder de declaracoes de hipossuficiencia (dados ficticios).

Rodar, dentro de Backend/:  python -m app.seeders.hipossuficiencia
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hipossuficiencia import Hipossuficiencia
from app.seeders.comum import dias_atras, executar, primeiro_funcionario

# representante, documento, tipo, imigrante, documento, tipo, sem trabalho,
# sem renda, renda ate meio salario, outro motivo, dias atras
REGISTROS = [
    ("Alice Porto (teste)", "00000000051", "cpf", "Juan Pérez (teste)", "TESTE0051", "passaporte", True, True, False, None, 110),
    ("Breno Costa (teste)", "000000052", "rg", "María López (teste)", "TESTE0052", "rne", True, False, True, None, 65),
    ("Cecília Amaral (teste)", "00000000053", "cnh", "Jean Pierre (teste)", "TESTE0053", "passaporte", False, False, True, "Dependentes menores de idade", 30),
    ("Davi Freire (teste)", "00000000054", "cpf", "Ana Gómez (teste)", "TESTE0054", "outro", True, True, False, None, 6),
]


def semear_hipossuficiencias(db: Session) -> int:
    funcionario_id = primeiro_funcionario(db)
    existentes = set(db.scalars(select(Hipossuficiencia.nome_representante)))
    criados = 0
    for (representante, doc_rep, tipo_rep, imigrante, doc_imi, tipo_imi,
         sem_trabalho, sem_renda, meio_salario, outro, dias) in REGISTROS:
        if representante in existentes:
            continue
        data = dias_atras(dias)
        db.add(Hipossuficiencia(
            funcionario_id=funcionario_id,
            nome_representante=representante, documento_representante=doc_rep,
            tipo_documento_representante=tipo_rep,
            email_representante=f"representante{doc_rep[-2:]}@example.com",
            nome_imigrante=imigrante, documento_imigrante=doc_imi,
            tipo_documento_imigrante=tipo_imi,
            email_imigrante=f"imigrante{doc_imi[-2:]}@example.com",
            nao_possui_trabalho_remunerado=sem_trabalho,
            nao_possui_renda=sem_renda,
            renda_ate_meio_salario_per_capita=meio_salario,
            outro_motivo=outro, local_declaracao="Paulo Afonso",
            data_declaracao=data.date(),
            assinatura_representante=representante, created_at=data,
        ))
        criados += 1
    db.flush()
    return criados


if __name__ == "__main__":
    executar("hipossuficiencia", semear_hipossuficiencias, len(REGISTROS))
