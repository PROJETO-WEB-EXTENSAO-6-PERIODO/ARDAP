import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

interface AnimalRow {
  id: number;
  nome: string | null;
  especie: string;
  sexo: string;
  porte: string | null;
  castrado: boolean;
}

const ESPECIES = [
  { value: "", label: "Selecione a espécie..." },
  { value: "cao", label: "Cão" },
  { value: "gato", label: "Gato" },
  { value: "outro", label: "Outro" },
];

const PORTES = [
  { value: "", label: "Selecione..." },
  { value: "pequeno", label: "Pequeno" },
  { value: "medio", label: "Médio" },
  { value: "grande", label: "Grande" },
];

const TEMPERAMENTOS = [
  { value: "", label: "Selecione o temperamento..." },
  { value: "docil", label: "Dócil" },
  { value: "medroso", label: "Medroso" },
  { value: "arisco", label: "Arisco" },
  { value: "agressivo", label: "Agressivo" },
];

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900] transition-colors";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#f8f9ff]/50 p-3">
      <span className="text-sm font-medium text-[#1A1A1A]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
          checked ? "bg-[#1A1A1A]" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-all ${
            checked ? "translate-x-full border-white" : ""
          }`}
        />
      </button>
    </div>
  );
}

export function Animais() {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [sexo, setSexo] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [idade, setIdade] = useState("");
  const [porte, setPorte] = useState("");
  const [cor, setCor] = useState("");
  const [peso, setPeso] = useState("");
  const [castrado, setCastrado] = useState(false);
  const [vermifugado, setVermifugado] = useState(false);
  const [vacinado, setVacinado] = useState(false);
  const [medicacao, setMedicacao] = useState(false);
  const [medicacaoDesc, setMedicacaoDesc] = useState("");
  const [origem, setOrigem] = useState("");
  const [temperamento, setTemperamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const [rows, setRows] = useState<AnimalRow[]>([]);
  const [filtroEspecie, setFiltroEspecie] = useState("");
  const [busca, setBusca] = useState("");

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtroEspecie) params.especie = filtroEspecie;
    if (busca.trim()) params.search = busca.trim();
    const { data } = await api.get("/animais", { params });
    setRows(data);
  }, [filtroEspecie, busca]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  function resetForm() {
    setNome(""); setEspecie(""); setRaca(""); setSexo("");
    setNascimento(""); setIdade(""); setPorte(""); setCor("");
    setPeso(""); setCastrado(false); setVermifugado(false);
    setVacinado(false); setMedicacao(false); setMedicacaoDesc("");
    setOrigem(""); setTemperamento(""); setObservacoes("");
    setTriedSubmit(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess(false);
    setTriedSubmit(true);
    if (!especie || !sexo) {
      setFormError("Preencha os campos obrigatórios (Espécie e Sexo).");
      return;
    }
    setSaving(true);
    try {
      await api.post("/animais", {
        nome: nome.trim() || null,
        especie,
        raca: raca.trim() || null,
        sexo,
        data_nascimento_estimada: nascimento || null,
        idade_estimada: idade === "" ? null : Number(idade),
        porte: porte || null,
        cor_pelo: cor.trim() || null,
        peso: peso === "" ? null : Number(peso),
        castrado, vermifugado, vacinado,
        temperamento: temperamento || null,
        medicacao_necessaria: medicacao,
        medicacao_desc: medicacaoDesc.trim() || null,
        origem_resgate: origem.trim() || null,
        observacoes: observacoes.trim() || null,
      });
      setSuccess(true);
      resetForm();
      await load();
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
          <Link to="/animais" className="transition-colors hover:text-[#1A1A1A]">
            Animais
          </Link>
          <span className="font-normal text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Novo animal</span>
        </nav>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
            Cadastro de Animal
          </h1>
          <p className="text-sm text-gray-500 md:text-base">
            Preencha os dados do animal acolhido. Campos com * são
            obrigatórios.
          </p>
        </section>

        {success && (
          <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-100 p-4 text-green-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <i className="bi bi-check-circle text-[22px]"></i>
              <span className="text-sm font-medium">
                Animal cadastrado com sucesso! Os dados foram registrados no
                sistema.
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1A1A1A]">
                      1. Identificação
                    </h2>
                    <p className="text-xs text-gray-500 md:text-sm">
                      Dados cadastrais primários do animal acolhido
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                  Obrigatório
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="animal_name"
                  >
                    Nome do Animal
                  </label>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <input
                  id="animal_name"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Caramelo (ou deixe em branco se sem nome)"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="animal_species"
                  >
                    Espécie <span className="font-bold text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="animal_species"
                      required
                      value={especie}
                      onChange={(e) => setEspecie(e.target.value)}
                      className={`${inputCls} cursor-pointer appearance-none pr-9`}
                    >
                      {ESPECIES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-semibold text-[#1A1A1A]"
                      htmlFor="animal_breed"
                    >
                      Raça
                    </label>
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </div>
                  <input
                    id="animal_breed"
                    type="text"
                    value={raca}
                    onChange={(e) => setRaca(e.target.value)}
                    placeholder="Ex: SRD, Poodle..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  Sexo <span className="font-bold text-[#DC2626]">*</span>
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "macho", label: "Macho" },
                    { value: "femea", label: "Fêmea" },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 p-2.5 transition-colors hover:bg-gray-50 ${
                        sexo === o.value
                          ? "border-[#1A1A1A] bg-[#f8f9ff] ring-1 ring-[#1A1A1A]"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="animal_sex"
                        value={o.value}
                        checked={sexo === o.value}
                        onChange={(e) => setSexo(e.target.value)}
                        className="h-4 w-4 accent-[#1A1A1A]"
                      />
                      <span className="text-sm font-medium text-[#1A1A1A]">
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
              </div>
            </article>

            <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                    <i className="bi bi-activity"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1A1A1A]">
                      2. Características físicas
                    </h2>
                    <p className="text-xs text-gray-500 md:text-sm">
                      Porte, estimativa etária e peso corporal
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                  Opcional
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-semibold text-[#1A1A1A]"
                      htmlFor="birth_date"
                    >
                      Data de nascimento estimada
                    </label>
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </div>
                  <input
                    id="birth_date"
                    type="date"
                    value={nascimento}
                    onChange={(e) => setNascimento(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-semibold text-[#1A1A1A]"
                      htmlFor="age_years"
                    >
                      Idade estimada
                    </label>
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </div>
                  <div className="relative">
                    <input
                      id="age_years"
                      type="number"
                      min={0}
                      max={40}
                      value={idade}
                      onChange={(e) => setIdade(e.target.value)}
                      placeholder="Ex: 2"
                      className={`${inputCls} pr-14`}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-2.5 text-xs font-medium text-gray-500">
                      anos
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="size"
                  >
                    Porte
                  </label>
                  <div className="relative">
                    <select
                      id="size"
                      value={porte}
                      onChange={(e) => setPorte(e.target.value)}
                      className={`${inputCls} cursor-pointer appearance-none pr-8`}
                    >
                      {PORTES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <i className="bi bi-chevron-down pointer-events-none absolute right-2.5 top-2.5 text-[20px] text-gray-400"></i>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="coat_color"
                  >
                    Cor do pelo
                  </label>
                  <input
                    id="coat_color"
                    type="text"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder="Ex: Caramelo"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="weight"
                  >
                    Peso
                  </label>
                  <div className="relative">
                    <input
                      id="weight"
                      type="number"
                      step="0.1"
                      min={0}
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="Ex: 12.5"
                      className={`${inputCls} pr-10`}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-2.5 text-xs font-semibold text-gray-500">
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                    <i className="bi bi-heart-pulse"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1A1A1A]">3. Saúde</h2>
                    <p className="text-xs text-gray-500 md:text-sm">
                      Triagem veterinária e tratamentos em curso
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                  Saúde
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Toggle
                  label="Castrado"
                  checked={castrado}
                  onChange={setCastrado}
                />
                <Toggle
                  label="Vermifugado"
                  checked={vermifugado}
                  onChange={setVermifugado}
                />
                <Toggle
                  label="Vacinado"
                  checked={vacinado}
                  onChange={setVacinado}
                />
                <Toggle
                  label="Necessita de medicação"
                  checked={medicacao}
                  onChange={setMedicacao}
                />
              </div>

              {medicacao && (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="medication_details"
                  >
                    Descrição da medicação
                  </label>
                  <textarea
                    id="medication_details"
                    rows={3}
                    value={medicacaoDesc}
                    onChange={(e) => setMedicacaoDesc(e.target.value)}
                    placeholder="Informe a posologia, nome dos medicamentos e recomendações de cuidados diários..."
                    className={inputCls}
                  />
                </div>
              )}
            </article>

            <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1A1A1A]">
                      4. Origem e observações
                    </h2>
                    <p className="text-xs text-gray-500 md:text-sm">
                      Local do resgate, temperamento e histórico
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                  Histórico
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="rescue_origin"
                  >
                    Origem do resgate
                  </label>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <input
                  id="rescue_origin"
                  type="text"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  placeholder="Ex: Av. Apolônio Sales, próximo ao mercado"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="temperament"
                  >
                    Temperamento
                  </label>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <div className="relative">
                  <select
                    id="temperament"
                    value={temperamento}
                    onChange={(e) => setTemperamento(e.target.value)}
                    className={`${inputCls} cursor-pointer appearance-none pr-8`}
                  >
                    {TEMPERAMENTOS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-2.5 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold text-[#1A1A1A]"
                    htmlFor="observations"
                  >
                    Observações
                  </label>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <textarea
                  id="observations"
                  rows={4}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva detalhes adicionais, comportamento, convivência e histórico do animal..."
                  className={inputCls}
                />
              </div>
            </article>
          </div>

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
              <span>{saving ? "Salvando..." : "Cadastrar Animal"}</span>
              {!saving && (
                <i className="bi bi-arrow-right text-[18px] text-[#1A1A1A]"></i>
              )}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">
                Animais cadastrados
              </h2>
              <p className="text-sm text-gray-500">
                {rows.length === 0
                  ? "Nenhum registro ainda."
                  : `${rows.length} registro(s).`}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={filtroEspecie}
                onChange={(e) => setFiltroEspecie(e.target.value)}
                className={`${inputCls} cursor-pointer sm:w-44`}
                aria-label="Filtrar por espécie"
              >
                <option value="">Todas as espécies</option>
                <option value="cao">Cão</option>
                <option value="gato">Gato</option>
                <option value="outro">Outro</option>
              </select>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                className={`${inputCls} sm:w-56`}
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-4 font-semibold">Nome</th>
                  <th className="py-2 pr-4 font-semibold">Espécie</th>
                  <th className="py-2 pr-4 font-semibold">Sexo</th>
                  <th className="py-2 pr-4 font-semibold">Porte</th>
                  <th className="py-2 font-semibold">Castrado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      {r.nome || "—"}
                    </td>
                    <td className="py-2 pr-4 capitalize">{r.especie}</td>
                    <td className="py-2 pr-4 capitalize">{r.sexo}</td>
                    <td className="py-2 pr-4 capitalize">{r.porte || "—"}</td>
                    <td className="py-2">{r.castrado ? "Sim" : "Não"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      Nada por aqui ainda — cadastre o primeiro animal acima.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="mt-auto w-full border-t bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 md:flex-row md:px-8">
          <div className="flex flex-col items-center gap-1 text-center md:flex-row md:text-left">
            <span className="text-xs font-bold">ARDAP • Paulo Afonso/BA</span>
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
