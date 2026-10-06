import { Link } from "react-router-dom";

export function Animais() {
  return (
    <div className="min-h-screen bg-[#F3F4F8] flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-extrabold">Animais</h1>
      <p className="text-sm text-gray-500">
        Formulário de entrada (próxima task).
      </p>
      <Link to="/home" className="text-sm font-semibold underline">
        Voltar para a Home
      </Link>
    </div>
  );
}
