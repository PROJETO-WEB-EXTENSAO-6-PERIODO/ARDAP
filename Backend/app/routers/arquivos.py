"""Entrega de arquivos por link assinado, quando nao ha R2 (desenvolvimento).

Em producao o navegador baixa as fotos direto do bucket R2, com URLs
pre-assinadas. Sem R2, armazenamento.url_assinada aponta para esta rota, que
confere a assinatura e a validade do link: sem login, mas so quem recebeu o
link da API consegue abrir o arquivo.
"""

from fastapi import APIRouter, HTTPException, Response

from app.core import armazenamento

router = APIRouter(tags=["arquivos"])


@router.get("/arquivos/{chave:path}")
def baixar(chave: str, expira: int, assinatura: str):
    if ".." in chave or not armazenamento.assinatura_valida(chave, expira, assinatura):
        raise HTTPException(status_code=403, detail="Link inválido ou expirado.")
    conteudo = armazenamento.ler(chave)
    if conteudo is None:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return Response(
        conteudo,
        media_type=armazenamento.tipo_da_chave(chave),
        headers={"Cache-Control": armazenamento.CACHE_IMUTAVEL},
    )
