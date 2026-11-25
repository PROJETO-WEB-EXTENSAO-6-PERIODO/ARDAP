import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimalCard, grupoEspecie, type Animal } from "../components/AnimalCard";
import { AvisoSucesso } from "../components/AvisoSucesso";
import { Header } from "../components/Header";
import { api } from "../services/api";

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
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
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
        <AvisoSucesso />
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
