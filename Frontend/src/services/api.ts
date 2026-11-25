import axios from "axios";

export const EVENTO_SESSAO_EXPIRADA = "ardap:sessao-expirada";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ardap_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 fora do login: o token expirou ou deixou de valer.
api.interceptors.response.use(undefined, (erro: unknown) => {
  if (
    axios.isAxiosError(erro) &&
    erro.response?.status === 401 &&
    erro.config?.url !== "/auth/login"
  ) {
    // Ignora respostas atrasadas de uma sessão anterior.
    const token = localStorage.getItem("ardap_token");
    if (token && erro.config?.headers.Authorization === `Bearer ${token}`) {
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }
  }
  return Promise.reject(erro);
});
