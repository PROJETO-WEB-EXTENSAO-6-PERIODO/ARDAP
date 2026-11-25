import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import { FotoAnimal } from "./FotoAnimal";
import { api } from "../services/api";

export interface AnimalVinculado {
  id: number;
  nome: string | null;
  especie: string;
  raca: string | null;
  sexo: "macho" | "femea";
  idade_estimada: number | null;
  porte: string | null;
  cor_pelo: string | null;
  peso: string | number | null;
  castrado: boolean;
  origem_resgate: string | null;
  tem_foto: boolean;
}

const ESPECIES: Record<string, string> = { cao: "Cão", gato: "Gato", outro: "Outro" };
const EMOJIS: Record<string, string> = { cao: "🐶", gato: "🐱" };
const MAX_VISIVEIS = 24;

export function rotuloEspecie(especie: string) {
  return ESPECIES[especie] ?? especie;
}

// Ignora acentos e maiúsculas na busca.
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function nomeExibido(animal: AnimalVinculado) {
  return animal.nome || "Animal sem nome";
}

function Miniatura({ animal }: { animal: AnimalVinculado }) {
  const emoji = (
    <span aria-hidden="true" className="text-lg leading-none">
      {EMOJIS[animal.especie] ?? "🐾"}
    </span>
  );
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
      {animal.tem_foto ? (
        <FotoAnimal
          id={animal.id}
          alt=""
          className="h-full w-full object-cover"
          fallback={emoji}
        />
      ) : (
        emoji
      )}
    </span>
  );
}

export function SeletorAnimal({
  animal,
  onChange,
  obrigatorio = false,
  invalido = false,
}: {
  animal: AnimalVinculado | null;
  onChange: (animal: AnimalVinculado | null) => void;
  obrigatorio?: boolean;
  invalido?: boolean;
}) {
  const [animais, setAnimais] = useState<AnimalVinculado[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const idBase = useId();

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<AnimalVinculado[]>("/animais", {
        params: { disponiveis: true },
      });
      setAnimais(data);
    } catch {
      setErro(true);
    }
  }, []);

  // Fecha ao clicar ou levar o foco para fora do seletor.
  useEffect(() => {
    if (!aberto) return;
    function aoSair(e: Event) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoSair);
    document.addEventListener("focusin", aoSair);
    return () => {
      document.removeEventListener("mousedown", aoSair);
      document.removeEventListener("focusin", aoSair);
    };
  }, [aberto]);

  // Mantém a opção destacada visível ao navegar com as setas.
  useEffect(() => {
    if (aberto) {
      document
        .getElementById(`${idBase}-${ativo}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [aberto, ativo, idBase]);

  const termo = normalizar(busca.trim());
  const encontrados = (animais ?? []).filter((a) =>
    normalizar(nomeExibido(a)).includes(termo),
  );
  const visiveis = encontrados.slice(0, MAX_VISIVEIS);

  function abrir() {
    setBusca("");
    setAtivo(0);
    setAberto(true);
    // Recarrega ao abrir: um animal pode ter deixado de estar disponível.
    void carregar();
  }

  function fechar() {
    setAberto(false);
    gatilho.current?.focus();
  }

  function escolher(a: AnimalVinculado) {
    if (a.id !== animal?.id) onChange(a);
    fechar();
  }

  function aoTeclar(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.max(0, Math.min(i + 1, visiveis.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // Enter escolhe o animal em vez de enviar o formulário.
      e.preventDefault();
      if (visiveis[ativo]) escolher(visiveis[ativo]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      fechar();
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id={`${idBase}-rotulo`} className="text-sm font-semibold text-[#1A1A1A]">
        Vincular animal cadastrado{" "}
        {obrigatorio ? (
          <span className="font-bold text-[#DC2626]">*</span>
        ) : (
          <span className="text-xs font-normal text-gray-500">(opcional)</span>
        )}
      </span>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div ref={raiz} className="relative w-full max-w-xs">
          <button
            ref={gatilho}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={aberto}
            aria-labelledby={`${idBase}-rotulo ${idBase}-valor`}
            onClick={() => (aberto ? setAberto(false) : abrir())}
            className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
          >
            {animal && <Miniatura animal={animal} />}
            <span
              id={`${idBase}-valor`}
              className={`min-w-0 flex-1 truncate ${
                animal ? "font-semibold text-[#1A1A1A]" : "text-gray-500"
              }`}
            >
              {animal ? nomeExibido(animal) : "Selecione um animal"}
            </span>
            <i
              aria-hidden="true"
              className={`bi bi-chevron-down text-gray-400 transition-transform ${
                aberto ? "rotate-180" : ""
              }`}
            ></i>
          </button>

          {aberto && (
            <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="relative p-2.5">
                <input
                  autoFocus
                  type="text"
                  role="combobox"
                  aria-expanded
                  aria-controls={`${idBase}-lista`}
                  aria-activedescendant={
                    visiveis[ativo] ? `${idBase}-${ativo}` : undefined
                  }
                  aria-label="Buscar animal pelo nome"
                  autoComplete="off"
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setAtivo(0);
                  }}
                  onKeyDown={aoTeclar}
                  placeholder="Buscar pelo nome..."
                  className="w-full rounded-md border border-gray-200 py-2 pl-3 pr-9 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none"
                />
                <i
                  aria-hidden="true"
                  className="bi bi-search pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-gray-400"
                ></i>
              </div>

              {erro && (
                <p role="alert" className="px-3 pb-3 text-sm text-[#DC2626]">
                  Não foi possível carregar.{" "}
                  <button
                    type="button"
                    onClick={() => void carregar()}
                    className="cursor-pointer font-bold underline"
                  >
                    Tentar novamente
                  </button>
                </p>
              )}

              {!erro && visiveis.length === 0 && (
                <p role="status" className="px-3 pb-3 text-sm text-gray-500">
                  {!animais
                    ? "Carregando animais..."
                    : animais.length === 0
                      ? "Nenhum animal cadastrado ainda."
                      : "Nenhum animal encontrado."}
                </p>
              )}

              <ul
                id={`${idBase}-lista`}
                role="listbox"
                aria-label="Animais cadastrados"
                className="max-h-64 overflow-y-auto"
              >
                {visiveis.map((a, indice) => (
                  <li
                    key={a.id}
                    id={`${idBase}-${indice}`}
                    role="option"
                    aria-selected={a.id === animal?.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setAtivo(indice)}
                    onClick={() => escolher(a)}
                    className={`flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm text-[#1A1A1A] ${
                      indice === ativo ? "bg-gray-100" : ""
                    }`}
                  >
                    <Miniatura animal={a} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {nomeExibido(a)}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">Nº {a.id}</span>
                    {a.id === animal?.id && (
                      <i aria-hidden="true" className="bi bi-check-lg"></i>
                    )}
                  </li>
                ))}
              </ul>

              {encontrados.length > MAX_VISIVEIS && (
                <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
                  Mostrando {MAX_VISIVEIS} de {encontrados.length}. Digite para
                  refinar.
                </p>
              )}
            </div>
          )}
        </div>

        {animal && (
          <div className="flex gap-4 text-xs font-semibold">
            <Link
              to={`/animais/${animal.id}`}
              target="_blank"
              className="text-[#1A1A1A] hover:underline"
            >
              Ver ficha
            </Link>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer text-[#DC2626] hover:underline"
            >
              Remover vínculo
            </button>
          </div>
        )}
      </div>
      {invalido && <p className="text-xs text-[#DC2626]">Campo obrigatório</p>}
    </div>
  );
}
