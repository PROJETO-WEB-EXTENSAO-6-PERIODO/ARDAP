import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { api } from "../services/api";

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FFD900] transition-colors";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function onlyDigits(v: string, max: number) {
  let n = v.replace(/\D/g, "");
  if (n.length > max) n = n.slice(0, max);
  return n;
}

function onlyLetters(v: string) {
  return v.replace(/[0-9]/g, "");
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

const TIPOS_DOC = [
  { value: "", label: "Selecione..." },
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "cnh", label: "CNH" },
  { value: "passaporte", label: "Passaporte" },
  { value: "rne", label: "RNE" },
  { value: "outro", label: "Outro" },
];

export function Hipossuficiencia() {
  // Seção 1 - Representante legal
  const [nomeRepresentante, setNomeRepresentante] = useState("");
  const [documentoRepresentante, setDocumentoRepresentante] = useState("");
  const [tipoDocumentoRepresentante, setTipoDocumentoRepresentante] = useState("");
  const [emailRepresentante, setEmailRepresentante] = useState("");

  // Seção 2 - Imigrante representado
  const [nomeImigrante, setNomeImigrante] = useState("");
  const [documentoImigrante, setDocumentoImigrante] = useState("");
  const [tipoDocumentoImigrante, setTipoDocumentoImigrante] = useState("");
  const [emailImigrante, setEmailImigrante] = useState("");

  // Seção 3 - Motivos
  const [naoTrabalho, setNaoTrabalho] = useState(false);
  const [naoRenda, setNaoRenda] = useState(false);
  const [rendaMeioSalario, setRendaMeioSalario] = useState(false);
  const [outroMotivo, setOutroMotivo] = useState("");

  // Seção 4 - Local, data e assinatura
  const [localDeclaracao, setLocalDeclaracao] = useState("");
  const [dataDeclaracao, setDataDeclaracao] = useState("");
  const [assinatura, setAssinatura] = useState("");
  const [anexoFiles, setAnexoFiles] = useState<File[]>([]);

  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  useEffect(() => {
    setDataDeclaracao(todayISO());
    setLocalDeclaracao("Paulo Afonso");
  }, []);

  function resetForm() {
    setNomeRepresentante("");
    setDocumentoRepresentante("");
    setTipoDocumentoRepresentante("");
    setEmailRepresentante("");
    setNomeImigrante("");
    setDocumentoImigrante("");
    setTipoDocumentoImigrante("");
    setEmailImigrante("");
    setNaoTrabalho(false);
    setNaoRenda(false);
    setRendaMeioSalario(false);
    setOutroMotivo("");
    setLocalDeclaracao("Paulo Afonso");
    setDataDeclaracao(todayISO());
    setAssinatura("");
    setAnexoFiles([]);
    setTriedSubmit(false);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess(false);
    setTriedSubmit(true);

    if (!nomeRepresentante.trim()) {
      setFormError("Informe o nome do representante legal.");
      return;
    }
    if (!nomeImigrante.trim()) {
      setFormError("Informe o nome do imigrante representado.");
      return;
    }
    if (!assinatura.trim()) {
      setFormError("Informe a assinatura do representante.");
      return;
    }
    if (anexoFiles.length > 4) {
      setFormError("Selecione no máximo 4 documentos para anexar.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/hipossuficiencias", {
        nome_representante: nomeRepresentante.trim(),
        documento_representante: documentoRepresentante.trim() || null,
        tipo_documento_representante: tipoDocumentoRepresentante || null,
        email_representante: emailRepresentante.trim() || null,
        nome_imigrante: nomeImigrante.trim(),
        documento_imigrante: documentoImigrante.trim() || null,
        tipo_documento_imigrante: tipoDocumentoImigrante || null,
        email_imigrante: emailImigrante.trim() || null,
        nao_possui_trabalho_remunerado: naoTrabalho,
        nao_possui_renda: naoRenda,
        renda_ate_meio_salario_per_capita: rendaMeioSalario,
        outro_motivo: outroMotivo.trim() || null,
        local_declaracao: localDeclaracao.trim() || null,
        data_declaracao: dataDeclaracao || null,
        assinatura_representante: assinatura.trim() || null,
        anexo_documentos: anexoFiles.length > 0 ? anexoFiles.map((f) => f.name).join(", ") : null,
      });
      setSuccess(true);
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setFormError(
        detail
          ? `Não foi possível salvar: ${detail}`
          : "Não foi possível salvar. Confira os dados e tente de novo."
      );
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
          <span className="font-medium text-[#1A1A1A]">Hipossuficiência</span>
        </nav>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#1A1A1A]">
              Declaração de Hipossuficiência Econômica
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
                Declaração de hipossuficiência registrada com sucesso!
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
          {/* Seção 1 - Representante legal */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-person"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Representante Legal</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Quem assina a declaração</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#FFD900] px-2.5 py-1 text-xs font-medium text-[#1A1A1A]">
                Campos Obrigatórios *
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Nome do representante <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <input type="text" value={nomeRepresentante} onChange={(e) => setNomeRepresentante(e.target.value)} placeholder="Nome completo" className={inputCls} />
                {triedSubmit && !nomeRepresentante.trim() && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Tipo do documento</label>
                <select value={tipoDocumentoRepresentante} onChange={(e) => setTipoDocumentoRepresentante(e.target.value)} className={inputCls}>
                  {TIPOS_DOC.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Número do documento</label>
                <input type="text" value={documentoRepresentante} onChange={(e) => setDocumentoRepresentante(onlyDigits(e.target.value, 20))} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">E-mail</label>
                <input type="email" value={emailRepresentante} onChange={(e) => setEmailRepresentante(e.target.value)} className={inputCls} />
              </div>
            </div>
          </article>

          {/* Seção 2 - Imigrante representado */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-person-badge"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Imigrante Representado</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Dados do imigrante</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Nome do imigrante <span className="font-bold text-[#DC2626]">*</span>
                </label>
                <input type="text" value={nomeImigrante} onChange={(e) => setNomeImigrante(e.target.value)} placeholder="Nome completo" className={inputCls} />
                {triedSubmit && !nomeImigrante.trim() && <p className="mt-0.5 text-xs text-[#DC2626]">Campo obrigatório</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Tipo do documento</label>
                <select value={tipoDocumentoImigrante} onChange={(e) => setTipoDocumentoImigrante(e.target.value)} className={inputCls}>
                  {TIPOS_DOC.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Número do documento</label>
                <input type="text" value={documentoImigrante} onChange={(e) => setDocumentoImigrante(onlyDigits(e.target.value, 20))} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">E-mail</label>
                <input type="email" value={emailImigrante} onChange={(e) => setEmailImigrante(e.target.value)} className={inputCls} />
              </div>
            </div>
          </article>

          {/* Seção 3 - Motivos de hipossuficiência */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-list-check"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Motivos de Hipossuficiência</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Justificativa econômica</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#f8f9ff] p-4 text-[#1A1A1A] flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center gap-2 text-[#6f5d00] font-semibold text-sm">
                <i className="bi bi-balance-scale text-[18px]"></i>
                <span>Declaração de Hipossuficiência Econômica</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Declaro, sob as penas da lei, para fins de aplicação da isenção prevista nos arts. 4º, inciso XII,
                110, parágrafo único, e 113, § 3º, da Lei nº 13.445, de 2017, e art. 312 do Decreto nº 9.199, de 2017,
                que a condição econômica do imigrante ora representado se revela hipossuficiente para arcar com o
                pagamento dos valores das taxas cobradas para obtenção de documentos para regularização migratória e de
                multas aplicadas com base na legislação migratória brasileira.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Toggle checked={naoTrabalho} onChange={setNaoTrabalho} label="Não possui trabalho remunerado" />
              <Toggle checked={naoRenda} onChange={setNaoRenda} label="Não possui renda" />
              <Toggle checked={rendaMeioSalario} onChange={setRendaMeioSalario} label="Renda familiar de até meio salário mínimo per capita ou até 3 salários mínimos" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#1A1A1A]">Outro motivo (descrever)</label>
              <textarea
                rows={3}
                value={outroMotivo}
                onChange={(e) => setOutroMotivo(e.target.value)}
                placeholder="Descreva outro motivo de hipossuficiência..."
                className={inputCls}
              />
            </div>
          </article>

          {/* Seção 4 - Local, data, assinatura e anexo */}
          <article className="flex h-full flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-[22px] text-gray-600">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Local, Data e Assinatura</h2>
                  <p className="text-xs text-gray-500 md:text-sm">Finalização da declaração</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Local da declaração</label>
                <input type="text" value={localDeclaracao} onChange={(e) => setLocalDeclaracao(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#1A1A1A]">Data da declaração</label>
                <input type="date" value={dataDeclaracao} onChange={(e) => setDataDeclaracao(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">Assinatura do representante</label>
                <input type="text" value={assinatura} onChange={(e) => setAssinatura(e.target.value)} className={inputCls} />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-[#1A1A1A]">Anexo de documentos</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAnexoFiles(Array.from(e.target.files || []))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] file:mr-3 file:rounded-md file:border-0 file:bg-[#1A1A1A] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#333]"
                />
                {anexoFiles.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-gray-600">
                    {anexoFiles.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                )}
                <p className={`text-xs ${anexoFiles.length <= 4 ? "text-green-600" : "text-red-500"}`}>
                  {anexoFiles.length} arquivo(s) selecionado(s) — máximo 4.
                </p>
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
              <span>{saving ? "Salvando..." : "Salvar declaração"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
