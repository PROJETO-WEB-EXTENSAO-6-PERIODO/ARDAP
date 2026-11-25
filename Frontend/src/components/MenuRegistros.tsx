import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MODULOS_REGISTRO } from "../services/registros";

export function MenuRegistros() {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  // Fecha ao clicar ou levar o foco para fora do menu.
  useEffect(() => {
    if (!aberto) return;
    function aoSair(e: Event) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoSair);
    document.addEventListener("focusin", aoSair);
    return () => {
      document.removeEventListener("mousedown", aoSair);
      document.removeEventListener("focusin", aoSair);
    };
  }, [aberto]);

  return (
    <div
      ref={raiz}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && aberto) {
          setAberto(false);
          botao.current?.focus();
        }
      }}
    >
      <button
        ref={botao}
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto(!aberto)}
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#1A1A1A] transition-colors hover:text-gray-600"
      >
        Registros
        <i
          aria-hidden="true"
          className={`bi bi-chevron-down text-xs transition-transform ${aberto ? "rotate-180" : ""}`}
        ></i>
      </button>

      {aberto && (
        <ul className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {MODULOS_REGISTRO.map((modulo) => (
            <li key={modulo.rota}>
              <Link
                to={`/${modulo.rota}/registros`}
                onClick={() => setAberto(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-gray-100"
              >
                <i aria-hidden="true" className={`bi ${modulo.icone} text-gray-500`}></i>
                {modulo.titulo}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
