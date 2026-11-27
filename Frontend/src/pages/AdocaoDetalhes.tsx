import { useEffect, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import { Autorias } from "../components/Autoria";
import { FotoAnimal } from "../components/FotoAnimal";
import { Header } from "../components/Header";
import {
  emojiDoAnimal,
  formatarCep,
  formatarCpf,
  formatarData,
  nomeDoAnimal,
  rotulo,
  type TermoAdocao,
} from "../services/adocoes";
import { api } from "../services/api";

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

function Resposta({ label, valor }: { label: string; valor: boolean | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#f8f9ff]/50 p-3">
      <dt className="text-sm text-[#1A1A1A]">{label}</dt>
      <dd
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          valor ? "bg-[#1A1A1A] text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {valor === null ? "Não informado" : valor ? "Sim" : "Não"}
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
          <i aria-hidden="true" className={`bi ${icone}`}></i>
        </div>
        <h2 className="text-lg font-bold text-[#1A1A1A]">{titulo}</h2>
      </div>
      {children}
    </article>
  );
}

function Detalhes({ adocao }: { adocao: TermoAdocao }) {
  const { animal } = adocao;
  const emoji = emojiDoAnimal(animal);

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-green-50 text-6xl">
          {animal?.tem_foto ? (
            <FotoAnimal
              src={animal.foto_mini_url}
              alt={`Foto de ${nomeDoAnimal(animal)}`}
              className="h-full w-full object-cover"
              fallback={emoji}
            />
          ) : (
            <span aria-hidden="true">{emoji}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">
            Termo nº {adocao.id}
          </p>
          <h1 className="mt-1 break-words text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
            {nomeDoAnimal(animal)}
          </h1>
          {animal && (
            <p className="text-sm text-gray-600">
              {[rotulo(animal.especie), animal.raca, rotulo(animal.sexo)]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
          <p className="mt-2 break-words text-sm text-[#1A1A1A]">
            Adotante: <strong>{adocao.nome_adotante}</strong>
          </p>
          <div className="mt-2">
            <Autorias registro={adocao} />
          </div>
        </div>
        <Link
          to={`/adocoes/${adocao.id}/editar`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#FFD900] px-5 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95"
        >
          <i aria-hidden="true" className="bi bi-pencil"></i>
          Editar
        </Link>
        {animal && (
          <Link
            to={`/animais/${animal.id}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
          >
            Ver ficha do animal
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Cartao icone="bi-person" titulo="Dados do adotante">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Campo label="Nome" valor={adocao.nome_adotante} />
            <Campo label="Tipo do formulário" valor={rotulo(adocao.especie_adocao)} />
            <Campo label="CPF" valor={formatarCpf(adocao.cpf)} />
            <Campo label="RG" valor={adocao.rg} />
            <Campo label="Telefone" valor={adocao.telefone} />
            <Campo label="Instagram" valor={adocao.instagram} />
          </dl>
        </Cartao>

        <Cartao icone="bi-geo-alt" titulo="Endereço e local de guarda">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Campo label="Endereço residencial" valor={adocao.endereco_residencial} />
            <Campo label="Bairro" valor={adocao.bairro} />
            <Campo label="Cidade" valor={adocao.cidade} />
            <Campo label="CEP" valor={formatarCep(adocao.cep)} />
            <Campo
              label="Endereço onde ficará o animal"
              valor={
                adocao.endereco_ficara_animal === "mesmo"
                  ? "Mesmo endereço do adotante"
                  : adocao.endereco_ficara_animal_outro
              }
            />
            <Campo label="Local na casa" valor={adocao.local_na_casa} />
          </dl>
        </Cartao>
      </div>

      <Cartao icone="bi-clipboard-check" titulo="Questionário de adoção">
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Resposta label="Tem espaço para o animal em casa" valor={adocao.espaco_casa} />
          <Resposta label="Casa murada" valor={adocao.casa_murada} />
          <Resposta
            label="Espaço coberto no quintal"
            valor={adocao.espaco_coberto_quintal}
          />
          <Resposta label="Mora de aluguel" valor={adocao.mora_aluguel} />
          {adocao.mora_aluguel && (
            <Resposta
              label="Proprietário permite animais"
              valor={adocao.proprietario_permite_animais}
            />
          )}
          <Resposta label="Família sabe da adoção" valor={adocao.familia_sabe_adocao} />
          <Resposta label="Alguém da casa tem alergia" valor={adocao.alguem_alergia} />
          <Resposta label="Animal terá acesso à rua" valor={adocao.acesso_rua} />
          <Resposta
            label="Ciente da vacinação periódica"
            valor={adocao.ciencia_vacinacao}
          />
          <Resposta label="Tem mais animais em casa" valor={adocao.mais_animais_em_casa} />
        </dl>
        <dl className="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <Campo
            label="Quantos animais em casa"
            valor={
              adocao.mais_animais_em_casa
                ? (adocao.quantos_mais_animais?.toString() ?? null)
                : "Nenhum"
            }
          />
          <Campo label="Quem cuidará em viagens" valor={adocao.viajar_quem_cuidara} />
          <Campo label="Alimentação" valor={adocao.alimentacao} />
        </dl>
      </Cartao>

      <Cartao icone="bi-pen" titulo="Declarações e assinaturas">
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Resposta
            label="Aceitou a declaração de responsabilidade"
            valor={adocao.aceite_declaracao}
          />
          <Resposta label="Aceitou o termo de adoção" valor={adocao.aceite_termo} />
        </dl>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Assinatura do adotante" valor={adocao.assinatura_adotante} />
          <Campo label="Assinatura da ARDAP" valor={adocao.assinatura_ardap} />
          <Campo label="Local" valor={adocao.local_assinatura} />
          <Campo label="Data" valor={formatarData(adocao.data_assinatura)} />
        </dl>
      </Cartao>
    </>
  );
}

export function AdocaoDetalhes() {
  const { id } = useParams();
  const [adocao, setAdocao] = useState<TermoAdocao | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    window.scrollTo({ top: 0 });
    api
      .get<TermoAdocao>(`/adocoes/${id}`)
      .then(({ data }) => {
        if (!ativo) return;
        setErro("");
        setAdocao(data);
      })
      .catch((e) => {
        if (!ativo) return;
        setAdocao(null);
        setErro(
          isAxiosError(e) && e.response?.status === 404
            ? "Termo de adoção não encontrado."
            : "Não foi possível carregar o termo de adoção.",
        );
      });
    return () => {
      ativo = false;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Link
            to="/adocoes/registradas"
            className="font-medium transition-colors hover:text-[#1A1A1A]"
          >
            <i aria-hidden="true" className="bi bi-arrow-left"></i> Adoções
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Termo de adoção</span>
        </nav>

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]"
          >
            {erro}
          </div>
        )}
        {!adocao && !erro && (
          <p role="status" className="text-sm text-gray-500">
            Carregando...
          </p>
        )}
        {adocao && <Detalhes adocao={adocao} />}
      </main>
    </div>
  );
}
