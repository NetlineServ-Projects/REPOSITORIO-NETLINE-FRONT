import { useState, useEffect, useCallback } from "react";
import { useCarregamento } from "./useCarregamento";
import { toast } from "sonner";
import { fetchComToken } from "../utils/api";
import { API_ENDPOINTS } from "../data/client/endpoint";
import type { Plataforma, Servidor, Dominio, Subdominio,ImagemContainer, DadosPlataforma, DadosDominio, CatalogoFornecedores} from "../types/plataforma";
import type { PlataformaArvore } from "../types/plataformaArvore";

// Fornecedores de cada tipo de plataforma (a fonte é o backend)
export const listarFornecedores = (): Promise<CatalogoFornecedores> =>
  fetchComToken(API_ENDPOINTS.PLATAFORMA_FORNECEDORES);

// Token de uma conta de acesso da plataforma.
// Só deve ser chamada com o token elevado (ver useAcessoElevado)
export const revelarTokenPlataforma = async (
  id: number | string,
  acessoId: number | string,
  tokenElevado: string,
): Promise<string> => {
  const resposta = await fetchComToken(API_ENDPOINTS.PLATAFORMA_TOKEN(id, acessoId), {
    headers: { "x-token-elevado": tokenElevado },
  });
  return (resposta as { token?: string })?.token ?? "";
};

// Só deve ser chamada com o token elevado (ver useAcessoElevado)
export const revelarPasswordServidor = async (
  id: number | string,
  tokenElevado: string,
): Promise<string> => {
  const resposta = await fetchComToken(API_ENDPOINTS.SERVIDOR_PASSWORD(id), {
    headers: { "x-token-elevado": tokenElevado },
  });
  return (resposta as { password?: string })?.password ?? "";
};


export function usePlataformasData() {
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [arvore, setArvore] = useState<PlataformaArvore[]>([]);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [dominios, setDominios] = useState<Dominio[]>([]);
  const [subdominios, setSubdominios] = useState<Subdominio[]>([]);
  const [imagens, setImagens] = useState<ImagemContainer[]>([]);
  const { carregando: loading, aAtualizar, erro, executar } = useCarregamento(
    "Não foi possível carregar as plataformas.",
  );

  const carregarTodos = useCallback(
    () =>
      executar(
        async () => {
          const resultados = await Promise.allSettled([
        fetchComToken(API_ENDPOINTS.PLATAFORMAS),
        fetchComToken(API_ENDPOINTS.PLATAFORMA_ARVORE),
        fetchComToken(API_ENDPOINTS.SERVIDORES),
        fetchComToken(API_ENDPOINTS.DOMINIOS),
        fetchComToken(API_ENDPOINTS.SUBDOMINIOS),
            fetchComToken(API_ENDPOINTS.IMAGENS),
          ]);
          // Sem a lista de plataformas a página não serve de nada: isso é um erro a sério.
          // Se só uma parte falhar (ex: imagens), mostra-se o resto e avisa-se.
          if (resultados[0].status === "rejected") throw resultados[0].reason;
          const NOMES = ["plataformas", "árvore", "servidores", "domínios", "registos DNS", "imagens"];
          const falhadas = resultados.flatMap((r, i) => (r.status === "rejected" ? [NOMES[i]] : []));
          if (falhadas.length > 0) toast.warning(`Alguns dados não carregaram: ${falhadas.join(", ")}.`);
          return resultados;
        },
        ([platRes, arvoreRes, servRes, domRes, subRes, imgRes]) => {
      if (platRes.status === "fulfilled" && Array.isArray(platRes.value)) {
        setPlataformas(platRes.value);
      }
      if (arvoreRes.status === "fulfilled" && Array.isArray(arvoreRes.value)) {
        setArvore(arvoreRes.value);
      }
      if (servRes.status === "fulfilled" && Array.isArray(servRes.value)) {
        setServidores(servRes.value);
      }
      if (domRes.status === "fulfilled" && Array.isArray(domRes.value)) {
        setDominios(domRes.value);
      }
      if (subRes.status === "fulfilled" && Array.isArray(subRes.value)) {
        setSubdominios(subRes.value);
      }
      if (imgRes.status === "fulfilled" && Array.isArray(imgRes.value)) {
        setImagens(imgRes.value);
      }
        },
      ),
    [executar],
  );

  useEffect(() => {
    carregarTodos();
  }, [carregarTodos]);

  // ==========================================
  // OPERAÇÕES: PLATAFORMA
  // ==========================================
   const criarPlataforma = async (dados: DadosPlataforma): Promise<Plataforma> => {
    const criada = await fetchComToken(API_ENDPOINTS.PLATAFORMAS, {
      method: "POST",
      body: JSON.stringify(dados),
    });
    await carregarTodos();
    return criada as Plataforma;
  };

  const atualizarPlataforma = async (
    id: number | string,
    dados: Partial<DadosPlataforma>
  ): Promise<Plataforma> => {
    const atualizada = await fetchComToken(API_ENDPOINTS.PLATAFORMA_BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
    await carregarTodos();
    return atualizada as Plataforma;
  };

  const enviarLogotipoPlataforma = async (id: number | string, ficheiro: File) => {
    const formData = new FormData();
    formData.append("logotipo", ficheiro);
    await fetchComToken(API_ENDPOINTS.PLATAFORMA_LOGOTIPO(id), {
      method: "PATCH",
      body: formData,
    });
    await carregarTodos();
  };
  const eliminarPlataforma = async (id: number | string) => {
    await fetchComToken(API_ENDPOINTS.PLATAFORMA_BY_ID(id), {
      method: "DELETE",
    });
    await carregarTodos();
  };

  // ==========================================
  // OPERAÇÕES: SERVIDOR
  // ==========================================
  const criarServidor = async (dados: Record<string, unknown>) => {
    await fetchComToken(API_ENDPOINTS.SERVIDORES, {
      method: "POST",
      body: JSON.stringify(dados),
    });
    await carregarTodos();
  };

  const atualizarServidor = async (
    id: number | string,
    dados: Record<string, unknown>
  ) => {
    await fetchComToken(API_ENDPOINTS.SERVIDOR_BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
    await carregarTodos();
  };

  const eliminarServidor = async (id: number | string) => {
    await fetchComToken(API_ENDPOINTS.SERVIDOR_BY_ID(id), {
      method: "DELETE",
    });
    await carregarTodos();
  };

  // ==========================================
  // OPERAÇÕES: DOMÍNIO
  // ==========================================
  const criarDominio = async (dados: DadosDominio) => {
    await fetchComToken(API_ENDPOINTS.DOMINIOS, {
      method: "POST",
      body: JSON.stringify(dados),
    });
    await carregarTodos();
  };

  const atualizarDominio = async (
    id: number | string,
    dados: Partial<DadosDominio>
  ) => {
    await fetchComToken(API_ENDPOINTS.DOMINIO_BY_ID(id), {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
    await carregarTodos();
  };

  const eliminarDominio = async (id: number | string) => {
    await fetchComToken(API_ENDPOINTS.DOMINIO_BY_ID(id), {
      method: "DELETE",
    });
    await carregarTodos();
  };

  // Os subdomínios são só de leitura aqui: criam-se e editam-se no formulário do sistema
   // ==========================================
   // OPERAÇÕES: IMAGEM DE CONTAINER
   // ==========================================
  const criarImagem = async (dados: Record<string, unknown>) => {
    await fetchComToken(API_ENDPOINTS.IMAGENS, {
     method: "POST",
     body: JSON.stringify(dados),
    });
    await carregarTodos();
  };

  const atualizarImagem = async (
    id: number | string,
    dados: Record<string, unknown>
  ) => {
    await fetchComToken(API_ENDPOINTS.IMAGEM_BY_ID(id), {
     method: "PATCH",
     body: JSON.stringify(dados),
    });
  await carregarTodos();
  };

  const eliminarImagem = async (id: number | string) => {
    await fetchComToken(API_ENDPOINTS.IMAGEM_BY_ID(id), {
    method: "DELETE",
  });
   await carregarTodos();
 };

  return {
    plataformas,
    arvore,
    servidores,
    dominios,
    subdominios,
    imagens,
    loading,
    aAtualizar,
    erro,
    carregarTodos,
    criarPlataforma,
    atualizarPlataforma,
    eliminarPlataforma,
    enviarLogotipoPlataforma,
    criarServidor,
    atualizarServidor,
    eliminarServidor,
    criarDominio,
    atualizarDominio,
    eliminarDominio,
    criarImagem,
    atualizarImagem,
    eliminarImagem,
  };
}

