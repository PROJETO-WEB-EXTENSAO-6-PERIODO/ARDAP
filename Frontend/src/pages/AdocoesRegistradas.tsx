import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Autoria } from "../components/Autoria";
import { FotoAnimal } from "../components/FotoAnimal";
import { Header } from "../components/Header";
import {
  emojiDoAnimal,
  formatarData,
  nomeDoAnimal,
  rotulo,
  type TermoAdocao,
} from "../services/adocoes";
import { api } from "../services/api";

const FILTROS = [
  { valor: "", rotulo: "Todas" },
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

function grupoEspecie(adocao: TermoAdocao) {
  const especie = adocao.animal?.especie;
  return especie === "cao" || especie === "gato" ? especie : "outro";
}

function Linha({ icone, label, valor }: { icone: string; label: string; valor: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 text-sm">
      <dt className="shrink-0 text-gray-500">
        <i aria-hidden="true" className={`bi ${icone}`}></i>
        <span className="sr-only">{label}</span>
      </dt>
      <dd
        title={valor ?? undefined}
        className={`min-w-0 truncate ${valor ? "text-[#1A1A1A]" : "text-gray-400"}`}
      >
        {valor || "Não informado"}
      </dd>
    </div>
  );
}

function AdocaoCard({ adocao }: { adocao: TermoAdocao }) {
  const { animal } = adocao;
  const emoji = emojiDoAnimal(animal);
  const detalhes = animal
    ? [rotulo(animal.especie), animal.raca, rotulo(animal.sexo)].filter(Boolean).join(" • ")
    : "Termo sem animal cadastrado";
  const local = [adocao.bairro, adocao.cidade].filter(Boolean).join(", ");
  const data = formatarData(adocao.data_assinatura ?? adocao.created_at);

  return (
    <Link
      to={`/adocoes/${adocao.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A1A]"
    >
      <div className="flex items-center gap-4 bg-green-50 p-5">
        <span
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-4xl shadow-sm"
        >
          {animal?.tem_foto ? (
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
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-[#1A1A1A]">{nomeDoAnimal(animal)}</h2>
          <p className="truncate text-sm text-gray-600">{detalhes}</p>
          {data && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              <i aria-hidden="true" className="bi bi-heart-fill"></i>
              Adoção em {data}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-500">Adotante</p>
          <p className="truncate font-bold text-[#1A1A1A]" title={adocao.nome_adotante}>
            {adocao.nome_adotante}
          </p>
        </div>
        <dl className="flex flex-col gap-2">
          <Linha icone="bi-telephone" label="Telefone" valor={adocao.telefone} />
          <Linha icone="bi-geo-alt" label="Bairro e cidade" valor={local || null} />
        </dl>
        <Autoria autor={adocao.funcionario} data={adocao.created_at} />
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
          <span className="text-gray-500">Termo nº {adocao.id}</span>
          <span className="inline-flex items-center gap-1 font-bold text-[#1A1A1A]">
            Ver termo
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

export function AdocoesRegistradas() {
  const [adocoes, setAdocoes] = useState<TermoAdocao[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [especie, setEspecie] = useState("");

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<TermoAdocao[]>("/adocoes");
      setAdocoes(data);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (adocoes ?? []).filter((adocao) => {
      if (especie && grupoEspecie(adocao) !== especie) return false;
      const texto = [
        nomeDoAnimal(adocao.animal),
        adocao.nome_adotante,
        adocao.bairro,
        adocao.cidade,
        String(adocao.id),
      ]
        .filter(Boolean)
        .join(" ");
      return normalizar(texto).includes(termo);
    });
  }, [adocoes, busca, especie]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Adoções</h1>
              <p aria-live="polite" className="mt-1 text-sm text-gray-500">
                {adocoes
                  ? `Mostrando ${visiveis.length} de ${adocoes.length} ${adocoes.length === 1 ? "adoção" : "adoções"}`
                  : "Todos os termos de adoção registrados"}
              </p>
            </div>
            <Link
              to="/adocoes"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFD900] px-5 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95"
            >
              <i aria-hidden="true" className="bi bi-plus-lg"></i>
              Nova adoção
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
                aria-label="Buscar adoções"
                placeholder="Buscar por animal, adotante, bairro, cidade ou nº do termo..."
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
              Não foi possível carregar as adoções.
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

        {!adocoes && !erro && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-16 text-gray-500"
          >
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]"></div>
            <span>Carregando adoções...</span>
          </div>
        )}

        {adocoes && visiveis.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="font-bold text-[#1A1A1A]">
              {adocoes.length === 0
                ? "Nenhuma adoção registrada ainda"
                : "Nenhuma adoção encontrada"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {adocoes.length === 0
                ? "Use o botão “Nova adoção” para registrar a primeira."
                : "Tente mudar a busca ou o filtro de espécie."}
            </p>
          </div>
        )}

        {visiveis.length > 0 && (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((adocao) => (
              <li key={adocao.id} className="min-w-0">
                <AdocaoCard adocao={adocao} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
