import type { ReactNode } from "react";
import EtiquetaSistema from "./etiquetaSistema";
import { useTranslation } from "react-i18next";
import { IconDownload } from "./icons";
import { formatarExtensao, obterNomeExibicao, formatarTamanho, obterUrlTransferencia } from "../utils/documentos";
import { API_URL } from "../utils/api";
import type { Documento } from "../types/documento";

export default function DocumentoCard({ doc, acoes }: { doc: Documento; acoes?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const ext = formatarExtensao(doc.tipoArquivo, doc.nomeArquivo);
  const nomeExibicao = obterNomeExibicao(doc);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl min-w-0 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <span className="inline-block p-2 bg-blue-50 text-netline-azul rounded-lg text-xs font-extrabold uppercase border border-blue-100/50">{ext}</span>
        <div className="min-w-0">
          <h4 className="font-bold text-slate-800 text-sm truncate" title={nomeExibicao}>{nomeExibicao}</h4>
          {doc.descricao && <p className="text-xs text-slate-400 line-clamp-2 mt-1" title={doc.descricao}>{doc.descricao}</p>}
          {doc.sistema && <div className="mt-2"><EtiquetaSistema sistema={doc.sistema} /></div>}
        </div>
        <div className="text-xs space-y-1 text-slate-500 pt-1">
          <p>{t("componentes.documento.submetidoPor")}: <strong className="text-slate-700">{doc.usuario?.nome || t("componentes.documento.sistema")}</strong></p>
          <p>{t("componentes.documento.categoria")}: <span className="text-slate-600">{doc.categoria?.nome || t("componentes.documento.semCategoria")}</span></p>
          <p>{t("componentes.documento.tamanho")}: <span className="text-slate-600">{formatarTamanho(doc.tamanho)}</span></p>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400">{doc.dataSubmissao ? new Date(doc.dataSubmissao).toLocaleDateString(i18n.language === "en" ? "en-GB" : "pt-PT") : t("componentes.documento.semData")}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <a href={obterUrlTransferencia(doc.caminho, API_URL)} download={doc.nomeArquivo} className="p-2 md:p-1.5 bg-blue-50 hover:bg-blue-100 text-netline-azul rounded-lg transition-colors border border-blue-100" title={t("componentes.documento.transferir")}>
            <IconDownload />
          </a>
          {acoes}
        </div>
      </div>
    </div>
  );
}