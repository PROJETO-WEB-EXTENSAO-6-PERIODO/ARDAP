import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { AnimalCard, grupoEspecie, rotulo, type Animal } from "./AnimalCard";

// Animais marcados como castrados no cadastro e sem termo de castração: os que
// têm termo já aparecem na aba Termos.
export function AnimaisCastrados({
  busca,
  especie,
  normalizar,
}: {
  busca: string;
  especie: string;
  normalizar: (texto: string) => string;
}) {
  const [animais, setAnimais] = useState<Animal[] | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const { data } = await api.get<Animal[]>("/animais", {
        params: { castrados_sem_termo: true },
      });
      setAnimais(data);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (erro) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 p-10 text-center"
      >
        <p className="text-sm font-bold text-[#DC2626]">
          Não foi possível carregar os animais castrados.
        </p>
        <button
          type="button"
          onClick={() => void carregar()}
          className="cursor-pointer rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!animais) {
    return (
      <p role="status" className="py-16 text-center text-sm text-gray-500">
        Carregando...
      </p>
    );
  }

  const termo = normalizar(busca.trim());
  const visiveis = animais.filter(
    (a) =>
      (!especie || grupoEspecie(a.especie) === especie) &&
      normalizar(
        [a.nome, rotulo(a.especie), a.raca, a.cor_pelo, String(a.id)].filter(Boolean).join(" "),
      ).includes(termo),
  );

  return (
    <>
      <p aria-live="polite" className="text-sm text-gray-600">
        Mostrando {visiveis.length} de {animais.length}{" "}
        {animais.length === 1 ? "animal castrado" : "animais castrados"} sem termo no sistema.
      </p>
      {visiveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <i aria-hidden="true" className="bi bi-scissors text-4xl text-gray-400"></i>
          <p className="mt-3 font-bold text-[#1A1A1A]">
            {animais.length === 0 ? "Nenhum animal castrado sem termo" : "Nenhum animal encontrado"}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((animal) => (
            <li key={animal.id} className="min-w-0">
              <AnimalCard animal={animal} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
