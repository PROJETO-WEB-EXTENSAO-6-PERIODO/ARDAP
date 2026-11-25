import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

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

const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"];
const FOTO_MAX_BYTES = 5 * 1024 * 1024;

function lerBase64(arquivo: File) {
  return new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    // Remove o prefixo "data:image/...;base64,"
    leitor.onload = () => resolve(String(leitor.result).split(",")[1]);
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

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
  const navigate = useNavigate();
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

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoErro, setFotoErro] = useState("");
  const fotoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!foto) return;
    const url = URL.createObjectURL(foto);
    setFotoPreview(url);
    return () => {
      setFotoPreview(null);
      URL.revokeObjectURL(url);
    };
  }, [foto]);

  function removerFoto() {
    setFoto(null);
    setFotoErro("");
    if (fotoInput.current) fotoInput.current.value = "";
  }

  function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    removerFoto();
    if (!FOTO_TIPOS.includes(arquivo.type)) {
      setFotoErro("Escolha uma imagem JPG, PNG ou WebP.");
    } else if (arquivo.size > FOTO_MAX_BYTES) {
      setFotoErro("A foto deve ter no máximo 5 MB.");
    } else {
      setFoto(arquivo);
    }
  }

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setTriedSubmit(true);
    if (!especie || !sexo) {
      setFormError("Preencha os campos obrigatórios (Espécie e Sexo).");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post<{ id: number }>("/animais", {
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
        foto: foto ? await lerBase64(foto) : null,
      });
      // replace: o botão voltar não reabre o formulário já enviado
      navigate(`/animais/${data.id}`, {
        replace: true,
        state: { cadastrado: true },
      });
    } catch (e) {
      const detalhe = isAxiosError(e) ? e.response?.data?.detail : null;
      setFormError(
        typeof detalhe === "string"
          ? detalhe
          : "Não foi possível salvar. Confira os dados e tente de novo.",
      );
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
                    htmlFor="animal_photo"
                  >
                    Foto do animal
                  </label>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-gray-300 p-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-3xl text-gray-400">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Prévia da foto do animal"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <i aria-hidden="true" className="bi bi-camera"></i>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    <input
                      ref={fotoInput}
                      id="animal_photo"
                      type="file"
                      accept={FOTO_TIPOS.join(",")}
                      onChange={(e) => escolherFoto(e.target.files?.[0])}
                      aria-describedby="animal_photo_help"
                      className="w-full cursor-pointer text-sm text-gray-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#1A1A1A] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                    <p id="animal_photo_help" className="text-xs text-gray-500">
                      JPG, PNG ou WebP, até 5 MB.
                    </p>
                    {fotoErro && (
                      <p role="alert" className="text-xs font-medium text-[#DC2626]">
                        {fotoErro}
                      </p>
                    )}
                    {foto && (
                      <button
                        type="button"
                        onClick={removerFoto}
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#DC2626] hover:underline"
                      >
                        <i aria-hidden="true" className="bi bi-trash"></i>
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>
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
