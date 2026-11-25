import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FotoAnimal } from "../components/FotoAnimal";
import { Header } from "../components/Header";
import { api } from "../services/api";

interface Animal {
  id: number;
  nome: string | null;
  especie: string;
  raca: string | null;
  sexo: string;
  data_nascimento_estimada: string | null;
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
  created_at: string | null;
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

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "cao", rotulo: "Cães" },
  { valor: "gato", rotulo: "Gatos" },
  { valor: "outro", rotulo: "Outros" },
];

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

function rotulo(valor: string | null) {
  return valor ? (LABELS[valor] ?? valor) : null;
}

// Espécies fora de cão/gato entram no grupo "Outros".
function grupoEspecie(especie: string) {
  return especie === "cao" || especie === "gato" ? especie : "outro";
}

// Ignora acentos e maiúsculas na busca.
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Formata sem passar por Date para o fuso horário não alterar o dia.
function formatarData(iso: string | null) {
  return iso ? iso.slice(0, 10).split("-").reverse().join("/") : null;
}

function formatarIdade(animal: Animal) {
  if (animal.idade_estimada !== null) {
    if (animal.idade_estimada === 0) return "Menos de 1 ano";
    return `${animal.idade_estimada} ${animal.idade_estimada === 1 ? "ano" : "anos"}`;
  }
  const nascimento = formatarData(animal.data_nascimento_estimada);
  return nascimento ? `Nasc. ${nascimento}` : null;
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

function AnimalCard({ animal }: { animal: Animal }) {
  const visual = VISUAL[grupoEspecie(animal.especie)];
  const nome = animal.nome || "Animal sem nome";
  const cadastro = formatarData(animal.created_at);

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
              id={animal.id}
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
          <Dado label="Idade" valor={formatarIdade(animal)} />
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

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs">
          <span className="text-gray-500">
            Nº {animal.id}
            {cadastro && ` • Cadastrado em ${cadastro}`}
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

export function AnimaisCadastrados() {
  const [animais, setAnimais] = useState<Animal[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [especie, setEspecie] = useState("");

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<Animal[]>("/animais");
      setAnimais(data);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (animais ?? []).filter((animal) => {
      if (especie && grupoEspecie(animal.especie) !== especie) return false;
      const texto = [
        animal.nome,
        animal.raca,
        animal.cor_pelo,
        animal.origem_resgate,
        String(animal.id),
      ]
        .filter(Boolean)
        .join(" ");
      return normalizar(texto).includes(termo);
    });
  }, [animais, busca, especie]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                Animais cadastrados
              </h1>
              <p aria-live="polite" className="mt-1 text-sm text-gray-500">
                {animais
                  ? `Mostrando ${visiveis.length} de ${animais.length} ${animais.length === 1 ? "animal" : "animais"}`
                  : "Todos os animais registrados no sistema"}
              </p>
            </div>
            <Link
              to="/animais"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFD900] px-5 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95"
            >
              <i aria-hidden="true" className="bi bi-plus-lg"></i>
              Cadastrar animal
            </Link>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <i
                aria-hidden="true"
                className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400"
              ></i>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar animais"
                placeholder="Buscar por nome, raça, cor, origem ou número..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
              />
            </div>
            <div
              role="group"
              aria-label="Filtrar por espécie"
              className="flex flex-wrap gap-2"
            >
              {FILTROS.map((filtro) => (
                <button
                  key={filtro.valor}
                  type="button"
                  aria-pressed={especie === filtro.valor}
                  onClick={() => setEspecie(filtro.valor)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    especie === filtro.valor
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filtro.rotulo}
                </button>
              ))}
            </div>
          </div>
        </section>

        {erro && (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <p className="text-sm font-bold text-[#DC2626]">
              Não foi possível carregar os animais.
            </p>
            <button
              type="button"
              onClick={() => void carregar()}
              className="cursor-pointer rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!animais && !erro && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-16 text-gray-500"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]"></div>
            <span>Carregando animais...</span>
          </div>
        )}

        {animais && visiveis.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <span aria-hidden="true" className="text-4xl">
              🐾
            </span>
            <p className="mt-3 font-bold text-[#1A1A1A]">
              {animais.length === 0
                ? "Nenhum animal cadastrado ainda"
                : "Nenhum animal encontrado"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {animais.length === 0
                ? "Use o botão “Cadastrar animal” para adicionar o primeiro."
                : "Tente mudar a busca ou o filtro de espécie."}
            </p>
          </div>
        )}

        {visiveis.length > 0 && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((animal) => (
              <li key={animal.id} className="min-w-0">
                <AnimalCard animal={animal} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
