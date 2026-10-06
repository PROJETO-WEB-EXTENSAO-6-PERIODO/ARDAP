import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Header } from "../components/Header";
import { api } from "../services/api";

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/animais")
      .then(({ data }) => setTotal(data.length))
      .catch(() => setTotal(null));
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F8] flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-6">
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-semibold text-[#1A1A1A]">
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-[#1A1A1A]"></span>
              Plantão Operacional Ativo
            </span>
            <span className="text-sm text-gray-500">
              Paulo Afonso - Sede ARDAP
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Bem-vindo(a), {user?.firstName}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Selecione o módulo de atendimento ou formulário para gerenciar.
          </p>
        </section>

        <div className="mt-4 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="group flex cursor-pointer flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 transition-all duration-150 hover:shadow-md">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-gray-100 text-xl text-[#1A1A1A] transition-colors duration-200 group-hover:bg-[#FFD900]">
                  <i className="bi bi-clipboard-data"></i>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Cadastro &amp; Histórico
                </span>
              </div>
              <div>
                <h3 className="font-bold">Animais</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cadastro, entradas e histórico dos abrigados.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                {total === null
                  ? "Carregando..."
                  : total === 0
                    ? "Nenhum registro ainda"
                    : `${total} registro${total === 1 ? "" : "s"} ativo${total === 1 ? "" : "s"}`}
              </div>
              <button
                onClick={() => navigate("/animais")}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95"
              >
                <span>Acessar</span>
                <i className="bi bi-arrow-right text-[18px] transition-transform group-hover:translate-x-0.5"></i>
              </button>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
