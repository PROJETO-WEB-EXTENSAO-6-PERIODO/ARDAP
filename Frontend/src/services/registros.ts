import type { Autor } from "../components/Autoria";
import { formatarCpf, formatarData, rotulo, type AnimalAdotado } from "./adocoes";

// Cada módulo tem campos próprios; a configuração abaixo diz como exibi-los.
export type Registro = {
  id: number;
  animal?: AnimalAdotado | null;
  created_at: string | null;
  funcionario: Autor | null;
  alterado_por: Autor | null;
  updated_at: string | null;
} & Record<string, unknown>;

export type Item =
  | { label: string; texto: string | null }
  | { label: string; resposta: boolean };

export interface Secao {
  icone: string;
  titulo: string;
  itens: Item[];
}

export interface ModuloRegistro {
  // Rota do formulário e da API, sem barra.
  rota: string;
  titulo: string;
  singular: string;
  plural: string;
  feminino: boolean;
  novo: string;
  icone: string;
  temAnimal: boolean;
  data: (r: Registro) => string | null;
  // Pessoa em destaque no card.
  pessoa: (r: Registro) => { label: string; nome: string };
  // Linhas resumidas do card.
  resumo: (r: Registro) => Array<{ icone: string; label: string; valor: string | null }>;
  secoes: (r: Registro) => Secao[];
}

function txt(r: Registro, campo: string): string | null {
  const valor = r[campo];
  return valor === null || valor === undefined || valor === "" ? null : String(valor);
}

function campo(r: Registro, label: string, chave: string): Item {
  return { label, texto: txt(r, chave) };
}

function data(r: Registro, label: string, chave: string): Item {
  return { label, texto: formatarData(txt(r, chave)) };
}

function resposta(r: Registro, label: string, chave: string): Item {
  return { label, resposta: r[chave] === true };
}

function juntar(...partes: Array<string | null>) {
  return partes.filter(Boolean).join(", ") || null;
}

const SITUACOES: Record<string, string> = {
  acidentado: "Acidentado",
  doente: "Doente",
  castracao: "Castração",
  outros: "Outros",
};

const DOCUMENTOS: Record<string, string> = {
  rg: "RG",
  cpf: "CPF",
  cnh: "CNH",
  passaporte: "Passaporte",
  rne: "RNE",
  outro: "Outro",
};

function situacao(r: Registro) {
  const valor = txt(r, "situacao_animal");
  if (valor === "outros") return txt(r, "situacao_animal_outros_desc") ?? "Outros";
  return valor ? (SITUACOES[valor] ?? valor) : null;
}

function tipoDocumento(r: Registro, chave: string) {
  const valor = txt(r, chave);
  return valor ? (DOCUMENTOS[valor] ?? valor) : null;
}

export function especieDoRegistro(r: Registro) {
  if (r.animal) return r.animal.especie;
  const especie = txt(r, "especie");
  return especie === "outro" ? (txt(r, "especie_outro") ?? especie) : especie;
}

export function grupoEspecie(r: Registro) {
  const especie = (especieDoRegistro(r) ?? "").trim().toLowerCase();
  if (["cao", "cão", "canino", "cachorro"].includes(especie)) return "cao";
  if (["gato", "felino"].includes(especie)) return "gato";
  return "outro";
}

export function nomeDoRegistro(r: Registro) {
  return r.animal?.nome || txt(r, "nome_animal") || "Animal sem nome";
}

export function detalhesDoAnimal(r: Registro) {
  return [
    rotulo(especieDoRegistro(r)),
    r.animal ? r.animal.raca : txt(r, "raca"),
    rotulo(r.animal ? r.animal.sexo : txt(r, "sexo")),
  ]
    .filter(Boolean)
    .join(" • ");
}

// Castração e cirurgia usam exatamente o mesmo termo.
function procedimentoCirurgico(
  base: Pick<ModuloRegistro, "rota" | "titulo" | "singular" | "plural" | "novo" | "icone">,
): ModuloRegistro {
  return {
    ...base,
    feminino: true,
    temAnimal: true,
    data: (r) => txt(r, "data_assinatura") ?? r.created_at,
    pessoa: (r) => ({
      label: "Proprietário/responsável",
      nome: txt(r, "proprietario_responsavel") ?? "Não informado",
    }),
    resumo: (r) => [
      { icone: "bi-clipboard2-pulse", label: "Procedimento", valor: txt(r, "procedimento") },
      { icone: "bi-telephone", label: "Telefone", valor: txt(r, "ba_telefones") },
      { icone: "bi-geo-alt", label: "Bairro", valor: txt(r, "bairro") },
    ],
    secoes: (r) => [
      {
        icone: "bi-person",
        titulo: "Proprietário/responsável",
        itens: [
          campo(r, "Nome", "proprietario_responsavel"),
          { label: "CPF/CNPJ", texto: formatarCpf(txt(r, "cpf_cnpj")) },
          campo(r, "Telefones", "ba_telefones"),
          campo(r, "E-mail", "email"),
          campo(r, "Endereço", "endereco"),
          campo(r, "Número", "numero"),
          campo(r, "Complemento", "complemento"),
          campo(r, "Bairro", "bairro"),
        ],
      },
      {
        icone: "bi-heart",
        titulo: "Animal informado no termo",
        itens: [
          campo(r, "Nome", "nome_animal"),
          campo(r, "Espécie", "especie"),
          campo(r, "Raça", "raca"),
          { label: "Sexo", texto: rotulo(txt(r, "sexo")) },
          campo(r, "Idade", "idade_real"),
          campo(r, "Pelagem", "pelagem"),
        ],
      },
      {
        icone: "bi-file-earmark-text",
        titulo: "Procedimento e autorização",
        itens: [
          campo(r, "Procedimento", "procedimento"),
          campo(r, "Assinatura do responsável", "assinatura_responsavel"),
          campo(r, "Local", "local_assinatura"),
          data(r, "Data", "data_assinatura"),
        ],
      },
    ],
  };
}

export const MODULOS_REGISTRO: ModuloRegistro[] = [
  {
    rota: "supatas",
    titulo: "SUPATAS",
    singular: "solicitação",
    plural: "solicitações",
    feminino: true,
    novo: "Nova solicitação",
    icone: "bi-heart-pulse",
    temAnimal: true,
    data: (r) => txt(r, "data_encaminhamento") ?? r.created_at,
    pessoa: (r) => ({
      label: "Responsável pelo encaminhamento",
      nome: txt(r, "nome_responsavel_encaminhamento") ?? "Não informado",
    }),
    resumo: (r) => [
      { icone: "bi-clipboard2-pulse", label: "Situação", valor: situacao(r) },
      { icone: "bi-geo-alt", label: "Local de recolhimento", valor: txt(r, "local_recolhimento") },
      { icone: "bi-person", label: "Resgatista", valor: txt(r, "nome_resgatista") },
    ],
    secoes: (r) => [
      {
        icone: "bi-bank",
        titulo: "Órgão solicitante",
        itens: [
          campo(r, "Órgão", "orgao_solicitante"),
          campo(r, "Responsável pelo encaminhamento", "nome_responsavel_encaminhamento"),
          data(r, "Data do encaminhamento", "data_encaminhamento"),
        ],
      },
      {
        icone: "bi-heart",
        titulo: "Animal encaminhado",
        itens: [
          campo(r, "Nome", "nome_animal"),
          {
            label: "Espécie",
            texto:
              txt(r, "especie") === "outro"
                ? (txt(r, "especie_outro") ?? "Outro")
                : rotulo(txt(r, "especie")),
          },
          { label: "Sexo", texto: rotulo(txt(r, "sexo")) },
          { label: "Situação", texto: situacao(r) },
          campo(r, "Local de recolhimento", "local_recolhimento"),
          campo(r, "Resgatista", "nome_resgatista"),
        ],
      },
      {
        icone: "bi-file-earmark-text",
        titulo: "Relatório",
        itens: [campo(r, "Descrição", "relatorio")],
      },
      {
        icone: "bi-pen",
        titulo: "Assinaturas e recebimento",
        itens: [
          { label: "CPF do responsável SUPATAS", texto: formatarCpf(txt(r, "cpf_responsavel_supatas")) },
          campo(r, "Assinatura SUPATAS", "assinatura_responsavel_supatas"),
          campo(r, "Recebido por", "recebido_por"),
          data(r, "Data do recebimento", "data_recebimento"),
          campo(r, "Assinatura ARDAP", "assinatura_recebimento_ardap"),
        ],
      },
    ],
  },
  procedimentoCirurgico({
    rota: "castracoes",
    titulo: "Castrações",
    singular: "castração",
    plural: "castrações",
    novo: "Nova castração",
    icone: "bi-scissors",
  }),
  procedimentoCirurgico({
    rota: "cirurgias",
    titulo: "Cirurgias",
    singular: "cirurgia",
    plural: "cirurgias",
    novo: "Nova cirurgia",
    icone: "bi-bandaid",
  }),
  {
    rota: "hipossuficiencias",
    titulo: "Hipossuficiência",
    singular: "declaração",
    plural: "declarações",
    feminino: true,
    novo: "Nova declaração",
    icone: "bi-file-earmark-text",
    temAnimal: false,
    data: (r) => txt(r, "data_declaracao") ?? r.created_at,
    pessoa: (r) => ({
      label: "Imigrante representado",
      nome: txt(r, "nome_imigrante") ?? "Não informado",
    }),
    resumo: (r) => [
      { icone: "bi-person", label: "Representante", valor: txt(r, "nome_representante") },
      { icone: "bi-geo-alt", label: "Local", valor: txt(r, "local_declaracao") },
    ],
    secoes: (r) => [
      {
        icone: "bi-person",
        titulo: "Representante legal",
        itens: [
          campo(r, "Nome", "nome_representante"),
          { label: "Tipo de documento", texto: tipoDocumento(r, "tipo_documento_representante") },
          campo(r, "Documento", "documento_representante"),
          campo(r, "E-mail", "email_representante"),
        ],
      },
      {
        icone: "bi-person-badge",
        titulo: "Imigrante representado",
        itens: [
          campo(r, "Nome", "nome_imigrante"),
          { label: "Tipo de documento", texto: tipoDocumento(r, "tipo_documento_imigrante") },
          campo(r, "Documento", "documento_imigrante"),
          campo(r, "E-mail", "email_imigrante"),
        ],
      },
      {
        icone: "bi-clipboard-check",
        titulo: "Motivos declarados",
        itens: [
          resposta(r, "Não possui trabalho remunerado", "nao_possui_trabalho_remunerado"),
          resposta(r, "Não possui renda", "nao_possui_renda"),
          resposta(r, "Renda até meio salário per capita", "renda_ate_meio_salario_per_capita"),
          campo(r, "Outro motivo", "outro_motivo"),
        ],
      },
      {
        icone: "bi-pen",
        titulo: "Assinatura",
        itens: [
          campo(r, "Assinatura do representante", "assinatura_representante"),
          campo(r, "Local", "local_declaracao"),
          data(r, "Data", "data_declaracao"),
          // Registros antigos só têm os nomes; os arquivos não foram guardados.
          ...(txt(r, "anexo_documentos")
            ? [campo(r, "Anexos informados (sem arquivo)", "anexo_documentos")]
            : []),
        ],
      },
    ],
  },
  {
    rota: "eutanasias",
    titulo: "Eutanásias",
    singular: "termo",
    plural: "termos",
    feminino: false,
    novo: "Novo termo",
    icone: "bi-file-earmark-medical",
    temAnimal: true,
    data: (r) => txt(r, "data_declaracao") ?? r.created_at,
    pessoa: (r) => ({
      label: "Responsável",
      nome: txt(r, "nome_responsavel") ?? "Não informado",
    }),
    resumo: (r) => [
      { icone: "bi-clipboard2-pulse", label: "CRMV do veterinário", valor: txt(r, "crmv_veterinario") && `CRMV ${txt(r, "crmv_veterinario")}` },
      { icone: "bi-telephone", label: "Telefone ou e-mail", valor: txt(r, "telefone_email") },
      { icone: "bi-geo-alt", label: "Bairro e cidade", valor: juntar(txt(r, "bairro"), txt(r, "cidade")) },
    ],
    secoes: (r) => [
      {
        icone: "bi-heart",
        titulo: "Animal informado no termo",
        itens: [
          campo(r, "Nome", "nome_animal"),
          campo(r, "Espécie", "especie"),
          campo(r, "Raça", "raca"),
          { label: "Sexo", texto: rotulo(txt(r, "sexo")) },
          campo(r, "Idade", "idade"),
          campo(r, "Pelagem", "pelagem"),
          campo(r, "CRMV do veterinário", "crmv_veterinario"),
        ],
      },
      {
        icone: "bi-person",
        titulo: "Responsável",
        itens: [
          campo(r, "Nome", "nome_responsavel"),
          { label: "CPF", texto: formatarCpf(txt(r, "cpf")) },
          campo(r, "RG", "rg"),
          campo(r, "Telefone/e-mail", "telefone_email"),
          campo(r, "Endereço", "endereco"),
          campo(r, "Bairro", "bairro"),
          campo(r, "Cidade", "cidade"),
        ],
      },
      {
        icone: "bi-pen",
        titulo: "Autorização",
        itens: [
          resposta(r, "Aceitou o termo de consentimento", "declaracao_aceite"),
          campo(r, "Assinatura do responsável", "assinatura_responsavel"),
          campo(r, "Local", "local_declaracao"),
          data(r, "Data", "data_declaracao"),
        ],
      },
    ],
  },
];
