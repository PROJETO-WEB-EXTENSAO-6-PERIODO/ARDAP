"""Gera as versoes reduzidas das fotos enviadas antes desta funcionalidade.

Roda uma vez em segundo plano quando a API inicia (FOTOS_VARIANTES_AO_INICIAR)
e tambem pode ser executado a mao: python -m app.scripts.gerar_miniaturas
Fotos que ja tem as versoes sao puladas, entao rodar de novo nao custa nada.
"""

import logging
import threading

from sqlalchemy import select

from app.core import armazenamento
from app.core.database import SessionLocal
from app.models.animal import Animal

log = logging.getLogger(__name__)


def gerar_faltantes() -> dict[str, int]:
    """Cria as versoes que faltam. Devolve quantas fotos foram geradas, puladas
    ou deram erro."""
    with SessionLocal() as db:
        chaves = db.scalars(select(Animal.foto_path).where(Animal.foto_path.is_not(None))).all()

    totais = {"geradas": 0, "puladas": 0, "erros": 0}
    for chave in chaves:
        try:
            faltando = [
                nome
                for nome in armazenamento.VARIANTES
                if not armazenamento.existe(armazenamento.chave_variante(chave, nome))
            ]
            if not faltando:
                totais["puladas"] += 1
                continue
            original = armazenamento.ler(chave)
            if original is None:
                log.warning("foto %s nao existe no armazenamento", chave)
                totais["erros"] += 1
                continue
            armazenamento.salvar_variantes(chave, original)
            totais["geradas"] += 1
        except Exception as erro:  # uma foto ruim nao interrompe as outras
            log.warning("nao foi possivel gerar as versoes de %s: %s", chave, erro)
            totais["erros"] += 1
    return totais


def gerar_em_segundo_plano() -> None:
    def tarefa():
        try:
            log.info("versoes reduzidas das fotos: %s", gerar_faltantes())
        except Exception as erro:
            log.warning("geracao das versoes reduzidas falhou: %s", erro)

    threading.Thread(target=tarefa, name="miniaturas", daemon=True).start()
