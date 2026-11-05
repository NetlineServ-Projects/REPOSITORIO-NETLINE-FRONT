import { useTranslation } from "react-i18next";

interface SistemasHeaderProps {
  total: number;
  // Sem permissão para criar sistemas, o botão não aparece
  onNovoSistema?: () => void;
}

export default function SistemasHeader({ total, onNovoSistema }: SistemasHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-blue-900 p-5 sm:p-6 rounded-xl text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
          {t("sistemas.lista.sobretitulo")}
        </span>
        <h2 className="text-2xl font-bold text-white">
          {t("sistemas.lista.titulo")}
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          {t("sistemas.lista.subtitulo")}
        </p>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="text-xs font-medium text-slate-200 bg-white/10 px-3 py-2.5 rounded-lg backdrop-blur-sm whitespace-nowrap">
          {t("sistemas.lista.total")} <span className="font-bold text-white">{total}</span>
        </div>

        {onNovoSistema && (
          <button
            onClick={onNovoSistema}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>{t("sistemas.lista.novoSistema")}</span>
          </button>
          )}
      </div>
    </div>
  );
}
