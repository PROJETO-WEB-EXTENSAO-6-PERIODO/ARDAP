import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/home", { replace: true });
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F8] flex flex-col">
      <header className="flex items-center gap-2 px-6 py-4">
        <img
          src="/logo-ardap.png"
          alt="ARDAP"
          className="h-8 w-8 rounded-lg object-cover"
        />
        <span className="font-extrabold tracking-wide">ARDAP</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4">
        <img
          src="/logo-ardap.png"
          alt="Logo ARDAP"
          className="mt-2 h-20 w-20 rounded-2xl object-cover"
        />
        <h1 className="text-2xl font-extrabold tracking-wide">ARDAP</h1>
        <p className="text-sm text-gray-500">
          Gestão Operacional e Abrigo • Paulo Afonso/BA
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 w-full max-w-md rounded-xl border-t-4 border-[#FFD900] bg-white p-8 shadow"
        >
          <h2 className="text-lg font-bold">Bem-vindo!</h2>
          <p className="text-sm text-gray-500">
            Gerencie seus formulários de forma centralizada .
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[#DC2626]">
              {error}
            </p>
          )}

          <label className="mt-5 block text-sm font-semibold" htmlFor="email">
            E-mail
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border px-3 text-gray-500 focus-within:border-[#1A1A1A]">
            <i className="bi bi-envelope"></i>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full py-2 text-[#1F2937] outline-none placeholder:text-gray-400"
            />
          </div>

          <label
            className="mt-4 block text-sm font-semibold"
            htmlFor="password"
          >
            Senha de acesso
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border px-3 text-gray-500 focus-within:border-[#1A1A1A]">
            <i className="bi bi-key"></i>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full py-2 text-[#1F2937] outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-500"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              <i
                className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
              ></i>
            </button>
          </div>

          <p className="mt-3 text-right text-xs font-semibold text-[#8a6d00]">
            Esqueceu a senha?
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar no Sistema"}
            {!loading && (
              <i className="bi bi-arrow-right text-[#FFD900]"></i>
            )}
          </button>
        </form>
      </main>

      <footer className="flex flex-col gap-1 px-6 py-4 text-xs text-gray-500 md:flex-row md:justify-between">
        <span>
          © 2026 Associação Recanto dos Animais em Perigo (ARDAP). Acesso
          restrito e monitorado a colaboradores autorizados.
        </span>
        <span>Suporte Interno • Políticas de Segurança • Manual do Voluntário</span>
      </footer>
    </div>
  );
}
