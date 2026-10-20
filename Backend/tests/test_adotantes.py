"""Estrutura da tabela `adotantes` (issue #54 - #DB0008).

Cobre as tres garantias desta issue:
  1. a tabela existe e tem as colunas desenhadas na modelagem em draw.io;
  2. o DDL versionado (`db/schema_min.sql`) bate com o que o SQLAlchemy espelha;
  3. a obrigatoriedade declarada e a esperada (`nome` obrigatorio, resto opcional).
"""

import re
from pathlib import Path

from sqlalchemy import inspect

from app.core.database import engine
from app.models.adotante import Adotante

# As 11 colunas da entidade ADOCOES/ADOTANTES no arquivo .drawio, na ordem
# em que aparecem no diagrama.
COLUNAS_DRAWIO = [
    "nome", "rg", "cpf", "endereco", "bairro", "cidade",
    "cep", "telefone", "whatsapp", "instagram", "profissao",
]

# Acrescentados pela convencao das demais tabelas do projeto (o diagrama nao
# desenha `id` em nenhuma das 6 entidades).
COLUNAS_CONVENCAO = ["id", "created_at", "updated_at"]


def _colunas_bd() -> list[str]:
    """Colunas da tabela no banco de teste, na ordem fisica."""
    insp = inspect(engine)
    return [c["name"] for c in insp.get_columns("adotantes")]


def _nullable_bd() -> dict[str, bool]:
    insp = inspect(engine)
    return {c["name"]: c["nullable"] for c in insp.get_columns("adotantes")}


def _ddl_completo() -> str:
    """Retorna o CREATE TABLE adotantes inteiro, do DDL versionado."""
    caminho = Path(__file__).resolve().parents[1] / "db" / "schema_min.sql"
    texto = caminho.read_text(encoding="utf-8")
    m = re.search(
        r"CREATE TABLE IF NOT EXISTS adotantes\s*\((.*?)\);", texto, re.S
    )
    assert m, "schema_min.sql nao contem a tabela adotantes"
    return m.group(0)


def _bloco_colunas() -> str:
    """So o miolo entre parenteses do CREATE TABLE."""
    return _ddl_completo().split("(", 1)[1].rsplit(")", 1)[0]


def _colunas_ddl() -> list[str]:
    """Colunas declaradas no .sql, na ordem."""
    return re.findall(r"^\s{4}(\w+)\s", _bloco_colunas(), re.M)


# ---------------------------------------------------------------- 1. existencia

def test_tabela_registrada_no_modelo():
    """A tabela esta no metadata do SQLAlchemy (Base)."""
    assert "adotantes" in Adotante.__table__.metadata.tables


def test_tabela_criada_no_banco_de_teste():
    """Base.metadata.create_all() criou a tabela."""
    assert "adotantes" in inspect(engine).get_table_names()


# ---------------------------------------------------------------- 2. colunas

def test_todas_as_colunas_do_drawio_existem():
    """As 11 colunas desenhadas no modelo estao presentes."""
    faltando = [c for c in COLUNAS_DRAWIO if c not in _colunas_bd()]
    assert not faltando, f"colunas do draw.io ausentes: {faltando}"


def test_colunas_de_convencao_existem():
    """`id` e os timestamps seguem a convencao das demais tabelas."""
    faltando = [c for c in COLUNAS_CONVENCAO if c not in _colunas_bd()]
    assert not faltando, f"colunas de convencao ausentes: {faltando}"


def test_total_de_colunas():
    """11 do desenho + id + created_at + updated_at = 14."""
    assert len(_colunas_bd()) == 14


def test_ordem_das_colunas():
    """A ordem fisica respeita a ordem do diagrama, com `id` primeiro."""
    esperado = ["id"] + COLUNAS_DRAWIO + ["created_at", "updated_at"]
    assert _colunas_bd() == esperado


def test_nao_ha_coluna_fora_do_escopo():
    """Nenhuma coluna alem das 14 previstas (escopo delimitado)."""
    esperado = set(["id"] + COLUNAS_DRAWIO + ["created_at", "updated_at"])
    assert set(_colunas_bd()) == esperado


# ------------------------------------------------------- 3. obrigatoriedade

def test_nome_e_obrigatorio():
    """`nome` e o unico campo NOT NULL (decisao documentada na issue)."""
    nul = _nullable_bd()
    assert nul["nome"] is False, "nome deveria ser NOT NULL"


def test_demais_campos_sao_opcionais():
    """A modelagem nao define obrigatoriedade: os outros ficam opcionais."""
    nul = _nullable_bd()
    opcionais = [c for c in COLUNAS_DRAWIO if c != "nome"]
    for c in opcionais:
        assert nul[c] is True, f"{c} deveria ser anulavel"


def test_id_e_primary_key():
    """`id` e chave primaria (base da futura FK de adocao/hipossuficiencia)."""
    pk = inspect(engine).get_pk_constraint("adotantes")
    assert pk["constrained_columns"] == ["id"]


def test_tabela_nao_tem_foreign_key_ainda():
    """Sem FK nesta issue: a ligacao com adocao/hipossuficiencia vem depois."""
    fk = inspect(engine).get_foreign_keys("adotantes")
    assert fk == [], f"FK inesperada em adotantes: {fk}"


# ------------------------------------------------------- 4. DDL versionado

def test_ddl_contem_a_tabela():
    assert "CREATE TABLE IF NOT EXISTS adotantes" in _ddl_completo()


def test_ddl_bate_com_o_modelo():
    """As colunas declaradas no .sql sao exatamente as do SQLAlchemy."""
    assert _colunas_ddl() == _colunas_bd()


def test_ddl_declara_nome_not_null():
    linha = next(
        l for l in _bloco_colunas().splitlines() if l.strip().startswith("nome")
    )
    assert "NOT NULL" in linha, f"'nome' nao declarado NOT NULL: {linha!r}"


def test_ddl_declara_id_auto_increment():
    linha = next(
        l for l in _bloco_colunas().splitlines() if l.strip().startswith("id ")
    )
    assert "AUTO_INCREMENT" in linha and "PRIMARY KEY" in linha, linha


# ------------------------------------------------------- 5. comportamento

def test_insere_e_le_registro_completo(client):
    """Roundtrip com todas as 11 colunas do draw.io."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        dados = dict(
            nome="Maria da Silva",
            rg="12.345.678-9",
            cpf="123.456.789-00",
            endereco="Rua das Flores, 100",
            bairro="Centro",
            cidade="Rio de Janeiro",
            cep="20000-000",
            telefone="(21) 99999-0000",
            whatsapp="(21) 99999-0000",
            instagram="@mariasilva",
            profissao="Professora",
        )
        adotante = Adotante(**dados)
        db.add(adotante)
        db.commit()
        db.refresh(adotante)

        assert adotante.id is not None
        assert adotante.created_at is not None
        for campo, valor in dados.items():
            assert getattr(adotante, campo) == valor, campo

        lido = db.get(Adotante, adotante.id)
        assert lido is not None
        assert lido.nome == "Maria da Silva"
    finally:
        db.close()


def test_insere_apenas_com_nome():
    """Todos os outros campos sao opcionais, como no modelo."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        adotante = Adotante(nome="Apenas Nome")
        db.add(adotante)
        db.commit()
        db.refresh(adotante)

        assert adotante.rg is None
        assert adotante.cpf is None
        assert adotante.profissao is None
    finally:
        db.close()


def test_id_incrementa():
    """Dois adotantes ganham ids diferentes (auto_increment)."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        a = Adotante(nome="Primeiro")
        b = Adotante(nome="Segundo")
        db.add_all([a, b])
        db.commit()
        db.refresh(a)
        db.refresh(b)
        assert a.id != b.id
        assert b.id == a.id + 1
    finally:
        db.close()


def test_listagem_vazia_no_inicio(cria_usuario):
    """Fixture `estado_zerado` garante base limpa (sanidade da suite)."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        assert db.query(Adotante).count() == 0
    finally:
        db.close()
