import { limparTema } from "./tema";
import i18n from "../lang/i18n";

// Endereço do backend, definido por ambiente em VITE_API_BASE_URL (sem a barra final)
export const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const API_BASE = `${API_URL}/api/v1`;

const CHAVE_IDIOMA_CACHE = "idioma_preferido";

// Erro que carrega, além da mensagem genérica, os detalhes de validação por campo
// (quando o backend devolve { sucesso: false, mensagem, data: [{ campo, mensagem }] })
export class ErroApi extends Error {
  detalhes?: { campo: string; mensagem: string }[];
  status:number;



  constructor(
    mensagem: string,
    detalhes?: { campo: string; mensagem: string }[],
    status: number = 0,
  ) {
    super(mensagem);
    this.name = "ErroApi";
    this.detalhes = detalhes;
    this.status = status;
  }
}

// A sessão vive num cookie HttpOnly posto pelo backend no login: o JavaScript não o lê nem o
// guarda. Aqui só se guarda o essencial para o ecrã (id, nome, perfil e permissões) em
// "usuario_logado". As permissões servem só para mostrar ou esconder: a API verifica tudo.
const CHAVE_USUARIO = "usuario_logado";

export function temSessaoLocal(): boolean {
  return Boolean(localStorage.getItem(CHAVE_USUARIO));
}

export function guardarUsuarioLocal(usuario: {
  id: number;
  nome?: string;
  name?: string;
  perfil: unknown;
  permissoes?: string[];
}) {
  localStorage.setItem(
    CHAVE_USUARIO,
    JSON.stringify({
      id: usuario.id,
      nome: usuario.nome ?? usuario.name,
      perfil: usuario.perfil,
      permissoes: usuario.permissoes ?? [],
    }),
  );
}

// Pede ao backend que apague o cookie (só ele o consegue apagar) e limpa os dados locais
export async function terminarSessaoNoServidor() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      signal: AbortSignal.timeout(TIMEOUT_PADRAO_MS),
    });
  } catch {
    // Sem rede o cookie expira sozinho; a sessão local é limpa na mesma
  }
  limparSessaoLocal();
}

export function limparSessaoLocal() {
  localStorage.removeItem(CHAVE_USUARIO);
  // Restos da versão antiga, que guardava o token no localStorage
  localStorage.removeItem("token_sistema");
  localStorage.removeItem("token");
}

function obterIdiomaCache(): string {
  return localStorage.getItem(CHAVE_IDIOMA_CACHE) || "pt";
}

// Guarda localmente o idioma vindo da API, para usar como Accept-Language nas próximas chamadas
function cachearIdiomaSeExistir(data: unknown) {
  if (!data || typeof data !== "object") return;

  const possivelUsuario = data as Record<string, any>;
  const idioma = possivelUsuario.idioma ?? possivelUsuario.user?.idioma;

  if (typeof idioma === "string" && idioma) {
    localStorage.setItem(CHAVE_IDIOMA_CACHE, idioma);
  }
}

// Constrói uma mensagem legível a partir do array de erros de validação do Zod:
// [{ campo: "descricaoCurta", mensagem: "Too big..." }] -> "descricaoCurta: Too big..."
function construirMensagemDetalhada(mensagemBase: string, detalhes?: { campo: string; mensagem: string }[]): string {
  if (!detalhes || detalhes.length === 0) return mensagemBase;
  return detalhes.map((d) => `${d.campo}: ${d.mensagem}`).join(" | ");
}

// Tempo máximo de espera por uma resposta da API
export const TIMEOUT_PADRAO_MS = 15_000;
// Uploads dependem do tamanho do ficheiro e da rede, por isso esperam mais
export const TIMEOUT_UPLOAD_MS = 120_000;

// Converte as falhas do fetch (timeout, sem rede, servidor em baixo) num ErroApi legível.
// Um cancelamento pedido pelo próprio código (AbortError) é devolvido tal como está.
export function erroDeLigacao(erro: unknown): unknown {
  if (erro instanceof DOMException && erro.name === "TimeoutError") {
    return new ErroApi(i18n.t("comum.erros.servidorLento"));
  }
  if (erro instanceof TypeError) {
    return new ErroApi(i18n.t("comum.erros.semLigacao"));
  }
  return erro;
}

// Nestes endpoints um 401 significa palavra-passe errada, não sessão expirada
const ENDPOINTS_COM_SENHA = ["/auth/senha", "/auth/reautenticar"];

// Um 401 só significa "sessão expirada" quando o pedido não usa o token elevado
// (esse tem o seu próprio modal de reautenticação, em acessoElevado.tsx)
function sessaoExpirou(endpoint: string, options: RequestInit): boolean {
  const usaTokenElevado = new Headers(options.headers).has("x-token-elevado");
  return !usaTokenElevado && !ENDPOINTS_COM_SENHA.includes(endpoint);
}

function terminarSessao() {
  void terminarSessaoNoServidor();
  limparTema();
  if (window.location.pathname !== "/autenticacao") {
    window.location.href = "/autenticacao?sessao=expirada";
  }
}

const PAUSA_ANTES_DE_REPETIR_MS = 1_000;

export async function fetchComToken(endpoint: string, options: RequestInit = {}) {
  const ehFormData = options.body instanceof FormData;
  const ehLeitura = !options.method || options.method.toUpperCase() === "GET";

  const pedir = () => {
    const timeout = AbortSignal.timeout(ehFormData ? TIMEOUT_UPLOAD_MS : TIMEOUT_PADRAO_MS);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal,
      credentials: "include", // envia o cookie HttpOnly da sessão
      headers: {
        ...(!ehFormData && { "Content-Type": "application/json" }),
        "Accept-Language": obterIdiomaCache(),
        ...options.headers,
      },
    });
  };

  let resposta: Response;
  try {
    resposta = await pedir();
  } catch (erro) {
    // Uma leitura que falha por rede é repetida uma vez; escritas nunca, para não duplicar ações
    if (!ehLeitura || !(erro instanceof TypeError)) throw erroDeLigacao(erro);
    await new Promise((r) => setTimeout(r, PAUSA_ANTES_DE_REPETIR_MS));
    try {
      resposta = await pedir();
    } catch (erroRepetido) {
      throw erroDeLigacao(erroRepetido);
    }
  }

  // Respostas sem corpo JSON (ex: 204, ou um 502 em HTML de um proxy) não devem rebentar aqui
  const corpo = await resposta.json().catch(() => null);

  if (resposta.status === 401 && temSessaoLocal() && sessaoExpirou(endpoint, options)) {
    terminarSessao();
  }

  if (!resposta.ok) {
    // O backend devolve os erros de validação Zod em `data`, um por campo
    const detalhes = Array.isArray(corpo?.data) ? corpo.data : undefined;
    const mensagemBase = corpo?.mensagem || i18n.t("comum.erros.comunicarServidor");
    throw new ErroApi(construirMensagemDetalhada(mensagemBase, detalhes), detalhes,resposta.status,);
  }

  cachearIdiomaSeExistir(corpo?.data);

  return corpo?.data;
}