import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initials = (user?.firstName ?? "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-3"
        >
          <img
            src="/logo-ardap.png"
            alt="ARDAP"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <span className="text-left">
            <span className="block text-lg font-bold tracking-tight">
              ARDAP | Gestão Interna
            </span>
            <span className="-mt-1 hidden text-xs text-gray-500 sm:block">
              Recanto dos Animais em Perigo • Paulo Afonso/BA
            </span>
          </span>
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] text-xs font-bold text-white">
              {initials}
            </span>
            <span className="hidden flex-col items-start leading-tight lg:flex">
              <span className="text-sm font-medium">{user?.firstName}</span>
              <span className="mt-0.5 rounded-full bg-[#FFD900] px-2 py-0.5 text-[11px] font-semibold text-[#1A1A1A]">
                {user?.role === "admin" ? "Admin" : "Funcionário"}
              </span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Encerrar sessão"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <i className="bi bi-box-arrow-right text-[22px]"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
