import type { ComponentType, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import EstadoVazio from "../../../components/plataformas/estadoVazio";
import LogotipoPlataforma from "../../../components/plataformas/logotipoPlataforma";
import {
  IconDominio,
  IconImagem,
  IconServer,
  IconSetaDireita,
  IconSistemas,
} from "../../../components/icons";
import { ROTULOS_TIPO_PLATAFORMA } from "../../../types/plataformaConstantes";
import type {
  Plataforma,
  Servidor,
  Dominio,
  ImagemContainer,
  TipoPlataforma,
} from "../../../types/plataforma";
import { usePaginacao } from "../../../hooks/usePaginacao";
import Paginacao from "../../../components/paginacao";

/* -------------------------------------------------------------------------- */
/*  O número que cada tipo mostra no cartão (um só, para o cartão ficar leve)  */
/*  Tipado com Record<TipoPlataforma, ...>: se um dia adicionar um tipo novo, */
/*  o TypeScript obriga a configurá-lo aqui.                                  */
/* -------------------------------------------------------------------------- */

type Metrica = "servidores" | "dominios" | "imagens" | "sistemas";

const METRICA_POR_TIPO: Record<TipoPlataforma, Metrica> = {
  CLOUD_BASE_DADOS: "servidores",
  CONTAINERIZACAO: "imagens",
  GESTAO_DOMINIO: "dominios",
};

// O rótulo de cada métrica está em plataformas.abas.plataformas.metricas.<metrica>
const ICONE_METRICA: Record<Metrica, ComponentType<{ className?: string }>> = {
  servidores: IconServer,
  dominios: IconDominio,
  imagens: IconImagem,
  sistemas: IconSistemas,
};

// Uma cloud sem servidores (ex: Vercel) é ela própria o alojamento: mostra os sistemas
function metricaDe(plataforma: Plataforma, totais: Record<Metrica, number>): Metrica {
  const metrica = METRICA_POR_TIPO[plataforma.tipo];
  return metrica === "servidores" && totais.servidores === 0 ? "sistemas" : metrica;
}

/* -------------------------------------------------------------------------- */
/*  Cartão                                                                    */
/* -------------------------------------------------------------------------- */

interface CartaoPlataformaProps {
  plataforma: Plataforma;
  metrica: Metrica;
  total: number;
  aoAbrirDetalhes: (plataforma: Plataforma) => void;
}

function CartaoPlataforma({ plataforma, metrica, total, aoAbrirDetalhes }: CartaoPlataformaProps) {
  const { t } = useTranslation();
  const Icone = ICONE_METRICA[metrica];
  const rotulo = t(`plataformas.abas.plataformas.metricas.${metrica}`);
  const abrirDetalhes = () => aoAbrirDetalhes(plataforma);

  const aoPressionarTecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrirDetalhes();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={abrirDetalhes}
      onKeyDown={aoPressionarTecla}
      aria-label={t("plataformas.abas.plataformas.ariaVerDetalhes", { nome: plataforma.nome })}
      className="group bg-white rounded-2xl border border-slate-100 border-l-4 border-l-blue-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/40"
    >
      <div className={`flex items-start gap-3 ${plataforma.ativo ? "" : "opacity-60"}`}>
        <LogotipoPlataforma nome={plataforma.nome} logotipo={plataforma.logotipo} />
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-bold text-slate-800 leading-snug line-clamp-2"
            title={plataforma.nome}
          >
            {plataforma.nome}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-100/60">
              {ROTULOS_TIPO_PLATAFORMA[plataforma.tipo]}
            </span>
            {!plataforma.ativo && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                {t("plataformas.comum.inativa")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <Icone className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-base font-extrabold text-slate-800">{total}</span>
          {rotulo}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-blue-900">
          {t("plataformas.abas.plataformas.verDetalhes")}
          <IconSetaDireita className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Aba                                                                       */
/* -------------------------------------------------------------------------- */

interface AbaPlataformasProps {
  plataformas: Plataforma[];
  servidores: Servidor[];
  dominios: Dominio[];
  imagens: ImagemContainer[];
  aoAbrirDetalhes: (plataforma: Plataforma) => void;
}

export default function AbaPlataformas({
  plataformas,
  servidores,
  dominios,
  imagens,
  aoAbrirDetalhes,
}: AbaPlataformasProps) {
  const { t } = useTranslation();
  if (plataformas.length === 0) {
    return <EstadoVazio mensagem={t("plataformas.abas.plataformas.vazio")} />;
  }

  // Mostra 10 de cada vez
  const paginacao = usePaginacao(plataformas);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-4 sm:gap-5">
      {paginacao.itens.map((plataforma) => {
        const totais: Record<Metrica, number> = {
          servidores:
            plataforma.totais?.servidores ??
            servidores.filter((s) => s.plataformaId === plataforma.id).length,
          dominios:
            plataforma.totais?.dominios ??
            dominios.filter((d) => d.plataformaId === plataforma.id).length,
          imagens:
            plataforma.totais?.imagens ??
            imagens.filter((i) => i.plataformaId === plataforma.id).length,
          sistemas: plataforma.totais?.sistemas ?? 0,
        };
        const metrica = metricaDe(plataforma, totais);

        return (
          <CartaoPlataforma
            key={plataforma.id}
            plataforma={plataforma}
            metrica={metrica}
            total={totais[metrica]}
            aoAbrirDetalhes={aoAbrirDetalhes}
          />
        );
      })}
      <Paginacao {...paginacao} />
    </div>
  );
}
