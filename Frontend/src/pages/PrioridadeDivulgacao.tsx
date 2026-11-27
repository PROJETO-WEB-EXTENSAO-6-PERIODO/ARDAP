import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { grupoEspecie, rotulo } from "../components/AnimalCard";
import { BarraPontuacao } from "../components/CartaoIA";
import { FotoAnimal } from "../components/FotoAnimal";
import { Header } from "../components/Header";
import { api } from "../services/api";
import {
  decimal,
  FAIXAS,
  mensagemErro,
  type Faixa,
  type ItemPrioridade,
} from "../services/ia";
import { formatarIdade } from "../services/idade";

const ORDENS = [
  { valor: "menor", rotulo: "Menor chance primeiro" },
  { valor: "tempo", rotulo: "Mais tempo no abrigo" },
  { valor: "maior", rotulo: "Maior chance primeiro" },
] as const;
type Ordem = (typeof ORDENS)[number]["valor"];

const ESPECIES = [
  { valor: "", rotulo: "Todas" },
  { valor: "cao", rotulo: "Cães" },
  { valor: "gato", rotulo: "Gatos" },
  { valor: "outro", rotulo: "Outros" },
];

const EMOJI: Record<string, string> = { cao: "🐶", gato: "🐱", outro: "🐾" };

function Resumo({ itens }: { itens: ItemPrioridade[] }) {
  const contar = (f: Faixa) => itens.filter((i) => i.faixa === f).length;
  const atencao = itens.filter((i) => i.atencao).length;
  const cartoes = [
    { titulo: "Pedem atenção", valor: atencao, dica: "Chance baixa e mais de 30 dias no abrigo", classe: "border-red-300" },
    { titulo: FAIXAS.baixa.titulo, valor: contar("baixa"), dica: FAIXAS.baixa.dica, classe: "border-red-100" },
    { titulo: FAIXAS.media.titulo, valor: contar("media"), dica: FAIXAS.media.dica, classe: "border-amber-100" },
    { titulo: FAIXAS.alta.titulo, valor: contar("alta"), dica: FAIXAS.alta.dica, classe: "border-green-100" },
  ];
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cartoes.map((c) => (
        <li
          key={c.titulo}
          className={`flex flex-col gap-1 rounded-2xl border-2 bg-white p-4 shadow-sm ${c.classe}`}
        >
          <span className="text-xs font-semibold text-gray-500">{c.titulo}</span>
          <span className="text-3xl font-bold text-[#1A1A1A]">{c.valor}</span>
          <span className="text-xs text-gray-500">{c.dica}</span>
        </li>
      ))}
    </ul>
  );
}

function Linha({ item, posicao }: { item: ItemPrioridade; posicao: number }) {
  const faixa = FAIXAS[item.faixa];
  const grupo = grupoEspecie(item.especie);
  const nome = item.nome || "Animal sem nome";
  return (
    <li>
      <Link
        to={`/animais/${item.animal_id}`}
        className="grid grid-cols-[auto_auto_1fr] items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#1A1A1A] md:grid-cols-[auto_auto_1.4fr_1fr_1.2fr]"
      >
        <span className="w-6 text-center text-sm font-bold text-gray-400">
          {posicao}
        </span>
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-2xl"
        >
          {item.tem_foto ? (
            <FotoAnimal
              id={item.animal_id}
              alt=""
              className="h-full w-full object-cover"
              fallback={EMOJI[grupo]}
            />
          ) : (
            EMOJI[grupo]
          )}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate font-bold text-[#1A1A1A]">
            {nome}
            {item.atencao && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                <i aria-hidden="true" className="bi bi-exclamation-triangle-fill"></i>
                Atenção
              </span>
            )}
          </p>
          <p className="truncate text-sm text-gray-500">
            {[rotulo(item.especie), item.raca, rotulo(item.sexo), formatarIdade(item.idade_estimada)]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
        <p className="col-span-3 text-sm text-gray-600 md:col-span-1">
          <i aria-hidden="true" className="bi bi-calendar3 mr-1.5"></i>
          {item.dias_no_abrigo} {item.dias_no_abrigo === 1 ? "dia" : "dias"} no abrigo
        </p>
        <div className="col-span-3 flex flex-col gap-1.5 md:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${faixa.classe}`}>
              {faixa.titulo}
            </span>
            <span className="text-sm font-semibold text-[#1A1A1A]">
              {decimal(item.probabilidade)}
            </span>
          </div>
          <BarraPontuacao valor={item.probabilidade} classe={faixa.barra} />
        </div>
      </Link>
    </li>
  );
}

export function PrioridadeDivulgacao() {
  const [itens, setItens] = useState<ItemPrioridade[] | null>(null);
  const [erro, setErro] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("menor");
  const [especie, setEspecie] = useState("");
  const [faixa, setFaixa] = useState<"" | Faixa>("");

  const carregar = useCallback(async () => {
    setErro("");
    try {
      const { data } = await api.get<ItemPrioridade[]>("/ia/prioridade");
      setItens(data);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar a lista de prioridade."));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const lista = (itens ?? []).filter(
      (i) =>
        (!especie || grupoEspecie(i.especie) === especie) &&
        (!faixa || i.faixa === faixa),
    );
    const comparar: Record<Ordem, (a: ItemPrioridade, b: ItemPrioridade) => number> = {
      menor: (a, b) => a.probabilidade - b.probabilidade || b.dias_no_abrigo - a.dias_no_abrigo,
      maior: (a, b) => b.probabilidade - a.probabilidade,
      tempo: (a, b) => b.dias_no_abrigo - a.dias_no_abrigo,
    };
    return lista.sort(comparar[ordem]);
  }, [itens, especie, faixa, ordem]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#1A1A1A]">
                <i aria-hidden="true" className="bi bi-stars"></i>
                Prioridade de divulgação
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Animais disponíveis para adoção, ordenados pela chance estimada de
                serem adotados em até 30 dias. Quem tem menos chance aparece
                primeiro: são eles que mais precisam de feiras, redes sociais e
                contato com adotantes.
              </p>
            </div>
            <Link
              to="/ia/sobre"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-white px-4 py-2 text-sm font-semibold text-[#1A1A1A] transition-all hover:bg-gray-50 active:scale-95"
            >
              <i aria-hidden="true" className="bi bi-info-circle"></i>
              Sobre o modelo
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Filtrar por espécie" className="flex flex-wrap gap-2">
              {ESPECIES.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  aria-pressed={especie === e.valor}
                  onClick={() => setEspecie(e.valor)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    especie === e.valor
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {e.rotulo}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Faixa
                <select
                  value={faixa}
                  onChange={(e) => setFaixa(e.target.value as "" | Faixa)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
                >
                  <option value="">Todas</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Ordenar
                <select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as Ordem)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
                >
                  {ORDENS.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.rotulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        {erro && (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <p className="text-sm font-bold text-[#DC2626]">{erro}</p>
            <button
              type="button"
              onClick={() => void carregar()}
              className="cursor-pointer rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!itens && !erro && (
          <div role="status" className="flex items-center justify-center gap-3 py-16 text-gray-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]"></div>
            <span>Calculando a chance de cada animal...</span>
          </div>
        )}

        {itens && <Resumo itens={itens} />}

        {itens && visiveis.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <span aria-hidden="true" className="text-4xl">🐾</span>
            <p className="mt-3 font-bold text-[#1A1A1A]">
              {itens.length === 0
                ? "Nenhum animal disponível para adoção"
                : "Nenhum animal com esses filtros"}
            </p>
          </div>
        )}

        {visiveis.length > 0 && (
          <ol aria-label="Animais por prioridade" className="flex flex-col gap-3">
            {visiveis.map((item, i) => (
              <Linha key={item.animal_id} item={item} posicao={i + 1} />
            ))}
          </ol>
        )}

        <p className="text-center text-xs text-gray-500">
          A pontuação é uma estimativa aprendida com dados de outro abrigo e serve
          para apoiar a decisão da equipe. Ela não decide sozinha.
        </p>
      </main>
    </div>
  );
}
