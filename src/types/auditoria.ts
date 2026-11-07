// Registos de auditoria (só para administradores): um por pedido feito à API

export const ACOES_AUDITORIA = [
  "ENTRADA",
  "SAIDA",
  "LOGIN_FALHADO",
  "REAUTENTICACAO",
  "CONSULTA",
  "CRIACAO",
  "ALTERACAO",
  "ELIMINACAO",
  "ACESSO_SENSIVEL",
  "ACESSO_RECUSADO",
  "ERRO",
] as const;

export type AcaoAuditoria = (typeof ACOES_AUDITORIA)[number];

export interface RegistoAuditoria {
  id: number;
  criadoEm: string;
  usuarioId: number | null;
  usuarioNome: string | null;
  usuarioEmail: string | null;
  perfilNome: string | null;
  acao: AcaoAuditoria;
  funcionalidade: string | null;
  recursoId: string | null;
  metodo: string;
  caminho: string;
  estado: number;
  duracaoMs: number;
  ip: string | null;
  // Só no registo aberto (o detalhe)
  userAgent?: string | null;
  detalhes?: Record<string, unknown> | null;
}

export interface PaginaAuditoria {
  registos: RegistoAuditoria[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// Filtros como estão no formulário (datas em AAAA-MM-DD, vazio = sem filtro)
export interface FiltrosAuditoria {
  desde: string;
  ate: string;
  utilizador: string;
  acao: string;
  funcionalidade: string;
  resultado: string;
}

export const FILTROS_AUDITORIA_VAZIOS: FiltrosAuditoria = {
  desde: "",
  ate: "",
  utilizador: "",
  acao: "",
  funcionalidade: "",
  resultado: "",
};
