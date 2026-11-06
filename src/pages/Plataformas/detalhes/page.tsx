import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Secao, Campo } from "../../../components/secaoDetalhe";
import ContaDominios from "./contaDominios";
import CartaoIndicador, { type CartaoIndicadorProps } from "../../../components/plataformas/cartaoIndicador";
import BotaoIconeCabecalho from "../../../components/plataformas/botaoIconeCabecalho";
import AbaImagens from "../abas/abaImagens";
import CartaoContaAcesso from "../../../components/plataformas/cartaoContaAcesso";
import LogotipoPlataforma from "../../../components/plataformas/logotipoPlataforma";
import CartaoServidor from "../../../components/plataformas/cartaoServidor";
import CartaoSistemaHospedado from "../../../components/plataformas/cartaoSistemaHospedado";
import {
  IconLinkExterno,
  IconCaneta,
  IconLixeira,
  IconServer,
  IconImagem,
  IconDominio,
  IconRede,
  IconSistemas,
  IconEstado,
  IconSetaDireita,
} from "../../../components/icons";
import { ROTULOS_TIPO_PLATAFORMA, localeDatas } from "../../../types/plataformaConstantes";
import type {
  AoEditarItem,
  AoEliminarItem,
} from "../../../types/plataformaTipos";
import type {
  Plataforma,
  Servidor,
  Dominio,
  Subdominio,
  ImagemContainer,
} from "../../../types/plataforma";

interface DetalhesPlataformaProps {
  plataforma: Plataforma;
  servidores: Servidor[];
  dominios: Dominio[];
  subdominios: Subdominio[];
  imagens: ImagemContainer[];
  podeGerir: boolean;
  aoVoltar: () => void;
  aoEditar: AoEditarItem;
  aoEliminar: AoEliminarItem;
}

/* -------------------------------------------------------------------------- */
/*  Subcomponentes                                                            */
/* -------------------------------------------------------------------------- */


function formatarData(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString(localeDatas()) : "-";
}

/* -------------------------------------------------------------------------- */
/*  Página                                                                    */
/* -------------------------------------------------------------------------- */

export default function DetalhesPlataforma({
  plataforma,
  servidores,
  dominios,
  subdominios,
  imagens,
  podeGerir,
  aoVoltar,
  aoEditar,
  aoEliminar,
}: DetalhesPlataformaProps) {
  const { t } = useTranslation();
  const ehContainerizacao = plataforma.tipo === "CONTAINERIZACAO";
  const ehGestaoDominio = plataforma.tipo === "GESTAO_DOMINIO";

  const servidoresDaPlataforma = servidores.filter((s) => s.plataformaId === plataforma.id);
  const dominiosDaPlataforma = dominios.filter((d) => d.plataformaId === plataforma.id);
  const imagensDaPlataforma = imagens.filter((i) => i.plataformaId === plataforma.id);
  const idsDominios = new Set(dominiosDaPlataforma.map((d) => d.id));
  const totalRegistosDns = subdominios.filter((s) => idsDominios.has(s.dominioId)).length;

  // Servidores: só a Cloud os aloja, e só se mostram se existirem. Uma cloud sem servidores
  // (ex: Vercel) é ela própria o alojamento; o que interessa são os sistemas lá hospedados.
  const mostraServidores = plataforma.tipo === "CLOUD_BASE_DADOS" && servidoresDaPlataforma.length > 0;
  // Registos antigos: servidores criados em containerização antes da regra existir
  const servidoresForaDoLugar = ehContainerizacao ? servidoresDaPlataforma : [];
  const sistemasHospedados = plataforma.sistemasHospedados ?? [];
  const acessos = plataforma.acessos ?? [];

  // Gestão de domínio: os domínios veem-se por conta (instituição), numa mini página
  // aberta pelo URL (?conta=ID, ou ?conta=sem para os domínios ainda sem conta)
  const [searchParams, setSearchParams] = useSearchParams();
  const contaDoUrl = searchParams.get("conta");
  const idsContas = new Set(acessos.map((a) => a.id));
  const dominiosDaConta = (contaId: number) => dominiosDaPlataforma.filter((d) => d.acessoId === contaId);
  // Sem conta, ou com uma conta que já não existe nesta plataforma
  const dominiosSemConta = dominiosDaPlataforma.filter((d) => d.acessoId == null || !idsContas.has(d.acessoId));

  const abrirConta = (conta: number | "sem") =>
    setSearchParams({ plataforma: String(plataforma.id), conta: String(conta) });
  const fecharConta = () => setSearchParams({ plataforma: String(plataforma.id) }, { replace: true });

  // Ao entrar ou sair da página de uma conta, começa no topo
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [contaDoUrl]);

  if (ehGestaoDominio && contaDoUrl) {
    const conta = contaDoUrl === "sem" ? null : acessos.find((a) => String(a.id) === contaDoUrl);
    // Conta que não existe (ex: apagada entretanto): volta à plataforma
    if (conta !== undefined) {
      return (
        <ContaDominios
          plataforma={plataforma}
          conta={conta}
          dominios={conta ? dominiosDaConta(conta.id) : dominiosSemConta}
          subdominios={subdominios}
          servidores={servidores}
          podeGerir={podeGerir}
          aoVoltar={fecharConta}
          aoEditar={aoEditar}
          aoEliminar={aoEliminar}
        />
      );
    }
  }

  const indicadores: CartaoIndicadorProps[] = [
    ...(ehGestaoDominio
      ? [
          { valor: dominiosDaPlataforma.length, rotulo: t("plataformas.detalhe.indicadores.dominios"), Icone: IconDominio },
          { valor: totalRegistosDns, rotulo: t("plataformas.detalhe.indicadores.registosDns"), Icone: IconRede },
        ]
      : [
          ...(ehContainerizacao
            ? [{ valor: imagensDaPlataforma.length, rotulo: t("plataformas.detalhe.indicadores.imagens"), Icone: IconImagem }]
            : []),
          ...(mostraServidores
            ? [{ valor: servidoresDaPlataforma.length, rotulo: t("plataformas.detalhe.indicadores.servidores"), Icone: IconServer }]
            : []),
          { valor: plataforma.totais?.sistemas ?? sistemasHospedados.length, rotulo: t("plataformas.detalhe.indicadores.sistemas"), Icone: IconSistemas },
        ]),
    // O estado fica num cartão, junto dos números, e não no cabeçalho
    {
      valor: plataforma.ativo ? t("plataformas.detalhe.ativa") : t("plataformas.detalhe.desativada"),
      rotulo: t("plataformas.detalhe.indicadores.estado"),
      Icone: IconEstado,
      classeIcone: plataforma.ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
    },
  ];
  // Número ímpar de cartões: abaixo de lg o último ocupa a linha toda, para não ficar sozinho a meio
  const ultimoIndicadorInteiro =
    indicadores.length % 2 === 1 ? "[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1" : "";
  const colunasIndicadores: Record<number, string> = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "xl:grid-cols-4", // a 1024px (com o menu lateral) 4 cartões ficam apertados
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ================= CABEÇALHO ================= */}
      <div className="bg-netline-azul text-white rounded-2xl shadow-sm">
        <div className="p-5 sm:p-8 space-y-5">
          <button
            onClick={aoVoltar}
            className="text-xs font-semibold text-blue-100/80 hover:text-white transition-colors cursor-pointer"
          >
            {t("plataformas.detalhe.voltar")}
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex items-center gap-4 min-w-0 max-w-full">
              <LogotipoPlataforma nome={plataforma.nome} logotipo={plataforma.logotipo} tamanho="lg" />
              <div className="min-w-0">
                <span className="text-xs uppercase font-semibold text-blue-200/80 tracking-widest block mb-1">
                  {ROTULOS_TIPO_PLATAFORMA[plataforma.tipo]}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold break-words lg:truncate">{plataforma.nome}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {plataforma.urlPainel && (
                <BotaoIconeCabecalho rotulo={t("plataformas.detalhe.abrirPainel")} Icone={IconLinkExterno} href={plataforma.urlPainel} />
              )}
              {podeGerir && (
                <>
                  <BotaoIconeCabecalho
                    rotulo={t("plataformas.detalhe.editar")}
                    Icone={IconCaneta}
                    onClick={() => aoEditar("plataforma", plataforma)}
                  />
                  <BotaoIconeCabecalho
                    rotulo={t("plataformas.detalhe.eliminar")}
                    Icone={IconLixeira}
                    perigoso
                    onClick={() => aoEliminar("plataforma", plataforma.id, plataforma.nome)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= INDICADORES ================= */}
      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${ultimoIndicadorInteiro} ${colunasIndicadores[indicadores.length] ?? "lg:grid-cols-3"}`}>
        {indicadores.map((indicador) => (
          <CartaoIndicador key={indicador.rotulo} {...indicador} />
        ))}
      </div>

      {/* ================= ACESSO E CONFIGURAÇÃO ================= */}
      <Secao titulo={t("plataformas.detalhe.acessoConfiguracao")}>
        <dl className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Campo rotulo={t("plataformas.detalhe.painelControlo")}>
            {plataforma.urlPainel ? (
              <a
                href={plataforma.urlPainel}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 hover:underline break-all"
              >
                {plataforma.urlPainel}
              </a>
            ) : (
              <span className="text-slate-400 font-normal">{t("plataformas.detalhe.semUrlPainel")}</span>
            )}
          </Campo>
          {ehContainerizacao && (
            <>
              <Campo rotulo={t("plataformas.detalhe.urlRegistry")}>
                <span className="font-mono break-all">{plataforma.registryUrl ?? "-"}</span>
              </Campo>
              <Campo rotulo={t("plataformas.detalhe.namespace")}>
                <span className="font-mono">{plataforma.namespace ?? "-"}</span>
              </Campo>
            </>
          )}
          <Campo rotulo={t("plataformas.detalhe.registadaEm")}>{formatarData(plataforma.criadoEm)}</Campo>
        </dl>
      </Secao>

      {/* ================= CONTAS DE ACESSO ================= */}
      <Secao titulo={t("plataformas.detalhe.contasAcesso")}>
        {acessos.length === 0 && !(ehGestaoDominio && dominiosSemConta.length > 0) ? (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5">
            <p className="text-sm text-slate-400">{t("plataformas.detalhe.semContas")}</p>
          </div>
        ) : (
          <>
            {ehGestaoDominio && (
              <p className="text-xs text-slate-500 px-1">{t("plataformas.detalhe.cliqueContaDominios")}</p>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
              {acessos.map((acesso) => (
                <CartaoContaAcesso
                  key={acesso.id}
                  conta={acesso}
                  plataformaId={plataforma.id}
                  nomePlataforma={plataforma.nome}
                  // Numa plataforma de domínios, o cartão abre a página com os domínios da conta
                  onAbrir={ehGestaoDominio ? () => abrirConta(acesso.id) : undefined}
                  totalDominios={dominiosDaConta(acesso.id).length}
                />
              ))}

              {/* Domínios ainda sem conta: ficam acessíveis num cartão à parte */}
              {ehGestaoDominio && dominiosSemConta.length > 0 && (
                <button
                  type="button"
                  onClick={() => abrirConta("sem")}
                  className="text-left bg-white rounded-2xl border border-dashed border-slate-300 p-5 flex flex-col justify-between gap-4 cursor-pointer transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-600">{t("plataformas.detalhe.semConta")}</h4>
                    <p className="text-xs text-slate-400">{t("plataformas.detalhe.semContaAjuda")}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span>{t("plataformas.detalhe.verDominios", { count: dominiosSemConta.length })}</span>
                    <IconSetaDireita className="w-3.5 h-3.5" />
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </Secao>

      {/* ================= SERVIDORES (só se existirem) ================= */}
      {mostraServidores && (
        <Secao titulo={t("plataformas.detalhe.servidores", { total: servidoresDaPlataforma.length })}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
            {servidoresDaPlataforma.map((servidor) => (
              <CartaoServidor key={servidor.id} servidor={servidor} />
            ))}
          </div>
        </Secao>
      )}

      {servidoresForaDoLugar.length > 0 && (
        <Secao titulo={t("plataformas.detalhe.servidoresAMover", { total: servidoresForaDoLugar.length })}>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
            {t("plataformas.detalhe.avisoServidoresAMover")}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
            {servidoresForaDoLugar.map((servidor) => (
              <CartaoServidor key={servidor.id} servidor={servidor} />
            ))}
          </div>
        </Secao>
      )}

      {/* ======== SISTEMAS HOSPEDADOS (num registo: containerizados, correm das suas imagens) ======== */}
      {!ehGestaoDominio && (
        <Secao
          titulo={t(
            ehContainerizacao ? "plataformas.detalhe.sistemasContainerizados" : "plataformas.detalhe.sistemasHospedados",
            { total: sistemasHospedados.length },
          )}
        >
          {sistemasHospedados.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 italic">
                {ehContainerizacao
                  ? t("plataformas.detalhe.semSistemasContainerizados")
                  : t("plataformas.detalhe.semSistemasHospedados")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
              {sistemasHospedados.map((sistema) => (
                <CartaoSistemaHospedado key={sistema.id} sistema={sistema} />
              ))}
            </div>
          )}
        </Secao>
      )}

      {/* ================= IMAGENS (só containerização) ================= */}
      {ehContainerizacao && (
        <Secao titulo={t("plataformas.detalhe.imagens", { total: imagensDaPlataforma.length })}>
          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/70 shadow-xs">
            <AbaImagens
              imagens={imagensDaPlataforma}
              podeGerir={podeGerir}
              aoEditar={aoEditar}
              aoEliminar={aoEliminar}
            />
          </div>
        </Secao>
      )}

      {/* Os domínios (gestão de domínio) não se listam aqui todos juntos: veem-se por
          conta, ao clicar no cartão de cada conta (ver ContaDominios) */}
    </div>
  );
}
