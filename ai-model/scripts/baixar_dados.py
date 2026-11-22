"""Baixa os dados abertos do Austin Animal Center (entradas e desfechos).

Fonte: portal de dados abertos da cidade de Austin (Socrata), sem autenticacao.
  - Intakes:  https://data.austintexas.gov/resource/wter-evkm
  - Outcomes: https://data.austintexas.gov/resource/9t4d-g238

Os arquivos vao para datasets/raw/ (fora do Git, ver .gitignore).

Uso:
    python ai-model/scripts/baixar_dados.py
    python ai-model/scripts/baixar_dados.py --limite 20000   # amostra rapida
"""

from __future__ import annotations

import argparse
import csv
import io
import ssl
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

BASE = "https://data.austintexas.gov/resource/{dataset}.csv"
DATASETS = {
    "intakes": "wter-evkm",
    "outcomes": "9t4d-g238",
}
PAGINA = 50_000
RAIZ = Path(__file__).resolve().parents[2]
SAIDA_PADRAO = RAIZ / "datasets" / "raw"


def _contexto_ssl() -> ssl.SSLContext:
    """Contexto SSL com o bundle do certifi (o Python do Windows costuma vir sem CAs)."""
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:  # pragma: no cover - ambiente sem certifi
        return ssl.create_default_context()


def _requisitar(url: str, tentativas: int = 4) -> str:
    """GET com retentativa e backoff simples."""
    contexto = _contexto_ssl()
    ultimo_erro: Exception | None = None
    for tentativa in range(1, tentativas + 1):
        try:
            req = Request(url, headers={"User-Agent": "ardap-pi-ia/1.0"})
            with urlopen(req, timeout=120, context=contexto) as resp:
                return resp.read().decode("utf-8")
        except (URLError, TimeoutError) as erro:  # pragma: no cover - rede
            ultimo_erro = erro
            espera = 2**tentativa
            print(f"  falha ({erro}); tentando de novo em {espera}s...")
            time.sleep(espera)
    raise RuntimeError(f"nao foi possivel baixar {url}") from ultimo_erro


def baixar(nome: str, destino: Path, limite: int | None = None) -> int:
    """Baixa um dataset paginando de 50k em 50k e grava um CSV unico."""
    dataset = DATASETS[nome]
    registros: list[dict] = []
    campos: list[str] = []
    offset = 0

    while True:
        tamanho = PAGINA if limite is None else min(PAGINA, limite - len(registros))
        if tamanho <= 0:
            break
        url = (
            f"{BASE.format(dataset=dataset)}"
            f"?$limit={tamanho}&$offset={offset}&$order=:id"
        )
        texto = _requisitar(url)
        pagina = list(csv.DictReader(io.StringIO(texto)))
        if not pagina:
            break
        if not campos:
            campos = list(pagina[0].keys())
        registros.extend(pagina)
        offset += len(pagina)
        print(f"  {nome}: {len(registros):>7} linhas", end="\r", flush=True)
        if len(pagina) < tamanho:
            break

    if not registros:
        raise RuntimeError(f"nenhum registro baixado para {nome}")

    destino.parent.mkdir(parents=True, exist_ok=True)
    with destino.open("w", encoding="utf-8", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=campos, extrasaction="ignore")
        escritor.writeheader()
        escritor.writerows(registros)

    print(f"  {nome}: {len(registros):>7} linhas -> {destino}")
    return len(registros)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--saida",
        type=Path,
        default=SAIDA_PADRAO,
        help="pasta de destino (padrao: datasets/raw)",
    )
    parser.add_argument(
        "--limite",
        type=int,
        default=None,
        help="numero maximo de linhas por dataset (util para testes)",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print(f"Baixando dados abertos de Austin para {args.saida}")
    for nome in DATASETS:
        baixar(nome, args.saida / f"{nome}.csv", args.limite)

    print("Concluido.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
