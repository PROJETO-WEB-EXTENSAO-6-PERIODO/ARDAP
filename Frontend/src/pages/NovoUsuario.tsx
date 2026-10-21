import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

export function NovoUsuario() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"funcionario" | "admin">("funcionario");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users", {
        first_name: firstName.trim(),
        second_name: lastName.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate("/home", { replace: true });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail;
      setError(detail ?? "Não foi possível criar o usuário.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-[#F8FAFC] px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus-within:border-[#1A1A1A] focus-within:bg-white";

  return (
    <div className="min-h-screen bg-[#F3F4F8] flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
            <i className="bi bi-house"></i>
            <button
              onClick={() => navigate("/home")}
              className="hover:text-gray-800"
            >
              Início
            </button>
            <span>/</span>
            <span>Usuários</span>
            <span>/</span>
            <span className="font-medium text-gray-800">Novo usuário</span>
          </nav>

          <div className="rounded-xl border-t-4 border-[#FFD900] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8]">
                  <i className="bi bi-person-badge text-xl"></i>
                </span>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Cadastrar Novo Colaborador
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Preencha as credenciais e defina as permissões de acesso ao
                    sistema ARDAP.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECEA] px-2.5 py-1 text-xs font-semibold text-[#DC3545]">
                <i className="bi bi-shield-lock"></i>
                Acesso Restrito: Admin
              </span>
            </div>
            
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[#DC2626]">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">
                  Nome <span className="text-[#DC2626]">*</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      Primeiro nome
                    </span>
                    <span className={inputClass}>
                      <i className="bi bi-person"></i>
                      <input
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ex: Mariana"
                        className="w-full bg-transparent outline-none placeholder:text-gray-400"
                      />
                    </span>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                      Sobrenome <span className="text-[#DC2626]">*</span>
                      <span className="ml-2 font-normal text-gray-400">
                        Sobrenome legal
                      </span>
                    </span>
                    <span className={inputClass}>
                      <i className="bi bi-person"></i>
                      <input
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Ex: Costa"
                        className="w-full bg-transparent outline-none placeholder:text-gray-400"
                      />
                    </span>
                  </label>
                </div>
              </fieldset>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold">
                  E-mail Institucional{" "}
                  <span className="text-[#DC2626]">*</span>
                </span>
                <span className={inputClass}>
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@ardap.org"
                    className="w-full bg-transparent outline-none placeholder:text-gray-400"
                  />
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  Utilizado para login, alertas de plantão e auditoria interna.
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Senha Provisória{" "}
                    <span className="text-[#DC2626]">*</span>
                  </span>
                  <span className={inputClass}>
                    <i className="bi bi-lock"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-transparent outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-gray-500"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      <i
                        className={
                          showPassword ? "bi bi-eye-slash" : "bi bi-eye"
                        }
                      ></i>
                    </button>
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">
                    Confirmar Senha{" "}
                    <span className="text-[#DC2626]">*</span>
                  </span>
                  <span className={inputClass}>
                    <i className="bi bi-shield-lock"></i>
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-transparent outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-gray-500"
                      aria-label={
                        showConfirm ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      <i
                        className={
                          showConfirm ? "bi bi-eye-slash" : "bi bi-eye"
                        }
                      ></i>
                    </button>
                  </span>
                </label>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold">
                  Nível de Permissão (Role){" "}
                  <span className="text-[#DC2626]">*</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`relative flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-colors ${
                      role === "funcionario"
                        ? "border-[#1A1A1A] bg-white"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      className="sr-only"
                      checked={role === "funcionario"}
                      onChange={() => setRole("funcionario")}
                    />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <i className="bi bi-person-gear text-gray-500"></i>
                        Funcionário (Padrão)
                      </span>
                      <span className="rounded-full bg-[#FFD900] px-2 py-0.5 text-[11px] font-semibold text-[#1A1A1A]">
                        Recomendado
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Operação diária: triagem de resgate, prontuários,
                      administração de vacinas e fichas de adoção.
                    </p>
                  </label>

                  <label
                    className={`relative flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-colors ${
                      role === "admin"
                        ? "border-[#1A1A1A] bg-white"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      className="sr-only"
                      checked={role === "admin"}
                      onChange={() => setRole("admin")}
                    />
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <i className="bi bi-shield-check text-gray-500"></i>
                        Administrador
                      </span>
                      <span className="text-[11px] font-medium text-gray-500">
                        Gestão Total
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Controle pleno: cadastro de novos membros, emissão de
                      relatórios contábeis, auditoria e desativações.
                    </p>
                  </label>
                </div>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <i className="bi bi-arrow-left"></i>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                      Criando...
                    </>
                  ) : (
                    <>
                      <span>Criar Usuário</span>
                      <i className="bi bi-arrow-right text-[#FFD900]"></i>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-1 border-t pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-1.5">
                <i className="bi bi-lock-shield"></i>
                Autenticação criptografada em conformidade com as diretrizes
                ARDAP.
              </span>
              <span>Paulo Afonso • Bahia</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
