import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initials = (user?.firstName ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F3F4F8] flex flex-col">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <img
            src="/logo-ardap.png"
            alt="ARDAP"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <div>
            <p className="font-extrabold leading-none">ARDAP | Gestão Interna</p>
            <p className="text-xs text-gray-500">
              Recanto dos Animais em Perigo • Paulo Afonso/BA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] text-sm font-bold text-white">
            {initials}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">{user?.firstName}</p>
            <span className="rounded-full bg-[#FFD900] px-2 py-0.5 text-xs font-bold text-[#1A1A1A]">
              {user?.role === "admin" ? "Admin" : "Funcionário"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"
          >
            Sair <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </header>

      <main className="flex-1" />
    </div>
  );
}
