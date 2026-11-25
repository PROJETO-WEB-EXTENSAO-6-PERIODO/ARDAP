import { useCallback, useEffect, useState } from "react";
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

function Foto({ animal }: { animal: AnimalVinculado }) {
  const emoji = (
    <span aria-hidden="true" className="text-4xl">
      {EMOJIS[animal.especie] ?? "🐾"}
    </span>
  );
  return animal.tem_foto ? (
    <FotoAnimal
      id={animal.id}
      alt=""
      className="h-full w-full object-cover"
      fallback={emoji}
    />
  ) : (
    emoji
  );
}

export function SeletorAnimal({
  animal,
  onChange,
}: {
  animal: AnimalVinculado | null;
  onChange: (animal: AnimalVinculado | null) => void;
}) {
  const [animais, setAnimais] = useState<AnimalVinculado[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<AnimalVinculado[]>("/animais");
      setAnimais(data);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const termo = normalizar(busca.trim());
  const encontrados = (animais ?? []).filter((a) =>
    normalizar(nomeExibido(a)).includes(termo),
  );
  const visiveis = encontrados.slice(0, MAX_VISIVEIS);

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
            <i aria-hidden="true" className="bi bi-link-45deg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">Vincular animal cadastrado</h2>
            <p className="text-xs text-gray-500 md:text-sm">
              Escolha pela foto ou busque pelo nome. Os dados do animal são preenchidos
              automaticamente.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          Opcional
        </span>
      </div>

      {animal ? (
        <div className="flex flex-col gap-4 rounded-xl border-2 border-[#FFD900] bg-[#FFF9DB] p-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
            <Foto animal={animal} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-green-800">
              <i aria-hidden="true" className="bi bi-check-circle-fill"></i>
              Animal vinculado
            </p>
            <p className="break-words text-lg font-bold text-[#1A1A1A]">{nomeExibido(animal)}</p>
            <p className="text-sm text-gray-600">
              Nº {animal.id} • {rotuloEspecie(animal.especie)} •{" "}
              {animal.sexo === "macho" ? "Macho" : "Fêmea"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/animais/${animal.id}`}
              target="_blank"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-gray-50"
            >
              Ver ficha
            </Link>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white active:scale-95"
            >
              Trocar ou remover
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <i
              aria-hidden="true"
              className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400"
            ></i>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                // Enter na busca não deve enviar o formulário.
                if (e.key === "Enter") e.preventDefault();
              }}
              aria-label="Buscar animal pelo nome"
              placeholder="Buscar pelo nome do animal..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
            />
          </div>

          {erro && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-[#DC2626]"
            >
              Não foi possível carregar os animais.
              <button
                type="button"
                onClick={() => void carregar()}
                className="cursor-pointer font-bold underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!animais && !erro && (
            <p role="status" className="text-sm text-gray-500">
              Carregando animais...
            </p>
          )}

          {animais && encontrados.length === 0 && (
            <p role="status" className="py-4 text-center text-sm text-gray-500">
              {animais.length === 0
                ? "Nenhum animal cadastrado ainda."
                : "Nenhum animal encontrado com esse nome."}
            </p>
          )}

          {visiveis.length > 0 && (
            <ul className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 lg:grid-cols-6">
              {visiveis.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      onChange(a);
                    }}
                    className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition-all hover:border-[#1A1A1A] hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#1A1A1A]"
                  >
                    <span className="flex aspect-square w-full items-center justify-center overflow-hidden bg-gray-100">
                      <Foto animal={a} />
                    </span>
                    <span className="block w-full p-2.5">
                      <span className="block truncate text-sm font-bold text-[#1A1A1A]">
                        {nomeExibido(a)}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        Nº {a.id} • {rotuloEspecie(a.especie)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {encontrados.length > MAX_VISIVEIS && (
            <p className="text-xs text-gray-500">
              Mostrando {MAX_VISIVEIS} de {encontrados.length}. Digite o nome para refinar.
            </p>
          )}
        </>
      )}
    </article>
  );
}
