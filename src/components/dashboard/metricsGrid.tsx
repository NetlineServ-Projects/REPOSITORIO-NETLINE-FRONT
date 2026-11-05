import { useTranslation } from "react-i18next";
import MetricCard from "./metricCard";
import {
  IconDocumento,
  IconRelogio,
  IconAprovado,
  IconSistemas,
  IconPasta,
  IconPlataforma,
} from "../icons";

interface metricsGridProps {
  totalDocumentos: number | null;
  pendentesAprovacao?: number | null;
  totalAprovados: number | null;
  totalSistemas: number | null;
  totalPlataformas?: number | null;
  totalCategorias: number | null;
  mostrarPendentes?: boolean;
  mostrarPlataformas?: boolean;
}

// Classes completas (o Tailwind só gera as que aparecem escritas no código)
const COLUNAS_XL: Record<number, string> = {
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

export default function MetricsGrid({
  totalDocumentos,
  pendentesAprovacao,
  totalAprovados,
  totalSistemas,
  totalPlataformas = 0,
  totalCategorias,
  mostrarPendentes = false,
  mostrarPlataformas = false,
}: metricsGridProps) {
  const { t } = useTranslation();
  const colunas = 4 + Number(mostrarPendentes) + Number(mostrarPlataformas);
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-3 ${COLUNAS_XL[colunas]} gap-3 sm:gap-6`}>
      <MetricCard
        titulo={t("dashboard.metricas.totalDocumentos")}
        valor={totalDocumentos}
        icone={<IconDocumento className="w-6 h-6" />}
        corBorda="border-t-blue-500"
        corIcone="text-blue-600"
      />
      {mostrarPendentes && (
        <MetricCard
          titulo={t("dashboard.metricas.pendentesAprovacao")}
          valor={pendentesAprovacao ?? 0}
          icone={<IconRelogio className="w-6 h-6" />}
          corBorda="border-t-amber-500"
          corIcone="text-amber-600"
        />
      )}
      <MetricCard
        titulo={t("dashboard.metricas.aprovados")}
        valor={totalAprovados}
        icone={<IconAprovado className="w-6 h-6" />}
        corBorda="border-t-emerald-500"
        corIcone="text-emerald-600"
      />
      <MetricCard
        titulo={t("dashboard.metricas.totalSistemas")}
        valor={totalSistemas}
        icone={<IconSistemas className="w-6 h-6" />}
        corBorda="border-t-indigo-600"
        corIcone="text-blue-900"
      />
      {mostrarPlataformas && (
        <MetricCard
          titulo={t("dashboard.metricas.plataformas")}
          valor={totalPlataformas}
          icone={<IconPlataforma className="w-6 h-6" />}
          corBorda="border-t-purple-600"
          corIcone="text-purple-700"
        />
      )}
      <MetricCard
        titulo={t("dashboard.metricas.categorias")}
        valor={totalCategorias}
        icone={<IconPasta className="w-6 h-6" />}
        corBorda="border-t-cyan-700"
        corIcone="text-cyan-800"
      />
    </div>
  );
}