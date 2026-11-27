import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import {
  carregarResumo,
  decimal,
  FATORES,
  FAIXAS,
  impacto,
  mensagemErro,
  porcentagem,
  type PrevisaoAnimal,
  type ResumoModelo,
} from "../services/ia";

// Faixa visual da pontuação, de 0 a 1, com os limites das faixas marcados.
export function BarraPontuacao({
  valor,
  classe,
  limites,
}: {
  valor: number;
  classe: string;
  limites?: { baixa: number; alta: number };
}) {
  return (
    <div className="relative h-2.5 w-full rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${classe}`}
        style={{ width: `${Math.max(3, valor * 100)}%` }}
      ></div>
      {limites &&
        [limites.baixa, limites.alta].map((l) => (
          <span
            key={l}
            aria-hidden="true"
            className="absolute -top-0.5 h-3.5 w-px bg-gray-400"
            style={{ left: `${l * 100}%` }}
          ></span>
        ))}
    </div>
  );
}

export function CartaoIA({ animalId }: { animalId: number }) {
  const [previsao, setPrevisao] = useState<PrevisaoAnimal | null>(null);
  const [resumo, setResumo] = useState<ResumoModelo | null>(null);
  const [erro, setErro] = useState<{ texto: string; tentar: boolean } | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    setPrevisao(null);
    try {
      const { data } = await api.post<PrevisaoAnimal>(`/ia/adocao/${animalId}`);
      setPrevisao(data);
    } catch (e) {
      // 409: adotado ou eutanasiado, não há o que tentar de novo
      const status = (e as { response?: { status?: number } }).response?.status;
      setErro({
        texto: mensagemErro(e, "Não foi possível calcular a chance de adoção."),
        tentar: status !== 409,
      });
    }
  }, [animalId]);

  useEffect(() => {
    void carregar();
    carregarResumo().then(setResumo).catch(() => {});
  }, [carregar]);

  const faixa = previsao ? FAIXAS[previsao.faixa] : null;
  const taxaReal = previsao && resumo?.taxa_real_por_faixa?.[previsao.faixa];

  return (
    <section
      aria-labelledby="titulo-ia"
      className="flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD900] text-[22px] text-[#1A1A1A]">
            <i aria-hidden="true" className="bi bi-stars"></i>
          </div>
          <div>
            <h2 id="titulo-ia" className="text-lg font-bold text-[#1A1A1A]">
              Chance de adoção em 30 dias
            </h2>
            <p className="text-xs text-gray-500">
              Estimativa da IA para apoiar a divulgação
            </p>
          </div>
        </div>
        <Link
          to="/ia/sobre"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A] underline-offset-4 hover:underline"
        >
          <i aria-hidden="true" className="bi bi-info-circle"></i>
          Como a IA calcula isso?
        </Link>
      </div>

      {!previsao && !erro && (
        <div role="status" className="flex items-center gap-3 text-sm text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#1A1A1A]"></div>
          Calculando...
        </div>
      )}

      {erro && (
        <div
          role={erro.tentar ? "alert" : "status"}
          className={`flex flex-col gap-3 rounded-xl p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${
            erro.tentar
              ? "border border-red-200 bg-red-50 font-medium text-[#DC2626]"
              : "bg-gray-50 text-gray-600"
          }`}
        >
          <span>{erro.texto}</span>
          {erro.tentar && (
            <button
              type="button"
              onClick={() => void carregar()}
              className="cursor-pointer self-start rounded-lg bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-white active:scale-95"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {previsao && faixa && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${faixa.classe}`}>
                {faixa.titulo}
              </span>
              <span className="text-sm text-gray-600">{faixa.dica}</span>
            </div>
            <BarraPontuacao
              valor={previsao.probabilidade}
              classe={faixa.barra}
              limites={resumo?.faixas}
            />
            <p className="text-sm text-gray-600">
              Pontuação do modelo:{" "}
              <strong className="text-[#1A1A1A]">
                {decimal(previsao.probabilidade)}
              </strong>{" "}
              (de 0 a 1).
              {taxaReal && (
                <>
                  {" "}
                  Nos testes, <strong className="text-[#1A1A1A]">
                    {porcentagem(taxaReal.taxa_real)}
                  </strong>{" "}
                  dos animais nesta faixa foram adotados em até{" "}
                  {previsao.janela_dias} dias.
                </>
              )}
            </p>
            <p className="text-sm text-gray-600">
              <i aria-hidden="true" className="bi bi-calendar3 mr-1.5"></i>
              No abrigo há{" "}
              <strong className="text-[#1A1A1A]">
                {previsao.dias_no_abrigo}{" "}
                {previsao.dias_no_abrigo === 1 ? "dia" : "dias"}
              </strong>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-500">
              O que mais pesou
            </h3>
            {previsao.fatores.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nenhum fator se destacou: o perfil é próximo de um animal típico
                do abrigo.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {previsao.fatores.map((f) => (
                  <li
                    key={f.fator}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#f8f9ff] px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-[#1A1A1A]">
                      <i
                        aria-hidden="true"
                        className={`bi ${
                          f.impacto > 0
                            ? "bi-arrow-up-circle-fill text-green-600"
                            : "bi-arrow-down-circle-fill text-red-600"
                        }`}
                      ></i>
                      {FATORES[f.fator] ?? f.fator}
                    </span>
                    <span
                      className={`font-semibold ${
                        f.impacto > 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {f.impacto > 0 ? "aumenta" : "reduz"}{" "}
                      {impacto(Math.abs(f.impacto)).replace("+", "")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-gray-500">
              Comparado a um animal de 1 ano, sem raça definida, resgatado na rua e
              saudável. São padrões aprendidos nos dados, não causas.
            </p>
          </div>
        </div>
      )}

      <p className="border-t border-gray-100 pt-3 text-xs text-gray-500">
        A IA apoia a decisão de quem divulgar primeiro. Ela não decide sozinha e
        não deve ser usada para negar cuidado a nenhum animal.
      </p>
    </section>
  );
}
