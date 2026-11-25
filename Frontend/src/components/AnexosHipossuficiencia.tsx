import { useState } from "react";
import { baixarArquivo } from "../services/arquivos";
import type { Registro } from "../services/registros";

export interface Anexo {
  id: number;
  nome: string;
}

export function AnexosHipossuficiencia({ registro }: { registro: Registro }) {
  const [baixando, setBaixando] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const anexos = (registro.anexos ?? []) as Anexo[];

  async function baixar(anexo: Anexo) {
    setErro("");
    setBaixando(anexo.id);
    try {
      await baixarArquivo(`/hipossuficiencias/${registro.id}/anexos/${anexo.id}`, anexo.nome);
    } catch {
      setErro(`Não foi possível baixar ${anexo.nome}.`);
    } finally {
      setBaixando(null);
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
          <i aria-hidden="true" className="bi bi-paperclip"></i>
        </div>
        <h2 className="text-lg font-bold text-[#1A1A1A]">Documentos anexados</h2>
      </div>
      {erro && (
        <p role="alert" className="text-sm font-medium text-[#DC2626]">
          {erro}
        </p>
      )}
      {anexos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum documento anexado.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {anexos.map((anexo) => (
            <li
              key={anexo.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-3"
            >
              <span className="min-w-0 break-words text-sm font-medium text-[#1A1A1A]">
                {anexo.nome}
              </span>
              <button
                type="button"
                disabled={baixando !== null}
                onClick={() => void baixar(anexo)}
                aria-label={`Baixar ${anexo.nome}`}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <i aria-hidden="true" className="bi bi-download"></i>
                {baixando === anexo.id ? "Baixando..." : "Baixar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
