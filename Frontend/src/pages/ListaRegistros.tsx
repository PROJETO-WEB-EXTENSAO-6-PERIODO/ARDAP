import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimaisCastrados } from "../components/AnimaisCastrados";
import { Autorias } from "../components/Autoria";
import { FotoRegistro } from "../components/FotoRegistro";
import { Header } from "../components/Header";
import { formatarData } from "../services/adocoes";
import { api } from "../services/api";
import {
  detalhesDoAnimal,
  grupoEspecie,
  nomeDoRegistro,
  type ModuloRegistro,
  type Registro,
} from "../services/registros";

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "cao", rotulo: "Cães" },
  { valor: "gato", rotulo: "Gatos" },
  { valor: "outro", rotulo: "Outros" },
];

// Ignora acentos e maiúsculas na busca.
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function RegistroCard({ modulo, registro }: { modulo: ModuloRegistro; registro: Registro }) {
  const pessoa = modulo.pessoa(registro);
  const data = formatarData(modulo.data(registro));
  const titulo = modulo.temAnimal ? nomeDoRegistro(registro) : pessoa.nome;

  return (
    <Link
      to={`/${modulo.rota}/${registro.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
    >
      <div className="flex items-center gap-4 bg-[#FFF9DB] p-5">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-4xl shadow-sm">
          <FotoRegistro modulo={modulo} registro={registro} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[#1A1A1A]" title={titulo}>
            {titulo}
          </h2>
          <p className="truncate text-sm text-gray-600">
            {modulo.temAnimal ? detalhesDoAnimal(registro) : pessoa.label}
          </p>
          {data && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1A1A1A]">
              <i aria-hidden="true" className="bi bi-calendar3"></i>
              {data}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {modulo.temAnimal && (
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500">{pessoa.label}</p>
            <p className="truncate font-bold text-[#1A1A1A]" title={pessoa.nome}>
              {pessoa.nome}
            </p>
          </div>
        )}
        <dl className="flex flex-col gap-2">
          {modulo.resumo(registro).map((linha) => (
            <div key={linha.label} className="flex min-w-0 items-center gap-2.5 text-sm">
              <dt className="shrink-0 text-gray-500" title={linha.label}>
                <i aria-hidden="true" className={`bi ${linha.icone}`}></i>
                <span className="sr-only">{linha.label}</span>
              </dt>
              <dd
                title={linha.valor ?? undefined}
                className={`min-w-0 truncate ${linha.valor ? "text-[#1A1A1A]" : "text-gray-400"}`}
              >
                {linha.valor || "Não informado"}
              </dd>
            </div>
          ))}
        </dl>
        <Autorias registro={registro} />
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs">
          <span className="text-gray-500">
            Registro nº {registro.id}
            {modulo.temAnimal && !registro.animal && " • Sem vínculo"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-[#1A1A1A]">
            Ver registro
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

export function ListaRegistros({ modulo }: { modulo: ModuloRegistro }) {
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [especie, setEspecie] = useState("");
  // Na URL, para o botão voltar devolver à mesma aba.
  const [parametros, setParametros] = useSearchParams();
  const temAbas = modulo.rota === "castracoes";
  const abaCastrados = temAbas && parametros.get("aba") === "castrados";

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<Registro[]>(`/${modulo.rota}`);
      setRegistros(data);
    } catch {
      setErro(true);
    }
  }, [modulo.rota]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (registros ?? []).filter((r) => {
      if (especie && grupoEspecie(r) !== especie) return false;
      const texto = [
        modulo.temAnimal ? nomeDoRegistro(r) : null,
        modulo.pessoa(r).nome,
        ...modulo.resumo(r).map((linha) => linha.valor),
        String(r.id),
      ]
        .filter(Boolean)
        .join(" ");
      return normalizar(texto).includes(termo);
    });
  }, [registros, busca, especie, modulo]);

  const nenhum = modulo.feminino ? "Nenhuma" : "Nenhum";
  const fim = modulo.feminino ? "a" : "o";

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                {modulo.titulo}
              </h1>
              <p aria-live="polite" className="mt-1 text-sm text-gray-500">
                {abaCastrados
                  ? "Animais que já constam como castrados no cadastro"
                  : registros
                  ? `Mostrando ${visiveis.length} de ${registros.length} ${registros.length === 1 ? modulo.singular : modulo.plural}`
                  : "Registros do sistema"}
              </p>
            </div>
            <Link
              to={`/${modulo.rota}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFD900] px-5 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95"
            >
              <i aria-hidden="true" className="bi bi-plus-lg"></i>
              {modulo.novo}
            </Link>
          </div>

          {temAbas && (
            <div
              role="group"
              aria-label="Exibir"
              className="flex gap-6 border-b border-gray-200"
            >
              {[
                { rotulo: "Termos", castrados: false },
                { rotulo: "Animais já castrados", castrados: true },
              ].map((aba) => (
                <button
                  key={aba.rotulo}
                  type="button"
                  aria-pressed={abaCastrados === aba.castrados}
                  onClick={() =>
                    setParametros(aba.castrados ? { aba: "castrados" } : {}, { replace: true })
                  }
                  className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
                    abaCastrados === aba.castrados
                      ? "border-[#1A1A1A] text-[#1A1A1A]"
                      : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                  }`}
                >
                  {aba.rotulo}
                </button>
              ))}
            </div>
          )}

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
                aria-label={`Buscar em ${modulo.titulo}`}
                placeholder={
                  abaCastrados
                    ? "Buscar por nome, raça, cor ou nº do animal..."
                    : modulo.temAnimal
                    ? "Buscar por animal, responsável ou nº do registro..."
                    : "Buscar por nome ou nº do registro..."
                }
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
              />
            </div>
            {modulo.temAnimal && (
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
            )}
          </div>
        </section>

        {abaCastrados && (
          <AnimaisCastrados busca={busca} especie={especie} normalizar={normalizar} />
        )}

        {!abaCastrados && erro && (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <p className="text-sm font-bold text-[#DC2626]">
              Não foi possível carregar os registros.
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

        {!abaCastrados && !registros && !erro && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-16 text-gray-500"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]"></div>
            <span>Carregando...</span>
          </div>
        )}

        {!abaCastrados && registros && visiveis.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <i aria-hidden="true" className={`bi ${modulo.icone} text-4xl text-gray-400`}></i>
            <p className="mt-3 font-bold text-[#1A1A1A]">
              {registros.length === 0
                ? `${nenhum} ${modulo.singular} registrad${fim} ainda`
                : `${nenhum} ${modulo.singular} encontrad${fim}`}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {registros.length === 0
                ? `Use o botão “${modulo.novo}” para começar.`
                : "Tente mudar a busca ou o filtro."}
            </p>
          </div>
        )}

        {!abaCastrados && visiveis.length > 0 && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((registro) => (
              <li key={registro.id} className="min-w-0">
                <RegistroCard modulo={modulo} registro={registro} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
