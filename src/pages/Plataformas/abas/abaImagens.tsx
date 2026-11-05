import { useTranslation } from "react-i18next";
import AcoesItem from "../../../components/plataformas/acoesItem";
import EstadoVazio from "../../../components/plataformas/estadoVazio";
import type { AoEditarItem, AoEliminarItem } from "../../../types/plataformaTipos";
import type { ImagemContainer } from "../../../types/plataforma";
import {
  ROTULOS_VISIBILIDADE_IMAGEM,
  ROTULOS_ORIGEM_IMAGEM,
  localeDatas,
} from "../../../types/plataformaConstantes";
import { usePaginacao } from "../../../hooks/usePaginacao";
import Paginacao from "../../../components/paginacao";

interface AbaImagensProps {
  imagens: ImagemContainer[];
  podeGerir: boolean;
  aoEditar: AoEditarItem;
  aoEliminar: AoEliminarItem;
}

function formatarData(data: string | null): string {
  return data ? new Date(data).toLocaleDateString(localeDatas()) : "-";
}

function SeloVisibilidade({ imagem }: { imagem: ImagemContainer }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
        imagem.visibilidade === "PRIVADA"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {ROTULOS_VISIBILIDADE_IMAGEM[imagem.visibilidade]}
    </span>
  );
}

function SeloEstado({ imagem }: { imagem: ImagemContainer }) {
  const { t } = useTranslation();
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        imagem.ativo
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-slate-100 text-slate-500 border-slate-200"
      }`}
    >
      {imagem.ativo ? t("plataformas.comum.ativa") : t("plataformas.comum.inativa")}
    </span>
  );
}

export default function AbaImagens({
  imagens,
  podeGerir,
  aoEditar,
  aoEliminar,
}: AbaImagensProps) {
  const { t } = useTranslation();
  // Mostra 10 de cada vez
  const paginacao = usePaginacao(imagens);

  if (imagens.length === 0) {
    return <EstadoVazio mensagem={t("plataformas.abas.imagens.vazio")} />;
  }

  // As mesmas ações na tabela e nos cartões do telemóvel
  const acoes = (imagem: ImagemContainer) =>
    podeGerir && (
      <AcoesItem
        tituloEditar={t("plataformas.abas.imagens.editar")}
        tituloEliminar={t("plataformas.abas.imagens.eliminar")}
        onEditar={() => aoEditar("imagem", imagem)}
        onEliminar={() =>
          aoEliminar("imagem", imagem.id, `${imagem.nome}:${imagem.tag}`)
        }
      />
    );

  return (
    // A troca cartões/tabela depende da largura disponível (container query), não do ecrã
    <div className="@container bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Espaço estreito: um cartão por imagem (a tabela não cabe) */}
      <ul className="@2xl:hidden divide-y divide-slate-100">
        {paginacao.itens.map((imagem) => (
          <li key={imagem.id} className="p-4 flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div>
                <p className="font-bold text-slate-800 text-sm break-all">{imagem.nome}</p>
                <p className="text-slate-400 font-mono text-[11px] break-all">:{imagem.tag}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <SeloVisibilidade imagem={imagem} />
                <SeloEstado imagem={imagem} />
              </div>
              <p className="text-[11px] text-slate-500">
                {ROTULOS_ORIGEM_IMAGEM[imagem.origem]}
                {imagem.portaExposta != null && <> · {t("plataformas.abas.imagens.porta")} <span className="font-mono">{imagem.portaExposta}</span></>}
                {" · "}{t("plataformas.abas.imagens.ultimoPush", { data: formatarData(imagem.ultimoPushEm) })}
              </p>
            </div>
            {podeGerir && <div className="shrink-0 -mr-1">{acoes(imagem)}</div>}
          </li>
        ))}
      </ul>

      <div className="hidden @2xl:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3.5">{t("plataformas.abas.imagens.colunas.imagem")}</th>
              <th className="px-5 py-3.5">{t("plataformas.abas.imagens.colunas.origem")}</th>
              <th className="px-5 py-3.5">{t("plataformas.abas.imagens.colunas.visibilidade")}</th>
              <th className="px-5 py-3.5">{t("plataformas.abas.imagens.colunas.porta")}</th>
              <th className="px-5 py-3.5">{t("plataformas.abas.imagens.colunas.ultimoPush")}</th>
              <th className="px-5 py-3.5">{t("plataformas.abas.imagens.colunas.estado")}</th>
              {podeGerir && <th className="px-5 py-3.5 text-right">{t("plataformas.abas.imagens.colunas.acoes")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginacao.itens.map((imagem) => (
              <tr
                key={imagem.id}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800 text-sm">{imagem.nome}</p>
                  <p className="text-slate-400 font-mono text-[11px]">
                    :{imagem.tag}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  {ROTULOS_ORIGEM_IMAGEM[imagem.origem]}
                </td>
                <td className="px-5 py-3.5">
                  <SeloVisibilidade imagem={imagem} />
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-600">
                  {imagem.portaExposta ?? "-"}
                </td>
                <td className="px-5 py-3.5">{formatarData(imagem.ultimoPushEm)}</td>
                <td className="px-5 py-3.5">
                  <SeloEstado imagem={imagem} />
                </td>
                {podeGerir && (
                  <td className="px-5 py-3.5 text-right">{acoes(imagem)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 pb-4">
        <Paginacao {...paginacao} />
      </div>
    </div>
  );
}
