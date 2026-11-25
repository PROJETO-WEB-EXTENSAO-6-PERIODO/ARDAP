"""Cadastro e listagem de animais (RF03 + RF10 parcial).

POST cria apenas o cadastro do animal. Registros de entrada via SUPATAS
devem ser feitos pelo endpoint dedicado /supatas.
"""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.animal import Animal
from app.models.user import User
from app.schemas.animal import AnimalIn, AnimalOut

router = APIRouter(tags=["animais"])

# Backend/uploads (fora do git), independente da pasta de execucao
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
FOTO_MAX_BYTES = 5 * 1024 * 1024


def _extensao_foto(foto: bytes) -> str:
    """Valida tamanho e formato pelo conteudo, nao pela extensao."""
    if len(foto) > FOTO_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="A foto deve ter no máximo 5 MB.",
        )
    if foto.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if foto.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if foto[:4] == b"RIFF" and foto[8:12] == b"WEBP":
        return ".webp"
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="A foto deve ser JPG, PNG ou WebP.",
    )


def _salvar_foto(foto: bytes) -> str:
    """Grava a foto em disco e devolve o caminho relativo a UPLOADS_DIR."""
    foto_path = f"animais/{uuid4().hex}{_extensao_foto(foto)}"
    destino = UPLOADS_DIR / foto_path
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(foto)
    return foto_path


def _to_out(a: Animal) -> AnimalOut:
    return AnimalOut(
        id=a.id, nome=a.nome, especie=a.especie, raca=a.raca, sexo=a.sexo,
        data_nascimento_estimada=a.data_nascimento_estimada,
        idade_estimada=a.idade_estimada,
        porte=a.porte, cor_pelo=a.cor_pelo, peso=a.peso,
        castrado=bool(a.castrado), vermifugado=bool(a.vermifugado),
        vacinado=bool(a.vacinado), temperamento=a.temperamento,
        medicacao_necessaria=bool(a.medicacao_necessaria),
        medicacao_desc=a.medicacao_desc, origem_resgate=a.origem_resgate,
        observacoes=a.observacoes, tem_foto=a.foto_path is not None,
        created_at=a.created_at,
    )


@router.post("/animais", response_model=AnimalOut,
             status_code=status.HTTP_201_CREATED)
def create_animal(
    data: AnimalIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    foto_path = _salvar_foto(data.foto) if data.foto else None
    animal = Animal(
        nome=data.nome or None,
        especie=data.especie,
        raca=data.raca,
        sexo=data.sexo,
        data_nascimento_estimada=data.data_nascimento_estimada,
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
    )
    try:
        db.add(animal)
        db.commit()
    except Exception:
        # sem registro no banco, o arquivo ficaria orfao
        if foto_path:
            (UPLOADS_DIR / foto_path).unlink(missing_ok=True)
        raise
    db.refresh(animal)
    return _to_out(animal)


@router.get("/animais", response_model=list[AnimalOut])
def list_animais(
    especie: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Animal).order_by(Animal.id.desc())
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
    arquivo = (
        UPLOADS_DIR / animal.foto_path
        if animal and animal.foto_path
        else None
    )
    if arquivo is None or not arquivo.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto não encontrada.",
        )
    return FileResponse(arquivo)
