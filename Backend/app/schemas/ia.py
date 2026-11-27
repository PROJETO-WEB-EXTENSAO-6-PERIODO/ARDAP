"""Formatos de entrada e saida do recurso de IA."""

from typing import Literal

from pydantic import BaseModel

Faixa = Literal["baixa", "media", "alta"]


class FatorOut(BaseModel):
    # idade, castracao, origem, saude, raca ou cor
    fator: str
    # variacao da probabilidade em relacao ao animal de referencia (-1 a 1)
    impacto: float


class PrevisaoOut(BaseModel):
    probabilidade: float
    faixa: Faixa
    previsao_adotado: bool
    threshold: float
    janela_dias: int
    fatores: list[FatorOut]


class PrevisaoAnimalOut(PrevisaoOut):
    animal_id: int
    dias_no_abrigo: int


class SimulacaoIn(BaseModel):
    """Perfil livre para testar o modelo sem cadastrar um animal.

    Os campos sao validados na rota, com mensagens em portugues (RF04).
    """

    especie: str | None = None
    sexo: str | None = None
    castrado: bool = False
    idade_anos: int | None = None
    raca: str | None = None
    cor_pelo: str | None = None
    origem: str | None = None
    condicao: str | None = None
    mes_entrada: int | None = None


class PrioridadeItemOut(BaseModel):
    animal_id: int
    nome: str | None
    especie: str
    raca: str | None
    sexo: str
    idade_estimada: int | None
    tem_foto: bool
    foto_mini_url: str | None = None
    dias_no_abrigo: int
    probabilidade: float
    faixa: Faixa
    # baixa chance e ha mais de 30 dias no abrigo
    atencao: bool
