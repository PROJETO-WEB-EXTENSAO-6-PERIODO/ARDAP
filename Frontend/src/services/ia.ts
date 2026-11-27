import { isAxiosError } from "axios";
import { api } from "./api";

export type Faixa = "baixa" | "media" | "alta";

export interface Fator {
  fator: string;
  impacto: number;
}

export interface Previsao {
  probabilidade: number;
  faixa: Faixa;
  previsao_adotado: boolean;
  threshold: number;
  janela_dias: number;
  fatores: Fator[];
}

export interface PrevisaoAnimal extends Previsao {
  animal_id: number;
  dias_no_abrigo: number;
}

export interface ItemPrioridade {
  animal_id: number;
  nome: string | null;
  especie: string;
  raca: string | null;
  sexo: string;
  idade_estimada: number | null;
  tem_foto: boolean;
  dias_no_abrigo: number;
  probabilidade: number;
  faixa: Faixa;
  atencao: boolean;
}

interface MetricasResumo {
  f1: number;
  f1_macro: number;
  roc_auc: number;
  pr_auc: number;
  precisao: number;
  recall: number;
  acuracia: number;
}

export interface ResumoModelo {
  algoritmo: string;
  threshold: number;
  janela_dias: number;
  faixas: { baixa: number; alta: number };
  base: {
    linhas: number;
    positivos: number;
    taxa_positivos: number;
    periodo: string;
    divisao: string;
  } | null;
  validacao: Record<string, MetricasResumo>;
  teste: MetricasResumo | null;
  matriz_confusao: number[][] | null;
  importancia: { feature: string; valor: number }[];
  taxa_real_por_faixa: Record<
    Faixa,
    { animais: number; participacao: number; taxa_real: number; prob_media: number }
  > | null;
}

export const FAIXAS: Record<
  Faixa,
  { titulo: string; classe: string; barra: string; dica: string }
> = {
  baixa: {
    titulo: "Chance baixa",
    classe: "bg-red-100 text-red-800",
    barra: "bg-red-500",
    dica: "Precisa de mais divulgação",
  },
  media: {
    titulo: "Chance média",
    classe: "bg-amber-100 text-amber-800",
    barra: "bg-amber-500",
    dica: "Vale incluir na divulgação",
  },
  alta: {
    titulo: "Chance alta",
    classe: "bg-green-100 text-green-800",
    barra: "bg-green-600",
    dica: "Perfil procurado por adotantes",
  },
};

export const FATORES: Record<string, string> = {
  idade: "Idade estimada",
  castracao: "Castração",
  origem: "Origem (rua, tutor ou abandono)",
  saude: "Condição de saúde na entrada",
  raca: "Raça",
  cor: "Cor da pelagem",
};

export const FEATURES: Record<string, string> = {
  idade_dias: "Idade",
  tipo_entrada: "Origem",
  sexo: "Sexo",
  raca_principal: "Raça",
  condicao_entrada: "Condição de saúde",
  especie: "Espécie",
  esterilizado: "Castração",
  cor_principal: "Cor",
  mes_entrada: "Mês de entrada",
  misto: "Sem raça definida",
  idade_ausente: "Idade não informada",
};

export function porcentagem(valor: number, casas = 0) {
  return `${(valor * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}

export function decimal(valor: number, casas = 2) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

// Impacto em pontos percentuais, com sinal.
export function impacto(valor: number) {
  const pp = Math.round(valor * 100);
  return `${pp > 0 ? "+" : ""}${pp} p.p.`;
}

// Mensagem do backend (validação, 404, 409, 503) ou uma genérica.
export function mensagemErro(e: unknown, padrao: string) {
  if (isAxiosError(e)) {
    if (!e.response) return "Não foi possível conectar ao servidor.";
    const detalhe = e.response.data?.detail;
    if (typeof detalhe === "string") return detalhe;
    if (e.response.status === 422) return "Confira os campos preenchidos.";
  }
  return padrao;
}

// O resumo do modelo não muda enquanto a API está no ar: busca uma vez.
let resumo: Promise<ResumoModelo> | null = null;
export function carregarResumo() {
  resumo ??= api.get<ResumoModelo>("/ia/modelo").then(({ data }) => data);
  resumo.catch(() => {
    resumo = null;
  });
  return resumo;
}
