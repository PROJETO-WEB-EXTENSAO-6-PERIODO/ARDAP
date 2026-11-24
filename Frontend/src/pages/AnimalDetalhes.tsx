import { useEffect, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

interface Animal {
  id: number;
  nome: string | null;
  especie: string;
  raca: string | null;
  sexo: string;
  data_nascimento_estimada: string | null;
  idade_estimada: number | null;
  porte: string | null;
  cor_pelo: string | null;
  peso: string | number | null;
  castrado: boolean;
  vermifugado: boolean;
  vacinado: boolean;
  temperamento: string;
  medicacao_necessaria: boolean;
  medicacao_desc: string | null;
  origem_resgate: string | null;
  observacoes: string | null;
  created_at: string | null;
}

const LABELS: Record<string, string> = {
  cao: "Cão",
  gato: "Gato",
  outro: "Outro",
  macho: "Macho",
  femea: "Fêmea",
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  docil: "Dócil",
  medroso: "Medroso",
  arisco: "Arisco",
  agressivo: "Agressivo",
  desconhecido: "Desconhecido",
};

function rotulo(valor: string | null) {
  return valor ? (LABELS[valor] ?? valor) : null;
}

// Formata sem passar por Date para o fuso horário não alterar o dia.
function formatarData(iso: string | null) {
  return iso ? iso.slice(0, 10).split("-").reverse().join("/") : null;
}

function formatarIdade(anos: number | null) {
  if (anos === null) return null;
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

function formatarPeso(peso: string | number | null) {
  return peso === null ? null : `${Number(peso).toLocaleString("pt-BR")} kg`;
}

function Campo({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-semibold text-gray-500">{label}</dt>
      <dd
        className={`whitespace-pre-wrap break-words text-sm ${
          valor ? "font-medium text-[#1A1A1A]" : "text-gray-400"
        }`}
      >
        {valor || "Não informado"}
      </dd>
    </div>
  );
}

function Situacao({ label, ativo }: { label: string; ativo: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-[#f8f9ff]/50 p-3">
      <dt className="text-sm font-medium text-[#1A1A1A]">{label}</dt>
      <dd
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          ativo ? "bg-[#1A1A1A] text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {ativo ? "Sim" : "Não"}
      </dd>
    </div>
  );
}

function Cartao({
  icone,
  titulo,
  children,
}: {
  icone: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
          <i className={`bi ${icone}`}></i>
        </div>
        <h2 className="text-lg font-bold text-[#1A1A1A]">{titulo}</h2>
      </div>
      {children}
    </article>
  );
}

function Detalhes({ animal }: { animal: Animal }) {
  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
            {animal.nome || "Animal sem nome"}
          </h1>
          <p className="text-sm text-gray-500 md:text-base">
            Registro nº {animal.id}
            {animal.created_at &&
              ` • Cadastrado em ${formatarData(animal.created_at)}`}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center self-start rounded-full bg-[#FFD900] px-3 py-1.5 text-xs font-medium text-[#1A1A1A] sm:self-auto">
          {rotulo(animal.especie)} • {rotulo(animal.sexo)}
        </span>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cartao icone="bi-person-badge" titulo="Identificação">
          <dl className="grid grid-cols-2 gap-5">
            <Campo label="Nome" valor={animal.nome} />
            <Campo label="Espécie" valor={rotulo(animal.especie)} />
            <Campo label="Raça" valor={animal.raca} />
            <Campo label="Sexo" valor={rotulo(animal.sexo)} />
          </dl>
        </Cartao>

        <Cartao icone="bi-activity" titulo="Características físicas">
          <dl className="grid grid-cols-2 gap-5">
            <Campo
              label="Data de nascimento estimada"
              valor={formatarData(animal.data_nascimento_estimada)}
            />
            <Campo
              label="Idade estimada"
              valor={formatarIdade(animal.idade_estimada)}
            />
            <Campo label="Porte" valor={rotulo(animal.porte)} />
            <Campo label="Cor do pelo" valor={animal.cor_pelo} />
            <Campo label="Peso" valor={formatarPeso(animal.peso)} />
          </dl>
        </Cartao>

        <Cartao icone="bi-heart-pulse" titulo="Saúde">
          <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Situacao label="Castrado" ativo={animal.castrado} />
            <Situacao label="Vermifugado" ativo={animal.vermifugado} />
            <Situacao label="Vacinado" ativo={animal.vacinado} />
            <Situacao
              label="Necessita de medicação"
              ativo={animal.medicacao_necessaria}
            />
          </dl>
          {animal.medicacao_necessaria && (
            <dl>
              <Campo
                label="Descrição da medicação"
                valor={animal.medicacao_desc}
              />
            </dl>
          )}
        </Cartao>

        <Cartao icone="bi-geo-alt" titulo="Origem e observações">
          <dl className="flex flex-col gap-5">
            <Campo label="Origem do resgate" valor={animal.origem_resgate} />
            <Campo label="Temperamento" valor={rotulo(animal.temperamento)} />
            <Campo label="Observações" valor={animal.observacoes} />
          </dl>
        </Cartao>
      </div>
    </>
  );
}

export function AnimalDetalhes() {
  const { id } = useParams();
  const location = useLocation();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState(location.state?.cadastrado === true);

  useEffect(() => {
    let ativo = true;
    window.scrollTo({ top: 0 });
    api
      .get<Animal>(`/animais/${id}`)
      .then(({ data }) => {
        if (!ativo) return;
        setErro("");
        setAnimal(data);
      })
      .catch((e) => {
        if (!ativo) return;
        setAnimal(null);
        setErro(
          isAxiosError(e) && e.response?.status === 404
            ? "Animal não encontrado."
            : "Não foi possível carregar os dados do animal.",
        );
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-[#EDF2FB]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Link
            to="/home"
            className="flex items-center gap-1 font-medium transition-colors hover:text-[#1A1A1A]"
          >
            <i className="bi bi-house text-[16px]"></i>
            <span>Início</span>
          </Link>
          <span className="font-normal text-gray-400">&gt;</span>
          <Link to="/animais" className="transition-colors hover:text-[#1A1A1A]">
            Animais
          </Link>
          <span className="font-normal text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Detalhes do animal</span>
        </nav>

        {aviso && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-green-300 bg-green-100 p-4 text-green-800 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <i className="bi bi-check-circle text-[22px]"></i>
              <span className="text-sm font-medium">
                Animal cadastrado com sucesso! Os dados foram registrados no
                sistema.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAviso(false)}
              className="p-1 hover:text-green-900"
              aria-label="Fechar aviso"
            >
              <i className="bi bi-x text-[18px]"></i>
            </button>
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]"
          >
            {erro}
          </div>
        )}

        {!animal && !erro && (
          <p className="text-sm text-gray-500">Carregando...</p>
        )}

        {animal && <Detalhes animal={animal} />}

        <div className="grid w-full grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2">
          <Link
            to="/home"
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-white px-6 py-3 text-center text-sm font-medium text-[#1A1A1A] transition-all hover:bg-gray-50 active:scale-95"
          >
            Voltar ao início
          </Link>
          <Link
            to="/animais"
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-[#FFD900] px-6 py-3 text-center text-sm font-bold text-[#1A1A1A] shadow-sm transition-all hover:opacity-90 active:scale-95"
          >
            Cadastrar outro animal
          </Link>
        </div>
      </main>

      <footer className="mt-auto w-full border-t bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 md:flex-row md:px-8">
          <div className="flex flex-col items-center gap-1 text-center md:flex-row md:text-left">
            <span className="text-xs font-bold">ARDAP • Paulo Afonso/BA</span>
            <span className="text-xs text-gray-500">
              © 2026 Associação Recanto dos Animais em Perigo (ARDAP). Acesso
              restrito e monitorado a colaboradores autorizados.
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-gray-500">
            <span className="transition-colors hover:text-[#6f5d00]">
              Políticas de Segurança
            </span>
            <span className="text-gray-300">•</span>
            <span className="transition-colors hover:text-[#6f5d00]">
              Manual do Voluntário
            </span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
