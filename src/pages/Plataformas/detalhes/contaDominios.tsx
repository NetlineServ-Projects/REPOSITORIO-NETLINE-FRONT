import { useTranslation } from "react-i18next";
import { Secao, Campo } from "../../../components/secaoDetalhe";
import SegredoRevelavel from "../../../components/segredoRevelavel";
import { revelarTokenPlataforma } from "../../../hooks/usePlataformasData";
import { IconVoltar } from "../../../components/icons";
import AbaDominios from "../abas/abaDominios";
import type { AoEditarItem, AoEliminarItem } from "../../../types/plataformaTipos";
import type { AcessoPlataforma, Dominio, Plataforma, Servidor, Subdominio } from "../../../types/plataforma";

interface ContaDominiosProps {
  plataforma: Plataforma;
  // null = domínios desta plataforma que ainda não têm conta
  conta: AcessoPlataforma | null;
  dominios: Dominio[];
  subdominios: Subdominio[];
  servidores: Servidor[];
  podeGerir: boolean;
  aoVoltar: () => void;
  aoEditar: AoEditarItem;
  aoEliminar: AoEliminarItem;
}

// Mini página de uma conta de uma plataforma de domínios: só os domínios (e os seus
// registos DNS) dessa conta, para não se misturarem domínios de instituições diferentes
export default function ContaDominios({
  plataforma,
  conta,
  dominios,
  subdominios,
  servidores,
  podeGerir,
  aoVoltar,
  aoEditar,
  aoEliminar,
}: ContaDominiosProps) {
  const { t } = useTranslation();
  const nome = conta
    ? conta.descricao || conta.utilizador || t("plataformas.detalhe.contaSemDescricao")
    : t("plataformas.detalhe.semConta");

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho: plataforma › conta */}
      <div className="bg-netline-azul text-white rounded-2xl shadow-sm p-5 sm:p-8 space-y-4">
        <button
          onClick={aoVoltar}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100/80 hover:text-white transition-colors cursor-pointer"
        >
          <IconVoltar className="w-3 h-3" />
          {t("plataformas.detalhe.voltarA", { nome: plataforma.nome })}
        </button>
        <div className="min-w-0">
          <span className="text-xs uppercase font-semibold text-blue-200/80 tracking-widest block mb-1">
            {t("plataformas.detalhe.contaEm", { nome: plataforma.nome })}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold break-words">{nome}</h2>
        </div>
      </div>

      {/* Credenciais da conta */}
      {conta && (
        <Secao titulo={t("plataformas.detalhe.credenciais")}>
          <dl className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Campo rotulo={t("plataformas.detalhe.utilizador")}>
              {conta.utilizador ? (
                <span className="font-mono break-all">{conta.utilizador}</span>
              ) : (
                <span className="text-slate-400 font-normal">{t("plataformas.detalhe.naoDefinido")}</span>
              )}
            </Campo>
            <Campo rotulo={t("plataformas.detalhe.token")}>
              {conta.temToken ? (
                <SegredoRevelavel
                  descricao={t("plataformas.detalhe.tokenDescricao", { conta: nome, nome: plataforma.nome })}
                  obter={(tokenElevado) => revelarTokenPlataforma(plataforma.id, conta.id, tokenElevado)}
                />
              ) : (
                <span className="text-slate-400 font-normal">{t("plataformas.detalhe.naoDefinido")}</span>
              )}
            </Campo>
          </dl>
        </Secao>
      )}

      {/* Domínios e subdomínios só desta conta */}
      <Secao titulo={t("plataformas.detalhe.dominiosDnsTotal", { total: dominios.length })}>
        <AbaDominios
          dominios={dominios}
          subdominios={subdominios}
          servidores={servidores}
          podeGerir={podeGerir}
          aoEditar={aoEditar}
          aoEliminar={aoEliminar}
          mostrarPlataforma={false}
          mostrarConta={false}
        />
      </Secao>
    </div>
  );
}
