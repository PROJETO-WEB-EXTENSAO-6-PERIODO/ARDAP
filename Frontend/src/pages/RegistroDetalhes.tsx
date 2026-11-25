import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import { FotoRegistro } from "../components/FotoRegistro";
import { Header } from "../components/Header";
import { formatarData } from "../services/adocoes";
import { api } from "../services/api";
import {
  detalhesDoAnimal,
  nomeDoRegistro,
  type Item,
  type ModuloRegistro,
  type Registro,
} from "../services/registros";

function Campo({ item }: { item: Item }) {
  const resposta = "resposta" in item;
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <dt className="text-xs font-semibold text-gray-500">{item.label}</dt>
      {resposta ? (
        <dd
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            item.resposta ? "bg-[#1A1A1A] text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {item.resposta ? "Sim" : "Não"}
        </dd>
      ) : (
        <dd
          className={`max-w-full whitespace-pre-wrap break-words text-sm ${
            item.texto ? "font-medium text-[#1A1A1A]" : "text-gray-400"
          }`}
        >
          {item.texto || "Não informado"}
        </dd>
      )}
    </div>
  );
}

function Detalhes({ modulo, registro }: { modulo: ModuloRegistro; registro: Registro }) {
  const pessoa = modulo.pessoa(registro);

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FFF9DB] text-6xl">
          <FotoRegistro modulo={modulo} registro={registro} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500">
            {modulo.titulo} • Registro nº {registro.id}
            {registro.created_at && ` • Registrado em ${formatarData(registro.created_at)}`}
          </p>
          <h1 className="mt-1 break-words text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
            {modulo.temAnimal ? nomeDoRegistro(registro) : pessoa.nome}
          </h1>
          {modulo.temAnimal ? (
            <>
              <p className="text-sm text-gray-600">{detalhesDoAnimal(registro)}</p>
              <p className="mt-2 break-words text-sm text-[#1A1A1A]">
                {pessoa.label}: <strong>{pessoa.nome}</strong>
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">{pessoa.label}</p>
          )}
        </div>
        {registro.animal && (
          <Link
            to={`/animais/${registro.animal.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
          >
            Ver ficha do animal
          </Link>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {modulo.secoes(registro).map((secao) => (
          <article
            key={secao.titulo}
            className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                <i aria-hidden="true" className={`bi ${secao.icone}`}></i>
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">{secao.titulo}</h2>
            </div>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {secao.itens.map((item) => (
                <Campo key={item.label} item={item} />
              ))}
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}

export function RegistroDetalhes({ modulo }: { modulo: ModuloRegistro }) {
  const { id } = useParams();
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    window.scrollTo({ top: 0 });
    api
      .get<Registro>(`/${modulo.rota}/${id}`)
      .then(({ data }) => {
        if (!ativo) return;
        setErro("");
        setRegistro(data);
      })
      .catch((e) => {
        if (!ativo) return;
        setRegistro(null);
        setErro(
          isAxiosError(e) && e.response?.status === 404
            ? "Registro não encontrado."
            : "Não foi possível carregar o registro.",
        );
      });
    return () => {
      ativo = false;
    };
  }, [id, modulo.rota]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Link
            to={`/${modulo.rota}/registros`}
            className="font-medium transition-colors hover:text-[#1A1A1A]"
          >
            <i aria-hidden="true" className="bi bi-arrow-left"></i> {modulo.titulo}
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Registro</span>
        </nav>

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]"
          >
            {erro}
          </div>
        )}
        {!registro && !erro && (
          <p role="status" className="text-sm text-gray-500">
            Carregando...
          </p>
        )}
        {registro && <Detalhes modulo={modulo} registro={registro} />}
      </main>
    </div>
  );
}
