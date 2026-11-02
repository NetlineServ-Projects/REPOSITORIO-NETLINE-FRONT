import type { ReactNode } from "react";
import EtiquetaSistema from "./etiquetaSistema";
import { useTranslation } from "react-i18next";
import { IconDownload } from "./icons";
import { formatarExtensao, obterNomeExibicao, obterUrlTransferencia } from "../utils/documentos";
import { API_URL } from "../utils/api";
import type { Documento } from "../types/documento";

interface DocumentoRowProps {
  doc: Documento;
  acoes?: ReactNode;
  mostrarCategoria?: boolean;
}

export default function DocumentoRow({ doc, acoes, mostrarCategoria = true }: DocumentoRowProps) {
  const { t, i18n } = useTranslation();
  const ext = formatarExtensao(doc.tipoArquivo, doc.nomeArquivo);
  const nomeExibicao = obterNomeExibicao(doc);

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 px-4 text-slate-800 flex items-center gap-3">
        <span className="p-2 bg-blue-50 text-netline-azul rounded-lg text-[11px] font-extrabold uppercase min-w-10 text-center shrink-0 border border-blue-100/50">{ext}</span>
        <div className="flex flex-col truncate max-w-xs md:max-w-sm">
          <span className="font-semibold text-slate-800 text-sm truncate" title={nomeExibicao}>{nomeExibicao}</span>
          {doc.descricao && <span className="text-xs text-slate-400 font-normal truncate" title={doc.descricao}>{doc.descricao}</span>}
          {doc.sistema && <span className="mt-1"><EtiquetaSistema sistema={doc.sistema} /></span>}
        </div>
      </td>
      {mostrarCategoria && <td className="py-3.5 px-4">{doc.categoria?.nome || t("componentes.documento.semCategoria")}</td>}
      <td className="py-3.5 px-4 font-medium text-slate-700">{doc.usuario?.nome || t("componentes.documento.sistema")}</td>
      <td className="py-3.5 px-4 text-xs">{doc.dataSubmissao ? new Date(doc.dataSubmissao).toLocaleDateString(i18n.language === "en" ? "en-GB" : "pt-PT") : t("componentes.documento.semData")}</td>
      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <a href={obterUrlTransferencia(doc.caminho, API_URL)} download={doc.nomeArquivo} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-netline-azul rounded-lg transition-colors border border-blue-100" title={t("componentes.documento.transferirFicheiro")}>
            <IconDownload />
          </a>
          {acoes}
        </div>
      </td>
    </tr>
  );
}