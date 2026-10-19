"""Tabela adocao (issue #DB0004) - Questionario + Termo de Adocao Responsavel.

Campos extraidos do formulario de papel descrito no documento de contexto:

  - dados do adotante (nome, RG, CPF, endereco, contato, profissao)
  - situacionais da avaliacao (outros animais, espaco, aluguel, familia...)
  - autorizacao de uso de imagem
  - assinatura do adotante + assinatura do responsavel ARDAP

NAO duplica dados de saude do animal (castrado, vacinado, peso, porte...):
esses ficam so em `animais`, porque sao o estado atual do animal - decisao
explicita de modelagem do projeto.

⚠️ DADOS DO ADOTANTE ESTAO INLINE. O modelo original do contexto previa uma
tabela `adotantes` separada ligada 1:N a `adocoes`; a issue #36 pede apenas a
tabela `adocao`, e o formulario de papel traz os dados do adotante na mesma
folha. Se a modelagem do draw.io trouxer `adotantes`, precisa haver migracao.
"""

from datetime import date
from datetime import datetime as DateTime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class Adocao(Base):
    __tablename__ = "adocao"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    animal_id: Mapped[int] = mapped_column(ForeignKey("animais.id"))
    funcionario_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    data_adocao: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- dados do adotante -------------------------------------------------
    nome_adotante: Mapped[str] = mapped_column(String(150))
    rg_adotante: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cpf_adotante: Mapped[str | None] = mapped_column(String(20), nullable=True)
    endereco_rua: Mapped[str | None] = mapped_column(String(200), nullable=True)
    endereco_bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    endereco_cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    endereco_cep: Mapped[str | None] = mapped_column(String(10), nullable=True)
    contato_telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contato_instagram: Mapped[str | None] = mapped_column(String(100), nullable=True)
    profissao: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- situacionais do questionario --------------------------------------
    tem_outros_animais: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    qtd_outros_animais: Mapped[int | None] = mapped_column(Integer, nullable=True)
    espaco_adequado: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    casa_murada: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    espaco_coberto_quintal: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    mora_de_aluguel: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    aluguel_permite_animais: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    quem_fica_se_viajar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    familia_sabe: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    alergia_alguem: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    alimentacao_oferecida: Mapped[str | None] = mapped_column(String(255), nullable=True)
    acesso_a_rua: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    ciencia_vacinacao_periodica: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    autoriza_uso_imagem: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # --- assinaturas -------------------------------------------------------
    # base64 de assinatura passa de 64 KB -> LONGTEXT, nao TEXT
    assinatura_adotante: Mapped[str | None] = mapped_column(
        Text().with_variant(LONGTEXT(), "mysql"), nullable=True
    )
    assinatura_responsavel_ardap: Mapped[str | None] = mapped_column(
        Text().with_variant(LONGTEXT(), "mysql"), nullable=True
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
