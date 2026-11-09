import { useTranslation } from "react-i18next";
import type { Documento } from "../../hooks/useDashboardData";

interface DocumentosRecentesProps {
  documentos: Documento[];
  onVerTodos: () => void;
  // Quem aprova vê também os pendentes e rejeitados, com a coluna do estado
  mostrarEstado: boolean;
}

const corEstado: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  APROVADO: "bg-emerald-100 text-emerald-700",
  REJEITADO: "bg-red-100 text-red-700",
};

export default function DocumentosRecentes({ documentos, onVerTodos, mostrarEstado }: DocumentosRecentesProps) {
  const { t, i18n } = useTranslation();

  const formatarData = (data?: string) =>
    data ? new Date(data).toLocaleDateString(i18n.language === "en" ? "en-GB" : "pt-PT") : "-";

  return (
    <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">{t("dashboard.documentosRecentes.titulo")}</h3>
        <button onClick={onVerTodos} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
          {t("dashboard.documentosRecentes.verTodos")}
        </button>
      </div>

      {/* Telemóvel: lista empilhada em vez da tabela */}
      <ul className="xl:hidden divide-y divide-slate-100">
        {documentos.length > 0 ? (
          documentos.map((doc) => {
            const estado = doc.estado || "APROVADO";
            return (
              <li key={doc.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate" title={doc.titulo}>
                    {doc.titulo || doc.nomeArquivo || t("dashboard.documentosRecentes.semNome")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {doc.categoria?.nome || t("dashboard.documentosRecentes.geral")} · {formatarData(doc.dataSubmissao)}
                  </p>
                </div>
                {mostrarEstado && (
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${corEstado[estado]}`}>
                    {t(`comum.status.${estado}`)}
                  </span>
                )}
              </li>
            );
          })
        ) : (
          <li className="text-center py-6 text-slate-400 text-xs">{t("dashboard.documentosRecentes.nenhumDocumento")}</li>
        )}
      </ul>

      <div className="hidden xl:block rolagem-horizontal">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 font-semibold">{t("dashboard.documentosRecentes.nome")}</th>
              <th className="py-3 px-4 font-semibold">{t("dashboard.documentosRecentes.categoria")}</th>
              <th className="py-3 px-4 font-semibold">{t("dashboard.documentosRecentes.data")}</th>
              {mostrarEstado && <th className="py-3 px-4 font-semibold">{t("dashboard.documentosRecentes.statusHeader")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documentos.length > 0 ? (
              documentos.map((doc) => {
                const estado = doc.estado || "APROVADO";
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 truncate max-w-xs" title={doc.titulo}>
                      {doc.titulo || doc.nomeArquivo || t("dashboard.documentosRecentes.semNome")}
                    </td>
                    <td className="py-3 px-4">{doc.categoria?.nome || t("dashboard.documentosRecentes.geral")}</td>
                    <td className="py-3 px-4 text-xs">
                      {formatarData(doc.dataSubmissao)}
                    </td>
                    {mostrarEstado && (
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${corEstado[estado]}`}>
                          {t(`comum.status.${estado}`)}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={mostrarEstado ? 4 : 3} className="text-center py-6 text-slate-400 text-xs">
                  {t("dashboard.documentosRecentes.nenhumDocumento")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}