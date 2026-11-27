"""Gera as versoes reduzidas das fotos antigas dos animais.

Uso (pasta Backend): python -m app.scripts.gerar_miniaturas
A API tambem faz isso sozinha ao iniciar; este script serve para rodar a mao.
"""

from app.core.miniaturas import gerar_faltantes


def main() -> None:
    totais = gerar_faltantes()
    print(
        f"geradas: {totais['geradas']}  ja existiam: {totais['puladas']}  "
        f"erros: {totais['erros']}"
    )


if __name__ == "__main__":
    main()
