import type { SubdominioDoSistema, TipoAmbiente } from "../../../hooks/useSistemasData";
import { IconDominio } from "../../../components/icons";
import CartaoInfra, { LinhaInfra } from "./cartaoInfra";
import { rotuloAmbiente } from "./constantes";
import { useTranslation } from "react-i18next";

interface CartaoSubdominioProps {
  ambiente: TipoAmbiente;
  subdominio?: SubdominioDoSistema;
  podeGerir: boolean;
}

// O subdomínio é do sistema (regista-se no formulário do sistema): aqui só se mostra
export default function CartaoSubdominio({ ambiente, subdominio, podeGerir }: CartaoSubdominioProps) {
  const { t } = useTranslation();
  return (
    <CartaoInfra
      titulo={t("sistemas.infraestrutura.subdominio.titulo")}
      subtitulo={t("sistemas.infraestrutura.subdominio.subtitulo", { ambiente: rotuloAmbiente(ambiente) })}
      Icone={IconDominio}
      classeIcone="bg-emerald-50 text-emerald-700"
    >
      {subdominio ? (
        <div className="space-y-4">
          <a
            href={`https://${subdominio.nomeCompleto}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-mono text-sm font-semibold text-blue-900 hover:underline break-all"
          >
            {subdominio.nomeCompleto}
          </a>
          <dl className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
            <LinhaInfra rotulo={t("sistemas.infraestrutura.subdominio.dominio")}>{subdominio.dominio.nome}</LinhaInfra>
            <LinhaInfra rotulo={t("sistemas.infraestrutura.subdominio.registo")}>{subdominio.tipoDns}</LinhaInfra>
            {subdominio.destino && (
              <LinhaInfra rotulo={t("sistemas.infraestrutura.subdominio.destino")}>
                <span className="font-mono text-xs">{subdominio.destino}</span>
              </LinhaInfra>
            )}
          </dl>
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          {t("sistemas.infraestrutura.subdominio.semSubdominio")}
          {podeGerir ? t("sistemas.infraestrutura.subdominio.definirAoEditar") : ""}
        </p>
      )}
    </CartaoInfra>
  );
}
