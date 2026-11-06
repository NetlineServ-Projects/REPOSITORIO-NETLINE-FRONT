import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import AcoesItem from "../../../components/plataformas/acoesItem";
import EstadoVazio from "../../../components/plataformas/estadoVazio";
import type { AoEditarItem, AoEliminarItem } from "../../../types/plataformaTipos";
import type {
  Servidor,
  Dominio,
  Subdominio,
} from "../../../types/plataforma";
import { localeDatas } from "../../../types/plataformaConstantes";
import { ROTULO_AMBIENTE } from "../../../utils/servidor";
import { usePaginacao } from "../../../hooks/usePaginacao";
import Paginacao from "../../../components/paginacao";
import { IconPlataforma, IconEmpresa } from "../../../components/icons";

interface AbaDominiosProps {
  dominios: Dominio[];
  subdominios: Subdominio[];
  servidores: Servidor[];
  podeGerir: boolean;
  aoEditar: AoEditarItem;
  aoEliminar: AoEliminarItem;
  // Etiqueta com a plataforma de cada domínio; desligada nos detalhes de uma plataforma (seria sempre a mesma)
  mostrarPlataforma?: boolean;
  // Etiqueta com a conta (instituição); desligada na página de uma conta (seria sempre a mesma)
  mostrarConta?: boolean;
}

// A partir de quantos dias o domínio passa a "a expirar" (igual ao aviso das notificações)
const DIAS_AVISO_EXPIRACAO = 30;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function seloExpiracao(dataExpiracao: string, t: TFunction) {
  const dias = Math.ceil((new Date(dataExpiracao).getTime() - Date.now()) / MS_POR_DIA);
  const data = new Date(dataExpiracao).toLocaleDateString(localeDatas());

  if (dias < 0) {
    return { texto: t("plataformas.abas.dominios.expirou", { data }), classe: "bg-red-50 text-red-700 border-red-200" };
  }
  if (dias <= DIAS_AVISO_EXPIRACAO) {
    const prazo = dias === 0 ? t("plataformas.abas.dominios.hoje") : t("plataformas.abas.dominios.dias", { count: dias });
    return {
      texto: t("plataformas.abas.dominios.expiraComPrazo", { data, prazo }),
      classe: "bg-amber-50 text-amber-800 border-amber-200",
    };
  }
  return { texto: t("plataformas.abas.dominios.expira", { data }), classe: "bg-emerald-50 text-emerald-700 border-emerald-100/60" };
}

// Conteúdo das células de um registo DNS, igual na tabela e na lista do telemóvel
function celulasRegisto(subdominio: Subdominio, dominio: Dominio, servidores: Servidor[]) {
  const nomeCompleto =
    subdominio.nomeCompleto ??
    (subdominio.nome === "@" ? dominio.nome : `${subdominio.nome}.${dominio.nome}`);
  const servidorDestino = servidores.find((s) => s.id === subdominio.servidorId);

  const destino = servidorDestino ? (
    <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
      {servidorDestino.nome} ({servidorDestino.ip || servidorDestino.hostname})
    </span>
  ) : (
    subdominio.destino || "-"
  );

  const sistema = (
    <>
      {subdominio.sistema ? (
        <Link
          to={`/dashboard/sistemas/${subdominio.sistema.id}`}
          className="font-semibold text-blue-900 hover:underline"
        >
          {subdominio.sistema.nome}
        </Link>
      ) : (
        <span className="text-slate-400">-</span>
      )}
      <span className="ml-1.5 text-[10px] font-semibold text-slate-500 uppercase">
        {ROTULO_AMBIENTE[subdominio.ambiente]}
      </span>
    </>
  );

  return { nomeCompleto, destino, sistema };
}

export default function AbaDominios({
  dominios,
  subdominios,
  servidores,
  podeGerir,
  aoEditar,
  aoEliminar,
  mostrarPlataforma = true,
  mostrarConta = true,
}: AbaDominiosProps) {
  const { t } = useTranslation();
  // Mostra 10 de cada vez
  const paginacao = usePaginacao(dominios);

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-500">
        {t("plataformas.abas.dominios.descricao")}
      </p>

      {dominios.length === 0 ? (
        <EstadoVazio mensagem={t("plataformas.abas.dominios.vazio")} />
      ) : (
        <div className="space-y-6">
          {paginacao.itens.map((dominio) => {
            const subdominiosDoDominio = subdominios.filter(
              (s) => s.dominioId === dominio.id
            );
            const selo = dominio.dataExpiracao ? seloExpiracao(dominio.dataExpiracao, t) : null;

            return (
              <div
                key={dominio.id}
                className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Cabeçalho do Domínio com Destaque Visual */}
                <div className="px-4 sm:px-6 py-4 bg-linear-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-100 flex justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {t("plataformas.abas.dominios.dominioPrincipal")}
                      </span>
                      <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight break-all">
                          {dominio.nome}
                        </h3>
                        {selo && (
                          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${selo.classe}`}>
                            {selo.texto}
                          </span>
                        )}
                        {/* Plataforma de gestão de domínio onde o domínio está registado, com ligação para ela */}
                        {mostrarPlataforma && dominio.plataforma && (
                          <Link
                            to={`/dashboard/plataformas?plataforma=${dominio.plataforma.id}`}
                            title={t("plataformas.abas.dominios.verPlataforma", { nome: dominio.plataforma.nome })}
                            className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-900 hover:bg-blue-100 transition-colors"
                          >
                            <IconPlataforma className="w-3 h-3 shrink-0" />
                            <span className="truncate">{dominio.plataforma.nome}</span>
                          </Link>
                        )}
                        {/* Conta / instituição da plataforma onde o domínio está registado */}
                        {mostrarConta && dominio.acesso && (
                          <span
                            title={t("plataformas.abas.dominios.contaTitulo")}
                            className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                          >
                            <IconEmpresa className="w-3 h-3 shrink-0 text-slate-500" />
                            <span className="truncate">
                              {dominio.acesso.descricao || dominio.acesso.utilizador}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {podeGerir && (
                    <AcoesItem
                      tituloEditar={t("plataformas.abas.dominios.editar")}
                      tituloEliminar={t("plataformas.abas.dominios.eliminar")}
                      onEditar={() => aoEditar("dominio", dominio)}
                      onEliminar={() =>
                        aoEliminar("dominio", dominio.id, dominio.nome)
                      }
                    />
                  )}
                </div>

                {/* Registos DNS (só leitura) */}
                <div className="@container p-4 sm:p-6">
                  {subdominiosDoDominio.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 italic">
                        {t("plataformas.abas.dominios.semRegistos")}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Espaço estreito (container query): um bloco por registo, as 4 colunas não cabem */}
                      <ul className="@2xl:hidden divide-y divide-slate-100">
                        {subdominiosDoDominio.map((subdominio) => {
                          const { nomeCompleto, destino, sistema } = celulasRegisto(subdominio, dominio, servidores);
                          return (
                            <li key={subdominio.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-slate-800 break-all">{nomeCompleto}</p>
                                <span className="shrink-0 px-2 py-1 bg-blue-50 text-blue-800 font-mono font-bold rounded-md text-[10px] border border-blue-100">
                                  {subdominio.tipoDns}
                                </span>
                              </div>
                              <div className="font-mono text-slate-600 break-all">{destino}</div>
                              <div>{sistema}</div>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="hidden @2xl:block overflow-x-auto">
                        <div className="min-w-160 space-y-3">
                          <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
                            <div className="col-span-4">{t("plataformas.abas.dominios.colunas.registo")}</div>
                            <div className="col-span-1">{t("plataformas.abas.dominios.colunas.tipo")}</div>
                            <div className="col-span-4">{t("plataformas.abas.dominios.colunas.destino")}</div>
                            <div className="col-span-3">{t("plataformas.abas.dominios.colunas.sistema")}</div>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {subdominiosDoDominio.map((subdominio) => {
                              const { nomeCompleto, destino, sistema } = celulasRegisto(subdominio, dominio, servidores);

                              return (
                                <div
                                  key={subdominio.id}
                                  className="grid grid-cols-12 items-center py-3 px-3 rounded-xl hover:bg-slate-50/80 transition-colors text-xs"
                                >
                                  <div className="col-span-4 font-bold text-slate-800 truncate pr-2">
                                    {nomeCompleto}
                                  </div>

                                  <div className="col-span-1">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-800 font-mono font-bold rounded-md text-[10px] border border-blue-100">
                                      {subdominio.tipoDns}
                                    </span>
                                  </div>

                                  <div className="col-span-4 font-mono text-slate-600 truncate pr-2">
                                    {destino}
                                  </div>

                                  <div className="col-span-3 truncate">{sistema}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Paginacao {...paginacao} />
    </div>
  );
}
