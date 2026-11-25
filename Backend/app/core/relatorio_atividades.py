"""Relatorio de atividades (prestacao de contas) de um periodo.

So produz totais: nenhum nome, documento, contato ou endereco.
"""

from calendar import monthrange
from collections import Counter
from dataclasses import dataclass, field
from datetime import date, timedelta
from io import BytesIO
from typing import Literal

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.horario import agora

# Bairros e cidades com menos registros sao somados, para nao identificar ninguem.
MINIMO_LOCAL = 3
SEM_INFORMACAO = "Não informado"
LIMITE_LINHAS = 10

ROTULOS = {
    "cao": "Cão", "cão": "Cão", "canino": "Cão",
    "gato": "Gato", "felino": "Gato",
    "outro": "Outro", "outros": "Outros",
    "macho": "Macho", "femea": "Fêmea",
    "pequeno": "Pequeno", "medio": "Médio", "grande": "Grande",
    "docil": "Dócil", "medroso": "Medroso", "arisco": "Arisco",
    "agressivo": "Agressivo", "desconhecido": "Desconhecido",
    "acidentado": "Acidentado", "doente": "Doente", "castracao": "Castração",
}

Chave = Literal[
    "animais", "supatas", "adocoes", "castracoes", "cirurgias",
    "eutanasias", "hipossuficiencias",
]


@dataclass(frozen=True)
class Tabela:
    titulo: str
    coluna: str = ""
    local: bool = False
    # rotulo -> condicao: um registro pode contar em varias linhas
    condicoes: dict[str, str] | None = None


@dataclass(frozen=True)
class Modulo:
    titulo: str
    tabela: str
    # data do termo; sem ela, vale a do cadastro
    data: str
    tabelas: list[Tabela] = field(default_factory=list)
    bairro: bool = False
    juncao: str = ""


ESPECIE = Tabela("Espécie", "t.especie")
SEXO = Tabela("Sexo", "t.sexo")
_PROCEDIMENTO = [ESPECIE, SEXO, Tabela("Procedimento", "t.procedimento")]

# Nomes de tabelas e colunas sao constantes: nada aqui vem do usuario.
MODULOS: dict[str, Modulo] = {
    "animais": Modulo(
        "Animais cadastrados", "animais", "DATE(t.created_at)",
        [
            ESPECIE,
            SEXO,
            Tabela("Porte", "t.porte"),
            Tabela("Temperamento", "t.temperamento"),
            Tabela("Saúde no cadastro", condicoes={
                "Castrados": "t.castrado = 1",
                "Vacinados": "t.vacinado = 1",
                "Vermifugados": "t.vermifugado = 1",
                "Com medicação": "t.medicacao_necessaria = 1",
            }),
        ],
    ),
    "supatas": Modulo(
        "Resgates SUPATAS", "supatas_intake",
        "COALESCE(t.data_encaminhamento, DATE(t.created_at))",
        [
            Tabela("Situação do animal", "t.situacao_animal"),
            ESPECIE,
            SEXO,
            Tabela("Órgão solicitante", "t.orgao_solicitante"),
        ],
    ),
    "adocoes": Modulo(
        "Adoções", "termo_adocao",
        "COALESCE(t.data_assinatura, DATE(t.created_at))",
        [
            Tabela("Espécie", "a.especie"),
            Tabela("Sexo", "a.sexo"),
            Tabela("Porte", "a.porte"),
            Tabela("Cidade", "t.cidade", local=True),
            Tabela("Perfil dos lares", condicoes={
                "Casa murada": "t.casa_murada = 1",
                "Quintal coberto": "t.espaco_coberto_quintal = 1",
                "Já tem outros animais":
                    "t.outros_animais = 1 OR t.mais_animais_em_casa = 1",
                "Mora de aluguel": "t.mora_aluguel = 1",
                "Família ciente da adoção": "t.familia_sabe_adocao = 1",
            }),
        ],
        bairro=True,
        juncao="LEFT JOIN animais a ON a.id = t.animal_id",
    ),
    "castracoes": Modulo(
        "Castrações", "castracao",
        "COALESCE(t.data_assinatura, DATE(t.created_at))",
        _PROCEDIMENTO, bairro=True,
    ),
    "cirurgias": Modulo(
        "Cirurgias", "cirurgia",
        "COALESCE(t.data_assinatura, DATE(t.created_at))",
        _PROCEDIMENTO, bairro=True,
    ),
    "eutanasias": Modulo(
        "Eutanásias", "eutanasia",
        "COALESCE(t.data_declaracao, DATE(t.created_at))",
        [ESPECIE, SEXO], bairro=True,
    ),
    "hipossuficiencias": Modulo(
        "Declarações de hipossuficiência", "hipossuficiencia",
        "COALESCE(t.data_declaracao, DATE(t.created_at))",
        [
            Tabela("Motivos declarados", condicoes={
                "Sem trabalho remunerado": "t.nao_possui_trabalho_remunerado = 1",
                "Sem renda": "t.nao_possui_renda = 1",
                "Renda até meio salário per capita":
                    "t.renda_ate_meio_salario_per_capita = 1",
            }),
        ],
    ),
}


def periodo_anterior(inicio: date, fim: date) -> tuple[date, date]:
    """Meses inteiros comparam com meses inteiros; o resto, com os mesmos dias."""
    ultimo_dia = monthrange(fim.year, fim.month)[1]
    if inicio.day == 1 and fim.day == ultimo_dia:
        meses = (fim.year - inicio.year) * 12 + fim.month - inicio.month + 1
        total = inicio.year * 12 + inicio.month - 1 - meses
        return date(total // 12, total % 12 + 1, 1), inicio - timedelta(days=1)
    dias = (fim - inicio).days + 1
    return inicio - timedelta(days=dias), inicio - timedelta(days=1)


def _contar(db: Session, modulo: Modulo, expressao: str, inicio: date, fim: date):
    return db.execute(
        text(
            f"SELECT {expressao} AS valor, COUNT(*) FROM {modulo.tabela} t "
            f"{modulo.juncao} WHERE {modulo.data} BETWEEN :inicio AND :fim "
            "GROUP BY valor"
        ),
        {"inicio": inicio, "fim": fim},
    ).all()


def _total(db: Session, modulo: Modulo, inicio: date, fim: date) -> int:
    # sem a juncao: a contagem e so do proprio modulo
    return int(db.execute(
        text(
            f"SELECT COUNT(*) FROM {modulo.tabela} t "
            f"WHERE {modulo.data} BETWEEN :inicio AND :fim"
        ),
        {"inicio": inicio, "fim": fim},
    ).scalar_one())


def _condicoes(
    db: Session, modulo: Modulo, condicoes: dict[str, str], inicio: date, fim: date
) -> list[dict]:
    somas = ", ".join(
        f"COALESCE(SUM(CASE WHEN {c} THEN 1 ELSE 0 END), 0)"
        for c in condicoes.values()
    )
    valores = db.execute(
        text(
            f"SELECT {somas} FROM {modulo.tabela} t "
            f"WHERE {modulo.data} BETWEEN :inicio AND :fim"
        ),
        {"inicio": inicio, "fim": fim},
    ).one()
    return [
        {"rotulo": rotulo, "total": int(valor)}
        for rotulo, valor in zip(condicoes, valores)
    ]


def _situacao(db: Session) -> dict:
    """Retrato de hoje, seja qual for o periodo do relatorio."""
    linha = db.execute(text(
        "SELECT COUNT(*), "
        "COALESCE(SUM(a.castrado = 1), 0), COALESCE(SUM(a.vacinado = 1), 0), "
        "COALESCE(SUM(a.vermifugado = 1), 0), "
        "COALESCE(SUM(a.medicacao_necessaria = 1), 0), "
        "COALESCE(SUM(a.especie = 'cao'), 0), COALESCE(SUM(a.especie = 'gato'), 0) "
        "FROM animais a "
        "WHERE NOT EXISTS (SELECT 1 FROM termo_adocao t WHERE t.animal_id = a.id) "
        "AND NOT EXISTS (SELECT 1 FROM eutanasia e WHERE e.animal_id = a.id)"
    )).one()
    total, castrados, vacinados, vermifugados, medicacao, caes, gatos = map(int, linha)
    return {
        "data": agora().date().isoformat(),
        "total": total,
        "caes": caes,
        "gatos": gatos,
        "outros": total - caes - gatos,
        "castrados": castrados,
        "vacinados": vacinados,
        "vermifugados": vermifugados,
        "medicacao": medicacao,
    }


def _agrupar(linhas) -> Counter:
    """Junta grafias que so diferem em maiusculas e espacos."""
    grafias: dict[str, Counter] = {}
    for valor, total in linhas:
        limpo = " ".join(str(valor).split()) if valor is not None else ""
        chave = limpo.casefold()
        rotulo = ROTULOS.get(chave, limpo) or SEM_INFORMACAO
        grafias.setdefault(rotulo.casefold(), Counter())[rotulo] += int(total)
    # fica a grafia mais usada
    return Counter({c.most_common(1)[0][0]: c.total() for c in grafias.values()})


def _ordenar(contagem: Counter, resto: str) -> list[dict]:
    """Maiores primeiro; o que passa do limite e somado; sem informacao no fim."""
    informados = [(k, v) for k, v in contagem.items() if k != SEM_INFORMACAO]
    informados.sort(key=lambda item: (-item[1], item[0].casefold()))
    linhas = informados[:LIMITE_LINHAS]
    sobra = sum(v for _, v in informados[LIMITE_LINHAS:])
    if sobra:
        linhas.append((resto, sobra))
    if contagem[SEM_INFORMACAO]:
        linhas.append((SEM_INFORMACAO, contagem[SEM_INFORMACAO]))
    return [{"rotulo": k, "total": v} for k, v in linhas]


def _proteger(contagem: Counter, resto: str) -> Counter:
    protegida: Counter = Counter()
    for rotulo, total in contagem.items():
        pequeno = total < MINIMO_LOCAL and rotulo != SEM_INFORMACAO
        protegida[resto if pequeno else rotulo] += total
    return protegida


def _linhas(tabela: Tabela, linhas) -> list[dict]:
    contagem = _agrupar(linhas)
    resto = "Outras cidades" if tabela.local else "Demais"
    if tabela.local:
        contagem = _proteger(contagem, resto)
        menores = contagem.pop(resto, 0)
        resultado = _ordenar(contagem, resto)
        if menores:
            existente = next((x for x in resultado if x["rotulo"] == resto), None)
            if existente:
                existente["total"] += menores
            else:
                fim = resultado and resultado[-1]["rotulo"] == SEM_INFORMACAO
                resultado.insert(
                    len(resultado) - 1 if fim else len(resultado),
                    {"rotulo": resto, "total": menores},
                )
        return resultado
    return _ordenar(contagem, resto)


def _bairros(db: Session, chaves: list[str], inicio: date, fim: date) -> dict | None:
    colunas = [c for c in chaves if MODULOS[c].bairro]
    if not colunas:
        return None
    # agrupa todos juntos, para a grafia do bairro ser a mesma entre modulos
    brutas = {c: _contar(db, MODULOS[c], "t.bairro", inicio, fim) for c in colunas}
    nomes = _agrupar([linha for linhas in brutas.values() for linha in linhas])
    if not nomes:
        return None
    grafia = {n.casefold(): n for n in nomes}
    grupos: dict[str, Counter] = {}
    for chave, linhas in brutas.items():
        for rotulo, total in _agrupar(linhas).items():
            grupos.setdefault(grafia[rotulo.casefold()], Counter())[chave] += total
    resto, sem_info = Counter(), grupos.pop(SEM_INFORMACAO, Counter())
    visiveis = []
    for nome, contagem in grupos.items():
        if contagem.total() < MINIMO_LOCAL:
            resto += contagem
        else:
            visiveis.append((nome, contagem))
    visiveis.sort(key=lambda item: (-item[1].total(), item[0].casefold()))
    if resto:
        visiveis.append(("Outros bairros", resto))
    if sem_info:
        visiveis.append((SEM_INFORMACAO, sem_info))
    return {
        "colunas": [{"chave": c, "titulo": MODULOS[c].titulo} for c in colunas],
        "linhas": [
            {
                "rotulo": nome,
                "valores": [contagem[c] for c in colunas],
                "total": contagem.total(),
            }
            for nome, contagem in visiveis
        ],
    }


def _evolucao(db: Session, chaves: list[str], inicio: date, fim: date) -> list[dict]:
    meses = []
    ano, mes = inicio.year, inicio.month
    while (ano, mes) <= (fim.year, fim.month):
        meses.append(f"{ano:04d}-{mes:02d}")
        ano, mes = (ano + 1, 1) if mes == 12 else (ano, mes + 1)
    if len(meses) < 2:
        return []
    series = {
        c: {
            str(valor): int(total)
            for valor, total in _contar(
                db, MODULOS[c], f"DATE_FORMAT({MODULOS[c].data}, '%Y-%m')",
                inicio, fim,
            )
        }
        for c in chaves
    }
    # meses que ainda nao chegaram baixariam a media
    atual = agora().strftime("%Y-%m")
    while meses and meses[-1] > atual and not any(meses[-1] in s for s in series.values()):
        meses.pop()
    if len(meses) < 2:
        return []
    return [
        {"mes": m, "valores": [series[c].get(m, 0) for c in chaves]} for m in meses
    ]


def gerar(
    db: Session, inicio: date, fim: date, escolhidos: list[str], emitido_por: str
) -> dict:
    # sempre na mesma ordem, sem repetir
    chaves = [c for c in MODULOS if c in escolhidos]
    anterior_inicio, anterior_fim = periodo_anterior(inicio, fim)
    modulos = []
    for chave in chaves:
        modulo = MODULOS[chave]
        modulos.append({
            "chave": chave,
            "titulo": modulo.titulo,
            "total": _total(db, modulo, inicio, fim),
            "anterior": _total(db, modulo, anterior_inicio, anterior_fim),
            "tabelas": [
                {
                    "titulo": t.titulo,
                    "multipla": t.condicoes is not None,
                    "linhas": (
                        _condicoes(db, modulo, t.condicoes, inicio, fim)
                        if t.condicoes
                        else _linhas(
                            t, _contar(db, modulo, t.coluna, inicio, fim)
                        )
                    ),
                }
                for t in modulo.tabelas
            ],
        })
    return {
        "inicio": inicio.isoformat(),
        "fim": fim.isoformat(),
        "anterior": {
            "inicio": anterior_inicio.isoformat(),
            "fim": anterior_fim.isoformat(),
        },
        "gerado_em": agora().isoformat(timespec="seconds"),
        "emitido_por": emitido_por,
        "modulos": modulos,
        "situacao": _situacao(db) if "animais" in chaves else None,
        "evolucao": _evolucao(db, chaves, inicio, fim),
        "bairros": _bairros(db, chaves, inicio, fim),
    }


def _data(iso: str) -> str:
    return "/".join(reversed(iso[:10].split("-")))


def planilha(relatorio: dict) -> bytes:
    livro = Workbook()
    negrito = Font(bold=True)
    amarelo = PatternFill("solid", fgColor="FFD900")

    def escrever(aba, valores, cabecalho=False):
        linha = 1 if aba.max_row == 1 and aba["A1"].value is None else aba.max_row + 1
        for coluna, valor in enumerate(valores, start=1):
            celula = aba.cell(linha, coluna, valor)
            if isinstance(valor, str):
                # texto digitado por usuarios nunca vira formula
                celula.data_type = "s"
            if cabecalho:
                celula.font, celula.fill = negrito, amarelo

    def ajustar(aba):
        for coluna in aba.columns:
            maior = max(len(str(c.value or "")) for c in coluna)
            aba.column_dimensions[coluna[0].column_letter].width = min(maior + 3, 50)

    resumo = livro.active
    resumo.title = "Resumo"
    escrever(resumo, ["ARDAP - Relatório de atividades"])
    resumo["A1"].font = Font(bold=True, size=14)
    escrever(resumo, [f"Período: {_data(relatorio['inicio'])} a {_data(relatorio['fim'])}"])
    escrever(resumo, [
        f"Período anterior: {_data(relatorio['anterior']['inicio'])} a "
        f"{_data(relatorio['anterior']['fim'])}"
    ])
    escrever(resumo, [
        f"Emitido em {_data(relatorio['gerado_em'])} por {relatorio['emitido_por']}"
    ])
    escrever(resumo, [" "])
    escrever(resumo, ["Atividade", "Período", "Anterior", "Variação"], True)
    for m in relatorio["modulos"]:
        escrever(resumo, [m["titulo"], m["total"], m["anterior"], m["total"] - m["anterior"]])
    if relatorio["situacao"]:
        s = relatorio["situacao"]
        escrever(resumo, [" "])
        escrever(resumo, [f"Animais sem adoção ou eutanásia em {_data(s['data'])}", "Total"], True)
        for rotulo, chave in (
            ("Total", "total"), ("Cães", "caes"), ("Gatos", "gatos"),
            ("Outros", "outros"), ("Castrados", "castrados"),
            ("Vacinados", "vacinados"), ("Vermifugados", "vermifugados"),
            ("Com medicação", "medicacao"),
        ):
            escrever(resumo, [rotulo, s[chave]])
    ajustar(resumo)
    resumo.column_dimensions["A"].width = 48

    titulos = [m["titulo"] for m in relatorio["modulos"]]
    if relatorio["evolucao"]:
        aba = livro.create_sheet("Evolução mensal")
        escrever(aba, ["Mês", *titulos], True)
        for linha in relatorio["evolucao"]:
            ano, mes = linha["mes"].split("-")
            escrever(aba, [f"{mes}/{ano}", *linha["valores"]])
        ajustar(aba)
    for m in relatorio["modulos"]:
        if not m["tabelas"]:
            continue
        # o Excel limita o nome da aba a 31 caracteres
        aba = livro.create_sheet(m["titulo"][:31])
        for indice, tabela in enumerate(m["tabelas"]):
            if indice:
                escrever(aba, [" "])
            escrever(aba, [tabela["titulo"], "Total", "%"], True)
            for linha in tabela["linhas"]:
                parte = linha["total"] / m["total"] if m["total"] else 0
                escrever(aba, [linha["rotulo"], linha["total"], parte])
                aba.cell(aba.max_row, 3).number_format = "0%"
        ajustar(aba)
    if relatorio["bairros"]:
        aba = livro.create_sheet("Bairros")
        colunas = [c["titulo"] for c in relatorio["bairros"]["colunas"]]
        escrever(aba, ["Bairro", *colunas, "Total"], True)
        for linha in relatorio["bairros"]["linhas"]:
            escrever(aba, [linha["rotulo"], *linha["valores"], linha["total"]])
        ajustar(aba)

    saida = BytesIO()
    livro.save(saida)
    return saida.getvalue()
