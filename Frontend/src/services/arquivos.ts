import { api } from "./api";

export const ARQUIVO_MAX_BYTES = 5 * 1024 * 1024;

export function lerBase64(arquivo: File) {
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    // Remove o prefixo "data:...;base64,"
    leitor.onload = () => resolve(String(leitor.result).split(",")[1]);
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

// A rota exige token, então um link direto não funciona.
export async function baixarArquivo(rota: string, nome: string) {
  const { data } = await api.get<Blob>(rota, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  // Dá tempo de o navegador iniciar o download.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
