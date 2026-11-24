import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function maskCPF(v: string) {
  let n = v.replace(/\D/g, "");
  if (n.length > 11) n = n.slice(0, 11);
  n = n.replace(/(\d{3})(\d)/, "$1.$2");
  n = n.replace(/(\d{3})(\d)/, "$1.$2");
  n = n.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return n;
}

function onlyDigits(v: string, max: number) {
  let n = v.replace(/\D/g, "");
  if (n.length > max) n = n.slice(0, max);
  return n;
}

function onlyLetters(v: string) {
  return v.replace(/[0-9]/g, "");
}

function maskTelefone(v: string) {
  let n = v.replace(/\D/g, "");
  if (n.length > 11) n = n.slice(0, 11);
  if (n.length > 6) {
    n = "(" + n.slice(0, 2) + ") " + n.slice(2, 7) + "-" + n.slice(7);
  } else if (n.length > 2) {
    n = "(" + n.slice(0, 2) + ") " + n.slice(2);
  } else if (n.length > 0) {
    n = "(" + n;
  }
  return n;
}

export function Castracao() {
  const [proprietario, setProprietario] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [telefones, setTelefones] = useState("");
  const [email, setEmail] = useState("");

  const [nomeAnimal, setNomeAnimal] = useState("");
  const [idadeReal, setIdadeReal] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [pelagem, setPelagem] = useState("");
  const [sexo, setSexo] = useState("");

  const [procedimento, setProcedimento] = useState("");

  const [aceite, setAceite] = useState(false);
  const [assinatura, setAssinatura] = useState("");
  const [localAssinatura, setLocalAssinatura] = useState("");
  const [dataAssinatura, setDataAssinatura] = useState("");

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  useEffect(() => {
    setDataAssinatura(todayISO());
    setLocalAssinatura("Paulo Afonso");
  }, []);

  function resetForm() {
    setProprietario("");
    setCpfCnpj("");
    setEndereco("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setTelefones("");
    setEmail("");
    setNomeAnimal("");
    setIdadeReal("");
    setEspecie("");
    setRaca("");
    setPelagem("");
    setSexo("");
    setProcedimento("");
    setAceite(false);
    setAssinatura("");
    setDataAssinatura(todayISO());
    setTriedSubmit(false);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess(false);
    setTriedSubmit(true);

    if (!proprietario.trim()) {
      setFormError("Informe o nome do proprietário/responsável.");
      return;
    }
    if (!aceite) {
      setFormError("É necessário aceitar o termo de consentimento.");
      return;
    }
    if (!assinatura.trim()) {
      setFormError("Informe a assinatura do responsável.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/castracoes", {
        proprietario_responsavel: proprietario.trim(),
        cpf_cnpj: cpfCnpj.replace(/\D/g, "") || null,
        endereco: endereco.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        ba_telefones: telefones.trim() || null,
        email: email.trim() || null,
        nome_animal: nomeAnimal.trim() || null,
        idade_real: idadeReal.trim() || null,
        especie: especie.trim() || null,
        raca: raca.trim() || null,
        pelagem: pelagem.trim() || null,
        sexo: sexo || null,
        procedimento: procedimento.trim() || null,
        assinatura_responsavel: assinatura.trim() || null,
        local_assinatura: localAssinatura.trim() || null,
        data_assinatura: dataAssinatura || null,
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
        <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/home" className="flex items-center gap-1 font-medium transition-colors hover:text-[#1A1A1A]">
            <i className="bi bi-house text-[16px]"></i>
            <span>Início</span>
          </Link>
          <span className="font-normal text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Termo de Castração</span>
        </nav>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
              Termo de Consentimento e Autorização
            </h1>
            <p className="mt-1 text-sm text-[#6f5d00] font-semibold">
              ARDAP – Associação Recanto dos Animais em Perigo
            </p>
          </div>
        </section>

        {success && (
          <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-100 p-4 text-green-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <i className="bi bi-check-circle text-[22px]"></i>
              <span className="text-sm font-medium">
                Termo de castração registrado com sucesso! Os dados foram salvos no sistema.
              </span>
            </div>
            <button type="button" onClick={() => setSuccess(false)} className="p-1 hover:text-green-900" aria-label="Fechar aviso">
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
          {/* Seção 1 – Dados do Proprietário/Responsável */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-person"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Dados do Proprietário/Responsável</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Identificação e endereço</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                Campos Obrigatórios *
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Nome do proprietário/responsável{" "}
                  <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={proprietario}
                  onChange={(e) => setProprietario(e.target.value)}
                  placeholder="Nome completo"
                  className={inputCls}
                />
                {triedSubmit && !proprietario.trim() && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">CPF/CNPJ</label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Telefones</label>
                <input
                  type="text"
                  value={telefones}
                  onChange={(e) => setTelefones(maskTelefone(e.target.value))}
                  placeholder="(75) 99999-9999"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">Endereço</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Número</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Complemento</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Bairro</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </article>

          {/* Seção 2 – Dados do Animal */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-heart"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Dados do Animal</h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Identificação e características
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Dados do Animal
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Nome do animal</label>
                <input
                  type="text"
                  value={nomeAnimal}
                  onChange={(e) => setNomeAnimal(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Idade (real ou aproximada)</label>
                <input
                  type="text"
                  value={idadeReal}
                  onChange={(e) => setIdadeReal(onlyDigits(e.target.value, 3))}
                  placeholder="Ex: 2"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Espécie</label>
                <input
                  type="text"
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  placeholder="Ex: Cão, Gato"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Raça</label>
                <input
                  type="text"
                  value={raca}
                  onChange={(e) => setRaca(onlyLetters(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Pelagem</label>
                <input
                  type="text"
                  value={pelagem}
                  onChange={(e) => setPelagem(onlyLetters(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Sexo</label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  <option value="macho">Macho</option>
                  <option value="femea">Fêmea</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Procedimento cirúrgico{" "}
                  <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  placeholder="Ex: Castração, Ovariohisterectomia..."
                  className={inputCls}
                />
                {triedSubmit && !procedimento.trim() && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>
                )}
              </div>
            </div>
          </article>

          {/* Seção 3 – Autorização */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">
                    Autorização para Procedimento Cirúrgico
                  </h2>
                  <p className="text-xs text-gray-500 md:text-sm">
                    Termo de consentimento
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                <i className="bi bi-file-earmark-text"></i>
                Termo Oficial
              </span>
            </div>

            <div className="rounded-xl bg-[#f8f9ff] p-4 text-[#1A1A1A] flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center gap-2 text-[#6f5d00] font-semibold text-sm">
                <i className="bi bi-balance-scale text-[18px]"></i>
                <span>Termo de Consentimento e Autorização</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Declaro estar ciente dos motivos que levam à necessidade de realização do procedimento cirúrgico,
                reconheço que esta é a opção escolhida por mim para o animal acima identificado e autorizo a sua
                realização pelo(a) Médico(a) Veterinário(a). Confirmo que o animal foi trazido e está sob minha
                responsabilidade, não está no cio e está em jejum alimentar de 12 horas e hídrico de 8 horas, pois,
                caso contrário, poderá gerar intercorrências levando o animal ao óbito. Autorizo a aplicação de
                sedativos e/ou anestésicos necessários para o procedimento, declarando que fui informado/a de que
                estes podem apresentar complicações, mesmo quando aplicados com perícia e prudência. Após a saída do
                animal da ARDAP, na qualidade de responsável, tomarei todos os cuidados para evitar complicações ou
                acidentes. Confirmo que li, compreendi e concordo com este Termo de Consentimento. Declaro que me
                foram claramente explicados os possíveis riscos inerentes do procedimento, durante ou após a
                operação, estando o médico veterinário isento de quaisquer responsabilidades decorrentes.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Toggle checked={aceite} onChange={setAceite} label="Aceito o termo de consentimento" />
              {triedSubmit && !aceite && (
                <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>
              )}
            </div>

            <div className="rounded-xl bg-[#f8f9ff] p-4 text-[#1A1A1A] flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center gap-2 text-[#6f5d00] font-semibold text-sm">
                <i className="bi bi-info-circle text-[18px]"></i>
                <span>Cuidados Pós-cirúrgicos</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                1) Manter o animal com colar elisabetano ou roupa cirúrgica (podem ser comprados em agropecuárias
                e pet shops). 2) Utilizar limpeza com antisséptico clorexidine, 2 vezes ao dia. 3) Observar a ferida
                cirúrgica (abertura de pontos, muito vermelho, inchado). 4) Os pontos podem ser retirados após 10
                dias ou quando a ferida cirúrgica estiver completamente seca, pelo Médico Veterinário.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Assinatura do responsável{" "}
                  <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                  className={inputCls}
                />
                {triedSubmit && !assinatura.trim() && (
                  <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Local</label>
                <input
                  type="text"
                  value={localAssinatura}
                  onChange={(e) => setLocalAssinatura(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Data</label>
                <input
                  type="date"
                  value={dataAssinatura}
                  onChange={(e) => setDataAssinatura(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </article>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1A1A1A] transition-all duration-150 hover:bg-gray-50 active:scale-95"
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Limpar</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1A1A1A] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-60"
            >
              <i className="bi bi-check-lg"></i>
              <span>{saving ? "Salvando..." : "Salvar termo"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
