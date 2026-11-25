import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Autoria, type Autor } from "../components/Autoria";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface Usuario {
  id: number;
  first_name: string;
  second_name: string;
  email: string;
  role: "admin" | "funcionario";
  funcionario: Autor | null;
  created_at: string | null;
  alterado_por: Autor | null;
  updated_at: string | null;
}

const FILTROS = [
  { valor: "", rotulo: "Todos" },
  { valor: "admin", rotulo: "Administradores" },
  { valor: "funcionario", rotulo: "Funcionários" },
];

// Ignora acentos e maiúsculas na busca.
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function Usuarios() {
  const { user } = useAuth();
  const location = useLocation();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [papel, setPapel] = useState("");
  const [aviso, setAviso] = useState<string>(location.state?.aviso ?? "");

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<Usuario[]>("/users");
      setUsuarios(data);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const termo = normalizar(busca.trim());
  const visiveis = (usuarios ?? []).filter(
    (u) =>
      (!papel || u.role === papel) &&
      normalizar(`${u.first_name} ${u.second_name} ${u.email}`).includes(termo),
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        {aviso && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-green-300 bg-green-100 p-4 text-sm font-medium text-green-800"
          >
            <span>
              <i aria-hidden="true" className="bi bi-check-circle mr-2"></i>
              {aviso}
            </span>
            <button
              type="button"
              onClick={() => setAviso("")}
              aria-label="Fechar aviso"
              className="cursor-pointer p-1"
            >
              <i aria-hidden="true" className="bi bi-x text-lg"></i>
            </button>
          </div>
        )}

        <section className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Usuários</h1>
              <p aria-live="polite" className="mt-1 text-sm text-gray-500">
                {usuarios
                  ? `Mostrando ${visiveis.length} de ${usuarios.length} ${usuarios.length === 1 ? "usuário" : "usuários"}`
                  : "Colaboradores com acesso ao sistema"}
              </p>
            </div>
            <Link
              to="/usuarios/novo"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFD900] px-5 py-2.5 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95"
            >
              <i aria-hidden="true" className="bi bi-person-plus"></i>
              Novo usuário
            </Link>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <i
                aria-hidden="true"
                className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400"
              ></i>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar usuários"
                placeholder="Buscar por nome ou e-mail..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900]"
              />
            </div>
            <div role="group" aria-label="Filtrar por permissão" className="flex flex-wrap gap-2">
              {FILTROS.map((filtro) => (
                <button
                  key={filtro.valor}
                  type="button"
                  aria-pressed={papel === filtro.valor}
                  onClick={() => setPapel(filtro.valor)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    papel === filtro.valor
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {filtro.rotulo}
                </button>
              ))}
            </div>
          </div>
        </section>

        {erro && (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
          >
            <p className="text-sm font-bold text-[#DC2626]">
              Não foi possível carregar os usuários.
            </p>
            <button
              type="button"
              onClick={() => void carregar()}
              className="cursor-pointer rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!usuarios && !erro && (
          <p role="status" className="py-10 text-center text-sm text-gray-500">
            Carregando usuários...
          </p>
        )}

        {usuarios && visiveis.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center font-bold text-[#1A1A1A]">
            Nenhum usuário encontrado
          </p>
        )}

        {visiveis.length > 0 && (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {visiveis.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-sm font-bold text-white"
                  >
                    {`${u.first_name[0] ?? ""}${u.second_name[0] ?? ""}`.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1A1A1A]">
                      {u.first_name} {u.second_name}
                      {u.email === user?.email && (
                        <span className="ml-2 text-xs font-medium text-gray-500">(você)</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-gray-500" title={u.email}>
                      {u.email}
                    </p>
                    <div className="mt-1 flex flex-col gap-0.5">
                      <Autoria autor={u.funcionario} data={u.created_at} />
                      {u.alterado_por && (
                        <Autoria
                          acao="Alterado"
                          autor={u.alterado_por}
                          data={u.updated_at}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-[#FFD900] text-[#1A1A1A]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {u.role === "admin" ? "Administrador" : "Funcionário"}
                  </span>
                  <Link
                    to={`/usuarios/${u.id}/editar`}
                    aria-label={`Editar ${u.first_name} ${u.second_name}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-gray-50"
                  >
                    <i aria-hidden="true" className="bi bi-pencil"></i>
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
