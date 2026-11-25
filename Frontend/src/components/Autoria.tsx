export interface Autor {
  id: number;
  first_name: string;
  second_name: string;
}

export function nomeDoAutor(autor: Autor | null | undefined) {
  return autor ? `${autor.first_name} ${autor.second_name}` : "Não registrado";
}

// O banco grava horário local sem fuso; formata o texto sem passar por Date.
export function formatarDataHora(iso: string | null | undefined) {
  if (!iso) return null;
  const data = iso.slice(0, 10).split("-").reverse().join("/");
  const hora = iso.slice(11, 16);
  return hora ? `${data} às ${hora}` : data;
}

// Linha "Cadastrado por Fulano em dd/mm/aaaa às hh:mm".
export function Autoria({
  autor,
  data,
  acao = "Cadastrado",
}: {
  autor: Autor | null | undefined;
  data?: string | null;
  acao?: string;
}) {
  const quando = formatarDataHora(data);
  return (
    <p className="flex min-w-0 items-start gap-1.5 text-xs text-gray-500">
      <i
        aria-hidden="true"
        className={`bi ${acao === "Cadastrado" ? "bi-person-check" : "bi-pencil-square"}`}
      ></i>
      <span className="min-w-0 break-words">
        {acao} por{" "}
        <strong className="font-semibold text-[#1A1A1A]">{nomeDoAutor(autor)}</strong>
        {quando && ` em ${quando}`}
      </span>
    </p>
  );
}

export interface ComAutoria {
  funcionario: Autor | null;
  created_at: string | null;
  alterado_por: Autor | null;
  updated_at: string | null;
}

// Quem cadastrou e, se houve edição, quem alterou por último.
export function Autorias({ registro }: { registro: ComAutoria }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Autoria autor={registro.funcionario} data={registro.created_at} />
      {registro.alterado_por && (
        <Autoria
          acao="Alterado"
          autor={registro.alterado_por}
          data={registro.updated_at}
        />
      )}
    </div>
  );
}
