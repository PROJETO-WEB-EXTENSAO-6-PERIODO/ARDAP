import { useState } from "react";
import { useLocation } from "react-router-dom";

// Mostra o aviso enviado pela tela anterior (state da navegação).
export function AvisoSucesso() {
  const location = useLocation();
  const [aviso, setAviso] = useState<string>(location.state?.aviso ?? "");

  if (!aviso) return null;
  return (
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
  );
}
