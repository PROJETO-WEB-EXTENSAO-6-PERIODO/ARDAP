"""Traduz o cadastro do ARDAP para as features do modelo.

O modelo foi treinado com a base publica do Austin Animal Center (EUA), cujos
valores estao em ingles ("Dog", "Stray", "Brown Tabby"...). Este modulo
converte os campos do cadastro do ARDAP para o mesmo vocabulario, seguindo o
mapeamento documentado em ai-model/README.md.

Valores sem equivalente (ex.: raca "Fila Brasileiro") viram uma categoria
desconhecida; o OneHotEncoder do modelo usa handle_unknown="ignore", entao
eles simplesmente nao somam nem subtraem nada.
"""

from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from datetime import date

# Idade 0 no cadastro significa "menos de 1 ano". Usamos 4 meses, o meio da
# faixa em que a maioria dos filhotes chega ao abrigo.
DIAS_FILHOTE = 120

ESPECIES = {"cao": "Dog", "gato": "Cat"}

# Raca do formulario do ARDAP -> raca principal na base de Austin.
RACAS_CAO = {
    "akita": "Akita",
    "basset hound": "Basset Hound",
    "beagle": "Beagle",
    "border collie": "Border Collie",
    "boxer": "Boxer",
    "buldogue frances": "French Bulldog",
    "buldogue ingles": "English Bulldog",
    "bull terrier": "Bull Terrier",
    "chihuahua": "Chihuahua Shorthair",
    "chow chow": "Chow Chow",
    "cocker spaniel": "Cocker Spaniel",
    "dachshund (salsicha)": "Dachshund",
    "dalmata": "Dalmatian",
    "doberman": "Doberman Pinsch",
    "golden retriever": "Golden Retriever",
    "husky siberiano": "Siberian Husky",
    "labrador retriever": "Labrador Retriever",
    "lhasa apso": "Lhasa Apso",
    "maltes": "Maltese",
    "pastor alemao": "German Shepherd",
    "pastor belga": "Belgian Malinois",
    "pinscher": "Miniature Pinscher",
    "pit bull": "Pit Bull",
    "poodle": "Miniature Poodle",
    "pug": "Pug",
    "rottweiler": "Rottweiler",
    "sao bernardo": "St. Bernard Rough Coat",
    "schnauzer": "Miniature Schnauzer",
    "shar-pei": "Chinese Sharpei",
    "shih tzu": "Shih Tzu",
    "spitz alemao (lulu da pomerania)": "Pomeranian",
    "yorkshire terrier": "Yorkshire Terrier",
}
RACAS_GATO = {
    "angora": "Domestic Longhair",
    "azul russo": "Russian Blue",
    "maine coon": "Maine Coon",
    "siames": "Siamese",
    # em Austin, gato sem raca definida e registrado como "Domestic Shorthair"
    "srd": "Domestic Shorthair",
}

# Cor (em portugues) -> cor base na base de Austin, na ordem em que aparecem.
CORES = {
    "preto": "Black", "preta": "Black",
    "branco": "White", "branca": "White",
    "caramelo": "Tan",
    "marrom": "Brown",
    "cinza": "Gray",
    "laranja": "Orange",
    "bege": "Cream", "creme": "Cream",
    "dourado": "Gold", "dourada": "Gold",
    "amarelo": "Yellow", "amarela": "Yellow",
    "chocolate": "Chocolate",
    "ruivo": "Red", "vermelho": "Red",
    "azul": "Blue",
    "prata": "Silver",
    "fulvo": "Fawn",
}
TABBY = {"Brown", "Gray", "Orange", "Blue", "Silver", "Cream", "Black"}
BRINDLE = {"Brown", "Black", "Yellow"}

# Situacao do animal no registro SUPATAS -> condicao de entrada em Austin.
CONDICOES = {"acidentado": "Injured", "doente": "Sick"}


def normalizar(texto: str | None) -> str:
    """Minusculas, sem acentos e sem espacos nas pontas."""
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFD", texto)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return sem_acento.lower().strip()


def especie(valor: str) -> str:
    return ESPECIES.get(normalizar(valor), "Other")


def sexo(valor: str) -> str:
    return {"macho": "Macho", "femea": "Femea"}.get(normalizar(valor), "Desconhecido")


def idade_dias(anos: int | None) -> float | None:
    if anos is None:
        return None
    return float(DIAS_FILHOTE if anos == 0 else anos * 365)


def raca(valor: str | None, especie_ardap: str) -> tuple[str, int]:
    """Devolve (raca_principal, misto)."""
    chave = normalizar(valor)
    grupo = normalizar(especie_ardap)
    if grupo == "gato":
        return RACAS_GATO.get(chave, "Desconhecida"), 0
    if grupo == "cao":
        if chave in ("", "srd", "outra"):
            # cao sem raca definida: sem raca de referencia, marcado como misto
            return "Desconhecida", 1
        return RACAS_CAO.get(chave, "Desconhecida"), 0
    return "Desconhecida", 0


def cor(valor: str | None, especie_ardap: str) -> str:
    texto = normalizar(valor)
    if not texto:
        return "Desconhecida"
    grupo = normalizar(especie_ardap)
    palavras = texto.replace(",", " ").split()
    bases = [CORES[p] for p in palavras if p in CORES]

    if "escaminha" in palavras or "tartaruga" in palavras:
        return "Tortie"
    tres_cores = "tricolor" in palavras or len(set(bases)) >= 3
    if tres_cores:
        return "Calico" if grupo == "gato" else "Tricolor"
    if not bases:
        return "Desconhecida"
    base = bases[0]
    if "tigrado" in palavras or "rajado" in palavras:
        if grupo == "gato" and base in TABBY:
            return f"{base} Tabby"
        if grupo == "cao":
            return f"{base} Brindle" if base in BRINDLE else "Brown Brindle"
    return base


def tipo_entrada(origem: str | None, veio_do_supatas: bool) -> str:
    """Austin separa animais de rua (Stray), entregues pelo tutor e abandonados."""
    if veio_do_supatas:
        return "Stray"
    texto = normalizar(origem)
    if any(p in texto for p in ("tutor", "entregue", "devolvid")):
        return "Owner Surrender"
    if "abandon" in texto:
        return "Abandoned"
    return "Stray"


def condicao_entrada(situacao_supatas: str | None, medicacao_necessaria: bool) -> str:
    condicao = CONDICOES.get(normalizar(situacao_supatas))
    if condicao:
        return condicao
    if medicacao_necessaria:
        return "Medical"
    return "Normal"


@dataclass
class EntradaAnimal:
    """Campos do ARDAP que o modelo usa (cadastro + registro SUPATAS)."""

    especie: str
    sexo: str
    castrado: bool
    idade_anos: int | None
    raca: str | None
    cor_pelo: str | None
    origem_resgate: str | None
    medicacao_necessaria: bool
    situacao_supatas: str | None
    veio_do_supatas: bool
    data_entrada: date


def features(entrada: EntradaAnimal) -> dict:
    """Linha de features no formato do treino (ai-model/scripts/treinar.py)."""
    dias = idade_dias(entrada.idade_anos)
    raca_principal, misto = raca(entrada.raca, entrada.especie)
    return {
        "especie": especie(entrada.especie),
        "sexo": sexo(entrada.sexo),
        "esterilizado": "Esterilizado" if entrada.castrado else "Nao esterilizado",
        "idade_dias": dias,
        "idade_ausente": int(dias is None),
        "raca_principal": raca_principal,
        "misto": misto,
        "cor_principal": cor(entrada.cor_pelo, entrada.especie),
        "tipo_entrada": tipo_entrada(entrada.origem_resgate, entrada.veio_do_supatas),
        "condicao_entrada": condicao_entrada(
            entrada.situacao_supatas, entrada.medicacao_necessaria
        ),
        "mes_entrada": entrada.data_entrada.month,
    }
