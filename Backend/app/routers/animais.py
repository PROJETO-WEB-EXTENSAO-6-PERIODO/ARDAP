"""Cadastro e listagem de animais (RF03 + RF10 parcial).

POST cria apenas o cadastro do animal. Registros de entrada via SUPATAS
devem ser feitos pelo endpoint dedicado /supatas.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core import armazenamento
from app.core.animal_vinculo import (
    animal_adotado,
    animal_com_termo_castracao,
    animal_eutanasiado,
)
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.exclusao import excluir_animal
from app.models.animal import Animal
from app.models.user import User
from app.schemas.animal import AnimalIn, AnimalOut, AnimalUpdateIn
from app.schemas.user import AutorOut

router = APIRouter(tags=["animais"])


def _salvar_foto(foto: bytes) -> str:
    """Valida e grava a foto; devolve a chave do arquivo."""
    if len(foto) > armazenamento.MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="A foto deve ter no máximo 5 MB.",
        )
    extensao = armazenamento.identificar(foto)
    if extensao not in armazenamento.IMAGENS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="A foto deve ser JPG, PNG ou WebP.",
        )
    return armazenamento.salvar("animais", foto, extensao)


def _to_out(a: Animal) -> AnimalOut:
    return AnimalOut(
        id=a.id, nome=a.nome, especie=a.especie, raca=a.raca, sexo=a.sexo,
        idade_estimada=a.idade_estimada,
        porte=a.porte, cor_pelo=a.cor_pelo, peso=a.peso,
        castrado=bool(a.castrado), vermifugado=bool(a.vermifugado),
        vacinado=bool(a.vacinado), temperamento=a.temperamento,
        medicacao_necessaria=bool(a.medicacao_necessaria),
        medicacao_desc=a.medicacao_desc, origem_resgate=a.origem_resgate,
        observacoes=a.observacoes, tem_foto=a.foto_path is not None,
        created_at=a.created_at,
        funcionario=(
            AutorOut.model_validate(a.funcionario) if a.funcionario else None
        ),
        alterado_por=(
            AutorOut.model_validate(a.alterado_por) if a.alterado_por else None
        ),
        updated_at=a.updated_at,
    )


@router.post("/animais", response_model=AnimalOut,
             status_code=status.HTTP_201_CREATED)
def create_animal(
    data: AnimalIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    foto_path = _salvar_foto(data.foto)
    animal = Animal(
        nome=data.nome or None,
        especie=data.especie,
        raca=data.raca,
        sexo=data.sexo,
        idade_estimada=data.idade_estimada,
        porte=data.porte,
        cor_pelo=data.cor_pelo,
        peso=data.peso,
        castrado=data.castrado,
        vermifugado=data.vermifugado,
        vacinado=data.vacinado,
        temperamento=data.temperamento or "desconhecido",
        medicacao_necessaria=data.medicacao_necessaria,
        medicacao_desc=data.medicacao_desc,
        origem_resgate=data.origem_resgate,
        observacoes=data.observacoes,
        foto_path=foto_path,
        funcionario_id=user.id,
    )
    try:
        db.add(animal)
        db.commit()
    except Exception:
        # sem registro no banco, o arquivo ficaria orfao
        armazenamento.apagar(foto_path)
        raise
    db.refresh(animal)
    return _to_out(animal)


@router.get("/animais", response_model=list[AnimalOut])
def list_animais(
    especie: str | None = None,
    search: str | None = None,
    disponiveis: bool = False,
    castrados_sem_termo: bool = False,
    nao_adotados: bool = False,
    exceto_adocao: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Animal).order_by(Animal.id.desc())
    if disponiveis:
        stmt = stmt.where(~animal_eutanasiado())
    if nao_adotados:
        # exceto_adocao: ao editar um termo, o animal dele continua na busca
        stmt = stmt.where(~animal_adotado(exceto_adocao))
    if castrados_sem_termo:
        stmt = stmt.where(Animal.castrado, ~animal_com_termo_castracao())
    if especie:
        stmt = stmt.where(Animal.especie == especie)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(Animal.nome.like(like), Animal.cor_pelo.like(like))
        )
    return [_to_out(a) for a in db.scalars(stmt).all()]


@router.get("/animais/{animal_id}", response_model=AnimalOut)
def get_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal não encontrado.",
        )
    return _to_out(animal)


@router.get("/animais/{animal_id}/foto")
def get_foto(
    animal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    animal = db.get(Animal, animal_id)
    foto = (
        armazenamento.ler(animal.foto_path)
        if animal and animal.foto_path
        else None
    )
    if foto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada.",
        )
    # revalida sempre: a foto pode ser trocada na edicao
    return Response(
        foto,
        media_type=armazenamento.tipo_da_chave(animal.foto_path),
        headers={"Cache-Control": "private, no-cache"},
    )


@router.put("/animais/{animal_id}", response_model=AnimalOut)
def update_animal(
    animal_id: int,
    data: AnimalUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal não encontrado.",
        )
    campos = data.model_dump(exclude={"foto"})
    campos["nome"] = data.nome or None
    campos["temperamento"] = data.temperamento or "desconhecido"
    foto_antiga = animal.foto_path
    foto_nova = _salvar_foto(data.foto) if data.foto else None
    if foto_nova:
        campos["foto_path"] = foto_nova
    try:
        for campo, valor in campos.items():
            setattr(animal, campo, valor)
        animal.alterado_por_id = user.id
        db.commit()
    except Exception:
        if foto_nova:
            armazenamento.apagar(foto_nova)
        raise
    # so apaga a antiga depois que a troca esta garantida no banco
    if foto_nova and foto_antiga:
        armazenamento.apagar(foto_antiga)
    db.refresh(animal)
    return _to_out(animal)


@router.delete("/animais/{animal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_animal(
    animal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    animal = db.get(Animal, animal_id)
    if animal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Animal não encontrado.",
        )
    foto_path = animal.foto_path
    excluir_animal(db, animal)
    # so apaga a foto depois que a exclusao esta garantida no banco
    if foto_path:
        armazenamento.apagar(foto_path)
