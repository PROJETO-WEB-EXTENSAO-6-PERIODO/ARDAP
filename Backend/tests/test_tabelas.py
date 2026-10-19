"""Testes das 5 tabelas novas - issues #DB0003 a #DB0007.

Garantem que o DDL do schema_min.sql e o modelo SQLAlchemy dizem a MESMA
coisa (uma divergencia so apareceria na hora de gravar dados) e que cada
tabela aceita um registro de ponta a ponta.

Roda com:  cd Backend && pytest -v
"""

import re
from pathlib import Path

from sqlalchemy import inspect, text

from app.core.database import SessionLocal, engine
from app.models import Adocao, Castracao, Cirurgia, Eutanasia, Hipossuficiencia
from app.models.user import User

TABELAS = ["castracao", "adocao", "cirurgia", "hipossuficiencia", "eutanasia"]

# Linhas do DDL que comeam com indentacao de coluna mas nao sao coluna.
NAO_E_COLUNA = {"foreign", "primary", "unique", "constraint", "key", "index"}

SCHEMA_SQL = Path(__file__).resolve().parents[1] / "db" / "schema_min.sql"


def colunas_da_tabela(nome: str) -> dict:
    """Devolve {coluna: tipo_ajustado} direto do banco de teste."""
    with engine.connect() as conn:
        linhas = conn.execute(text(f"SHOW COLUMNS FROM {nome}")).fetchall()
    return {linha[0]: str(linha[1]).lower() for linha in linhas}


def colunas_do_modelo(modelo) -> set:
    return set(inspect(modelo).columns.keys())


# ---------------------------------------------------------------------------
# As 5 tabelas existem
# ---------------------------------------------------------------------------


def test_as_cinco_tabelas_existem():
    existentes = set(inspect(engine).get_table_names())
    faltando = [t for t in TABELAS if t not in existentes]
    assert not faltando, f"Tabelas nao criadas: {faltando}"


# ---------------------------------------------------------------------------
# Modelo e DDL dizem a mesma coisa
# ---------------------------------------------------------------------------


def test_modelo_e_schema_min_sql_estao_em_sintonia():
    """O schema_min.sql e o modelo precisam ter os MESMOS campos.

    Se divergirem, o banco de producao aceitaria uma coluna que o codigo nao
    enxerga (ou o contrario) - o tipo de bug que so aparece em producao.
    """
    with SCHEMA_SQL.open(encoding="utf-8") as f:
        sql = f.read()

    modelos = {
        "castracao": Castracao,
        "adocao": Adocao,
        "cirurgia": Cirurgia,
        "hipossuficiencia": Hipossuficiencia,
        "eutanasia": Eutanasia,
    }

    for tabela, modelo in modelos.items():
        bloco = re.search(
            rf"CREATE TABLE IF NOT EXISTS {tabela}\s*\((.*?)\n\);",
            sql,
            re.S,
        )
        assert bloco, f"tabela {tabela} nao encontrada em schema_min.sql"

        declaradas = {
            coluna
            for coluna in re.findall(r"^\s{4}([a-z_]+)\s", bloco.group(1), re.M)
            if coluna not in NAO_E_COLUNA
        }
        no_modelo = colunas_do_modelo(modelo)

        assert declaradas == no_modelo, (
            f"{tabela}: divergencia\n"
            f"  so no SQL:   {sorted(declaradas - no_modelo)}\n"
            f"  so no modelo:{sorted(no_modelo - declaradas)}"
        )


# ---------------------------------------------------------------------------
# Assinaturas sao LONGTEXT (base64 > 64 KB - RF08)
# ---------------------------------------------------------------------------


def test_colunas_de_assinatura_sao_longtext():
    """Assinatura em base64 ultrapassa 64 KB; TEXT truncaria o dado."""
    esperado = {
        "castracao": ["assinatura_responsavel", "assinatura_ardap"],
        "adocao": ["assinatura_adotante", "assinatura_responsavel_ardap"],
        "cirurgia": ["assinatura_responsavel", "assinatura_ardap"],
        "hipossuficiencia": ["assinatura"],
        "eutanasia": ["assinatura_responsavel", "assinatura_ardap"],
    }

    for tabela, colunas in esperado.items():
        reais = colunas_da_tabela(tabela)
        for coluna in colunas:
            assert "longtext" in reais[coluna], (
                f"{tabela}.{coluna} e {reais[coluna]}, precisa ser longtext"
            )


# ---------------------------------------------------------------------------
# INSERT -> SELECT de ponta a ponta em cada tabela
# ---------------------------------------------------------------------------


def _usuario_id() -> int:
    """Le (ou cria) um usuario - a suite zera `users` antes de CADA teste,
    entao nao da para simplesmente ler o primeiro registro."""
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if user is None:
            user = User(
                first_name="Admin",
                second_name="ARDAP",
                email="admin@ardap.org",
                # a senha nao importa aqui: nada destes testes faz login
                password="nao-importa",
                role="admin",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user.id
    finally:
        db.close()


def _animal_id() -> int:
    from app.models.animal import Animal

    db = SessionLocal()
    try:
        animal = Animal(nome="Thor", especie="cao", sexo="macho")
        db.add(animal)
        db.commit()
        db.refresh(animal)
        return animal.id
    finally:
        db.close()


def _grava_e_ler(sql: str, tabela: str, params: dict) -> dict:
    """Insere e le de volta a MESMA linha, para provar o ciclo completo."""
    db = SessionLocal()
    try:
        db.execute(text(sql), params)
        db.commit()
        linha = db.execute(
            text(f"SELECT * FROM {tabela} ORDER BY id DESC LIMIT 1")
        ).mappings().first()
        return dict(linha) if linha else {}
    finally:
        db.close()


def test_castracao_grava_e_les():
    dados = _grava_e_ler(
        "INSERT INTO castracao (animal_id, funcionario_id, data_castracao,"
        " veterinario, local) VALUES (:a, :f, '2026-10-19', :v, :l)",
        "castracao",
        {"a": _animal_id(), "f": _usuario_id(), "v": "Dra. Ana", "l": "Clinica X"},
    )
    assert dados["veterinario"] == "Dra. Ana"


def test_adocao_grava_e_les():
    dados = _grava_e_ler(
        "INSERT INTO adocao (animal_id, funcionario_id, nome_adotante,"
        " cpf_adotante, autoriza_uso_imagem)"
        " VALUES (:a, :f, :n, :c, 1)",
        "adocao",
        {"a": _animal_id(), "f": _usuario_id(), "n": "Maria Teste",
         "c": "111.222.333-44"},
    )
    assert dados["nome_adotante"] == "Maria Teste"
    assert dados["autoriza_uso_imagem"] in (1, True)


def test_adocao_declara_nome_do_adotante_como_obrigatorio():
    """`nome_adotante` e NOT NULL no DDL - e o campo obrigatorio do formulario.

    ⚠️ Este MariaDB roda em sql_mode NAO estrito (sem STRICT_TRANS_TABLES),
    entao um INSERT direto que ignore a regra insere '' em vez de falhar.
    A protecao efetiva tem de ser na API (Pydantic `min_length=1`) - nao no
    banco. Testamos aqui a DECLARACAO do contrato.
    """
    with engine.connect() as conn:
        nullable = conn.execute(
            text(
                "SELECT IS_NULLABLE FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "  AND TABLE_NAME = 'adocao' "
                "  AND COLUMN_NAME = 'nome_adotante'"
            )
        ).scalar()

    assert nullable == "NO", "nome_adotante deveria ser NOT NULL no DDL"


def test_cirurgia_grava_e_les():
    dados = _grava_e_ler(
        "INSERT INTO cirurgia (animal_id, funcionario_id, tipo_cirurgia,"
        " data_cirurgia) VALUES (:a, :f, 'osteotomia', '2026-10-19')",
        "cirurgia",
        {"a": _animal_id(), "f": _usuario_id()},
    )
    assert dados["tipo_cirurgia"] == "osteotomia"


def test_hipossuficiencia_grava_e_les_com_motivo_valido():
    dados = _grava_e_ler(
        "INSERT INTO hipossuficiencia (funcionario_id, nome_declarante, motivo)"
        " VALUES (:f, :n, 'sem_renda')",
        "hipossuficiencia",
        {"f": _usuario_id(), "n": "Joao Teste"},
    )
    assert dados["motivo"] == "sem_renda"


def test_hipossuficiencia_motivo_e_enum_no_banco():
    """`motivo` e ENUM no DDL, com exatamente os 4 motivos do formulario.

    ⚠️ Este MariaDB roda em sql_mode NAO estrito: um INSERT direto com motivo
    invalido NAO falha - vira '' (string vazia) com so um warning. Ou seja o
    ENUM so protege se o valor vier de quem ja validou. Por isso o schema do
    Pydantic usa Literal[...] para validar na API antes de chegar aqui.
    """
    with engine.connect() as conn:
        tipo = conn.execute(
            text(
                "SELECT COLUMN_TYPE FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() "
                "  AND TABLE_NAME = 'hipossuficiencia' "
                "  AND COLUMN_NAME = 'motivo'"
            )
        ).scalar()

    assert tipo is not None and tipo.lower().startswith("enum("), (
        f"motivo deveria ser ENUM, veio {tipo!r}"
    )
    for motivo in ("sem_trabalho_remunerado", "sem_renda",
                   "renda_ate_limite", "outros"):
        assert motivo in tipo, f"motivo '{motivo}' fora do ENUM"


def test_eutanasia_grava_e_les():
    dados = _grava_e_ler(
        "INSERT INTO eutanasia (animal_id, funcionario_id, data_eutanasia,"
        " motivo) VALUES (:a, :f, '2026-10-19', 'sofrimento irrecuperavel')",
        "eutanasia",
        {"a": _animal_id(), "f": _usuario_id()},
    )
    assert dados["motivo"] == "sofrimento irrecuperavel"


# ---------------------------------------------------------------------------
# Foreign keys: nao existe registro orfao
# ---------------------------------------------------------------------------


def test_fk_impede_registro_com_animal_inexistente():
    import pytest
    from sqlalchemy.exc import IntegrityError

    db = SessionLocal()
    try:
        with pytest.raises(IntegrityError):
            db.execute(
                text(
                    "INSERT INTO castracao (animal_id, funcionario_id)"
                    " VALUES (999999, :f)"
                ),
                {"f": _usuario_id()},
            )
            db.rollback()
    finally:
        db.close()
