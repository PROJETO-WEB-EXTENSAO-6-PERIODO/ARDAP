import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BarraPontuacao } from "../components/CartaoIA";
import { Header } from "../components/Header";
import { api } from "../services/api";
import {
  carregarResumo,
  decimal,
  FATORES,
  FAIXAS,
  FEATURES,
  impacto,
  mensagemErro,
  porcentagem,
  type Faixa,
  type Previsao,
  type ResumoModelo,
} from "../services/ia";

const NOMES_MODELO: Record<string, string> = {
  "Baseline (classe majoritaria)": "Referência (sempre “não adotado”)",
  "Regressao Logistica": "Regressão Logística",
  "Random Forest": "Random Forest",
  "Gradient Boosting": "Gradient Boosting",
};

function Secao({
  icone,
  titulo,
  children,
}: {
  icone: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-3 text-lg font-bold text-[#1A1A1A]">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[20px] text-gray-600">
          <i aria-hidden="true" className={`bi ${icone}`}></i>
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Numero({ valor, rotulo, dica }: { valor: string; rotulo: string; dica: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-[#f8f9ff]/50 p-4">
      <span className="text-2xl font-bold text-[#1A1A1A]">{valor}</span>
      <span className="text-sm font-semibold text-[#1A1A1A]">{rotulo}</span>
      <span className="text-xs text-gray-500">{dica}</span>
    </div>
  );
}

const campo =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900] aria-[invalid=true]:border-red-400";

function Simulador({ resumo }: { resumo: ResumoModelo | null }) {
  const [form, setForm] = useState({
    especie: "",
    sexo: "",
    idade: "",
    castrado: false,
    raca: "",
    cor: "",
    origem: "",
    condicao: "",
  });
  const [erros, setErros] = useState<string[]>([]);
  const [resultado, setResultado] = useState<Previsao | null>(null);
  const [enviando, setEnviando] = useState(false);

  function alterar<K extends keyof typeof form>(chave: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const faltando: string[] = [];
    if (!form.especie) faltando.push("Escolha a espécie.");
    if (!form.sexo) faltando.push("Escolha o sexo.");
    const idade = Number(form.idade);
    if (form.idade.trim() === "") faltando.push("Informe a idade estimada.");
    else if (!Number.isInteger(idade) || idade < 0 || idade > 30)
      faltando.push("A idade deve ser um número inteiro entre 0 e 30 anos.");
    if (!form.origem) faltando.push("Escolha a origem do animal.");
    if (!form.condicao) faltando.push("Escolha a condição de saúde.");
    setErros(faltando);
    setResultado(null);
    if (faltando.length) return;

    setEnviando(true);
    try {
      const { data } = await api.post<Previsao>("/ia/adocao/simular", {
        especie: form.especie,
        sexo: form.sexo,
        idade_anos: idade,
        castrado: form.castrado,
        raca: form.raca || null,
        cor_pelo: form.cor || null,
        origem: form.origem,
        condicao: form.condicao,
      });
      setResultado(data);
    } catch (erro) {
      setErros([mensagemErro(erro, "Não foi possível fazer a simulação.")]);
    } finally {
      setEnviando(false);
    }
  }

  const faixa = resultado ? FAIXAS[resultado.faixa] : null;
  const taxa = resultado && resumo?.taxa_real_por_faixa?.[resultado.faixa];

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
      <p className="text-sm text-gray-600">
        Preencha um perfil para ver como o modelo reage, sem cadastrar um animal.
        Nada do que for digitado aqui é salvo.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Espécie *
          <select className={campo} value={form.especie} aria-invalid={erros.length > 0 && !form.especie}
            onChange={(e) => alterar("especie", e.target.value)}>
            <option value="">Selecione...</option>
            <option value="cao">Cão</option>
            <option value="gato">Gato</option>
            <option value="outro">Outro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Sexo *
          <select className={campo} value={form.sexo} aria-invalid={erros.length > 0 && !form.sexo}
            onChange={(e) => alterar("sexo", e.target.value)}>
            <option value="">Selecione...</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Idade estimada (anos) *
          <input type="number" min={0} max={30} inputMode="numeric" className={campo}
            placeholder="0 = menos de 1 ano" value={form.idade}
            aria-invalid={erros.length > 0 && form.idade === ""}
            onChange={(e) => alterar("idade", e.target.value)} />
        </label>
        <label className="flex items-center gap-2.5 self-end rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-[#1A1A1A]">
          <input type="checkbox" checked={form.castrado}
            onChange={(e) => alterar("castrado", e.target.checked)}
            className="h-4 w-4 accent-[#1A1A1A]" />
          Castrado
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Origem *
          <select className={campo} value={form.origem} aria-invalid={erros.length > 0 && !form.origem}
            onChange={(e) => alterar("origem", e.target.value)}>
            <option value="">Selecione...</option>
            <option value="rua">Resgatado na rua</option>
            <option value="tutor">Entregue pelo tutor</option>
            <option value="abandono">Abandonado</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Condição de saúde *
          <select className={campo} value={form.condicao} aria-invalid={erros.length > 0 && !form.condicao}
            onChange={(e) => alterar("condicao", e.target.value)}>
            <option value="">Selecione...</option>
            <option value="saudavel">Saudável</option>
            <option value="acidentado">Acidentado</option>
            <option value="doente">Doente</option>
            <option value="em_tratamento">Em tratamento</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Raça
          <input className={campo} maxLength={100} placeholder="Ex.: SRD, Poodle"
            value={form.raca} onChange={(e) => alterar("raca", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-[#1A1A1A]">
          Cor da pelagem
          <input className={campo} maxLength={100} placeholder="Ex.: Preto e branco"
            value={form.cor} onChange={(e) => alterar("cor", e.target.value)} />
        </label>
      </div>

      {erros.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]">
          <ul className="list-inside list-disc">
            {erros.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      <button type="submit" disabled={enviando}
        className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-[#FFD900] px-6 py-3 text-sm font-bold text-[#1A1A1A] transition-all hover:opacity-90 active:scale-95 disabled:opacity-60">
        <i aria-hidden="true" className="bi bi-stars"></i>
        {enviando ? "Calculando..." : "Calcular chance"}
      </button>

      {resultado && faixa && (
        <div aria-live="polite" className="grid grid-cols-1 gap-5 rounded-xl border border-gray-200 bg-[#f8f9ff]/50 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className={`self-start rounded-full px-3 py-1.5 text-sm font-bold ${faixa.classe}`}>
              {faixa.titulo}
            </span>
            <BarraPontuacao valor={resultado.probabilidade} classe={faixa.barra} limites={resumo?.faixas} />
            <p className="text-sm text-gray-600">
              Pontuação <strong className="text-[#1A1A1A]">{decimal(resultado.probabilidade)}</strong>.
              {taxa && <> Nos testes, {porcentagem(taxa.taxa_real)} dos animais nesta faixa foram adotados em até 30 dias.</>}
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {resultado.fatores.length === 0 && (
              <li className="text-gray-600">Nenhum fator se destacou para este perfil.</li>
            )}
            {resultado.fatores.map((f) => (
              <li key={f.fator} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2">
                <span>{FATORES[f.fator] ?? f.fator}</span>
                <span className={`font-semibold ${f.impacto > 0 ? "text-green-700" : "text-red-700"}`}>
                  {impacto(f.impacto)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

export function SobreModelo() {
  const [resumo, setResumo] = useState<ResumoModelo | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarResumo()
      .then(setResumo)
      .catch((e) => setErro(mensagemErro(e, "Não foi possível carregar os dados do modelo.")));
  }, []);

  const teste = resumo?.teste;
  const baseline = resumo?.validacao["Baseline (classe majoritaria)"];
  const maiorImportancia = Math.max(...(resumo?.importancia.map((i) => i.valor) ?? [1]));

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F2ED]">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/ia/prioridade" className="font-medium hover:text-[#1A1A1A]">
            Prioridade de divulgação
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Sobre o modelo</span>
        </nav>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#1A1A1A]">
            <i aria-hidden="true" className="bi bi-stars"></i>
            Sobre o modelo de IA
          </h1>
          <p className="text-sm text-gray-600 md:text-base">
            A ONG resgata mais animais do que consegue divulgar. Para ajudar a
            escolher quem divulgar primeiro, o sistema estima a{" "}
            <strong>chance de cada animal ser adotado em até 30 dias</strong>. Quem
            tem chance baixa aparece no topo da{" "}
            <Link to="/ia/prioridade" className="font-semibold underline underline-offset-4">
              lista de prioridade
            </Link>
            , porque é quem mais precisa de feiras, redes sociais e contato com
            adotantes.
          </p>
        </section>

        {erro && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]">
            {erro}
          </div>
        )}

        <Secao icone="bi-database" titulo="Quais dados a IA usa">
          <p className="text-sm text-gray-600">
            O modelo aprendeu com{" "}
            <strong>
              {resumo?.base ? resumo.base.linhas.toLocaleString("pt-BR") : "173 mil"} entradas
            </strong>{" "}
            de animais do <strong>Austin Animal Center</strong> (Texas, EUA), uma base
            pública de abrigo com o desfecho de cada animal
            {resumo?.base && <> ({resumo.base.periodo})</>}. A ARDAP ainda não tem
            histórico suficiente para treinar um modelo próprio.
          </p>
          <p className="text-sm text-gray-600">
            Do cadastro de cada animal, a IA lê: espécie, sexo, castração, idade
            estimada, raça, cor da pelagem, origem (rua, tutor ou abandono), a
            condição de saúde registrada no SUPATAS e o mês de entrada. Nenhum dado
            de pessoas (adotantes, tutores ou funcionários) é usado.
          </p>
        </Secao>

        <Secao icone="bi-speedometer2" titulo="Como ler o resultado">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(["baixa", "media", "alta"] as Faixa[]).map((f) => {
              const taxa = resumo?.taxa_real_por_faixa?.[f];
              const limites = resumo?.faixas;
              const intervalo = limites
                ? f === "baixa"
                  ? `abaixo de ${decimal(limites.baixa)}`
                  : f === "media"
                    ? `de ${decimal(limites.baixa)} a ${decimal(limites.alta)}`
                    : `${decimal(limites.alta)} ou mais`
                : "";
              return (
                <div key={f} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
                  <span className={`self-start rounded-full px-3 py-1 text-sm font-bold ${FAIXAS[f].classe}`}>
                    {FAIXAS[f].titulo}
                  </span>
                  <span className="text-xs text-gray-500">Pontuação {intervalo}</span>
                  {taxa && (
                    <span className="text-sm text-gray-700">
                      <strong className="text-lg text-[#1A1A1A]">{porcentagem(taxa.taxa_real)}</strong>{" "}
                      foram adotados em 30 dias nos testes
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-600">
            A pontuação vai de 0 a 1, mas <strong>não é uma porcentagem exata</strong>:
            o modelo tende a exagerar a chance. Por isso mostramos a faixa e quantos
            animais de cada faixa foram realmente adotados no conjunto de teste.
          </p>
        </Secao>

        <Secao icone="bi-graph-up" titulo="Quão bem o modelo acerta">
          {teste && baseline && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Numero valor={decimal(teste.roc_auc)} rotulo="ROC-AUC"
                  dica="Chance de ordenar certo um adotado e um não adotado (0,5 = sorteio)" />
                <Numero valor={porcentagem(teste.recall)} rotulo="Recall"
                  dica="Dos animais que foram adotados, quantos o modelo reconheceu" />
                <Numero valor={porcentagem(teste.precisao)} rotulo="Precisão"
                  dica="Dos que o modelo apontou como adotáveis, quantos foram adotados" />
                <Numero valor={decimal(teste.f1_macro)} rotulo="F1 macro"
                  dica={`Contra ${decimal(baseline.f1_macro)} de uma regra que sempre diz “não adotado”`} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <caption className="mb-2 text-left text-xs text-gray-500">
                    Modelos comparados na validação. O escolhido foi o de maior F1 macro.
                  </caption>
                  <thead className="border-b border-gray-200 text-xs text-gray-500">
                    <tr>
                      <th className="py-2 font-semibold">Modelo</th>
                      <th className="py-2 font-semibold">F1 macro</th>
                      <th className="py-2 font-semibold">ROC-AUC</th>
                      <th className="py-2 font-semibold">Precisão</th>
                      <th className="py-2 font-semibold">Recall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(resumo!.validacao).map(([nome, m]) => (
                      <tr key={nome} className={`border-b border-gray-100 ${nome === resumo!.algoritmo ? "bg-[#FFD900]/20 font-semibold" : ""}`}>
                        <td className="py-2">{NOMES_MODELO[nome] ?? nome}</td>
                        <td className="py-2">{decimal(m.f1_macro, 3)}</td>
                        <td className="py-2">{decimal(m.roc_auc, 3)}</td>
                        <td className="py-2">{decimal(m.precisao, 3)}</td>
                        <td className="py-2">{decimal(m.recall, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600">
                O limite de decisão ({decimal(resumo!.threshold)}) favorece o recall:
                é melhor divulgar um animal a mais do que esquecer um que seria
                adotado.
              </p>
            </>
          )}
          {!resumo && !erro && <p className="text-sm text-gray-500">Carregando...</p>}
        </Secao>

        <Secao icone="bi-bar-chart" titulo="O que mais influencia a chance">
          <ul className="flex flex-col gap-2.5">
            {resumo?.importancia.map((i) => (
              <li key={i.feature} className="grid grid-cols-[9rem_1fr_3.5rem] items-center gap-3 text-sm">
                <span className="text-[#1A1A1A]">{FEATURES[i.feature] ?? i.feature}</span>
                <div className="h-2.5 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#1A1A1A]" style={{ width: `${(i.valor / maiorImportancia) * 100}%` }}></div>
                </div>
                <span className="text-right text-xs text-gray-500">{decimal(i.valor, 3)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600">
            A idade é, de longe, o fator mais forte: filhotes são adotados mais
            rápido, idosos demoram mais. Animais entregues pelo tutor também têm mais
            chance do que os resgatados na rua.
          </p>
        </Secao>

        <Secao icone="bi-exclamation-triangle" titulo="Limites da IA">
          <ul className="flex list-inside list-disc flex-col gap-2 text-sm text-gray-600">
            <li>
              <strong>Os dados são dos EUA.</strong> Em Paulo Afonso, raças, cores
              e hábitos de adoção são diferentes. Use a pontuação para comparar
              animais entre si, não como previsão exata.
            </li>
            <li>
              <strong>Porte, peso, temperamento e vacinação não entram</strong>: a
              base pública não tem esses campos.
            </li>
            <li>
              Raças e cores sem equivalente na base (ex.: Fila Brasileiro) são
              tratadas como desconhecidas.
            </li>
            <li>
              Os fatores mostram <strong>padrões dos dados, não causas</strong>.
              Não mude o cuidado de um animal só para subir a pontuação.
            </li>
            <li>
              A IA <strong>apoia</strong> a decisão de divulgação. Ela não decide
              sozinha e nunca deve ser usada para negar cuidado a um animal.
            </li>
          </ul>
        </Secao>

        <Secao icone="bi-sliders" titulo="Teste o modelo">
          <Simulador resumo={resumo} />
        </Secao>
      </main>
    </div>
  );
}
