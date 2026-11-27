"""Recurso de IA: chance de adocao em ate 30 dias.

- POST /ia/adocao/{animal_id}: previsao de um animal cadastrado (cartao no perfil)
- POST /ia/adocao/simular: previsao de um perfil digitado (pagina "Sobre o modelo")
- GET  /ia/prioridade: animais disponiveis ordenados pela chance (divulgacao)
- GET  /ia/modelo: metricas e dados do treino (pagina "Sobre o modelo")

O modelo e treinado em ai-model/ e carregado por app/ia/modelo.py.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.animal_vinculo import animal_adotado, animal_eutanasiado
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.horario import agora
from app.ia import modelo, traducao
from app.models.animal import Animal
from app.models.intake import SupatasIntake
from app.models.user import User
from app.schemas.ia import (
    PrevisaoAnimalOut,
    PrevisaoOut,
    PrioridadeItemOut,
    SimulacaoIn,
)

router = APIRouter(prefix="/ia", tags=["ia"])

# dias no abrigo a partir dos quais um animal de baixa chance pede atencao
DIAS_ATENCAO = 30

ORIGENS_SIMULACAO = {
    "rua": "Resgatado na rua",
    "tutor": "Entregue pelo tutor",
    "abandono": "Abandonado",
}
CONDICOES_SIMULACAO = {
    "saudavel": (None, False),
    "acidentado": ("acidentado", False),
    "doente": ("doente", False),
    "em_tratamento": (None, True),
}


def _modelo_indisponivel(erro: modelo.ModeloIndisponivel) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="O modelo de IA não está disponível no momento. "
        "Avise o administrador do sistema.",
    )


def _ultimo_supatas(db: Session, ids: list[int]) -> dict[int, SupatasIntake]:
    """Registro SUPATAS mais recente de cada animal."""
    if not ids:
        return {}
    registros = db.scalars(
        select(SupatasIntake)
        .where(SupatasIntake.animal_id.in_(ids))
        .order_by(SupatasIntake.id)
    ).all()
    # o ultimo da lista ordenada sobrescreve os anteriores
    return {r.animal_id: r for r in registros}


def _data_entrada(animal: Animal, supatas: SupatasIntake | None) -> date:
    if supatas is not None and supatas.data_recebimento is not None:
        return supatas.data_recebimento
    if animal.created_at is not None:
        return animal.created_at.date()
    return agora().date()


def _entrada(animal: Animal, supatas: SupatasIntake | None) -> traducao.EntradaAnimal:
    return traducao.EntradaAnimal(
        especie=animal.especie,
        sexo=animal.sexo,
        castrado=bool(animal.castrado),
        idade_anos=animal.idade_estimada,
        raca=animal.raca,
        cor_pelo=animal.cor_pelo,
        origem_resgate=animal.origem_resgate,
        medicacao_necessaria=bool(animal.medicacao_necessaria),
        situacao_supatas=supatas.situacao_animal if supatas else None,
        veio_do_supatas=supatas is not None,
        data_entrada=_data_entrada(animal, supatas),
    )


def _dias_no_abrigo(entrada: traducao.EntradaAnimal) -> int:
    return max(0, (agora().date() - entrada.data_entrada).days)


@router.post("/adocao/simular", response_model=PrevisaoOut)
def simular(
    dados: SimulacaoIn,
    user: User = Depends(get_current_user),
):
    erros: list[str] = []
    if dados.especie not in ("cao", "gato", "outro"):
        erros.append("Escolha a espécie.")
    if dados.sexo not in ("macho", "femea"):
        erros.append("Escolha o sexo.")
    if dados.idade_anos is None:
        erros.append("Informe a idade estimada.")
    elif not 0 <= dados.idade_anos <= 30:
        erros.append("A idade deve estar entre 0 e 30 anos.")
    if dados.origem not in ORIGENS_SIMULACAO:
        erros.append("Escolha a origem do animal.")
    if dados.condicao not in CONDICOES_SIMULACAO:
        erros.append("Escolha a condição de saúde.")
    if dados.mes_entrada is not None and not 1 <= dados.mes_entrada <= 12:
        erros.append("O mês de entrada deve estar entre 1 e 12.")
    if dados.raca and len(dados.raca) > 100:
        erros.append("A raça deve ter no máximo 100 caracteres.")
    if dados.cor_pelo and len(dados.cor_pelo) > 100:
        erros.append("A cor deve ter no máximo 100 caracteres.")
    if erros:
        raise HTTPException(
            status_code=422, detail=" ".join(erros)
        )

    situacao, medicacao = CONDICOES_SIMULACAO[dados.condicao]
    hoje = agora().date()
    entrada = traducao.EntradaAnimal(
        especie=dados.especie,
        sexo=dados.sexo,
        castrado=dados.castrado,
        idade_anos=dados.idade_anos,
        raca=dados.raca,
        cor_pelo=dados.cor_pelo,
        origem_resgate=ORIGENS_SIMULACAO[dados.origem],
        medicacao_necessaria=medicacao,
        situacao_supatas=situacao,
        veio_do_supatas=False,
        data_entrada=hoje.replace(month=dados.mes_entrada or hoje.month, day=1),
    )
    try:
        return modelo.explicar(traducao.features(entrada))
    except modelo.ModeloIndisponivel as erro:
        raise _modelo_indisponivel(erro) from erro


@router.post("/adocao/{animal_id}", response_model=PrevisaoAnimalOut)
def prever_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Animal não encontrado.")
    if db.scalar(select(Animal.id).where(Animal.id == animal_id, animal_eutanasiado())):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Este animal passou por eutanásia; não há previsão de adoção.",
        )
    if db.scalar(select(Animal.id).where(Animal.id == animal_id, animal_adotado())):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Este animal já foi adotado; a previsão não se aplica.",
        )

    entrada = _entrada(animal, _ultimo_supatas(db, [animal_id]).get(animal_id))
    try:
        previsao = modelo.explicar(traducao.features(entrada))
    except modelo.ModeloIndisponivel as erro:
        raise _modelo_indisponivel(erro) from erro
    return {
        **previsao,
        "animal_id": animal_id,
        "dias_no_abrigo": _dias_no_abrigo(entrada),
    }


@router.get("/prioridade", response_model=list[PrioridadeItemOut])
def prioridade(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Animais disponiveis, da menor para a maior chance de adocao.

    Quem tem menos chance precisa de mais divulgacao, por isso vem primeiro.
    """
    animais = db.scalars(
        select(Animal).where(~animal_adotado(), ~animal_eutanasiado())
    ).all()
    supatas = _ultimo_supatas(db, [a.id for a in animais])
    entradas = [_entrada(a, supatas.get(a.id)) for a in animais]
    try:
        probabilidades = modelo.prever_varios([traducao.features(e) for e in entradas])
    except modelo.ModeloIndisponivel as erro:
        raise _modelo_indisponivel(erro) from erro

    itens = []
    for animal, entrada, prob in zip(animais, entradas, probabilidades):
        dias = _dias_no_abrigo(entrada)
        faixa = modelo.faixa(prob)
        itens.append(
            PrioridadeItemOut(
                animal_id=animal.id,
                nome=animal.nome,
                especie=animal.especie,
                raca=animal.raca,
                sexo=animal.sexo,
                idade_estimada=animal.idade_estimada,
                tem_foto=animal.foto_path is not None,
                dias_no_abrigo=dias,
                probabilidade=round(prob, 4),
                faixa=faixa,
                atencao=faixa == "baixa" and dias > DIAS_ATENCAO,
            )
        )
    itens.sort(key=lambda i: (i.probabilidade, -i.dias_no_abrigo))
    return itens


@router.get("/modelo")
def sobre_o_modelo(user: User = Depends(get_current_user)):
    try:
        return modelo.resumo()
    except modelo.ModeloIndisponivel as erro:
        raise _modelo_indisponivel(erro) from erro
