"""Registro de termos de adocao."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.adocao import Adocao
from app.models.user import User
from app.schemas.adocao import AdocaoIn, AdocaoOut, ContagemOut

router = APIRouter(tags=["adocoes"])


@router.get("/adocoes/contagem", response_model=ContagemOut)
def contar_termos_adocao(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total = db.execute(text("SELECT COUNT(*) FROM termo_adocao")).scalar_one()
    return ContagemOut(total=total)


@router.post(
    "/adocoes",
    response_model=AdocaoOut,
    status_code=status.HTTP_201_CREATED,
)
def create_adocao(
    data: AdocaoIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    adocao = Adocao(
        animal_id=data.animal_id,
        funcionario_id=user.id,
        especie_adocao=data.especie_adocao,
        nome_adotante=data.nome_adotante,
        rg=data.rg,
        cpf=data.cpf,
        endereco_residencial=data.endereco_residencial,
        bairro=data.bairro,
        cidade=data.cidade,
        cep=data.cep,
        telefone=data.telefone,
        instagram=data.instagram,
        nome_animal=data.nome_animal,
        especie=data.especie,
        sexo=data.sexo,
        idade=data.idade,
        raca=data.raca,
        srd=data.srd,
        onde_resgatou_tutor=data.onde_resgatou_tutor,
        cor_pelo=data.cor_pelo,
        porte=data.porte,
        peso=data.peso,
        castrado=data.castrado,
        vermifugado_3meses=data.vermifugado_3meses,
        medicamento_diario=data.medicamento_diario,
        mais_animais_em_casa=data.mais_animais_em_casa,
        quantos_mais_animais=data.quantos_mais_animais,
        endereco_ficara_animal=data.endereco_ficara_animal,
        endereco_ficara_animal_outro=data.endereco_ficara_animal_outro,
        local_na_casa=data.local_na_casa,
        outros_animais=data.outros_animais,
        quantos_animais=data.quantos_animais,
        espaco_casa=data.espaco_casa,
        casa_murada=data.casa_murada,
        espaco_coberto_quintal=data.espaco_coberto_quintal,
        mora_aluguel=data.mora_aluguel,
        proprietario_permite_animais=data.proprietario_permite_animais,
        viajar_quem_cuidara=data.viajar_quem_cuidara,
        familia_sabe_adocao=data.familia_sabe_adocao,
        alguem_alergia=data.alguem_alergia,
        alimentacao=data.alimentacao,
        acesso_rua=data.acesso_rua,
        ciencia_vacinacao=data.ciencia_vacinacao,
        aceite_declaracao=data.aceite_declaracao,
        aceite_termo=data.aceite_termo,
        assinatura_adotante=data.assinatura_adotante,
        assinatura_ardap=data.assinatura_ardap,
        local_assinatura=data.local_assinatura,
        data_assinatura=data.data_assinatura,
    )
    db.add(adocao)
    db.commit()
    db.refresh(adocao)
    return adocao


@router.get("/adocoes", response_model=list[AdocaoOut])
def list_adocoes(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Adocao).order_by(Adocao.id.desc())
    return db.scalars(stmt).all()


@router.get("/adocoes/{adocao_id}", response_model=AdocaoOut)
def get_adocao(
    adocao_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    adocao = db.get(Adocao, adocao_id)
    if adocao is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Termo de adocao nao encontrado.")
    return adocao
