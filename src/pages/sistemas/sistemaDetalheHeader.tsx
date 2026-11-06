import { IconVoltar, IconCaneta, IconLixeira } from "../../components/icons";
import BotaoIconeCabecalho from "../../components/plataformas/botaoIconeCabecalho";
import type { Sistema } from "../../hooks/useSistemasData";
import { useTranslation } from "react-i18next";

interface SistemaDetalheHeaderProps {
  sistema: Sistema;
  onVoltar: () => void;
  onEditar: () => void;
  onApagar: () => void;
  // Editar: quem trabalha com sistemas. Eliminar: só quem criou o sistema
  podeEditar: boolean;
  podeEliminar: boolean;
}

export default function SistemaDetalheHeader({
  sistema,
  onVoltar,
  onEditar,
  onApagar,
  podeEditar,
  podeEliminar,
}: SistemaDetalheHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-md flex flex-col gap-3">
      {/* Botão Voltar + Categoria + Editar/Apagar no Topo */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onVoltar}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-xs cursor-pointer shrink-0"
          >
            <IconVoltar />
            <span>{t("sistemas.comum.voltar")}</span>
          </button>

          <span className="text-[11px] font-bold tracking-wider text-blue-200/70 uppercase">
            {t("sistemas.detalhe.sobretitulo")}
          </span>
        </div>

        {(podeEditar || podeEliminar) && (
          <div className="flex items-center gap-2 shrink-0">
            {podeEditar && (
              <BotaoIconeCabecalho rotulo={t("sistemas.detalhe.editar")} Icone={IconCaneta} onClick={onEditar} />
            )}
            {podeEliminar && (
              <BotaoIconeCabecalho rotulo={t("sistemas.detalhe.apagar")} Icone={IconLixeira} perigoso onClick={onApagar} />
            )}
          </div>
        )}
      </div>

      {/* Nome do Sistema */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 break-words">
        {sistema.nome}
      </h2>
      {sistema.criadoPor && (
        <p className="text-xs text-blue-100/80">{t("sistemas.detalhe.criadoPor", { nome: sistema.criadoPor.nome })}</p>
      )}
    </div>
  );
}