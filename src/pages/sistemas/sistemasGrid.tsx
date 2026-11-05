import { useTranslation } from "react-i18next";
import type { Sistema, Documento } from "../../hooks/useSistemasData";
import SistemaCard from "./sistemaCard";
import { EstadoVazio } from "../../components/estados";
import { usePaginacao } from "../../hooks/usePaginacao";
import Paginacao from "../../components/paginacao";

interface SistemasGridProps {
  sistemas: Sistema[];
  documentos: Documento[];
  onSelecionar: (sistema: Sistema) => void;
}

export default function SistemasGrid({ sistemas, documentos, onSelecionar }: SistemasGridProps) {
  const { t } = useTranslation();
  // Mostra 10 de cada vez
  const paginacao = usePaginacao(sistemas);

  if (sistemas.length === 0) {
    return <EstadoVazio mensagem={t("sistemas.lista.vazio")} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginacao.itens.map((sis) => (
        <SistemaCard key={sis.id} sistema={sis} documentos={documentos} onVerDetalhes={() => onSelecionar(sis)} />
      ))}
      <Paginacao {...paginacao} />
    </div>
  );
}