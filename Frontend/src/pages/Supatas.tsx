import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

const SITUACOES = [
  { value: "acidentado", label: "Acidentado", icon: "bi-emoji-angry" },
  { value: "doente", label: "Doente", icon: "bi-heart-pulse" },
  { value: "castracao", label: "Castração", icon: "bi-scissors" },
  { value: "outros", label: "Outros", icon: "bi-question-circle" },
];

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900] transition-colors";

export function Supatas() {
  // Seção 1 – Órgão solicitante
  const orgaoSolicitante =
    "SUPATAS – Superintendência de Proteção e Bem-Estar Animal";
  const [responsavel, setResponsavel] = useState("");
  const [dataEncaminhamento, setDataEncaminhamento] = useState("");

  // Seção 2 – Animal encaminhado
  const [especie, setEspecie] = useState("");
  const [especieOutro, setEspecieOutro] = useState("");
  const [sexo, setSexo] = useState("");
  const [nomeAnimal, setNomeAnimal] = useState("");
  const [situacao, setSituacao] = useState("");
  const [situacaoOutros, setSituacaoOutros] = useState("");
  const [localRecolhimento, setLocalRecolhimento] = useState("");
  const [nomeResgatista, setNomeResgatista] = useState("");

  // Seção 3 – Declaração / relatório
  const [relatorio, setRelatorio] = useState("");

  // Seção 4 – Assinatura SUPATAS
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [assinaturaSupatas, setAssinaturaSupatas] = useState("");

  // Seção 5 – Assinatura ARDAP (recebimento)
  const [recebidoPor, setRecebidoPor] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [assinaturaArdap, setAssinaturaArdap] = useState("");

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("ardap_user");
    if (user) {
      try {
        const u = JSON.parse(user);
        setRecebidoPor(
          `${u.firstName ?? u.email} - ${u.role === "admin" ? "Admin" : "Funcionário"}`
        );
      } catch {
        setRecebidoPor("Colaborador ARDAP");
      }
    }
    const hoje = new Date().toISOString().slice(0, 10);
    setDataEncaminhamento(hoje);
    setDataRecebimento(hoje);
  }, []);

  function resetForm() {
    setResponsavel("");
    setDataEncaminhamento("");
    setEspecie("");
    setEspecieOutro("");
    setSexo("");
    setNomeAnimal("");
    setSituacao("");
    setSituacaoOutros("");
    setLocalRecolhimento("");
    setNomeResgatista("");
    setRelatorio("");
    setCpfResponsavel("");
    setAssinaturaSupatas("");
    setTriedSubmit(false);
  }

  function maskCPF(v: string) {
    let n = v.replace(/\D/g, "");
    if (n.length > 11) n = n.slice(0, 11);
    n = n.replace(/(\d{3})(\d)/, "$1.$2");
    n = n.replace(/(\d{3})(\d)/, "$1.$2");
    n = n.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess(false);
    setTriedSubmit(true);

    if (!responsavel.trim()) {
      setFormError("Informe o nome do responsável pelo encaminhamento.");
      return;
    }
    if (!dataEncaminhamento) {
      setFormError("Informe a data do encaminhamento.");
      return;
    }
    if (!especie) {
      setFormError("Informe a espécie do animal.");
      return;
    }
    if (especie === "outro" && !especieOutro.trim()) {
      setFormError("Especifique a espécie do animal.");
      return;
    }
    if (!sexo) {
      setFormError("Informe o sexo do animal.");
      return;
    }
    if (!situacao) {
      setFormError("Informe a situação do animal.");
      return;
    }
    if (situacao === "outros" && !situacaoOutros.trim()) {
      setFormError("Descreva a situação do animal.");
      return;
    }
    if (!localRecolhimento.trim()) {
      setFormError("Informe o local onde o animal foi recolhido.");
      return;
    }
    if (!cpfResponsavel.replace(/\D/g, "")) {
      setFormError("Informe o CPF do responsável SUPATAS.");
      return;
    }
    if (!assinaturaSupatas.trim()) {
      setFormError("Informe a assinatura do servidor SUPATAS.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/supatas", {
        orgao_solicitante: orgaoSolicitante,
        nome_responsavel_encaminhamento: responsavel.trim(),
        data_encaminhamento: dataEncaminhamento,
        situacao_animal: situacao,
        situacao_animal_outros_desc:
          situacao === "outros" ? situacaoOutros.trim() || null : null,
        local_recolhimento: localRecolhimento.trim() || null,
        nome_resgatista: nomeResgatista.trim() || null,
        relatorio: relatorio.trim() || null,
      });
      setSuccess(true);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Não foi possível salvar. Confira os dados e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#EDF2FB]">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <Link
            to="/home"
            className="flex items-center gap-1 font-medium transition-colors hover:text-[#1A1A1A]"
          >
            <i className="bi bi-house text-[16px]"></i>
            <span>Início</span>
          </Link>
          <span className="font-normal text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Solicitação SUPATAS</span>
        </nav>

        {/* Cabeçalho do formulário */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
              Solicitação de Atendimento
            </h1>
            <p className="mt-1 text-sm text-[#6f5d00] font-semibold">
              SUPATAS – Superintendência de Proteção e Bem-Estar Animal
            </p>
          </div>
        </section>

        {success && (
          <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-100 p-4 text-green-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <i className="bi bi-check-circle text-[22px]"></i>
              <span className="text-sm font-medium">
                Solicitação SUPATAS registrada com sucesso! Os dados foram
                salvos no sistema.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="p-1 hover:text-green-900"
              aria-label="Fechar aviso"
            >
              <i className="bi bi-x text-[18px]"></i>
            </button>
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-[#DC2626]">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Seção 1 – Dados do Órgão Solicitante */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <span className="font-bold text-[#1A1A1A]">1</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Dados do Órgão Solicitante
                  </h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Encaminhamento municipal
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                Encaminhamento Municipal
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold text-[#1A1A1A]"
                  htmlFor="orgao_origem"
                >
                  Órgão de Origem
                </label>
                <span className="text-xs text-gray-500">
                  Preenchimento Fixo
                </span>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] text-[#1A1A1A] shadow-inner">
                <i className="bi bi-bank text-[#FFD900] text-[20px]"></i>
                <input
                  id="orgao_origem"
                  type="text"
                  value={orgaoSolicitante}
                  readOnly
                  className="bg-transparent border-0 font-body-md text-[#1A1A1A] w-full outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="responsavel_enc"
                  >
                    Nome do responsável pelo encaminhamento{" "}
                    <span className="font-bold text-[#DC2626]">*</span>
                  </label>
                </div>
                <input
                  id="responsavel_enc"
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className={inputCls}
                />
                {triedSubmit && !responsavel.trim() && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">
                    Campo obrigatório
                  </p>
                )}
                <span className="font-body-sm text-secondary">
                  Servidor ou agente municipal que entregou o animal.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="data_encaminhamento"
                  >
                    Data do encaminhamento{" "}
                    <span className="font-bold text-[#DC2626]">*</span>
                  </label>
                </div>
                <input
                  id="data_encaminhamento"
                  type="date"
                  value={dataEncaminhamento}
                  onChange={(e) => setDataEncaminhamento(e.target.value)}
                  required
                  className={inputCls}
                />
                {triedSubmit && !dataEncaminhamento && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">
                    Campo obrigatório
                  </p>
                )}
                <span className="font-body-sm text-secondary">
                  Conforme data carimbada na guia SUPATAS.
                </span>
              </div>
            </div>
          </article>

          {/* Seção 2 – Dados do Animal Encaminhado */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <span className="font-bold text-[#1A1A1A]">2</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Dados do Animal Encaminhado
                  </h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Espécie, sexo, nome, situação e local de recolhimento
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#fdecea] px-2 py-0.5 text-xs font-medium text-[#dc2626]">
                Campos Obrigatórios *
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Espécie <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "cao", label: "Cão", icon: "bi-bull-eye" },
                    { value: "gato", label: "Gato", icon: "bi-cat" },
                    { value: "outro", label: "Outro", icon: "bi-plus-square" },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className={`cursor-pointer flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-gray-200 transition-colors hover:bg-gray-50 ${
                        especie === o.value
                          ? "border-[#FFD900] bg-[#FFF3CD] ring-1 ring-[#FFD900]"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="especie"
                        value={o.value}
                        checked={especie === o.value}
                        onChange={(e) => setEspecie(e.target.value)}
                        className="sr-only"
                      />
                      <i className={`bi ${o.icon} text-[24px]`}></i>
                      <span className="font-label-md text-[#1A1A1A]">
                        {o.label}
                      </span>
                    </label>
                  ))}
                </div>
                {especie === "outro" && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="font-label-sm text-[#1A1A1A]">
                      Especificar espécie{" "}
                      <span className="font-bold text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      value={especieOutro}
                      onChange={(e) => setEspecieOutro(e.target.value)}
                      placeholder="Ex: Equino, Ave, Silvestre..."
                      className={inputCls}
                    />
                  </div>
                )}
                {triedSubmit && !especie && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">
                    Campo obrigatório
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Sexo <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "macho", label: "Macho", icon: "bi-male" },
                    { value: "femea", label: "Fêmea", icon: "bi-female" },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className={`cursor-pointer flex items-center justify-center gap-2 p-3.5 rounded-xl border border-gray-200 transition-colors hover:bg-gray-50 ${
                        sexo === o.value
                          ? "border-[#1A1A1A] bg-[#f8f9ff] ring-1 ring-[#1A1A1A]"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="sexo"
                        value={o.value}
                        checked={sexo === o.value}
                        onChange={(e) => setSexo(e.target.value)}
                        className="h-4 w-4 accent-[#1A1A1A]"
                      />
                      <i className={`bi ${o.icon} text-[20px]`}></i>
                      <span className="font-label-md text-[#1A1A1A]">
                        {o.label}
                      </span>
                    </label>
                  ))}
                </div>
                {triedSubmit && !sexo && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">
                    Campo obrigatório
                  </p>
                )}
                <span className="font-body-sm text-secondary">
                  Conforme visualização inicial ou ficha física.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Nome do animal
                </label>
                <span className="text-xs text-gray-500">(opcional)</span>
              </div>
              <input
                type="text"
                value={nomeAnimal}
                onChange={(e) => setNomeAnimal(e.target.value)}
                placeholder="Ex: Caramelo (ou deixe em branco se sem nome)"
                className={inputCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                Situação do animal <span className="font-bold text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SITUACOES.map((s) => (
                  <label
                    key={s.value}
                    className={`cursor-pointer flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-gray-200 h-full gap-1.5 transition-colors hover:bg-gray-50 ${
                      situacao === s.value
                        ? "border-[#DC2626] bg-[#fdecea] ring-1 ring-[#DC2626]"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="situacao"
                      value={s.value}
                      checked={situacao === s.value}
                      onChange={(e) => setSituacao(e.target.value)}
                      className="sr-only"
                    />
                    <i className={`bi ${s.icon} text-[26px]`}></i>
                    <span className="font-label-md text-[#1A1A1A]">
                      {s.label}
                    </span>
                  </label>
                ))}
              </div>
              {situacao === "outros" && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="font-label-sm text-[#1A1A1A]">
                    Descreva a situação do animal{" "}
                    <span className="font-bold text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    value={situacaoOutros}
                    onChange={(e) => setSituacaoOutros(e.target.value)}
                    placeholder="Descreva sucintamente a ocorrência relatada..."
                    className={inputCls}
                  />
                </div>
              )}
              {triedSubmit && !situacao && (
                <p className="mt-0.5 text-xs text-[#DC2626]">
                  Campo obrigatório
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1A1A1A]">
                    Local onde foi recolhido{" "}
                    <span className="font-bold text-[#DC2626]">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={localRecolhimento}
                  onChange={(e) => setLocalRecolhimento(e.target.value)}
                  placeholder="Ex: Av. Apolônio Sales, Centro - próximo à praça"
                  className={inputCls}
                />
                {triedSubmit && !localRecolhimento.trim() && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">
                    Campo obrigatório
                  </p>
                )}
                <span className="font-body-sm text-secondary">
                  Ponto de referência de Paulo Afonso informado na ficha.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1A1A1A]">
                    Nome da pessoa que fez o resgate
                  </label>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <input
                  type="text"
                  value={nomeResgatista}
                  onChange={(e) => setNomeResgatista(e.target.value)}
                  placeholder="Nome do cidadão ou voluntário que realizou o resgate"
                  className={inputCls}
                />
                <span className="font-body-sm text-secondary">
                  Preencher apenas se diferente do servidor SUPATAS.
                </span>
              </div>
            </div>
          </article>

          {/* Seção 3 – Declaração de Responsabilidade */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <span className="font-bold text-[#1A1A1A]">3</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Declaração de Responsabilidade
                  </h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Termo oficial de custódia e encaminhamento
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined">gavel</span>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f9ff] text-[#1A1A1A] flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center gap-2 text-[#6f5d00] font-label-md">
                <i className="bi bi-balance-scale text-[18px]"></i>
                <span>Termo Oficial de Custódia e Encaminhamento</span>
              </div>
              <p className="font-body-sm text-secondary leading-relaxed">
                Declaro, para os devidos fins, que este animal foi encaminhado
                pela SUPATAS à ONG ARDAP para atendimento veterinário. Estou
                ciente de que: A ONG ARDAP atua de forma voluntária e limitada
                às suas capacidades físicas, humanas e financeiras, inclusive
                sem insumos para consultas e cirurgias. Esse animal permanece
                sob responsabilidade da SUPATAS / Prefeitura, inclusive quanto
                ao destino após atendimento (adoção, devolução, eutanásia
                legalmente justificada, etc.). A não retirada do animal dentro
                do prazo informado poderá comprometer a capacidade de
                atendimento da ARDAP, sem que isso configure acúmulo, má
                gestão ou negligência da ONG. A presente ficha poderá ser
                utilizada para fins de prestação de contas, auditoria ou ações
                judiciais pertinentes.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                Relatório / Observações Clínicas Iniciais
              </label>
              <textarea
                rows={4}
                value={relatorio}
                onChange={(e) => setRelatorio(e.target.value)}
                placeholder="Descreva aqui o parecer inicial, condições visíveis do animal no ato da entrega e observações pertinentes..."
                className={inputCls}
              />
              <span className="font-body-sm text-secondary">
                Transcrever qualquer anotação manuscrita presente no verso da
                folha de encaminhamento.
              </span>
            </div>
          </article>

          {/* Seção 4 – Assinatura do Responsável (SUPATAS) */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <span className="font-bold text-[#1A1A1A]">4</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Assinatura do Responsável (SUPATAS)
                  </h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Órgão emissor
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                Órgão Emissor
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-w-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  CPF do responsável{" "}
                  <span className="font-bold text-[#DC2626]">*</span>
                </label>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={cpfResponsavel}
                  onChange={(e) =>
                    setCpfResponsavel(maskCPF(e.target.value))
                  }
                  maxLength={14}
                  placeholder="000.000.000-00"
                  className={inputCls}
                />
              </div>
              {triedSubmit && !cpfResponsavel.replace(/\D/g, "") && (
                <p className="mt-0.5 text-xs text-[#DC2626]">
                  Campo obrigatório
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                Assinatura do Servidor SUPATAS{" "}
                <span className="font-bold text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                value={assinaturaSupatas}
                onChange={(e) => setAssinaturaSupatas(e.target.value)}
                placeholder="Nome e assinatura do servidor SUPATAS"
                className={inputCls}
              />
            </div>
          </article>

          {/* Seção 5 – Assinatura de Recebimento (ARDAP) */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <span className="font-bold text-[#1A1A1A]">5</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Assinatura de Recebimento (ARDAP)
                  </h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Colaborador conectado
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2 py-0.5 text-xs font-medium text-[#1A1A1A]">
                Colaborador Conectado
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1A1A1A]">
                    Recebido por (ARDAP)
                  </label>
                  <span className="text-xs text-gray-500">
                    Usuário Ativo
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] text-[#1A1A1A] shadow-inner">
                  <i className="bi bi-badge text-[#FFD900] text-[20px]"></i>
                  <input
                    type="text"
                    value={recebidoPor}
                    readOnly
                    className="bg-transparent border-0 font-body-md text-[#1A1A1A] outline-none cursor-not-allowed truncate"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#1A1A1A]">
                    Data e Hora de Recebimento
                  </label>
                  <span className="text-xs text-gray-500">
                    Automático
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#f8f9ff] text-[#1A1A1A] shadow-inner">
                  <i className="bi bi-schedule text-[#FFD900] text-[20px]"></i>
                  <input
                    type="text"
                    value={dataRecebimento}
                    readOnly
                    className="bg-transparent border-0 font-body-md text-[#1A1A1A] outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                Assinatura do Recebedor ARDAP{" "}
                <span className="font-bold text-[#DC2626]">*</span>
              </label>
              <div className="relative w-full h-36 bg-[#f8f9ff] rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-200">
                <div className="absolute bottom-6 left-8 right-8 h-px bg-gray-300 opacity-25 pointer-events-none"></div>
                <div className="absolute bottom-2 text-center w-full pointer-events-none">
                  <span className="font-label-sm text-secondary opacity-60">
                    Assine na linha acima para validar o protocolo de
                    recebimento
                  </span>
                </div>
                <input
                  type="text"
                  value={assinaturaArdap}
                  onChange={(e) => setAssinaturaArdap(e.target.value)}
                  placeholder="Assinatura do recebedor ARDAP"
                  className="w-full bg-transparent border-0 outline-none text-center text-[#1A1A1A] font-medium"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-secondary hover:text-error hover:bg-red-50 text-label-md font-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">backspace</span>
                  Limpar Assinatura
                </button>
              </div>
            </div>
          </article>

          <div className="grid w-full grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2">
            <Link
              to="/home"
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-white px-6 py-3 text-center text-sm font-medium text-[#1A1A1A] transition-all hover:bg-gray-50 active:scale-95"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#1A1A1A] bg-[#FFD900] px-6 py-3 text-center text-sm font-bold text-[#1A1A1A] shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            >
              <span>{saving ? "Salvando..." : "Salvar Solicitação"}</span>
              {!saving && (
                <i className="bi bi-arrow-right text-[18px] text-[#1A1A1A]"></i>
              )}
            </button>
          </div>
        </form>
      </main>

      <footer className="mt-auto w-full border-t bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 md:flex-row md:px-8">
          <div className="flex flex-col items-center gap-1 text-center md:flex-row md:text-left">
            <span className="text-xs font-bold">
              ARDAP • Paulo Afonso/BA
            </span>
            <span className="text-xs text-gray-500">
              © 2026 Associação Recanto dos Animais em Perigo (ARDAP). Acesso
              restrito e monitorado a colaboradores autorizados.
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-gray-500">
            <span className="transition-colors hover:text-[#6f5d00]">
              Políticas de Segurança
            </span>
            <span className="text-gray-300">•</span>
            <span className="transition-colors hover:text-[#6f5d00]">
              Manual do Voluntário
            </span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
