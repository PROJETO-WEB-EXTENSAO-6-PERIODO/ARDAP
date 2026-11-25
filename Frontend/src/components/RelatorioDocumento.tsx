import type { ReactNode } from "react";
import { dataBR, mesBR, type Periodo } from "../services/periodo";

interface Linha {
  rotulo: string;
  total: number;
}

interface ModuloRelatorio {
  chave: string;
  titulo: string;
  total: number;
  anterior: number;
  // multipla: um registro pode contar em várias linhas.
  tabelas: Array<{ titulo: string; multipla: boolean; linhas: Linha[] }>;
}

export interface Relatorio {
  inicio: string;
  fim: string;
  anterior: Periodo;
  gerado_em: string;
  emitido_por: string;
  modulos: ModuloRelatorio[];
  situacao: {
    data: string;
    total: number;
    caes: number;
    gatos: number;
    outros: number;
    castrados: number;
    vacinados: number;
    vermifugados: number;
    medicacao: number;
  } | null;
  evolucao: Array<{ mes: string; valores: number[] }>;
  bairros: {
    colunas: Array<{ chave: string; titulo: string }>;
    linhas: Array<{ rotulo: string; valores: number[]; total: number }>;
  } | null;
}

const ICONES: Record<string, string> = {
  animais: "bi-clipboard-data",
  supatas: "bi-heart-pulse",
  adocoes: "bi-heart-fill",
  castracoes: "bi-scissors",
  cirurgias: "bi-bandaid",
  eutanasias: "bi-file-earmark-medical",
  hipossuficiencias: "bi-file-earmark-text",
};

// Frase de cada atividade no texto de destaques: singular e plural.
const FRASES: Record<string, [string, string]> = {
  animais: ["animal cadastrado", "animais cadastrados"],
  supatas: ["resgate pelo SUPATAS", "resgates pelo SUPATAS"],
  adocoes: ["adoção", "adoções"],
  castracoes: ["castração", "castrações"],
  cirurgias: ["cirurgia", "cirurgias"],
  eutanasias: ["eutanásia", "eutanásias"],
  hipossuficiencias: ["declaração de hipossuficiência", "declarações de hipossuficiência"],
};

function numero(valor: number) {
  return valor.toLocaleString("pt-BR");
}

function porcento(parte: number, total: number) {
  return total ? `${Math.round((parte / total) * 100)}%` : "0%";
}

function diferenca(atual: number, anterior: number) {
  const d = atual - anterior;
  return d === 0 ? "0" : `${d > 0 ? "+" : "−"}${numero(Math.abs(d))}`;
}

function listar(itens: string[]) {
  if (itens.length < 2) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-9 print:mt-7">
      <h2 className="mb-4 flex break-after-avoid items-center gap-3 text-base font-bold text-[#1A1A1A]">
        <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-[#FFD900]"></span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function CartaoNumero({ modulo }: { modulo: ModuloRelatorio }) {
  return (
    <li className="flex break-inside-avoid flex-col rounded-xl border border-gray-200 bg-[#FAFAF7] p-4 print:p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-gray-600">{modulo.titulo}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFD900] text-sm">
          <i aria-hidden="true" className={`bi ${ICONES[modulo.chave]}`}></i>
        </span>
      </div>
      <p className="mt-1 text-3xl font-bold leading-none tabular-nums">{numero(modulo.total)}</p>
      <p className="mt-2 text-[11px] text-gray-600">
        <strong className="text-[#1A1A1A]">{diferenca(modulo.total, modulo.anterior)}</strong> em
        relação ao período anterior ({numero(modulo.anterior)})
      </p>
    </li>
  );
}

function Barras({ titulo, linhas, total, multipla }: {
  titulo: string;
  linhas: Linha[];
  total: number;
  multipla: boolean;
}) {
  return (
    <div className="break-inside-avoid">
      <h4 className="mb-2 text-xs font-bold text-[#1A1A1A]">
        {titulo}
        {multipla && <span className="font-normal text-gray-500"> (de {numero(total)})</span>}
      </h4>
      <dl className="flex flex-col gap-2">
        {linhas.map((linha) => (
          <div key={linha.rotulo}>
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <dt className="min-w-0 break-words text-gray-700">{linha.rotulo}</dt>
              <dd className="shrink-0 tabular-nums">
                <strong>{numero(linha.total)}</strong>{" "}
                <span className="text-gray-500">{porcento(linha.total, total)}</span>
              </dd>
            </div>
            <div aria-hidden="true" className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#E5B800]"
                style={{ width: `${total ? (linha.total / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Um gráfico pequeno por atividade: lado a lado, sem disputar cores.
function MiniGrafico({ titulo, meses, valores }: {
  titulo: string;
  meses: string[];
  valores: number[];
}) {
  const maximo = Math.max(...valores, 1);
  const total = valores.reduce((soma, v) => soma + v, 0);
  const media = total / valores.length;
  return (
    <figure className="break-inside-avoid rounded-xl border border-gray-200 p-3">
      <figcaption className="flex items-baseline justify-between gap-2 text-[11px]">
        <strong>{titulo}</strong>
        <span className="text-gray-500">
          média {media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}/mês
        </span>
      </figcaption>
      <div aria-hidden="true" className="mt-2 flex h-20 items-end gap-[3px] border-b border-gray-300">
        {valores.map((valor, i) => (
          <div key={meses[i]} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
            {valor > 0 && valores.length <= 12 && (
              <span className="text-[8px] font-semibold leading-tight text-gray-700">{valor}</span>
            )}
            <div
              className="rounded-t-sm bg-[#1A1A1A]"
              style={{ height: `${(valor / maximo) * 78}%` }}
            ></div>
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1 flex justify-between text-[8px] text-gray-500">
        <span>{mesBR(meses[0])}</span>
        <span>{mesBR(meses[meses.length - 1])}</span>
      </div>
    </figure>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: string[]; linhas: Array<Array<string | number>> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 print:overflow-visible">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#1A1A1A] text-white">
            {cabecalho.map((titulo, i) => (
              <th
                key={titulo}
                scope="col"
                className={`px-3 py-2 font-semibold ${i === 0 ? "text-left" : "text-right"}`}
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha[0]} className="break-inside-avoid even:bg-[#FAFAF7]">
              {linha.map((valor, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-3 py-1.5 text-left font-medium">
                    {valor}
                  </th>
                ) : (
                  <td
                    key={i}
                    className={`px-3 py-1.5 text-right tabular-nums ${valor === 0 ? "text-gray-400" : ""}`}
                  >
                    {typeof valor === "number" ? numero(valor) : valor}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Destaques({ relatorio }: { relatorio: Relatorio }) {
  const ativos = relatorio.modulos.filter((m) => m.total > 0);
  const total = ativos.reduce((soma, m) => soma + m.total, 0);
  const partes = ativos.map((m) => `${numero(m.total)} ${FRASES[m.chave][m.total === 1 ? 0 : 1]}`);
  const bairro = relatorio.bairros?.linhas.find(
    (l) => l.rotulo !== "Outros bairros" && l.rotulo !== "Não informado",
  );
  const pico = relatorio.evolucao
    .map((l) => ({ mes: l.mes, total: l.valores.reduce((soma, v) => soma + v, 0) }))
    .reduce<{ mes: string; total: number } | null>(
      (maior, l) => (l.total > (maior?.total ?? 0) ? l : maior),
      null,
    );

  return (
    <div className="mt-6 rounded-xl border-l-4 border-[#FFD900] bg-[#FFFBE6] p-4 text-sm leading-relaxed">
      {total === 0 ? (
        <p>Nenhuma atividade foi registrada neste período.</p>
      ) : (
        <>
          <p>
            No período, a ARDAP registrou <strong>{listar(partes)}</strong>.
          </p>
          {(bairro || pico) && (
            <p className="mt-1.5">
              {pico && (
                <>
                  O mês com mais registros foi <strong>{mesBR(pico.mes)}</strong> (
                  {numero(pico.total)}).{" "}
                </>
              )}
              {bairro && (
                <>
                  O bairro com mais registros foi <strong>{bairro.rotulo}</strong> (
                  {numero(bairro.total)}).
                </>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function RelatorioDocumento({
  relatorio,
  observacoes,
}: {
  relatorio: Relatorio;
  observacoes: string;
}) {
  const { modulos, evolucao, bairros, situacao } = relatorio;
  const vazio = modulos.every((m) => m.total === 0);
  const comDetalhes = modulos.filter((m) => m.total > 0 && m.tabelas.length > 0);
  const meses = evolucao.map((l) => l.mes);
  // Com muitos módulos a tabela mensal não cabe na largura da folha.
  const titulos = modulos.map((m) => m.titulo.replace("Declarações de hipossuficiência", "Hipossuf."));

  // Os números das seções acompanham as que existem.
  let secao = 0;
  const numerar = (titulo: string) => `${++secao}. ${titulo}`;

  return (
    <article className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-sm bg-white text-[#1A1A1A] shadow-md [page:relatorio] [print-color-adjust:exact] print:max-w-none print:rounded-none print:shadow-none">
      <header className="flex items-center gap-5 bg-[#1A1A1A] px-6 py-7 text-white sm:px-12 print:rounded-xl print:px-7 print:py-6">
        <img
          src="/logo-ardap.png"
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl bg-white object-cover p-1"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#FFD900]">
            ARDAP – Associação Recanto dos Animais em Perigo
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">Relatório de atividades</h1>
          <p className="mt-1 text-sm text-gray-300">
            {dataBR(relatorio.inicio)} a {dataBR(relatorio.fim)} • Paulo Afonso/BA
          </p>
        </div>
      </header>
      <div aria-hidden="true" className="h-1.5 bg-[#FFD900] print:mt-1 print:rounded-full"></div>

      <div className="px-6 pb-12 sm:px-12 print:p-0">
        <Destaques relatorio={relatorio} />

        <Secao titulo={numerar("Números do período")}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
            {modulos.map((m) => (
              <CartaoNumero key={m.chave} modulo={m} />
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-gray-500">
            Período anterior: {dataBR(relatorio.anterior.inicio)} a{" "}
            {dataBR(relatorio.anterior.fim)}.
          </p>
        </Secao>

        {situacao && situacao.total > 0 && (
          <Secao titulo={numerar(`Animais sob cuidado em ${dataBR(situacao.data)}`)}>
            <div className="grid break-inside-avoid grid-cols-1 gap-x-8 gap-y-5 rounded-xl border border-gray-200 p-5 sm:grid-cols-[auto_1fr_1fr] print:grid-cols-[auto_1fr_1fr]">
              <div className="flex flex-col justify-center pr-4">
                <p className="text-5xl font-bold leading-none tabular-nums">
                  {numero(situacao.total)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {situacao.total === 1 ? "animal" : "animais"}
                </p>
              </div>
              <Barras
                titulo="Espécie"
                total={situacao.total}
                multipla={false}
                linhas={[
                  { rotulo: "Cães", total: situacao.caes },
                  { rotulo: "Gatos", total: situacao.gatos },
                  { rotulo: "Outros", total: situacao.outros },
                ].filter((l) => l.total > 0)}
              />
              <Barras
                titulo="Saúde"
                total={situacao.total}
                multipla
                linhas={[
                  { rotulo: "Castrados", total: situacao.castrados },
                  { rotulo: "Vacinados", total: situacao.vacinados },
                  { rotulo: "Vermifugados", total: situacao.vermifugados },
                  { rotulo: "Com medicação", total: situacao.medicacao },
                ]}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Animais cadastrados sem termo de adoção ou de eutanásia vinculado.
            </p>
          </Secao>
        )}

        {evolucao.length > 0 && !vazio && (
          <Secao titulo={numerar("Evolução mensal")}>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 print:grid-cols-3">
              {modulos.map((m, i) => (
                <MiniGrafico
                  key={m.chave}
                  titulo={m.titulo}
                  meses={meses}
                  valores={evolucao.map((l) => l.valores[i])}
                />
              ))}
            </div>
            <Tabela
              cabecalho={["Mês", ...titulos, "Total"]}
              linhas={evolucao.map((l) => [
                mesBR(l.mes),
                ...l.valores,
                l.valores.reduce((soma, v) => soma + v, 0),
              ])}
            />
          </Secao>
        )}

        {comDetalhes.length > 0 && (
          <Secao titulo={numerar("Detalhes por atividade")}>
            <div className="flex flex-col gap-5">
              {comDetalhes.map((modulo) => (
                <div
                  key={modulo.chave}
                  className="break-inside-avoid overflow-hidden rounded-xl border border-gray-200"
                >
                  <h3 className="flex items-center justify-between gap-3 bg-[#FAFAF7] px-5 py-3 text-sm font-bold">
                    <span className="flex items-center gap-2.5">
                      <i aria-hidden="true" className={`bi ${ICONES[modulo.chave]}`}></i>
                      {modulo.titulo}
                    </span>
                    <span className="rounded-full bg-[#FFD900] px-3 py-0.5 text-xs tabular-nums">
                      {numero(modulo.total)}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 items-start gap-x-7 gap-y-5 p-5 sm:grid-cols-3 print:grid-cols-3">
                    {modulo.tabelas.map((tabela) => (
                      <Barras
                        key={tabela.titulo}
                        titulo={tabela.titulo}
                        linhas={tabela.linhas}
                        total={modulo.total}
                        multipla={tabela.multipla}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {bairros && (
          <Secao titulo={numerar("Bairros atendidos")}>
            <Tabela
              cabecalho={["Bairro", ...bairros.colunas.map((c) => c.titulo), "Total"]}
              linhas={bairros.linhas.map((l) => [l.rotulo, ...l.valores, l.total])}
            />
          </Secao>
        )}

        {observacoes.trim() && (
          <Secao titulo={numerar("Observações")}>
            <p className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 p-5 text-sm leading-relaxed">
              {observacoes.trim()}
            </p>
          </Secao>
        )}

        <div className="break-inside-avoid">
          <aside className="mt-9 rounded-xl bg-[#FAFAF7] p-4 text-[11px] leading-relaxed text-gray-600 print:mt-7">
            <strong className="text-[#1A1A1A]">Como ler este relatório.</strong> Vale a data do
            termo; quando ela falta, a do cadastro no sistema. Animais que já chegaram castrados
            não contam como castração. Nas tabelas “de N”, um registro pode aparecer em mais de
            uma linha.
            {" "}Bairros e cidades com menos de 3 registros são somados, e nenhum dado pessoal é
            exibido.
          </aside>

          <footer className="mt-16 flex flex-wrap items-end justify-between gap-8 text-xs print:mt-14">
            <div className="w-64 border-t border-[#1A1A1A] pt-1.5 text-center">
              Responsável pela ARDAP
            </div>
            <p className="text-right text-gray-600">
              Emitido em {dataBR(relatorio.gerado_em)} às {relatorio.gerado_em.slice(11, 16)}
              <br />
              por {relatorio.emitido_por}
            </p>
          </footer>
        </div>
      </div>
    </article>
  );
}
