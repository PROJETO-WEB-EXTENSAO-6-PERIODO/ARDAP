import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, EVENTO_SESSAO_EXPIRADA } from "../services/api";

export interface SessionUser {
  email: string;
  role: string;
  firstName: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  sessaoExpirada: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  recarregarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem("ardap_user");
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(loadUser);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  useEffect(() => {
    function encerrar() {
      logout();
      setSessaoExpirada(true);
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, encerrar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, encerrar);
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("ardap_token", data.access_token);
    await recarregarUsuario();
    setSessaoExpirada(false);
  }

  async function recarregarUsuario() {
    const me = await api.get("/users/me");
    const session: SessionUser = {
      email: me.data.email,
      role: me.data.role,
      firstName: me.data.first_name ?? me.data.email.split("@")[0],
    };
    localStorage.setItem("ardap_user", JSON.stringify(session));
    setUser(session);
  }

  function logout() {
    localStorage.removeItem("ardap_token");
    localStorage.removeItem("ardap_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, sessaoExpirada, login, logout, recarregarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
