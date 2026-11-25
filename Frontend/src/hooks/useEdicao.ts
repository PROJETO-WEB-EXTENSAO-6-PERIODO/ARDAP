import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

// Resposta da API; cada formulário sabe quais campos ela tem.
export type DadosRegistro = Record<string, any>;

// Com :id na rota o formulário edita aquele registro; sem :id, cria um novo.
export function useEdicao(rota: string, preencher: (dados: DadosRegistro) => void) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carregado, setCarregado] = useState(id === undefined);
  const [erroCarga, setErroCarga] = useState("");
  const preencherRef = useRef(preencher);

  useEffect(() => {
    if (id === undefined) return;
    let ativo = true;
    api
      .get<DadosRegistro>(`/${rota}/${id}`)
      .then(({ data }) => {
        if (!ativo) return;
        preencherRef.current(data);
        setErroCarga("");
        setCarregado(true);
      })
      .catch((e) => {
        if (!ativo) return;
        setErroCarga(
          isAxiosError(e) && e.response?.status === 404
            ? "Registro não encontrado."
            : "Não foi possível carregar o registro para edição.",
        );
      });
    return () => {
      ativo = false;
    };
  }, [rota, id]);

  // Devolve true quando editou (e já saiu da tela) e false quando criou.
  async function salvar(dados: DadosRegistro) {
    if (id === undefined) {
      await api.post(`/${rota}`, dados);
      return false;
    }
    await api.put(`/${rota}/${id}`, dados);
    navigate(`/${rota}/${id}`, { replace: true });
    return true;
  }

  return {
    idEdicao: id,
    editando: id !== undefined,
    carregado,
    erroCarga,
    salvar,
    cancelarPara: id === undefined ? "/home" : `/${rota}/${id}`,
  };
}
