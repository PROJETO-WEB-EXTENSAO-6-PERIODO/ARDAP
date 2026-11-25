import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

// Exclui o registro após confirmação e volta para a lista com um aviso.
export function BotaoExcluir({
  rota,
  id,
  nome,
  voltarPara,
  descricao,
  aviso = "Registro excluído com sucesso!",
  disabled = false,
}: {
  rota: string;
  id: string;
  nome: string;
  voltarPara: string;
  descricao?: string;
  aviso?: string;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  function abrir() {
    setErro("");
    dialogRef.current?.showModal();
  }

  async function excluir() {
    setErro("");
    setExcluindo(true);
    try {
      await api.delete(`/${rota}/${id}`);
      navigate(voltarPara, { replace: true, state: { aviso } });
    } catch (e) {
      const detalhe = isAxiosError(e) ? e.response?.data?.detail : null;
      setErro(
        typeof detalhe === "string" ? detalhe : "Não foi possível excluir. Tente novamente.",
      );
      setExcluindo(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        disabled={disabled}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-[#DC2626] bg-white px-6 py-3 text-center text-sm font-medium text-[#DC2626] transition-all hover:bg-red-50 active:scale-95 disabled:opacity-60"
      >
        <i aria-hidden="true" className="bi bi-trash"></i>
        Excluir
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="titulo-excluir"
        onCancel={(e) => {
          if (excluindo) e.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 text-[#1A1A1A] shadow-xl backdrop:bg-black/50"
      >
        <h2 id="titulo-excluir" className="text-lg font-bold">
          Excluir {nome}?
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {descricao} Esta ação não pode ser desfeita.
        </p>
        {erro && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-[#DC2626]"
          >
            {erro}
          </p>
        )}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={excluindo}
            className="cursor-pointer rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void excluir()}
            disabled={excluindo}
            className="cursor-pointer rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          >
            {excluindo ? "Excluindo..." : "Sim, excluir"}
          </button>
        </div>
      </dialog>
    </>
  );
}
