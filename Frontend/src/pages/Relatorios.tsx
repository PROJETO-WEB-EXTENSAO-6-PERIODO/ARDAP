import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Header } from "../components/Header";
import { RelatorioDocumento, type Relatorio } from "../components/RelatorioDocumento";
import { api } from "../services/api";
import { baixarArquivo } from "../services/arquivos";
import {
  periodoDe,
  rotuloPeriodo,
  type Periodo,
  type TipoPeriodo,
} from "../services/periodo";
import { hojeISO } from "../services/datas";

const TIPOS: Array<{ valor: TipoPeriodo; rotulo: string }> = [
  { valor: "mes", rotulo: "Mês" },
  { valor: "trimestre", rotulo: "Trimestre" },
  { valor: "ano", rotulo: "Ano" },
  { valor: "datas", rotulo: "Datas" },
];

const MODULOS = [
  { chave: "animais", rotulo: "Animais" },
  { chave: "supatas", rotulo: "SUPATAS" },
  { chave: "adocoes", rotulo: "Adoções" },
  { chave: "castracoes", rotulo: "Castrações" },
  { chave: "cirurgias", rotulo: "Cirurgias" },
  { chave: "eutanasias", rotulo: "Eutanásias" },
  { chave: "hipossuficiencias", rotulo: "Hipossuficiência" },
];

// Hipossuficiência não é atividade com animais: entra só se for marcada.
const MODULOS_PADRAO = MODULOS.map((m) => m.chave).filter((c) => c !== "hipossuficiencias");

const campoCls =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]";

// params com vários módulos: a API espera a chave repetida.
function consulta(periodo: Periodo, modulos: string[]) {
  const params = new URLSearchParams({ inicio: periodo.inicio, fim: periodo.fim });
  for (const modulo of modulos) params.append("modulos", modulo);
  return params.toString();
}

function mensagemDeErro(e: unknown) {
  const detalhe = isAxiosError(e) ? e.response?.data?.detail : null;
  return typeof detalhe === "string" ? detalhe : "Não foi possível gerar o relatório.";
}

export function Relatorios() {
  const [tipo, setTipo] = useState<TipoPeriodo>("mes");
  const [periodo, setPeriodo] = useState<Periodo>(() => periodoDe("mes"));
  const [modulos, setModulos] = useState(MODULOS_PADRAO);
  const [observacoes, setObservacoes] = useState("");
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const semModulos = modulos.length === 0;
  const datasInvalidas =
    !periodo.inicio || !periodo.fim || periodo.inicio > periodo.fim;
  const invalido = semModulos || datasInvalidas;
  const chamada = consulta(periodo, modulos);

  useEffect(() => {
    if (invalido) return;
    let ativo = true;
    setCarregando(true);
    setErro("");
    // Espera parar de clicar ou digitar antes de consultar.
    const espera = setTimeout(() => {
      api
        .get<Relatorio>(`/relatorios/atividades?${chamada}`)
        .then(({ data }) => {
          if (ativo) setRelatorio(data);
        })
        .catch((e) => {
          if (!ativo) return;
          setRelatorio(null);
          setErro(mensagemDeErro(e));
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [chamada, invalido, tentativa]);

  function escolherTipo(novo: TipoPeriodo) {
    setTipo(novo);
    // "Datas" parte do período que estava na tela.
    if (novo !== "datas") setPeriodo(periodoDe(novo, periodo.inicio || hojeISO()));
  }

  function mover(passo: number) {
    if (tipo !== "datas") setPeriodo(periodoDe(tipo, periodo.inicio, passo));
  }

  function alternar(chave: string) {
    setModulos((atuais) =>
      atuais.includes(chave) ? atuais.filter((c) => c !== chave) : [...atuais, chave],
    );
  }

  const nomeArquivo = `relatorio-ardap-${periodo.inicio}-a-${periodo.fim}`;
  const pronto = !invalido && !carregando && !erro && relatorio !== null;

  function imprimir() {
    // O navegador sugere o título da página como nome do PDF.
    const titulo = document.title;
    document.title = nomeArquivo;
    window.addEventListener("afterprint", () => (document.title = titulo), { once: true });
    window.print();
  }

  async function baixarExcel() {
    setBaixando(true);
    setErro("");
    try {
      await baixarArquivo(`/relatorios/atividades/excel?${chamada}`, `${nomeArquivo}.xlsx`);
    } catch {
      setErro("Não foi possível baixar a planilha.");
    } finally {
      setBaixando(false);
    }
  }

  const noFuturo = tipo !== "datas" && periodoDe(tipo, periodo.inicio, 1).inicio > hojeISO();

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED] print:min-h-0 print:bg-white">
      <div className="contents print:hidden">
        <Header />
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8 print:block print:max-w-none print:p-0">
        <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm print:hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">
                Relatório de atividades
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Prestação de contas do período, só com totais e sem dados pessoais.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={imprimir}
                disabled={!pronto}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#FFD900] px-5 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i aria-hidden="true" className="bi bi-file-earmark-pdf"></i>
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => void baixarExcel()}
                disabled={!pronto || baixando}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i aria-hidden="true" className="bi bi-file-earmark-excel"></i>
                {baixando ? "Gerando..." : "Excel"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Tipo de período" className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  type="button"
                  aria-pressed={tipo === t.valor}
                  onClick={() => escolherTipo(t.valor)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    tipo === t.valor
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>

            {tipo === "datas" ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                  De
                  <input
                    type="date"
                    value={periodo.inicio}
                    onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
                    className={campoCls}
                  />
                </label>
                <label className="flex items-center gap-2">
                  até
                  <input
                    type="date"
                    value={periodo.fim}
                    onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
                    className={campoCls}
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => mover(-1)}
                  aria-label="Período anterior"
                  className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                >
                  <i aria-hidden="true" className="bi bi-chevron-left"></i>
                </button>
                <p
                  aria-live="polite"
                  className="min-w-44 text-center text-sm font-bold text-[#1A1A1A] first-letter:uppercase"
                >
                  {rotuloPeriodo(tipo, periodo)}
                </p>
                <button
                  type="button"
                  onClick={() => mover(1)}
                  disabled={noFuturo}
                  aria-label="Próximo período"
                  className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i aria-hidden="true" className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>

          <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
            <legend className="mb-2 text-sm font-semibold text-[#1A1A1A]">Incluir</legend>
            {MODULOS.map((m) => (
              <label key={m.chave} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={modulos.includes(m.chave)}
                  onChange={() => alternar(m.chave)}
                  className="h-4 w-4 accent-[#1A1A1A]"
                />
                {m.rotulo}
              </label>
            ))}
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
            Observações (opcional)
            <textarea
              rows={3}
              maxLength={3000}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Texto que sai no fim do PDF. Não é salvo nem vai para o Excel."
              className={`${campoCls} font-normal`}
            />
          </label>
        </section>

        {invalido && (
          <p
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900 print:hidden"
          >
            {semModulos
              ? "Escolha ao menos um módulo."
              : "Informe um período em que a data inicial venha antes da final."}
          </p>
        )}

        {!invalido && erro && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626] print:hidden"
          >
            {erro}
            <button
              type="button"
              onClick={() => setTentativa((n) => n + 1)}
              className="cursor-pointer rounded-lg bg-[#1A1A1A] px-4 py-2 font-semibold text-white"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!invalido && carregando && (
          <p role="status" className="text-center text-sm text-gray-500 print:hidden">
            Gerando relatório...
          </p>
        )}

        {!invalido && relatorio && (
          <div className={carregando ? "opacity-50" : undefined}>
            <RelatorioDocumento relatorio={relatorio} observacoes={observacoes} />
          </div>
        )}
      </main>
    </div>
  );
}
