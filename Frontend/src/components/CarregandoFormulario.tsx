import { Link } from "react-router-dom";
import { Header } from "./Header";

// Exibido no lugar do formulário enquanto o registro em edição não chega.
export function CarregandoFormulario({ erro, voltarPara }: { erro: string; voltarPara: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#EDF2FB]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-4 px-4 py-8 md:px-8">
        {erro ? (
          <>
            <p
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]"
            >
              {erro}
            </p>
            <Link to={voltarPara} className="text-sm font-semibold hover:underline">
              Voltar
            </Link>
          </>
        ) : (
          <p role="status" className="text-sm text-gray-500">
            Carregando registro...
          </p>
        )}
      </main>
    </div>
  );
}
