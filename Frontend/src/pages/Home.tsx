import { Header } from "../components/Header";
import { PainelRelatorios } from "../components/PainelRelatorios";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-semibold text-[#1A1A1A]">
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-[#1A1A1A]"></span>
              Plantão Operacional Ativo
            </span>
            <span className="text-sm text-gray-500">
              Paulo Afonso - Sede ARDAP
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Bem-vindo(a), {user?.firstName}
          </h1>
        </section>

        <PainelRelatorios />
      </main>
    </div>
  );
}
