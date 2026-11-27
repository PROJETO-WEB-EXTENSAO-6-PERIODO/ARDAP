"""Gera Docs/relatorio-ardap.pdf a partir de relatorio-ardap.html.

Dependencias (fora do requirements do projeto): pip install playwright pypdf
Usa o Chrome instalado na maquina. Da raiz do repositorio:
    python Docs/relatorio/gerar_pdf.py
"""

import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright
from pypdf import PdfReader

PASTA = Path(__file__).resolve().parent
html = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else PASTA / "relatorio-ardap.html"
saida = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else PASTA.parent / "relatorio-ardap.pdf"


def render(paginas: dict) -> None:
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        pg = b.new_page()
        pg.add_init_script(f"window.PAGINAS = {json.dumps(paginas, ensure_ascii=False)};")
        pg.goto(html.as_uri())
        pg.wait_for_load_state("networkidle")
        pg.pdf(path=str(saida), format="A4", print_background=True, prefer_css_page_size=True)
        titulos = pg.eval_on_selector_all(
            "section h1, section h2",
            "els => els.filter(e => !e.closest('.pre')).map(e => e.textContent)",
        )
        b.close()
    return titulos


def normalizar(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip().lower()


titulos = render({})
for _ in range(2):
    leitor = PdfReader(str(saida))
    textos = [[normalizar(l) for l in (pg.extract_text() or "").splitlines()] for pg in leitor.pages]
    paginas = {}
    inicio = 4  # pula capa, rosto, resumo e sumario
    for t in titulos:
        alvo = normalizar(t)
        for i in range(inicio, len(textos)):
            if alvo in textos[i]:
                paginas[t] = str(i + 1)
                inicio = i
                break
    render(paginas)

print(f"{len(PdfReader(str(saida)).pages)} paginas")
faltando = [t for t in titulos if t not in paginas]
print("sem pagina:", faltando)
