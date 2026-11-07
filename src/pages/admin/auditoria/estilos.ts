import type { AcaoAuditoria } from "../../../types/auditoria";

// Cor da etiqueta de cada acção (o texto vem de auditoria.acoes.*)
export const CLASSE_ACAO: Record<AcaoAuditoria, string> = {
  ENTRADA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SAIDA: "bg-slate-100 text-slate-600 border-slate-200",
  LOGIN_FALHADO: "bg-red-50 text-red-700 border-red-200",
  REAUTENTICACAO: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONSULTA: "bg-slate-50 text-slate-600 border-slate-200",
  CRIACAO: "bg-blue-50 text-blue-800 border-blue-200",
  ALTERACAO: "bg-amber-50 text-amber-800 border-amber-200",
  ELIMINACAO: "bg-rose-50 text-rose-700 border-rose-200",
  ACESSO_SENSIVEL: "bg-violet-50 text-violet-700 border-violet-200",
  ACESSO_RECUSADO: "bg-red-50 text-red-700 border-red-200",
  ERRO: "bg-red-100 text-red-800 border-red-300",
};

// Cor do código HTTP: verde (2xx/3xx), âmbar (4xx), vermelho (5xx e ligações cortadas)
export function classeEstado(estado: number): string {
  if (estado < 400) return "bg-emerald-50 text-emerald-700";
  if (estado < 500) return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-700";
}

// Data e hora com segundos, no formato do idioma (ex: 07/11/2026, 17:00:25)
export function formatarDataHora(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
