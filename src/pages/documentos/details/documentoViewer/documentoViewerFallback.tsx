import { useTranslation } from "react-i18next";

interface DocumentoViewerFallbackProps {
  extensao: string;
  url: string;
  nomeArquivo: string;
}

export default function DocumentoViewerFallback({ extensao, url, nomeArquivo }: DocumentoViewerFallbackProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-12">
      <span className="p-3 bg-blue-50 text-netline-azul rounded-lg text-sm font-extrabold uppercase border border-blue-100/50">
        {extensao}
      </span>
      <p className="text-slate-500 text-sm">
        {t("documentos.visualizador.indisponivel")}
      </p>
      <a
        href={`${url}${url.includes("?") ? "&" : "?"}transferir=1`}
        download={nomeArquivo}
        className="text-sm text-netline-azul font-semibold hover:underline"
      >
        {t("documentos.visualizador.transferirParaVer")}
      </a>
    </div>
  );
}