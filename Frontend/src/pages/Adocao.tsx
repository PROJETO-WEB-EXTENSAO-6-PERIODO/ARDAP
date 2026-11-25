import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { SeletorAnimal, type AnimalVinculado } from "../components/SeletorAnimal";
import { api } from "../services/api";

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900] transition-colors";

function fieldCls(hasError: boolean) {
  return hasError
    ? "w-full rounded-lg border border-red-400 bg-red-50 px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
    : inputCls;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#f8f9ff]/50 p-2">
      <span className="text-xs font-medium text-[#1A1A1A]">{label}</span>
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

export function Adocao() {
  // Seção 1 - Dados do adotante
  const [nomeAdotante, setNomeAdotante] = useState("");
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [enderecoResidencial, setEnderecoResidencial] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [especieAdocao, setEspecieAdocao] = useState("");

  // Seção 2 - Dados do animal
  const [animal, setAnimal] = useState<AnimalVinculado | null>(null);
  const [nomeAnimal, setNomeAnimal] = useState("");
  const [especie, setEspecie] = useState("");
  const [sexo, setSexo] = useState("");
  const [idade, setIdade] = useState("");
  const [raca, setRaca] = useState("");
  const [srd, setSrd] = useState(false);
  const [ondeResgatou, setOndeResgatou] = useState("");
  const [corPelo, setCorPelo] = useState("");
  const [porte, setPorte] = useState("");
  const [peso, setPeso] = useState("");
  const [castrado, setCastrado] = useState<boolean | null>(null);
  const [vermifugado, setVermifugado] = useState("");
  const [medicamentoDiario, setMedicamentoDiario] = useState(false);
  const [maisAnimaisCasa, setMaisAnimaisCasa] = useState(false);
  const [quantosMaisAnimais, setQuantosMaisAnimais] = useState("");

  // Seção 3 - Questionário
  const [outrosAnimais, setOutrosAnimais] = useState(false);
  const [quantosAnimais, setQuantosAnimais] = useState("");
  const [espacoCasa, setEspacoCasa] = useState(false);
  const [casaMurada, setCasaMurada] = useState(false);
  const [espacoCoberto, setEspacoCoberto] = useState(false);
  const [moraAluguel, setMoraAluguel] = useState(false);
  const [proprietarioPermite, setProprietarioPermite] = useState<boolean | null>(null);
  const [viajarQuem, setViajarQuem] = useState("");
  const [familiaSabe, setFamiliaSabe] = useState(false);
  const [alguemAlergia, setAlguemAlergia] = useState(false);
  const [alimentacao, setAlimentacao] = useState("");
  const [acessoRua, setAcessoRua] = useState(false);
  const [cienciaVacinacao, setCienciaVacinacao] = useState(false);

  // Seção 4 - Endereço onde ficará
  const [enderecoFicara, setEnderecoFicara] = useState("mesmo");
  const [enderecoFicaraOutro, setEnderecoFicaraOutro] = useState("");
  const [localNaCasa, setLocalNaCasa] = useState("");

  // Seção 5 - Declarações e assinatura
  const [aceiteDeclaracao, setAceiteDeclaracao] = useState(false);
  const [aceiteTermo, setAceiteTermo] = useState(false);
  const [assinaturaAdotante, setAssinaturaAdotante] = useState("");
  const [assinaturaArdap, setAssinaturaArdap] = useState("");
  const [localAssinatura, setLocalAssinatura] = useState("");
  const [dataAssinatura, setDataAssinatura] = useState("");

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const missingRequired: string[] = [];
  if (triedSubmit) {
    if (!nomeAdotante.trim()) missingRequired.push("Nome do adotante");
    if (!enderecoResidencial.trim()) missingRequired.push("Endereço residencial");
    if (!assinaturaAdotante.trim()) missingRequired.push("Assinatura do adotante");
    if (!aceiteDeclaracao) missingRequired.push("Aceite da declaração");
    if (!aceiteTermo) missingRequired.push("Aceite do termo de adoção");
  }

  useEffect(() => {
    const hoje = todayISO();
    setDataAssinatura(hoje);
    setLocalAssinatura("Paulo Afonso");
  }, []);

  // Vincula o animal e preenche os campos; ao desvincular, limpa-os.
  function vincularAnimal(a: AnimalVinculado | null) {
    setAnimal(a);
    setNomeAnimal(a?.nome ?? "");
    setEspecie(a && (a.especie === "cao" || a.especie === "gato") ? a.especie : "");
    setSexo(a?.sexo ?? "");
    setIdade(a?.idade_estimada?.toString() ?? "");
    setRaca(a?.raca ?? "");
    setSrd(a?.raca?.trim().toLowerCase() === "srd");
    setOndeResgatou(a?.origem_resgate ?? "");
    setCorPelo(a?.cor_pelo ?? "");
    setPorte(a?.porte ?? "");
    setPeso(a?.peso == null ? "" : String(a.peso));
    setCastrado(a ? a.castrado : null);
  }

  function resetForm() {
    setAnimal(null);
    setNomeAdotante("");
    setRg("");
    setCpf("");
    setEnderecoResidencial("");
    setBairro("");
    setCidade("");
    setCep("");
    setTelefone("");
    setInstagram("");
    setEspecieAdocao("");
    setNomeAnimal("");
    setEspecie("");
    setSexo("");
    setIdade("");
    setRaca("");
    setSrd(false);
    setOndeResgatou("");
    setCorPelo("");
    setPorte("");
    setPeso("");
    setCastrado(null);
    setVermifugado("");
    setMedicamentoDiario(false);
    setMaisAnimaisCasa(false);
    setQuantosMaisAnimais("");
    setOutrosAnimais(false);
    setQuantosAnimais("");
    setEspacoCasa(false);
    setCasaMurada(false);
    setEspacoCoberto(false);
    setMoraAluguel(false);
    setProprietarioPermite(null);
    setViajarQuem("");
    setFamiliaSabe(false);
    setAlguemAlergia(false);
    setAlimentacao("");
    setAcessoRua(false);
    setCienciaVacinacao(false);
    setEnderecoFicara("mesmo");
    setEnderecoFicaraOutro("");
    setLocalNaCasa("");
    setAceiteDeclaracao(false);
    setAceiteTermo(false);
    setAssinaturaAdotante("");
    setAssinaturaArdap("");
    setDataAssinatura(todayISO());
    setTriedSubmit(false);
    setFormError("");
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

  function maskCEP(v: string) {
    let n = v.replace(/\D/g, "");
    if (n.length > 8) n = n.slice(0, 8);
    if (n.length > 5) n = n.slice(0, 5) + "-" + n.slice(5);
    return n;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess(false);
    setTriedSubmit(true);

    if (!nomeAdotante.trim()) {
      setFormError("Informe o nome do adotante.");
      return;
    }
    if (!enderecoResidencial.trim()) {
      setFormError("Informe o endereço residencial do adotante.");
      return;
    }
    if (!aceiteDeclaracao) {
      setFormError("É necessário aceitar a declaração de responsabilidade.");
      return;
    }
    if (!aceiteTermo) {
      setFormError("É necessário aceitar o termo de adoção.");
      return;
    }
    if (!assinaturaAdotante.trim()) {
      setFormError("Informe a assinatura do adotante.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/adocoes", {
        animal_id: animal?.id ?? null,
        especie_adocao: especieAdocao || null,
        nome_adotante: nomeAdotante.trim(),
        rg: rg.trim() || null,
        cpf: cpf.replace(/\D/g, "") || null,
        endereco_residencial: enderecoResidencial.trim(),
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        cep: cep.replace(/\D/g, "") || null,
        telefone: telefone.trim() || null,
        instagram: instagram.trim() || null,
        nome_animal: nomeAnimal.trim() || null,
        especie: especie || null,
        sexo: sexo || null,
        idade: idade.trim() || null,
        raca: raca.trim() || null,
        srd,
        onde_resgatou_tutor: ondeResgatou.trim() || null,
        cor_pelo: corPelo.trim() || null,
        porte: porte || null,
        peso: peso ? Number(peso) : null,
        castrado,
        vermifugado_3meses: vermifugado || null,
        medicamento_diario: medicamentoDiario,
        mais_animais_em_casa: maisAnimaisCasa,
        quantos_mais_animais: quantosMaisAnimais ? Number(quantosMaisAnimais) : null,
        endereco_ficara_animal: enderecoFicara,
        endereco_ficara_animal_outro: enderecoFicara === "outro" ? enderecoFicaraOutro.trim() || null : null,
        local_na_casa: localNaCasa.trim() || null,
        outros_animais: maisAnimaisCasa,
        quantos_animais: quantosMaisAnimais ? Number(quantosMaisAnimais) : null,
        espaco_casa: espacoCasa,
        casa_murada: casaMurada,
        espaco_coberto_quintal: espacoCoberto,
        mora_aluguel: moraAluguel,
        proprietario_permite_animais: moraAluguel ? proprietarioPermite : null,
        viajar_quem_cuidara: viajarQuem.trim() || null,
        familia_sabe_adocao: familiaSabe,
        alguem_alergia: alguemAlergia,
        alimentacao: alimentacao.trim() || null,
        acesso_rua: acessoRua,
        ciencia_vacinacao: cienciaVacinacao,
        aceite_declaracao: aceiteDeclaracao,
        aceite_termo: aceiteTermo,
        assinatura_adotante: assinaturaAdotante.trim() || null,
        assinatura_ardap: assinaturaArdap.trim() || null,
        local_assinatura: localAssinatura.trim() || null,
        data_assinatura: dataAssinatura || null,
      });
      setSuccess(true);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setFormError(
        detail
          ? `Não foi possível salvar: ${detail}`
          : "Não foi possível salvar. Confira os dados destacados e tente de novo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#EDF2FB]">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
        <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/home" className="flex items-center gap-1 font-medium transition-colors hover:text-[#1A1A1A]">
            <i className="bi bi-house text-[16px]"></i>
            <span>Início</span>
          </Link>
          <span className="font-normal text-gray-400">&gt;</span>
          <span className="font-medium text-[#1A1A1A]">Termo de Adoção</span>
        </nav>

        {/* Cabeçalho do formulário */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
              Termo de Adoção Responsável
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
                Termo de adoção registrado com sucesso! Os dados foram salvos no sistema.
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
            {missingRequired.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs font-normal">
                {missingRequired.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Seção 1 - Dados do Adotante */}
          <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-person"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Dados do Adotante</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Identificação e endereço</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                Campos Obrigatórios *
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Nome do adotante <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <i className="bi bi-person pointer-events-none absolute left-3 top-2.5 text-[18px] text-gray-400"></i>
                  <input type="text" value={nomeAdotante} onChange={(e) => setNomeAdotante(e.target.value)} placeholder="Nome completo" className={`${fieldCls(triedSubmit && !nomeAdotante.trim())} pl-10`} />
                </div>
                {triedSubmit && !nomeAdotante.trim() && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">RG</label>
                <input type="text" value={rg} onChange={(e) => setRg(onlyDigits(e.target.value, 9))} placeholder="Identidade" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">CPF</label>
                <input type="text" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Endereço residencial <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <input type="text" value={enderecoResidencial} onChange={(e) => setEnderecoResidencial(e.target.value)} placeholder="Rua, número" className={fieldCls(triedSubmit && !enderecoResidencial.trim())} />
                {triedSubmit && !enderecoResidencial.trim() && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
                {triedSubmit && !enderecoResidencial.trim() && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Bairro</label>
                <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Cidade</label>
                <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">CEP</label>
                <input type="text" value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} placeholder="00000-000" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Telefone</label>
                <input type="text" value={telefone} onChange={(e) => setTelefone(maskTelefone(e.target.value))} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Instagram</label>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@usuario" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Tipo do formulário</label>
                <div className="relative">
                  <select value={especieAdocao} onChange={(e) => setEspecieAdocao(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="">Selecione...</option>
                    <option value="canino">Canino</option>
                    <option value="felino">Felino</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>
            </div>
          </article>

          <SeletorAnimal animal={animal} onChange={vincularAnimal} />

          {/* Seção 2 - Dados do Animal */}
          <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-heart"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Dados do Animal</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Identificação e condições</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Dados do Animal
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Nome do animal</label>
                <input type="text" value={nomeAnimal} onChange={(e) => setNomeAnimal(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Espécie</label>
                <div className="relative">
                  <select value={especie} onChange={(e) => setEspecie(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="">Selecione...</option>
                    <option value="cao">Cão</option>
                    <option value="gato">Gato</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Sexo</label>
                <div className="relative">
                  <select value={sexo} onChange={(e) => setSexo(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="">Selecione...</option>
                    <option value="macho">Macho</option>
                    <option value="femea">Fêmea</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Idade</label>
                <input type="text" value={idade} onChange={(e) => setIdade(onlyDigits(e.target.value, 3))} placeholder="Ex: 2" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Raça</label>
                <input type="text" value={raca} onChange={(e) => setRaca(onlyLetters(e.target.value))} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">SRD</label>
                <select value={srd ? "sim" : "nao"} onChange={(e) => setSrd(e.target.value === "sim")} className={inputCls}>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-semibold text-[#1A1A1A]">Onde foi resgatado / tutor</label>
                <input type="text" value={ondeResgatou} onChange={(e) => setOndeResgatou(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Cor do pelo</label>
                <input type="text" value={corPelo} onChange={(e) => setCorPelo(onlyLetters(e.target.value))} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Porte</label>
                <div className="relative">
                  <select value={porte} onChange={(e) => setPorte(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="">Selecione...</option>
                    <option value="pequeno">Pequeno</option>
                    <option value="medio">Médio</option>
                    <option value="grande">Grande</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Peso (kg)</label>
                <input type="text" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))} placeholder="Ex: 12.5" className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Castrado</label>
                <div className="relative">
                  <select value={castrado === null ? "" : castrado ? "sim" : "nao"} onChange={(e) => setCastrado(e.target.value === "" ? null : e.target.value === "sim")} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="">Selecione...</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Vermifugado (últ. 3 meses)</label>
                <div className="relative">
                  <select value={vermifugado} onChange={(e) => setVermifugado(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="">Selecione...</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                    <option value="sem_informacao">Sem informação</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Toggle checked={medicamentoDiario} onChange={setMedicamentoDiario} label="Necessita de medicamento diariamente" />
              </div>
            </div>
          </article>

          {/* Seção 3 - Questionário */}
          <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-clipboard-check"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Questionário de Adoção</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Condições do adotante e do lar</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                Questionário
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <Toggle checked={espacoCasa} onChange={setEspacoCasa} label="Tem espaço para o animal em sua casa?" />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={casaMurada} onChange={setCasaMurada} label="Sua casa é murada?" />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={espacoCoberto} onChange={setEspacoCoberto} label="Tem espaço coberto no quintal para abrigo?" />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={moraAluguel} onChange={setMoraAluguel} label="Mora de aluguel?" />
              </div>
              {moraAluguel && (
                <div className="sm:col-span-2">
                  <Toggle checked={proprietarioPermite === true} onChange={(v) => setProprietarioPermite(v)} label="O proprietário permite animais na casa?" />
                </div>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">No caso de precisar viajar, com quem esse animal ficará?</label>
                <input type="text" value={viajarQuem} onChange={(e) => setViajarQuem(e.target.value)} className={inputCls} />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={familiaSabe} onChange={setFamiliaSabe} label="Sua família sabe da adoção?" />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={alguemAlergia} onChange={setAlguemAlergia} label="Alguém da casa tem ou poderia ter alergia?" />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">Qual alimentação você irá oferecer ao animal?</label>
                <input type="text" value={alimentacao} onChange={(e) => setAlimentacao(e.target.value)} className={inputCls} />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={acessoRua} onChange={setAcessoRua} label="O animal terá acesso à rua?" />
              </div>

              <div className="sm:col-span-1">
                <Toggle checked={cienciaVacinacao} onChange={setCienciaVacinacao} label="Tem consciência de que o animal precisa ser vacinado periodicamente?" />
              </div>
            </div>
          </article>

          {/* Seção 4 - Endereço onde ficará */}
          <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Endereço onde ficará o animal</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Local de guarda</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                Local de Guarda
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Toggle checked={maisAnimaisCasa} onChange={setMaisAnimaisCasa} label="Tem mais animais em casa?" />
              </div>
              {maisAnimaisCasa && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">Quantos?</label>
                  <input type="number" value={quantosMaisAnimais} onChange={(e) => setQuantosMaisAnimais(e.target.value)} className={inputCls} />
                </div>
              )}

              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <label className="text-sm font-semibold text-[#1A1A1A]">Endereço onde ficará o animal</label>
                <div className="relative">
                  <select value={enderecoFicara} onChange={(e) => setEnderecoFicara(e.target.value)} className={`${inputCls} cursor-pointer appearance-none pr-9`}>
                    <option value="mesmo">Mesmo do adotante</option>
                    <option value="outro">Outro</option>
                  </select>
                  <i className="bi bi-chevron-down pointer-events-none absolute right-3 top-2.5 text-[20px] text-gray-400"></i>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-1">
                <label className="text-sm font-semibold text-[#1A1A1A]">Local na casa (onde o animal ficará)</label>
                <input type="text" value={localNaCasa} onChange={(e) => setLocalNaCasa(e.target.value)} className={inputCls} />
              </div>

              {enderecoFicara === "outro" && (
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-semibold text-[#1A1A1A]">Qual endereço?</label>
                  <input type="text" value={enderecoFicaraOutro} onChange={(e) => setEnderecoFicaraOutro(e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
          </article>

          {/* Seção 5 - Declarações e assinatura */}
          <article className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Declarações e Assinatura</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Termo oficial</p>
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
                <span>Termo Oficial de Adoção Responsável</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Ao adotar o animal acima descrito, confirmo cuidar do animal no local indicado e declaro-me apto a
                assumir a guarda e a responsabilidade sobre este animal, eximindo o doador de toda e qualquer
                responsabilidade por quaisquer atos praticados pelo animal a partir desta data. Declaro ainda que
                todos da minha casa estão cientes da adoção e concordam com a sua guarda e manutenção durante toda
                a vida do animal, além de garantir ser informado de que o animal emite sons, gera sujeira, pode
                danificar algo em casa brincando ou quando estiver assustado. Confirmo ter conhecimento de que o
                animal vive em média dezoito anos e garanto estar apto a guardá-lo e vigiá-lo, comprometendo-me a
                proporcionar boas condições de alojamento, higiene, lazer e alimentação apropriada, vacinas,
                vermífugo a cada seis meses e espaço físico que possibilite o animal se exercitar. Responsabilizo-me
                por preservar a saúde e integridade do animal e a submetê-lo aos cuidados médico veterinários sempre
                que necessário. Comprometo-me também a não ceder, vender ou comercializar este animal, a permitir
                o acesso do doador ao local onde se encontra o animal para averiguação de suas condições. Tenho
                conhecimento de que, caso seja constatado pelo doador situação de risco para o bem-estar do animal,
                perderei a sua guarda. Assumo todos os deveres que lhe são inerentes, cumprindo toda a legislação
                vigente municipal, estadual e federal.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Toggle checked={aceiteDeclaracao} onChange={setAceiteDeclaracao} label="Aceito a declaração de responsabilidade (questionário)" />
              {triedSubmit && !aceiteDeclaracao && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Toggle checked={aceiteTermo} onChange={setAceiteTermo} label="Aceito o termo de adoção responsável" />
              {triedSubmit && !aceiteTermo && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#1A1A1A]">
                Relatório / Observações
              </label>
              <textarea
                rows={4}
                value={assinaturaArdap}
                onChange={(e) => setAssinaturaArdap(e.target.value)}
                placeholder="Observações pertinentes, parecer inicial, condições visíveis no ato da adoção..."
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">Assinatura do adotante</label>
                <input type="text" value={assinaturaAdotante} onChange={(e) => setAssinaturaAdotante(e.target.value)} className={fieldCls(triedSubmit && !assinaturaAdotante.trim())} />
                {triedSubmit && !assinaturaAdotante.trim() && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Local</label>
                <input type="text" value={localAssinatura} onChange={(e) => setLocalAssinatura(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Data</label>
                <input type="date" value={dataAssinatura} onChange={(e) => setDataAssinatura(e.target.value)} className={inputCls} />
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
              <span>{saving ? "Salvando..." : "Salvar Termo de Adoção"}</span>
              {!saving && (
                <i className="bi bi-arrow-right text-[18px] text-[#1A1A1A]"></i>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
