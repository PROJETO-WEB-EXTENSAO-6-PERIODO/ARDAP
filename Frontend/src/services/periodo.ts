import { hojeISO } from "./datas";

export type TipoPeriodo = "mes" | "trimestre" | "ano" | "datas";

export interface Periodo {
  inicio: string;
  fim: string;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const DURACAO = { mes: 1, trimestre: 3, ano: 12 };

function dois(n: number) {
  return String(n).padStart(2, "0");
}

// Meses contados desde o ano 0, para somar e subtrair sem tratar a virada.
function mesesInteiros(inicio: number, duracao: number): Periodo {
  const ultimo = inicio + duracao - 1;
  const anoFim = Math.floor(ultimo / 12);
  const mesFim = (ultimo % 12) + 1;
  const diaFim = new Date(anoFim, mesFim, 0).getDate();
  return {
    inicio: `${Math.floor(inicio / 12)}-${dois((inicio % 12) + 1)}-01`,
    fim: `${anoFim}-${dois(mesFim)}-${dois(diaFim)}`,
  };
}

// Período que contém a data, deslocado em tantos períodos.
export function periodoDe(
  tipo: Exclude<TipoPeriodo, "datas">,
  dataISO = hojeISO(),
  deslocamento = 0,
): Periodo {
  const duracao = DURACAO[tipo];
  const mes = Number(dataISO.slice(0, 4)) * 12 + Number(dataISO.slice(5, 7)) - 1;
  const inicio = Math.floor(mes / duracao) * duracao + deslocamento * duracao;
  return mesesInteiros(inicio, duracao);
}

export function rotuloPeriodo(tipo: TipoPeriodo, { inicio, fim }: Periodo) {
  const ano = inicio.slice(0, 4);
  const mes = Number(inicio.slice(5, 7));
  if (tipo === "mes") return `${MESES[mes - 1]} de ${ano}`;
  if (tipo === "trimestre") return `${Math.ceil(mes / 3)}º trimestre de ${ano}`;
  if (tipo === "ano") return ano;
  return `${dataBR(inicio)} a ${dataBR(fim)}`;
}

// Formata sem passar por Date para o fuso horário não alterar o dia.
export function dataBR(iso: string) {
  return iso.slice(0, 10).split("-").reverse().join("/");
}

export function mesBR(anoMes: string) {
  const [ano, mes] = anoMes.split("-");
  return `${MESES[Number(mes) - 1].slice(0, 3)}/${ano}`;
}
