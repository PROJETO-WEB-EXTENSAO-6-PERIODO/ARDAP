import { Link } from "react-router-dom";
import { formatarIdade } from "../services/idade";
import { Autorias, type Autor } from "./Autoria";
import { FotoAnimal } from "./FotoAnimal";

export interface Animal {
  id: number;
  nome: string | null;
  especie: string;
  raca: string | null;
  sexo: string;
  idade_estimada: number | null;
  porte: string | null;
  cor_pelo: string | null;
  peso: string | number | null;
  castrado: boolean;
  vermifugado: boolean;
  vacinado: boolean;
  temperamento: string;
  medicacao_necessaria: boolean;
  medicacao_desc: string | null;
  origem_resgate: string | null;
  tem_foto: boolean;
  foto_url: string | null;
  foto_mini_url: string | null;
  created_at: string | null;
  funcionario: Autor | null;
  alterado_por: Autor | null;
  updated_at: string | null;
}

const LABELS: Record<string, string> = {
  cao: "Cão",
  gato: "Gato",
  outro: "Outro",
  macho: "Macho",
  femea: "Fêmea",
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  docil: "Dócil",
  medroso: "Medroso",
  arisco: "Arisco",
  agressivo: "Agressivo",
  desconhecido: "Desconhecido",
};

const VISUAL: Record<string, { emoji: string; fundo: string }> = {
  cao: { emoji: "🐶", fundo: "bg-amber-100" },
  gato: { emoji: "🐱", fundo: "bg-violet-100" },
  outro: { emoji: "🐾", fundo: "bg-emerald-100" },
};

const TEMPERAMENTO: Record<string, string> = {
  docil: "bg-green-100 text-green-800",
  medroso: "bg-blue-100 text-blue-800",
  arisco: "bg-amber-100 text-amber-800",
  agressivo: "bg-red-100 text-red-800",
};

export function rotulo(valor: string | null) {
  return valor ? (LABELS[valor] ?? valor) : null;
}

// Espécies fora de cão/gato entram no grupo "Outros".
export function grupoEspecie(especie: string) {
  return especie === "cao" || especie === "gato" ? especie : "outro";
}

function formatarPeso(peso: string | number | null) {
  return peso === null ? null : `${Number(peso).toLocaleString("pt-BR")} kg`;
}

function Dado({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-gray-500">{label}</dt>
      <dd
        className={`truncate text-sm ${
          valor ? "font-semibold text-[#1A1A1A]" : "text-gray-400"
        }`}
        title={valor ?? undefined}
      >
        {valor || "Não informado"}
      </dd>
    </div>
  );
}

function Saude({ label, ativo }: { label: string; ativo: boolean }) {
  return (
    <li
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      <i
        aria-hidden="true"
        className={`bi ${ativo ? "bi-check-circle-fill" : "bi-x-circle"}`}
      ></i>
      {label}: {ativo ? "Sim" : "Não"}
    </li>
  );
}

export function AnimalCard({ animal }: { animal: Animal }) {
  const visual = VISUAL[grupoEspecie(animal.especie)];
  const nome = animal.nome || "Animal sem nome";

  return (
    <Link
      to={`/animais/${animal.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
    >
      <div className={`flex items-center gap-4 p-5 ${visual.fundo}`}>
        <span
          aria-hidden="true"
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-4xl shadow-sm transition-transform duration-200 group-hover:scale-105"
        >
          {animal.tem_foto ? (
            <FotoAnimal
              src={animal.foto_mini_url}
              alt=""
              className="h-full w-full object-cover"
              fallback={visual.emoji}
            />
          ) : (
            visual.emoji
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[#1A1A1A]" title={nome}>
            {nome}
          </h2>
          <p className="truncate text-sm text-gray-700">
            {[rotulo(animal.especie), animal.raca].filter(Boolean).join(" • ")}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1A1A1A]">
            <i
              aria-hidden="true"
              className={`bi ${
                animal.sexo === "macho"
                  ? "bi-gender-male text-blue-600"
                  : "bi-gender-female text-pink-600"
              }`}
            ></i>
            {rotulo(animal.sexo)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dado label="Idade" valor={formatarIdade(animal.idade_estimada)} />
          <Dado label="Porte" valor={rotulo(animal.porte)} />
          <Dado label="Peso" valor={formatarPeso(animal.peso)} />
          <Dado label="Cor do pelo" valor={animal.cor_pelo} />
          <div className="col-span-2">
            <Dado label="Origem do resgate" valor={animal.origem_resgate} />
          </div>
        </dl>

        <ul className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-4">
          <Saude label="Castrado" ativo={animal.castrado} />
          <Saude label="Vacinado" ativo={animal.vacinado} />
          <Saude label="Vermifugado" ativo={animal.vermifugado} />
          <li
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              TEMPERAMENTO[animal.temperamento] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            Temperamento: {rotulo(animal.temperamento)}
          </li>
        </ul>

        {animal.medicacao_necessaria && (
          <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
            <i aria-hidden="true" className="bi bi-capsule"></i>
            <span className="line-clamp-2 min-w-0 break-words">
              Medicação: {animal.medicacao_desc || "necessária, sem descrição"}
            </span>
          </p>
        )}

        <Autorias registro={animal} />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs">
          <span className="text-gray-500">
            Nº {animal.id}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-[#1A1A1A]">
            Ver ficha
            <i
              aria-hidden="true"
              className="bi bi-arrow-right transition-transform group-hover:translate-x-0.5"
            ></i>
          </span>
        </div>
      </div>
    </Link>
  );
}
