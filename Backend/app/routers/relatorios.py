from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.horario import agora
from app.models.user import User

router = APIRouter(tags=["relatorios"])

ESPECIE = {"cao": "Cão", "gato": "Gato", "felino": "Felino", "canino": "Canino", "outro": "Outro"}
SEXO = {"macho": "Macho", "femea": "Fêmea"}
PORTE = {"pequeno": "Pequeno", "medio": "Médio", "grande": "Grande"}
TEMPERAMENTO = {
    "docil": "Dócil",
    "medroso": "Medroso",
    "arisco": "Arisco",
    "agressivo": "Agressivo",
    "desconhecido": "Desconhecido",
}
SITUACAO = {
    "acidentado": "Acidentado",
    "doente": "Doente",
    "castracao": "Castração",
    "outros": "Outros",
}
BOOLEANO = {"0": "Não", "1": "Sim"}

MODULOS = [
    ("animais", "Animais", "animais"),
    ("supatas", "SUPATAS", "supatas_intake"),
    ("adocoes", "Adoções", "termo_adocao"),
    ("castracoes", "Castração", "castracao"),
    ("cirurgias", "Cirurgias", "cirurgia"),
    ("hipossuficiencia", "Hipossuficiência", "hipossuficiencia"),
    ("eutanasia", "Eutanásia", "eutanasia"),
]


def _count(db: Session, table: str) -> int:
    return int(db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar_one())


def _group(db: Session, sql: str, labels: dict | None = None) -> dict:
    resultado: dict[str, int] = {}
    for chave, total in db.execute(text(sql)).fetchall():
        if chave is None or str(chave).strip() == "":
            rotulo = "Não informado"
        elif labels and str(chave) in labels:
            rotulo = labels[str(chave)]
        else:
            rotulo = str(chave).strip()
        resultado[rotulo] = resultado.get(rotulo, 0) + int(total)
    return resultado


def _taxa(parte: int, total: int) -> float:
    if not total:
        return 0.0
    return round(parte / total * 100, 1)


def _conta(db: Session, tabela: str, condicao: str) -> int:
    return int(db.execute(text(f"SELECT COUNT(*) FROM {tabela} WHERE {condicao}")).scalar_one())


def _distintos(db: Session, tabela: str, coluna: str) -> int:
    return int(
        db.execute(
            text(
                f"SELECT COUNT(DISTINCT {coluna}) FROM {tabela} "
                f"WHERE {coluna} IS NOT NULL AND {coluna} <> ''"
            )
        ).scalar_one()
    )


def _meses(quantidade: int = 6) -> list[str]:
    hoje = agora().date()
    ano, mes = hoje.year, hoje.month
    meses = []
    for _ in range(quantidade):
        meses.append(f"{ano:04d}-{mes:02d}")
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1
    return list(reversed(meses))


def _serie_mensal(db: Session, meses: list[str]) -> list[dict]:
    def coletar(tabela: str) -> dict[str, int]:
        linhas = db.execute(
            text(
                f"SELECT DATE_FORMAT(created_at, '%Y-%m'), COUNT(*) "
                f"FROM {tabela} WHERE created_at IS NOT NULL "
                f"GROUP BY DATE_FORMAT(created_at, '%Y-%m')"
            )
        ).fetchall()
        return {str(m): int(t) for m, t in linhas}

    series = {chave: coletar(tabela) for chave, _, tabela in MODULOS}

    return [
        {
            "mes": mes,
            **{chave: series[chave].get(mes, 0) for chave, _, _ in MODULOS},
        }
        for mes in meses
    ]


def _ultimo_registro(db: Session, table: str):
    valor = db.execute(text(f"SELECT MAX(created_at) FROM {table}")).scalar()
    if isinstance(valor, datetime):
        return valor.isoformat(timespec="seconds")
    return None


@router.get("/relatorios/resumo")
def resumo_geral(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    totais = {chave: _count(db, tabela) for chave, _, tabela in MODULOS}
    total_geral = sum(totais.values())

    modulos = [
        {
            "chave": chave,
            "nome": nome,
            "total": totais[chave],
            "ultimoRegistro": _ultimo_registro(db, tabela),
        }
        for chave, nome, tabela in MODULOS
    ]

    por_especie = _group(db, "SELECT especie, COUNT(*) FROM animais GROUP BY especie", ESPECIE)
    por_sexo = _group(db, "SELECT sexo, COUNT(*) FROM animais GROUP BY sexo", SEXO)
    por_porte = _group(db, "SELECT porte, COUNT(*) FROM animais GROUP BY porte", PORTE)
    por_temperamento = _group(
        db, "SELECT temperamento, COUNT(*) FROM animais GROUP BY temperamento", TEMPERAMENTO
    )
    castrados = _group(db, "SELECT castrado, COUNT(*) FROM animais GROUP BY castrado", BOOLEANO)
    vacinados = _group(db, "SELECT vacinado, COUNT(*) FROM animais GROUP BY vacinado", BOOLEANO)
    vermifugados = _group(db, "SELECT vermifugado, COUNT(*) FROM animais GROUP BY vermifugado", BOOLEANO)
    origem = _group(db, "SELECT origem_resgate, COUNT(*) FROM animais GROUP BY origem_resgate")

    total_animais = totais["animais"]
    sim_castrados = castrados.get("Sim", 0)
    sim_vacinados = vacinados.get("Sim", 0)
    sim_vermifugados = vermifugados.get("Sim", 0)

    sup_situacao = _group(
        db, "SELECT situacao_animal, COUNT(*) FROM supatas_intake GROUP BY situacao_animal", SITUACAO
    )
    sup_especie = _group(db, "SELECT especie, COUNT(*) FROM supatas_intake GROUP BY especie", ESPECIE)
    sup_sexo = _group(db, "SELECT sexo, COUNT(*) FROM supatas_intake GROUP BY sexo", SEXO)

    # Os dados do animal adotado vêm do cadastro, pelo animal_id do termo.
    def adocao_por(coluna: str, rotulos: dict | None = None) -> dict:
        return _group(
            db,
            f"SELECT a.{coluna}, COUNT(*) FROM termo_adocao t "
            f"LEFT JOIN animais a ON a.id = t.animal_id GROUP BY a.{coluna}",
            rotulos,
        )

    adocao_especie = adocao_por("especie", ESPECIE)
    adocao_sexo = adocao_por("sexo", SEXO)
    adocao_raca = adocao_por("raca")
    adocao_cor = adocao_por("cor_pelo")
    adocao_castrado = adocao_por("castrado", BOOLEANO)
    adocao_vermifugado = adocao_por("vermifugado", BOOLEANO)
    adocao_cidade = _group(db, "SELECT cidade, COUNT(*) FROM termo_adocao GROUP BY cidade")

    def conta_onde(condicao: str) -> int:
        return _conta(db, "termo_adocao", condicao)

    perfil_adotante = {
        "moraAluguel": conta_onde("mora_aluguel = 1"),
        "casaMurada": conta_onde("casa_murada = 1"),
        "quintalCoberto": conta_onde("espaco_coberto_quintal = 1"),
        "acessoRua": conta_onde("acesso_rua = 1"),
        "outrosAnimais": conta_onde("outros_animais = 1 OR mais_animais_em_casa = 1"),
        "familiaCiente": conta_onde("familia_sabe_adocao = 1"),
        "alguemAlergia": conta_onde("alguem_alergia = 1"),
    }

    cidades_distintas = int(
        db.execute(
            text(
                "SELECT COUNT(DISTINCT cidade) FROM termo_adocao "
                "WHERE cidade IS NOT NULL AND cidade <> ''"
            )
        ).scalar_one()
    )
    meses_com_adocao = int(
        db.execute(
            text(
                "SELECT COUNT(DISTINCT DATE_FORMAT(created_at, '%Y-%m')) "
                "FROM termo_adocao WHERE created_at IS NOT NULL"
            )
        ).scalar_one()
    )
    sim_castrados_adocao = adocao_castrado.get("Sim", 0)

    castracao_resumo = {
        "total": totais["castracoes"],
        "porEspecie": _group(
            db, "SELECT especie, COUNT(*) FROM castracao GROUP BY especie", ESPECIE
        ),
        "porSexo": _group(db, "SELECT sexo, COUNT(*) FROM castracao GROUP BY sexo", SEXO),
        "porProcedimento": _group(
            db, "SELECT procedimento, COUNT(*) FROM castracao GROUP BY procedimento"
        ),
        "porBairro": _group(db, "SELECT bairro, COUNT(*) FROM castracao GROUP BY bairro"),
        "bairrosDistintos": _distintos(db, "castracao", "bairro"),
        "especiesDistintas": _distintos(db, "castracao", "especie"),
    }

    cirurgia_resumo = {
        "total": totais["cirurgias"],
        "porEspecie": _group(db, "SELECT especie, COUNT(*) FROM cirurgia GROUP BY especie", ESPECIE),
        "porSexo": _group(db, "SELECT sexo, COUNT(*) FROM cirurgia GROUP BY sexo", SEXO),
        "porProcedimento": _group(
            db, "SELECT procedimento, COUNT(*) FROM cirurgia GROUP BY procedimento"
        ),
        "porBairro": _group(db, "SELECT bairro, COUNT(*) FROM cirurgia GROUP BY bairro"),
        "bairrosDistintos": _distintos(db, "cirurgia", "bairro"),
        "especiesDistintas": _distintos(db, "cirurgia", "especie"),
    }

    hipossuficiencia_resumo = {
        "total": totais["hipossuficiencia"],
        "porTipoDocumento": _group(
            db,
            "SELECT tipo_documento_representante, COUNT(*) FROM hipossuficiencia "
            "GROUP BY tipo_documento_representante",
        ),
        "motivos": {
            "Não possui trabalho remunerado": _conta(
                db, "hipossuficiencia", "nao_possui_trabalho_remunerado = 1"
            ),
            "Não possui renda": _conta(db, "hipossuficiencia", "nao_possui_renda = 1"),
            "Renda até meio salário mínimo per capita": _conta(
                db, "hipossuficiencia", "renda_ate_meio_salario_per_capita = 1"
            ),
            "Outro motivo": _conta(
                db,
                "hipossuficiencia",
                "outro_motivo IS NOT NULL AND outro_motivo <> ''",
            ),
        },
        "comAnexos": _conta(
            db,
            "hipossuficiencia",
            "EXISTS (SELECT 1 FROM hipossuficiencia_anexos x "
            "WHERE x.hipossuficiencia_id = hipossuficiencia.id)",
        ),
    }

    eutanasia_resumo = {
        "total": totais["eutanasia"],
        "porEspecie": _group(db, "SELECT especie, COUNT(*) FROM eutanasia GROUP BY especie", ESPECIE),
        "porSexo": _group(db, "SELECT sexo, COUNT(*) FROM eutanasia GROUP BY sexo", SEXO),
        "porCidade": _group(db, "SELECT cidade, COUNT(*) FROM eutanasia GROUP BY cidade"),
        "porBairro": _group(db, "SELECT bairro, COUNT(*) FROM eutanasia GROUP BY bairro"),
        "cidadesDistintas": _distintos(db, "eutanasia", "cidade"),
    }

    tutores_procedimentos = int(
        db.execute(
            text(
                "SELECT COUNT(DISTINCT cpf_cnpj) FROM ("
                "SELECT cpf_cnpj FROM castracao WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> '' "
                "UNION "
                "SELECT cpf_cnpj FROM cirurgia WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> ''"
                ") AS tutores"
            )
        ).scalar_one()
    )
    bairros_procedimentos = int(
        db.execute(
            text(
                "SELECT COUNT(DISTINCT bairro) FROM ("
                "SELECT bairro FROM castracao WHERE bairro IS NOT NULL AND bairro <> '' "
                "UNION "
                "SELECT bairro FROM cirurgia WHERE bairro IS NOT NULL AND bairro <> ''"
                ") AS bairros"
            )
        ).scalar_one()
    )

    ultimos_procedimentos = db.execute(
        text(
            "SELECT 'Castração' AS tipo, nome_animal, proprietario_responsavel, bairro, "
            "procedimento, created_at FROM castracao "
            "UNION ALL "
            "SELECT 'Cirurgia' AS tipo, nome_animal, proprietario_responsavel, bairro, "
            "procedimento, created_at FROM cirurgia "
            "ORDER BY created_at DESC LIMIT 6"
        )
    ).fetchall()

    procedimentos_resumo = {
        "total": totais["castracoes"] + totais["cirurgias"],
        "castracoes": totais["castracoes"],
        "cirurgias": totais["cirurgias"],
        "tutoresUnicos": tutores_procedimentos,
        "bairrosDistintos": bairros_procedimentos,
        "animaisVinculados": _conta(db, "castracao", "animal_id IS NOT NULL")
        + _conta(db, "cirurgia", "animal_id IS NOT NULL"),
        "comAssinatura": _conta(
            db, "castracao", "assinatura_responsavel IS NOT NULL AND assinatura_responsavel <> ''"
        )
        + _conta(
            db, "cirurgia", "assinatura_responsavel IS NOT NULL AND assinatura_responsavel <> ''"
        ),
        "ultimos": [
            {
                "tipo": tipo,
                "animal": animal or "Não informado",
                "tutor": tutor or "Não informado",
                "bairro": bairro or "Não informado",
                "procedimento": procedimento or "Não informado",
                "data": data.isoformat(timespec="seconds") if isinstance(data, datetime) else None,
            }
            for tipo, animal, tutor, bairro, procedimento, data in ultimos_procedimentos
        ],
    }

    ultimos_30 = {
        chave: int(
            db.execute(
                text(
                    f"SELECT COUNT(*) FROM {tabela} "
                    f"WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
                )
            ).scalar_one()
        )
        for chave, _, tabela in MODULOS
    }

    return {
        "geradoEm": agora().isoformat(timespec="seconds"),
        "totais": totais,
        "totalGeral": total_geral,
        "modulos": modulos,
        "animais": {
            "total": total_animais,
            "porEspecie": por_especie,
            "porSexo": por_sexo,
            "porPorte": por_porte,
            "porTemperamento": por_temperamento,
            "castrados": castrados,
            "vacinados": vacinados,
            "vermifugados": vermifugados,
            "origens": origem,
            "taxaCastracao": _taxa(sim_castrados, total_animais),
            "taxaVacinacao": _taxa(sim_vacinados, total_animais),
            "taxaVermifugacao": _taxa(sim_vermifugados, total_animais),
        },
        "supatas": {
            "total": totais["supatas"],
            "porSituacao": sup_situacao,
            "porEspecie": sup_especie,
            "porSexo": sup_sexo,
        },
        "adocoes": {
            "total": totais["adocoes"],
            "porEspecie": adocao_especie,
            "porSexo": adocao_sexo,
            "porRaca": adocao_raca,
            "porCidade": adocao_cidade,
            "porCorPelo": adocao_cor,
            "castrados": adocao_castrado,
            "vermifugados": adocao_vermifugado,
            "taxaCastracao": _taxa(sim_castrados_adocao, totais["adocoes"]),
            "cidadesDistintas": cidades_distintas,
            "mediaPorMes": round(totais["adocoes"] / meses_com_adocao, 1) if meses_com_adocao else 0.0,
            "perfilAdotante": perfil_adotante,
        },
        "castracoes": castracao_resumo,
        "cirurgias": cirurgia_resumo,
        "procedimentos": procedimentos_resumo,
        "hipossuficiencia": hipossuficiencia_resumo,
        "eutanasia": eutanasia_resumo,
        "ultimos30Dias": ultimos_30,
        "serieMensal": _serie_mensal(db, _meses(6)),
    }
