export interface AnimalAdotado {
  id: number;
  nome: string | null;
  especie: string;
  raca: string | null;
  sexo: string;
  tem_foto: boolean;
}

export interface TermoAdocao {
  id: number;
  animal: AnimalAdotado | null;
  especie_adocao: string | null;
  nome_adotante: string;
  rg: string | null;
  cpf: string | null;
  endereco_residencial: string;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
  telefone: string | null;
  instagram: string | null;
  mais_animais_em_casa: boolean;
  quantos_mais_animais: number | null;
  endereco_ficara_animal: string;
  endereco_ficara_animal_outro: string | null;
  local_na_casa: string | null;
  espaco_casa: boolean;
  casa_murada: boolean;
  espaco_coberto_quintal: boolean;
  mora_aluguel: boolean;
  proprietario_permite_animais: boolean | null;
  viajar_quem_cuidara: string | null;
  familia_sabe_adocao: boolean;
  alguem_alergia: boolean;
  alimentacao: string | null;
  acesso_rua: boolean;
  ciencia_vacinacao: boolean;
  aceite_declaracao: boolean;
  aceite_termo: boolean;
  assinatura_adotante: string | null;
  assinatura_ardap: string | null;
  local_assinatura: string | null;
  data_assinatura: string | null;
  created_at: string | null;
}

const ROTULOS: Record<string, string> = {
  cao: "Cão",
  gato: "Gato",
  outro: "Outro",
  macho: "Macho",
  femea: "Fêmea",
  canino: "Canino",
  felino: "Felino",
};

export function rotulo(valor: string | null) {
  return valor ? (ROTULOS[valor] ?? valor) : null;
}

export function nomeDoAnimal(animal: AnimalAdotado | null) {
  if (!animal) return "Animal não vinculado";
  return animal.nome || "Animal sem nome";
}

export function emojiDoAnimal(animal: AnimalAdotado | null) {
  if (animal?.especie === "cao") return "🐶";
  if (animal?.especie === "gato") return "🐱";
  return "🐾";
}

// Formata sem passar por Date para o fuso horário não alterar o dia.
export function formatarData(iso: string | null) {
  return iso ? iso.slice(0, 10).split("-").reverse().join("/") : null;
}

export function formatarCpf(cpf: string | null) {
  return cpf ? cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : null;
}

export function formatarCep(cep: string | null) {
  return cep ? cep.replace(/^(\d{5})(\d{3})$/, "$1-$2") : null;
}
