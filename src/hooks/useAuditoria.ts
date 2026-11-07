import { useEffect, useState } from "react";
import { fetchComToken } from "../utils/api";
import { API_ENDPOINTS } from "../data/client/endpoint";
import { FILTROS_AUDITORIA_VAZIOS, type FiltrosAuditoria, type PaginaAuditoria, type RegistoAuditoria } from "../types/auditoria";
import i18n from "../lang/i18n";

const POR_PAGINA = 20;

// Filtros do formulário → query string. As datas são do dia local inteiro
// (das 00:00 às 23:59:59.999), enviadas em ISO para o backend (que guarda em UTC).
function paraQuery(filtros: FiltrosAuditoria, pagina: number): string {
  const params = new URLSearchParams();
  if (filtros.desde) params.set("desde", new Date(`${filtros.desde}T00:00:00`).toISOString());
  if (filtros.ate) params.set("ate", new Date(`${filtros.ate}T23:59:59.999`).toISOString());
  if (filtros.utilizador.trim()) params.set("utilizador", filtros.utilizador.trim());
  if (filtros.acao) params.set("acao", filtros.acao);
  if (filtros.funcionalidade) params.set("funcionalidade", filtros.funcionalidade);
  if (filtros.resultado) params.set("resultado", filtros.resultado);
  params.set("pagina", String(pagina));
  params.set("porPagina", String(POR_PAGINA));
  return params.toString();
}

export const obterRegistoAuditoria = (id: number): Promise<RegistoAuditoria> =>
  fetchComToken(API_ENDPOINTS.AUDITORIA_BY_ID(id));

// Filtros e página vivem no URL da lista (?desde=...&pagina=2): assim, ao voltar dos
// detalhes de um registo, a lista abre exatamente onde estava
const CAMPOS_FILTRO = Object.keys(FILTROS_AUDITORIA_VAZIOS) as (keyof FiltrosAuditoria)[];

export function filtrosDoUrl(params: URLSearchParams): FiltrosAuditoria {
  const filtros = { ...FILTROS_AUDITORIA_VAZIOS };
  for (const campo of CAMPOS_FILTRO) filtros[campo] = params.get(campo) ?? "";
  return filtros;
}

export function paginaDoUrl(params: URLSearchParams): number {
  const n = Number(params.get("pagina"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function paraUrl(filtros: FiltrosAuditoria, pagina: number): Record<string, string> {
  const params: Record<string, string> = {};
  for (const campo of CAMPOS_FILTRO) if (filtros[campo].trim()) params[campo] = filtros[campo].trim();
  if (pagina > 1) params.pagina = String(pagina);
  return params;
}

// Lista paginada no servidor (podem ser milhares de registos), com os filtros aplicados
export function useAuditoria(filtrosAplicados: FiltrosAuditoria, pagina: number) {
  // Muda para pedir a mesma página outra vez ("Tentar novamente")
  const [versao, setVersao] = useState(0);
  const [funcionalidades, setFuncionalidades] = useState<string[]>([]);

  // O pedido atual identifica-se pela query; a resposta guarda a query a que pertence.
  // Assim "a carregar" é só "a última resposta ainda não é deste pedido", e uma resposta
  // atrasada de um pedido antigo nunca substitui a do atual.
  const query = paraQuery(filtrosAplicados, pagina);
  const pedido = `${query}#${versao}`;
  const [resposta, setResposta] = useState<{ pedido: string; dados?: PaginaAuditoria; erro?: string } | null>(null);
  // Os últimos dados bons ficam visíveis (esbatidos) enquanto a página seguinte carrega
  const [dados, setDados] = useState<PaginaAuditoria | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetchComToken(`${API_ENDPOINTS.AUDITORIA}?${query}`)
      .then((d: PaginaAuditoria) => {
        if (cancelado) return;
        setDados(d);
        setResposta({ pedido, dados: d });
      })
      .catch((e) => {
        if (cancelado) return;
        setResposta({ pedido, erro: e instanceof Error ? e.message : i18n.t("auditoria.erroCarregar") });
      });
    return () => {
      cancelado = true;
    };
  }, [query, pedido]);

  const aCarregar = resposta?.pedido !== pedido;
  const erro = !aCarregar ? (resposta?.erro ?? null) : null;

  // As funcionalidades do filtro vêm dos próprios registos. Se falharem, o filtro fica vazio.
  useEffect(() => {
    fetchComToken(API_ENDPOINTS.AUDITORIA_FUNCIONALIDADES)
      .then((lista: string[]) => setFuncionalidades(Array.isArray(lista) ? lista : []))
      .catch(() => setFuncionalidades([]));
  }, []);

  return {
    dados,
    funcionalidades,
    aCarregar,
    erro,
    recarregar: () => setVersao((v) => v + 1),
  };
}
