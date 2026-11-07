import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { obterRegistoAuditoria } from "../../../../hooks/useAuditoria";
import type { RegistoAuditoria } from "../../../../types/auditoria";
import { IconVoltar } from "../../../../components/icons";
import { CLASSE_ACAO, classeEstado, formatarDataHora } from "../estilos";

const LISTA = "/dashboard/auditoria";
const CARTAO = "bg-white rounded-2xl border border-slate-200/70 shadow-xs";

// Rótulo pequeno e valor compacto, mas com peso suficiente para se ler bem
function Campo({ rotulo, children, largo = false }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <div className={`min-w-0 ${largo ? "col-span-full" : ""}`}>
      <dt className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wide">{rotulo}</dt>
      <dd className="text-[13px] font-medium text-slate-900 mt-0.5 break-words leading-snug">{children}</dd>
    </div>
  );
}

// Grupo de campos dentro do cartão (Quem, O quê, De onde)
function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <h3 className="text-[11px] font-bold text-netline-azul uppercase tracking-wide mb-2">{titulo}</h3>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2.5">{children}</dl>
    </div>
  );
}

// Página de um registo de auditoria (só administradores), aberta a partir da lista
export default function AuditoriaDetalhePage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // A lista passa o seu URL (com filtros e página); vindo de um link direto, volta à lista simples
  const voltarPara = (location.state as { voltarPara?: string } | null)?.voltarPara ?? LISTA;

  const [resultado, setResultado] = useState<{ id: string; registo?: RegistoAuditoria; erro?: string } | null>(null);

  useEffect(() => {
    let cancelado = false;
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero <= 0) return;
    obterRegistoAuditoria(numero)
      .then((registo) => !cancelado && setResultado({ id: String(id), registo }))
      .catch(
        (e) =>
          !cancelado &&
          setResultado({ id: String(id), erro: e instanceof Error ? e.message : t("auditoria.erroCarregar") }),
      );
    return () => {
      cancelado = true;
    };
  }, [id, t]);

  const idValido = Number.isInteger(Number(id)) && Number(id) > 0;
  const atual = resultado?.id === id ? resultado : null;
  const r = atual?.registo;
  const erro = !idValido ? t("auditoria.detalhe.naoEncontrado") : atual?.erro;
  const anonimo = r ? !r.usuarioNome && !r.usuarioEmail : false;
  const voltar = () => navigate(voltarPara);

  return (
    <div className="space-y-4 pb-8">
      {/* Cabeçalho: o banner azul das outras páginas, mais baixo */}
      <div className="bg-netline-azul text-white px-5 py-4 sm:px-6 sm:py-5 rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={voltar}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100/90 hover:text-white transition-colors cursor-pointer"
        >
          <IconVoltar className="w-3 h-3" />
          {t("auditoria.detalhe.voltar")}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{t("auditoria.detalhe.titulo", { id })}</h1>
            {r && <p className="text-[13px] font-medium text-blue-100 mt-0.5">{formatarDataHora(r.criadoEm, i18n.language)}</p>}
          </div>
          {r && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${CLASSE_ACAO[r.acao] ?? ""}`}>
                {t(`auditoria.acoes.${r.acao}`, { defaultValue: r.acao })}
              </span>
              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${classeEstado(r.estado)}`}>
                {r.estado}
              </span>
            </div>
          )}
        </div>
      </div>

      {erro ? (
        <div className={`${CARTAO} p-6 text-center space-y-2`}>
          <p className="text-sm font-medium text-red-600">{erro}</p>
          <button type="button" onClick={voltar} className="text-sm font-semibold text-netline-azul hover:underline cursor-pointer">
            {t("auditoria.detalhe.voltar")}
          </button>
        </div>
      ) : !r ? (
        <div className={`${CARTAO} p-6 text-center`}>
          <p className="text-sm font-medium text-slate-500">{t("auditoria.aCarregar")}</p>
        </div>
      ) : (
        // Ecrã largo: informação à esquerda, dados do pedido à direita (menos scroll)
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className={`${CARTAO} p-4 sm:p-5 lg:col-span-3 divide-y divide-slate-100`}>
            <Grupo titulo={t("auditoria.detalhe.quem")}>
              <Campo rotulo={t("auditoria.colunas.utilizador")}>
                {anonimo ? <span className="text-slate-500 uppercase text-xs">{t("auditoria.anonimo")}</span> : r.usuarioNome || "—"}
              </Campo>
              <Campo rotulo={t("auditoria.colunas.perfil")}>{r.perfilNome || "—"}</Campo>
              <Campo rotulo={t("auditoria.detalhe.email")}>{r.usuarioEmail || "—"}</Campo>
            </Grupo>

            <Grupo titulo={t("auditoria.detalhe.oQue")}>
              <Campo rotulo={t("auditoria.colunas.funcionalidade")}>
                {r.funcionalidade
                  ? t(`auditoria.funcionalidades.${r.funcionalidade}`, { defaultValue: r.funcionalidade })
                  : "—"}
              </Campo>
              <Campo rotulo={t("auditoria.detalhe.recurso")}>{r.recursoId ? `#${r.recursoId}` : "—"}</Campo>
              <Campo rotulo={t("auditoria.detalhe.duracaoRotulo")}>{t("auditoria.detalhe.duracaoMs", { ms: r.duracaoMs })}</Campo>
              <Campo rotulo={t("auditoria.colunas.pedido")} largo>
                <code className="font-mono text-xs font-medium break-all bg-slate-50 border border-slate-100 rounded-md px-2 py-1 inline-block">
                  <span className="font-bold">{r.metodo}</span> {r.caminho}
                </code>
              </Campo>
            </Grupo>

            <Grupo titulo={t("auditoria.detalhe.deOnde")}>
              <Campo rotulo={t("auditoria.detalhe.ip")}>
                <span className="font-mono text-xs">{r.ip || "—"}</span>
              </Campo>
              <Campo rotulo={t("auditoria.detalhe.navegador")} largo>
                <span className="text-xs font-normal text-slate-700">{r.userAgent || "—"}</span>
              </Campo>
            </Grupo>
          </div>

          <div className={`${CARTAO} p-4 sm:p-5 lg:col-span-2 space-y-2`}>
            <h3 className="text-[11px] font-bold text-netline-azul uppercase tracking-wide">{t("auditoria.detalhe.dados")}</h3>
            {r.detalhes ? (
              <pre className="text-[11.5px] leading-relaxed font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto max-h-80 whitespace-pre-wrap break-all">
                {JSON.stringify(r.detalhes, null, 2)}
              </pre>
            ) : (
              <p className="text-[13px] font-medium text-slate-500">{t("auditoria.detalhe.semDados")}</p>
            )}
            <p className="text-[11px] text-slate-500">{t("auditoria.detalhe.notaSegredos")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
