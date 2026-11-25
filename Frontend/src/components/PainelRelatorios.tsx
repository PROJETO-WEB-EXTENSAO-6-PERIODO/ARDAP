import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

interface Modulo {
  chave: string;
  nome: string;
  total: number;
  ultimoRegistro: string | null;
}

interface ResumoProcedimento {
  total: number;
  porEspecie: Record<string, number>;
  porSexo: Record<string, number>;
  porProcedimento: Record<string, number>;
  porBairro: Record<string, number>;
  bairrosDistintos: number;
  especiesDistintas: number;
}

interface Resumo {
  geradoEm: string;
  totais: Record<string, number>;
  totalGeral: number;
  modulos: Modulo[];
  animais: {
    total: number;
    porEspecie: Record<string, number>;
    porSexo: Record<string, number>;
    porPorte: Record<string, number>;
    porTemperamento: Record<string, number>;
    castrados: Record<string, number>;
    vacinados: Record<string, number>;
    vermifugados: Record<string, number>;
    origens: Record<string, number>;
    taxaCastracao: number;
    taxaVacinacao: number;
    taxaVermifugacao: number;
  };
  supatas: {
    total: number;
    porSituacao: Record<string, number>;
    porEspecie: Record<string, number>;
    porSexo: Record<string, number>;
  };
  adocoes: {
    total: number;
    porEspecie: Record<string, number>;
    porSexo: Record<string, number>;
    porRaca: Record<string, number>;
    porCidade: Record<string, number>;
    porCorPelo: Record<string, number>;
    castrados: Record<string, number>;
    vermifugados: Record<string, number>;
    taxaCastracao: number;
    cidadesDistintas: number;
    mediaPorMes: number;
    perfilAdotante: Record<string, number>;
  };
  castracoes: ResumoProcedimento;
  cirurgias: ResumoProcedimento;
  hipossuficiencia: {
    total: number;
    porTipoDocumento: Record<string, number>;
    motivos: Record<string, number>;
    comAnexos: number;
  };
  eutanasia: {
    total: number;
    porEspecie: Record<string, number>;
    porSexo: Record<string, number>;
    porCidade: Record<string, number>;
    porBairro: Record<string, number>;
    cidadesDistintas: number;
  };
  procedimentos: {
    total: number;
    castracoes: number;
    cirurgias: number;
    tutoresUnicos: number;
    bairrosDistintos: number;
    animaisVinculados: number;
    comAssinatura: number;
    ultimos: Array<{
      tipo: string;
      animal: string;
      tutor: string;
      bairro: string;
      procedimento: string;
      data: string | null;
    }>;
  };
  ultimos30Dias: Record<string, number>;
  serieMensal: Array<{
    mes: string;
    animais: number;
    supatas: number;
    adocoes: number;
    castracoes: number;
    cirurgias: number;
    hipossuficiencia: number;
    eutanasia: number;
  }>;
}

type Tom =
  | "verde"
  | "azul"
  | "amarelo"
  | "vermelho"
  | "violeta"
  | "ciano"
  | "neutro"
  | "rosa";

interface Destaque {
  tom: "azul" | "violeta" | "amarelo";
  titulo: string;
  valor: string;
  detalhe: string;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const AZUL = ["#2563EB", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];
const AMBAR = ["#B45309", "#D97706", "#F59E0B", "#FBBF24", "#FDE68A"];
const MARROM = ["#92400E", "#B45309", "#D97706", "#F59E0B", "#FCD34D"];
const VERMELHO = ["#EF4444", "#F87171", "#F59E0B", "#FBBF24", "#FDE68A"];
const SLATE = ["#334155", "#475569", "#64748B", "#94A3B8", "#CBD5E1"];
const VIOLETA = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE"];

// A cor acompanha a categoria, não a posição: cão é sempre verde, mesmo quando
// há mais gatos. As três barras usam o mesmo par, conferido para daltonismo.
const COR_PRIMARIA = "#047857";
const COR_SECUNDARIA = "#F59E0B";
const CORES_CATEGORIA: Record<string, string> = {
  Cão: COR_PRIMARIA,
  Canino: COR_PRIMARIA,
  Gato: COR_SECUNDARIA,
  Felino: COR_SECUNDARIA,
  Outro: "#6366F1",
  Macho: COR_PRIMARIA,
  Fêmea: COR_SECUNDARIA,
  Sim: COR_PRIMARIA,
  Não: COR_SECUNDARIA,
};
const COR_SEM_CATEGORIA = "#CBD5E1";

function corDaCategoria(rotulo: string) {
  return CORES_CATEGORIA[rotulo] ?? COR_SEM_CATEGORIA;
}

const TILE: Record<Tom, string> = {
  verde: "bg-gradient-to-br from-emerald-200 to-emerald-50 text-emerald-600",
  azul: "bg-gradient-to-br from-sky-200 to-sky-50 text-sky-600",
  amarelo: "bg-gradient-to-br from-amber-200 to-amber-50 text-amber-600",
  vermelho: "bg-gradient-to-br from-rose-200 to-rose-50 text-rose-500",
  violeta: "bg-gradient-to-br from-violet-200 to-violet-50 text-violet-600",
  ciano: "bg-gradient-to-br from-cyan-200 to-cyan-50 text-cyan-600",
  neutro: "bg-gradient-to-br from-slate-200 to-slate-50 text-slate-500",
  rosa: "bg-gradient-to-br from-pink-200 to-pink-50 text-pink-500",
};

const CARD: Record<Tom, string> = {
  verde: "border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70",
  azul: "border-sky-100 bg-gradient-to-br from-white to-sky-50/70",
  amarelo: "border-amber-100 bg-gradient-to-br from-white to-amber-50/70",
  vermelho: "border-rose-100 bg-gradient-to-br from-white to-rose-50/70",
  violeta: "border-violet-100 bg-gradient-to-br from-white to-violet-50/70",
  ciano: "border-cyan-100 bg-gradient-to-br from-white to-cyan-50/70",
  neutro: "border-gray-100 bg-white",
  rosa: "border-pink-100 bg-gradient-to-br from-white to-pink-50/70",
};

const DESTAQUE: Record<Destaque["tom"], string> = {
  azul: "border-sky-100 bg-gradient-to-br from-[#F8FCFF] to-[#E5F1FD]",
  violeta: "border-violet-100 bg-gradient-to-br from-[#FBF9FF] to-[#EEE9FE]",
  amarelo: "border-[#FFE9A0] bg-gradient-to-br from-[#FFFDF6] to-[#FFF4C9]",
};

const SERIES_MENSAIS = [
  { chave: "animais", rotulo: "Animais", cor: "#3B82F6" },
  { chave: "supatas", rotulo: "SUPATAS", cor: "#F59E0B" },
  { chave: "adocoes", rotulo: "Adoções", cor: "#22C55E" },
  { chave: "castracoes", rotulo: "Castração", cor: "#F87171" },
  { chave: "cirurgias", rotulo: "Cirurgias", cor: "#22D3EE" },
  { chave: "hipossuficiencia", rotulo: "Hipossuficiência", cor: "#A855F7" },
  { chave: "eutanasia", rotulo: "Eutanásia", cor: "#334155" },
] as const;

type SerieMensal = Resumo["serieMensal"][number];

function totalMes(item: SerieMensal) {
  return SERIES_MENSAIS.reduce((soma, serie) => soma + item[serie.chave], 0);
}

function numero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function rotuloQuantidade(valor: number, singular: string, plural: string) {
  return `${numero(valor)} ${valor === 1 ? singular : plural}`;
}

function labelMes(mes: string) {
  const [ano, m] = mes.split("-");
  const indice = Number(m) - 1;
  return `${MESES[indice] ?? m}/${ano.slice(2)}`;
}

function topo(mapa: Record<string, number>) {
  const entries = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  return entries[0] ?? null;
}

function SectionTitle({
  icon,
  title,
  subtitle,
  tom = "amarelo",
}: {
  icon: string;
  title: string;
  subtitle?: string;
  tom?: Tom;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] ${TILE[tom]}`}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold leading-tight text-[#1A1A1A]">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Vazio({ mensagem = "Sem dados registrados" }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <i className="bi bi-inbox text-2xl text-gray-300"></i>
      <p className="text-xs text-gray-400">{mensagem}</p>
    </div>
  );
}

function Gauge({ label, valor, detalhe }: { label: string; valor: number; detalhe?: string }) {
  const pct = Math.max(0, Math.min(100, valor));
  const cor = pct >= 70 ? "#16A34A" : pct >= 40 ? "#F59E0B" : "#DC2626";
  const fundo =
    pct >= 70
      ? "border-emerald-100 bg-gradient-to-b from-white to-emerald-50/80"
      : pct >= 40
        ? "border-amber-100 bg-gradient-to-b from-white to-amber-50/80"
        : "border-rose-100 bg-gradient-to-b from-white to-rose-50/80";

  return (
    <div className={`flex flex-col items-center gap-2.5 rounded-2xl border p-5 shadow-sm ${fundo}`}>
      <div
        className="relative h-24 w-24 rounded-full"
        style={{ background: `conic-gradient(${cor} ${pct}%, #E7E8E3 ${pct}% 100%)` }}
      >
        <div className="absolute inset-[8px] flex items-center justify-center rounded-full bg-white">
          <span className="text-lg font-bold text-[#1A1A1A]">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-[#1A1A1A]">{label}</p>
        {detalhe && <p className="mt-0.5 text-[11px] text-gray-400">{detalhe}</p>}
      </div>
    </div>
  );
}

function StatCard({
  valor,
  rotulo,
  tom = "neutro",
}: {
  valor: string;
  rotulo: string;
  tom?: Tom;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${CARD[tom]}`}>
      <p className="text-2xl font-bold leading-none text-[#1A1A1A]">{valor}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500">
        {rotulo}
      </p>
    </div>
  );
}

function BarrasLista({
  dados,
  cores,
  limite,
  empilhado = false,
}: {
  dados: Record<string, number>;
  cores: string[];
  limite?: number;
  empilhado?: boolean;
}) {
  let entries = Object.entries(dados)
    .filter(([, valor]) => valor > 0)
    .sort((a, b) => b[1] - a[1]);
  if (limite) entries = entries.slice(0, limite);
  const total = entries.reduce((soma, [, valor]) => soma + valor, 0);
  const maximo = Math.max(...entries.map(([, valor]) => valor), 1);

  if (entries.length === 0) return <Vazio />;

  if (empilhado) {
    return (
      <div className="space-y-3">
        {entries.map(([rotulo, valor], indice) => (
          <div key={rotulo}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] leading-snug text-gray-600">{rotulo}</span>
              <span className="shrink-0 text-[11px] font-bold text-[#1A1A1A]">
                {numero(valor)}
                <span className="ml-1 font-normal text-gray-400">
                  {total ? `${Math.round((valor / total) * 100)}%` : ""}
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F1EE]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(valor / maximo) * 100}%`,
                  backgroundColor: cores[indice % cores.length],
                  minWidth: valor > 0 ? "4px" : "0",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {entries.map(([rotulo, valor], indice) => (
        <div key={rotulo} className="flex items-center gap-2">
          <span
            className="w-[80px] shrink-0 truncate text-[11px] text-gray-600"
            title={rotulo}
          >
            {rotulo}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F1EE]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(valor / maximo) * 100}%`,
                backgroundColor: cores[indice % cores.length],
                minWidth: valor > 0 ? "4px" : "0",
              }}
            ></div>
          </div>
          <span className="w-14 shrink-0 text-right text-[11px] font-bold text-[#1A1A1A]">
            {numero(valor)}
            <span className="ml-1 font-normal text-gray-400">
              {total ? `${Math.round((valor / total) * 100)}%` : ""}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function BarCard({
  title,
  dados,
  cores,
  limite,
  tom = "neutro",
  empilhado = false,
}: {
  title: string;
  dados: Record<string, number>;
  cores: string[];
  limite?: number;
  tom?: Tom;
  empilhado?: boolean;
}) {
  const total = Object.values(dados).reduce((soma, valor) => soma + valor, 0);

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${CARD[tom]}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[#1A1A1A]">{title}</h3>
        {total > 0 && (
          <span className="text-[10px] font-semibold text-gray-400">{numero(total)}</span>
        )}
      </div>
      <BarrasLista dados={dados} cores={cores} limite={limite} empilhado={empilhado} />
    </div>
  );
}

function DonutCard({
  title,
  dados,
  centro,
  cores,
  tom = "neutro",
}: {
  title: string;
  dados: Record<string, number>;
  centro?: string;
  cores: string[];
  tom?: Tom;
}) {
  const entries = Object.entries(dados)
    .filter(([, valor]) => valor > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((soma, [, valor]) => soma + valor, 0);

  let acumulado = 0;
  const segmentos = entries.map(([rotulo, valor], indice) => {
    const pct = total ? (valor / total) * 100 : 0;
    const inicio = acumulado;
    acumulado += pct;
    return { rotulo, valor, pct, cor: cores[indice % cores.length], inicio };
  });
  const gradiente = segmentos
    .map((s) => `${s.cor} ${s.inicio}% ${s.inicio + s.pct}%`)
    .join(", ");

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${CARD[tom]}`}>
      <h3 className="mb-3 text-xs font-bold text-[#1A1A1A]">{title}</h3>
      {total === 0 ? (
        <Vazio />
      ) : (
        <div className="flex items-center gap-3">
          <div
            className="relative h-16 w-16 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${gradiente})` }}
          >
            <div className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full bg-white">
              <span className="text-sm font-bold leading-none text-[#1A1A1A]">
                {numero(total)}
              </span>
              {centro && (
                <span className="mt-0.5 text-[7px] uppercase tracking-wide text-gray-400">
                  {centro}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {segmentos.map((s) => (
              <div key={s.rotulo} className="flex items-center gap-1 text-[10px]">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.cor }}
                ></span>
                <span className="flex-1 truncate text-gray-600" title={s.rotulo}>
                  {s.rotulo}
                </span>
                <span className="font-bold text-[#1A1A1A]">{numero(s.valor)}</span>
                <span className="w-6 shrink-0 text-right text-gray-400">
                  {s.pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DonutVertical({
  dados,
  cores,
  centro,
}: {
  dados: Record<string, number>;
  cores: string[];
  centro?: string;
}) {
  const entries = Object.entries(dados)
    .filter(([, valor]) => valor > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((soma, [, valor]) => soma + valor, 0);

  let acumulado = 0;
  const segmentos = entries.map(([rotulo, valor], indice) => {
    const pct = total ? (valor / total) * 100 : 0;
    const inicio = acumulado;
    acumulado += pct;
    return { rotulo, valor, pct, cor: cores[indice % cores.length], inicio };
  });
  const gradiente = segmentos
    .map((s) => `${s.cor} ${s.inicio}% ${s.inicio + s.pct}%`)
    .join(", ");

  if (total === 0) return <Vazio />;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradiente})` }}
      >
        <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">
          <span className="text-2xl font-bold leading-none text-[#1A1A1A]">
            {numero(total)}
          </span>
          {centro && (
            <span className="mt-1 text-[8px] uppercase tracking-wide text-gray-400">
              {centro}
            </span>
          )}
        </div>
      </div>
      <div className="w-full space-y-2">
        {segmentos.map((s) => (
          <div key={s.rotulo} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: s.cor }}
            ></span>
            <span className="flex-1 truncate text-gray-600" title={s.rotulo}>
              {s.rotulo}
            </span>
            <span className="font-bold text-[#1A1A1A]">{numero(s.valor)}</span>
            <span className="w-8 shrink-0 text-right text-gray-400">
              {s.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Distribuicoes({
  itens,
}: {
  itens: Array<{ rotulo: string; dados: Record<string, number> }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        {itens.map((item) => {
          const entries = Object.entries(item.dados)
            .filter(([, valor]) => valor > 0)
            .sort((a, b) => b[1] - a[1]);
          const total = entries.reduce((soma, [, valor]) => soma + valor, 0);
          return (
            <div
              key={item.rotulo}
              className="grid grid-cols-1 items-center gap-2.5 sm:grid-cols-[150px_1fr_auto]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {item.rotulo}
              </span>
              {total === 0 ? (
                <p className="text-xs text-gray-400 sm:col-span-2">Sem dados</p>
              ) : (
                <>
                  <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-[#F1F1EE]">
                    {entries.map(([rotulo, valor]) => (
                      <div
                        key={rotulo}
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${(valor / total) * 100}%`,
                          backgroundColor: corDaCategoria(rotulo),
                        }}
                        title={`${rotulo}: ${numero(valor)}`}
                      ></div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {entries.map(([rotulo, valor]) => (
                      <span key={rotulo} className="flex items-center gap-1.5 text-[11px]">
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{ backgroundColor: corDaCategoria(rotulo) }}
                        ></span>
                        <span className="text-gray-600">{rotulo}</span>
                        <span className="font-bold text-[#1A1A1A]">{numero(valor)}</span>
                        <span className="text-gray-400">
                          {total ? `${Math.round((valor / total) * 100)}%` : ""}
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabelaProcedimentos({ dados }: { dados: Resumo["procedimentos"]["ultimos"] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">Últimos procedimentos</h3>
          <p className="text-[11px] text-gray-400">
            Registros mais recentes de castração e cirurgia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]"></span>
            Castração
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
            <span className="h-2 w-2 rounded-full bg-[#22D3EE]"></span>
            Cirurgia
          </span>
        </div>
      </div>
      {dados.length === 0 ? (
        <Vazio />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-gray-100 bg-[#FAFAF8] text-[10px] uppercase tracking-wide text-gray-400">
                <th className="px-5 py-2.5 font-semibold">Tipo</th>
                <th className="px-3 py-2.5 font-semibold">Animal</th>
                <th className="px-3 py-2.5 font-semibold">Tutor</th>
                <th className="hidden px-3 py-2.5 font-semibold sm:table-cell">Bairro</th>
                <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Procedimento</th>
                <th className="px-5 py-2.5 text-right font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item, indice) => {
                const castracao = item.tipo === "Castração";
                return (
                  <tr
                    key={`${item.tipo}-${indice}`}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            castracao ? "bg-[#EF4444]" : "bg-[#22D3EE]"
                          }`}
                        ></span>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] font-semibold text-[#1A1A1A]">
                      {item.animal}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-[11px] text-gray-600">
                      {item.tutor}
                    </td>
                    <td className="hidden max-w-[140px] truncate px-3 py-2.5 text-[11px] text-gray-600 sm:table-cell">
                      {item.bairro}
                    </td>
                    <td className="hidden max-w-[180px] truncate px-3 py-2.5 text-[11px] text-gray-600 md:table-cell">
                      {item.procedimento}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right text-[11px] text-gray-400">
                      {item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EvolucaoMensal({ dados }: { dados: Resumo["serieMensal"] }) {
  const maximo = Math.max(1, ...dados.map(totalMes));
  const total = dados.reduce((soma, item) => soma + totalMes(item), 0);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">Evolução dos últimos 6 meses</h3>
          <p className="text-[11px] text-gray-400">{numero(total)} registros no período</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
          {SERIES_MENSAIS.map((s) => (
            <div key={s.chave} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.cor }}></span>
              <span className="text-[10px] font-medium text-gray-500">{s.rotulo}</span>
            </div>
          ))}
        </div>
      </div>
      {total === 0 ? (
        <Vazio />
      ) : (
        <div className="flex items-end gap-2 sm:gap-3">
          {dados.map((item) => {
            const totalDoMes = totalMes(item);
            return (
              <div key={item.mes} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">{totalDoMes}</span>
                <div className="flex h-44 w-full max-w-[52px] flex-col-reverse overflow-hidden rounded-lg bg-[#F1F1EE]">
                  {SERIES_MENSAIS.map((s) => {
                    const valor = item[s.chave];
                    if (valor === 0) return null;
                    return (
                      <div
                        key={s.chave}
                        className="w-full transition-all duration-500 hover:opacity-80"
                        style={{
                          height: `${(valor / maximo) * 100}%`,
                          backgroundColor: s.cor,
                        }}
                        title={`${labelMes(item.mes)} · ${s.rotulo}: ${numero(valor)}`}
                      ></div>
                    );
                  })}
                </div>
                <span className="text-[11px] text-gray-400">{labelMes(item.mes)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DestaqueCard({ titulo, valor, detalhe, tom }: Destaque) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${DESTAQUE[tom]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{titulo}</p>
      <p className="mt-1.5 truncate text-2xl font-bold text-[#1A1A1A]" title={valor}>
        {valor}
      </p>
      <p className="mt-1 text-[11px] text-gray-500">{detalhe}</p>
    </div>
  );
}

export function PainelRelatorios() {
  const [dados, setDados] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (silencioso = false) => {
    if (silencioso) setAtualizando(true);
    else setCarregando(true);
    setErro("");
    try {
      const resposta = await api.get<Resumo>("/relatorios/resumo");
      setDados(resposta.data);
    } catch {
      setErro("Não foi possível carregar os relatórios.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const destaques = useMemo<Destaque[]>(() => {
    if (!dados) return [];
    const especie = topo(dados.animais.porEspecie);
    const totalAnimais = dados.animais.total || 0;
    const mes = [...dados.serieMensal].sort((a, b) => totalMes(b) - totalMes(a))[0];
    const mesTotal = mes ? totalMes(mes) : 0;
    const modulo = [...dados.modulos].sort((a, b) => b.total - a.total)[0];

    return [
      {
        tom: "azul",
        titulo: "Espécie predominante",
        valor: especie ? especie[0] : "—",
        detalhe:
          especie && totalAnimais
            ? `${Math.round((especie[1] / totalAnimais) * 100)}% dos animais cadastrados`
            : "Nenhum animal cadastrado",
      },
      {
        tom: "violeta",
        titulo: "Mês mais movimentado",
        valor: mes ? labelMes(mes.mes) : "—",
        detalhe: mes ? `${numero(mesTotal)} registros no mês` : "Sem histórico",
      },
      {
        tom: "amarelo",
        titulo: "Módulo mais ativo",
        valor: modulo ? modulo.nome : "—",
        detalhe: modulo
          ? `${numero(modulo.total)} registros · ${Math.round((modulo.total / Math.max(dados.totalGeral, 1)) * 100)}% do total`
          : "Sem registros",
      },
    ];
  }, [dados]);

  if (carregando) {
    return (
      <div className="flex flex-grow items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]"></div>
          <span>Carregando relatórios...</span>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <i className="bi bi-exclamation-triangle text-3xl text-[#DC2626]"></i>
          <div>
            <p className="text-sm font-bold text-[#DC2626]">
              {erro || "Sem dados disponíveis."}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Verifique a conexão com o servidor e tente novamente.
            </p>
          </div>
          <button
            onClick={() => void carregar()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Tentar novamente</span>
          </button>
        </div>
      </>
    );
  }

  const {
    animais,
    supatas,
    adocoes,
    procedimentos,
    hipossuficiencia,
    eutanasia,
    totalGeral,
    ultimos30Dias,
    serieMensal,
  } = dados;
  const total30 = Object.values(ultimos30Dias).reduce((soma, valor) => soma + valor, 0);

  const resumoHero = [
    { valor: numero(animais.total), rotulo: "Animais cadastrados" },
    { valor: numero(supatas.total), rotulo: "Resgates SUPATAS" },
    { valor: numero(adocoes.total), rotulo: "Adoções registradas" },
    { valor: numero(total30), rotulo: "Nos últimos 30 dias" },
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-[#1A1A1A] p-6 shadow-xl md:p-8">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD900] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
              <i className="bi bi-graph-up-arrow text-[11px]"></i>
              Painel analítico
            </span>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl">
              Central de Relatórios ARDAP
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-gray-400">
              Visão consolidada de todos os módulos: animais, resgates SUPATAS, adoções,
              castrações, cirurgias, hipossuficiência e eutanásia.
            </p>
          </div>

          <div className="flex items-center justify-between gap-5 md:justify-end">
            <div className="text-right">
              <p className="text-4xl font-bold leading-none text-[#FFD900] md:text-5xl">
                {numero(totalGeral)}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Registros no total
              </p>
            </div>
            <button
              onClick={() => void carregar(true)}
              disabled={atualizando}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#FFD900] px-4 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              <i className={`bi bi-arrow-clockwise ${atualizando ? "animate-spin" : ""}`}></i>
              <span>{atualizando ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-y-4 border-t border-white/10 pt-5">
          {resumoHero.map((item, indice) => (
            <div
              key={item.rotulo}
              className={`min-w-[130px] flex-1 ${
                indice > 0 ? "sm:border-l sm:border-white/10 sm:pl-5" : ""
              }`}
            >
              <p className="text-xl font-bold text-white">{item.valor}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                {item.rotulo}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-clipboard2-pulse"
          title="Indicadores de saúde animal"
          subtitle="Verde = meta atingida · âmbar abaixo de 70% · vermelho abaixo de 40%"
          tom="verde"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Gauge
            label="Castrados"
            valor={animais.taxaCastracao}
            detalhe={`${numero(animais.castrados["Sim"] ?? 0)} de ${numero(animais.total)}`}
          />
          <Gauge
            label="Vacinados"
            valor={animais.taxaVacinacao}
            detalhe={`${numero(animais.vacinados["Sim"] ?? 0)} de ${numero(animais.total)}`}
          />
          <Gauge
            label="Vermifugados"
            valor={animais.taxaVermifugacao}
            detalhe={`${numero(animais.vermifugados["Sim"] ?? 0)} de ${numero(animais.total)}`}
          />
          <Gauge
            label="Adotados castrados"
            valor={adocoes.taxaCastracao}
            detalhe={`${numero(adocoes.castrados["Sim"] ?? 0)} de ${numero(adocoes.total)}`}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-bar-chart-line"
          title="Movimentação mensal"
          subtitle="Registros de todos os módulos, cada um com sua cor fixa"
          tom="azul"
        />
        <EvolucaoMensal dados={serieMensal} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {destaques.map((item) => (
          <DestaqueCard key={item.titulo} {...item} />
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-paw"
          title="Perfil dos animais"
          subtitle={`${numero(animais.total)} animais cadastrados no sistema`}
          tom="azul"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <DonutCard
            title="Espécie"
            dados={animais.porEspecie}
            centro="animais"
            cores={AZUL}
          />
          <DonutCard title="Sexo" dados={animais.porSexo} centro="animais" cores={AZUL} />
          <BarCard title="Porte" dados={animais.porPorte} cores={AZUL} />
          <BarCard title="Temperamento" dados={animais.porTemperamento} cores={AZUL} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-heart-pulse"
          title="Resgates SUPATAS"
          subtitle={`${numero(supatas.total)} encaminhamentos registrados`}
          tom="amarelo"
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BarCard title="Situação do animal" dados={supatas.porSituacao} cores={VERMELHO} />
          <DonutCard
            title="Espécie resgatada"
            dados={supatas.porEspecie}
            centro="resgates"
            cores={AMBAR}
          />
          <BarCard title="Sexo" dados={supatas.porSexo} cores={MARROM} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-heart"
          title="Adoções"
          subtitle={rotuloQuantidade(adocoes.total, "termo registrado", "termos registrados")}
          tom="verde"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard tom="verde" valor={numero(adocoes.total)} rotulo="Termos registrados" />
          <StatCard
            tom="verde"
            valor={numero(adocoes.cidadesDistintas)}
            rotulo="Cidades atendidas"
          />
          <StatCard
            tom="verde"
            valor={numero(ultimos30Dias.adocoes ?? 0)}
            rotulo="Últimos 30 dias"
          />
          <StatCard
            tom="verde"
            valor={adocoes.mediaPorMes.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            rotulo="Média por mês"
          />
        </div>
        <Distribuicoes
          itens={[
            { rotulo: "Espécie adotada", dados: adocoes.porEspecie },
            { rotulo: "Sexo", dados: adocoes.porSexo },
            { rotulo: "Vermifugação", dados: adocoes.vermifugados },
          ]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-scissors"
          title="Castração e Cirurgias"
          subtitle={`${rotuloQuantidade(procedimentos.total, "procedimento registrado", "procedimentos registrados")} no total`}
          tom="vermelho"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          <StatCard valor={numero(procedimentos.total)} rotulo="Total" />
          <StatCard tom="rosa" valor={numero(procedimentos.castracoes)} rotulo="Castrações" />
          <StatCard tom="ciano" valor={numero(procedimentos.cirurgias)} rotulo="Cirurgias" />
          <StatCard valor={numero(procedimentos.tutoresUnicos)} rotulo="Tutores únicos" />
          <StatCard valor={numero(procedimentos.bairrosDistintos)} rotulo="Bairros atendidos" />
          <StatCard
            valor={numero(procedimentos.animaisVinculados)}
            rotulo="Animais vinculados"
          />
        </div>
        <TabelaProcedimentos dados={procedimentos.ultimos} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-file-earmark-text"
          title="Hipossuficiência"
          subtitle={rotuloQuantidade(
            hipossuficiencia.total,
            "declaração registrada",
            "declarações registradas",
          )}
          tom="violeta"
        />
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            tom="violeta"
            valor={numero(hipossuficiencia.total)}
            rotulo="Declarações"
          />
          <StatCard
            valor={numero(hipossuficiencia.total - hipossuficiencia.comAnexos)}
            rotulo="Sem anexos"
          />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-0 md:divide-x md:divide-gray-100">
            <div className="md:pr-7">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-[#1A1A1A]">Motivos declarados</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Critérios de renda e trabalho
                </p>
              </div>
              <BarrasLista
                dados={hipossuficiencia.motivos}
                cores={VIOLETA}
                empilhado
              />
            </div>
            <div className="flex flex-col md:pl-7">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-[#1A1A1A]">Tipo de documento</h3>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  Documento apresentado pelo representante
                </p>
              </div>
              <div className="flex flex-1 items-center">
                <DonutVertical
                  dados={hipossuficiencia.porTipoDocumento}
                  cores={VIOLETA}
                  centro="declarações"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle
          icon="bi-shield-plus"
          title="Eutanásia"
          subtitle={rotuloQuantidade(eutanasia.total, "termo registrado", "termos registrados")}
          tom="azul"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard valor={numero(eutanasia.total)} rotulo="Termos" />
          <StatCard valor={numero(ultimos30Dias.eutanasia ?? 0)} rotulo="Últimos 30 dias" />
          <StatCard valor={numero(eutanasia.cidadesDistintas)} rotulo="Cidades atendidas" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <BarCard title="Espécie" dados={eutanasia.porEspecie} cores={SLATE} />
          <BarCard title="Sexo" dados={eutanasia.porSexo} cores={SLATE} />
          <BarCard title="Cidades" dados={eutanasia.porCidade} cores={SLATE} limite={5} />
          <BarCard title="Bairros" dados={eutanasia.porBairro} cores={SLATE} limite={5} />
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-xs text-gray-500 shadow-sm">
        <span className="flex items-center gap-2">
          <i className="bi bi-clock-history text-[14px]"></i>
          Relatório gerado em {new Date(dados.geradoEm).toLocaleString("pt-BR")}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-600"></span>
          Dados extraídos diretamente do banco ARDAP
        </span>
      </footer>
    </>
  );
}
