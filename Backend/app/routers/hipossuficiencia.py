"""Registro de declaracoes de hipossuficiencia."""

from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import armazenamento
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.edicao import editar_registro
from app.models.hipossuficiencia import Hipossuficiencia
from app.models.hipossuficiencia_anexo import HipossuficienciaAnexo
from app.models.user import User
from app.schemas.hipossuficiencia import (
    AnexoIn,
    HipossuficienciaCampos,
    HipossuficienciaIn,
    HipossuficienciaOut,
    HipossuficienciaUpdateIn,
)

router = APIRouter(tags=["hipossuficiencias"])

MAX_ANEXOS = 4


def _salvar_anexos(anexos: list[AnexoIn]) -> list[HipossuficienciaAnexo]:
    """Valida todos antes de gravar; se um falhar, nenhum fica gravado."""
    extensoes = []
    for anexo in anexos:
        if len(anexo.conteudo) > armazenamento.MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"O anexo {anexo.nome} passa de 5 MB.",
            )
        extensao = armazenamento.identificar(anexo.conteudo)
        if extensao is None:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"O anexo {anexo.nome} deve ser PDF, JPG, PNG ou WebP.",
            )
        extensoes.append(extensao)
    salvos: list[HipossuficienciaAnexo] = []
    try:
        for anexo, extensao in zip(anexos, extensoes):
            path = armazenamento.salvar(
                "hipossuficiencia", anexo.conteudo, extensao
            )
            salvos.append(HipossuficienciaAnexo(nome=anexo.nome, path=path))
    except Exception:
        for salvo in salvos:
            armazenamento.apagar(salvo.path)
        raise
    return salvos


@router.post(
    "/hipossuficiencias",
    response_model=HipossuficienciaOut,
    status_code=status.HTTP_201_CREATED,
)
def create_hipossuficiencia(
    data: HipossuficienciaIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    anexos = _salvar_anexos(data.anexos_novos)
    paths = [a.path for a in anexos]
    hipossuficiencia = Hipossuficiencia(
        nome_representante=data.nome_representante,
        documento_representante=data.documento_representante,
        tipo_documento_representante=data.tipo_documento_representante,
        email_representante=data.email_representante,
        nome_imigrante=data.nome_imigrante,
        documento_imigrante=data.documento_imigrante,
        tipo_documento_imigrante=data.tipo_documento_imigrante,
        email_imigrante=data.email_imigrante,
        nao_possui_trabalho_remunerado=data.nao_possui_trabalho_remunerado,
        nao_possui_renda=data.nao_possui_renda,
        renda_ate_meio_salario_per_capita=data.renda_ate_meio_salario_per_capita,
        outro_motivo=data.outro_motivo,
        local_declaracao=data.local_declaracao,
        data_declaracao=data.data_declaracao,
        assinatura_representante=data.assinatura_representante,
        anexos=anexos,
        funcionario_id=user.id,
    )
    try:
        db.add(hipossuficiencia)
        db.commit()
    except Exception:
        # sem registro no banco, os arquivos ficariam orfaos
        for path in paths:
            armazenamento.apagar(path)
        raise
    db.refresh(hipossuficiencia)
    return hipossuficiencia


@router.get("/hipossuficiencias", response_model=list[HipossuficienciaOut])
def list_hipossuficiencias(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Hipossuficiencia).order_by(Hipossuficiencia.id.desc())
    return db.scalars(stmt).all()


@router.get("/hipossuficiencias/{hipossuficiencia_id}", response_model=HipossuficienciaOut)
def get_hipossuficiencia(
    hipossuficiencia_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    h = db.get(Hipossuficiencia, hipossuficiencia_id)
    if h is None:
        raise HTTPException(status_code=404, detail="Declaracao de hipossuficiencia nao encontrada.")
    return h


@router.put("/hipossuficiencias/{hipossuficiencia_id}", response_model=HipossuficienciaOut)
def update_hipossuficiencia(
    hipossuficiencia_id: int,
    data: HipossuficienciaUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    h = get_hipossuficiencia(hipossuficiencia_id, db, user)
    mantidos = [
        a
        for a in h.anexos
        if data.anexos_mantidos is None or a.id in data.anexos_mantidos
    ]
    if len(mantidos) + len(data.anexos_novos) > MAX_ANEXOS:
        raise HTTPException(
            status_code=422,
            detail=f"São permitidos no máximo {MAX_ANEXOS} anexos.",
        )
    removidos = [a.path for a in h.anexos if a not in mantidos]
    novos = _salvar_anexos(data.anexos_novos)
    paths = [a.path for a in novos]
    campos = HipossuficienciaCampos(
        **data.model_dump(exclude={"anexos_novos", "anexos_mantidos"})
    )
    try:
        h.anexos = mantidos + novos
        h = editar_registro(db, h, campos, user)
    except Exception:
        for path in paths:
            armazenamento.apagar(path)
        raise
    # so apaga os arquivos depois que a remocao esta garantida no banco
    for path in removidos:
        armazenamento.apagar(path)
    return h


@router.get("/hipossuficiencias/{hipossuficiencia_id}/anexos/{anexo_id}")
def get_anexo(
    hipossuficiencia_id: int,
    anexo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    anexo = db.get(HipossuficienciaAnexo, anexo_id)
    if anexo is None or anexo.hipossuficiencia_id != hipossuficiencia_id:
        raise HTTPException(status_code=404, detail="Anexo não encontrado.")
    conteudo = armazenamento.ler(anexo.path)
    if conteudo is None:
        raise HTTPException(status_code=404, detail="Anexo não encontrado.")
    return Response(
        conteudo,
        media_type=armazenamento.tipo_da_chave(anexo.path),
        headers={
            "Cache-Control": "private, no-store",
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(anexo.nome, safe='')}",
            "X-Content-Type-Options": "nosniff",
        },
    )
