import { Link } from "react-router-dom";
import type { SistemaInfraestrutura } from "../../../hooks/useSistemasData";
import { IconServer } from "../../../components/icons";
import { caminhoDetalheServidor } from "../../../utils/servidor";
import CartaoInfra, { BotaoAcaoInfra, LinhaInfra } from "./cartaoInfra";
import { useTranslation } from "react-i18next";

interface CartaoBackendProps {
  subtitulo: string;
  infraestrutura: SistemaInfraestrutura | null;
  podeGerir: boolean;
  onEditar: () => void;
}

const CLASSE_LINK = "text-blue-900 hover:underline";

export default function CartaoBackend({ subtitulo, infraestrutura, podeGerir, onEditar }: CartaoBackendProps) {
  const { t } = useTranslation();
  // Registos antigos: o backend estava "na" plataforma de um registo de imagens, que não executa nada
  const plataformaInvalida = Boolean(infraestrutura?.plataforma && infraestrutura.plataforma.tipo !== "CLOUD_BASE_DADOS");

  return (
    <CartaoInfra
      titulo={t("sistemas.infraestrutura.backend.titulo")}
      subtitulo={subtitulo}
      Icone={IconServer}
      acao={
        podeGerir && (
          <BotaoAcaoInfra onClick={onEditar}>{infraestrutura ? t("sistemas.infraestrutura.backend.editar") : t("sistemas.infraestrutura.backend.registar")}</BotaoAcaoInfra>
        )
      }
    >
      {!infraestrutura ? (
        <p className="text-xs text-slate-400 italic">{t("sistemas.infraestrutura.backend.semInfra")}</p>
      ) : (
        <>
        {plataformaInvalida && (
          <p className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            {t("sistemas.infraestrutura.backend.plataformaInvalida", { nome: infraestrutura.plataforma?.nome })}
            {podeGerir ? t("sistemas.infraestrutura.backend.plataformaInvalidaAdmin") : ""}
          </p>
        )}
        <dl className="divide-y divide-slate-100">
          <LinhaInfra rotulo={t("sistemas.infraestrutura.backend.correEm")}>
            {infraestrutura.plataforma ? (
              <Link to={`/dashboard/plataformas?plataforma=${infraestrutura.plataforma.id}`} className={CLASSE_LINK}>
                {infraestrutura.plataforma.nome}
              </Link>
            ) : (
              "—"
            )}
          </LinhaInfra>
          <LinhaInfra rotulo={t("sistemas.infraestrutura.backend.servidor")}>
            {infraestrutura.servidor ? (
              <Link to={caminhoDetalheServidor(infraestrutura.servidor.id)} className={CLASSE_LINK}>
                {infraestrutura.servidor.nome}
              </Link>
            ) : (
              "—"
            )}
          </LinhaInfra>
          {infraestrutura.servidor?.hostname && (
            <LinhaInfra rotulo={t("sistemas.infraestrutura.backend.hostname")}>
              <span className="font-mono text-xs">{infraestrutura.servidor.hostname}</span>
            </LinhaInfra>
          )}
          <LinhaInfra rotulo={t("sistemas.infraestrutura.backend.imagem")}>
            {infraestrutura.imagem ? (
              <>
                <span className="font-mono text-xs">
                  {infraestrutura.imagem.nome}:{infraestrutura.imagem.tag}
                </span>
                {infraestrutura.imagem.plataforma && (
                  <span className="block text-[11px] font-normal text-slate-400">
                    {t("sistemas.infraestrutura.backend.doRegisto")}{" "}
                    <Link
                      to={`/dashboard/plataformas?plataforma=${infraestrutura.imagem.plataforma.id}`}
                      className={CLASSE_LINK}
                    >
                      {infraestrutura.imagem.plataforma.nome}
                    </Link>
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </LinhaInfra>
          <LinhaInfra rotulo={t("sistemas.infraestrutura.backend.endereco")}>
            {infraestrutura.url ? <span className="font-mono text-xs">{infraestrutura.url}</span> : "—"}
          </LinhaInfra>
        </dl>
        </>
      )}
    </CartaoInfra>
  );
}
