import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { fetchComToken } from "../../../utils/api";
import { API_ENDPOINTS } from "../../../data/client/endpoint";
import { revelarPasswordServidor } from "../../../hooks/usePlataformasData";
import SegredoRevelavel from "../../../components/segredoRevelavel";
import ModalConfirmacao from "../../../components/modalConfirmacaoprops";
import CartaoIndicador from "../../../components/plataformas/cartaoIndicador";
import BotaoIconeCabecalho from "../../../components/plataformas/botaoIconeCabecalho";
import {
  IconCaneta,
  IconCpu,
  IconDisco,
  IconEstado,
  IconLixeira,
  IconMemoria,
  IconServer,
  IconSistemas,
  IconVelocidade,
} from "../../../components/icons";
import { rotuloStatus } from "../../../utils/status";
import {
  ROTULO_AMBIENTE,
  ROTULO_ESTADO_SERVIDOR,
  agruparSistemasHospedados,
  formatarBanda,
  formatarDisco,
  formatarRam,
} from "../../../utils/servidor";
import type { Servidor } from "../../../types/plataforma";
import { localeDatas } from "../../../types/plataformaConstantes";
import PlataformaFormularioPage from "../formulario/page";
import { useCarregamento } from "../../../hooks/useCarregamento";
import { EstadoCarregando, EstadoErro } from "../../../components/estados";
import { PERMISSOES, pode, type PerfilResumo } from "../../../utils/permissoes";

interface DashboardContext {
  usuario: { id?: number; nome: string; perfil?: PerfilResumo | null; permissoes?: string[] } | null;
}

const LISTA_SERVIDORES = "/dashboard/plataformas?aba=servidores";

function formatarData(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString(localeDatas()) : "-";
}

const CLASSE_ICONE_ESTADO: Record<Servidor["estado"], string> = {
  ATIVO: "bg-emerald-50 text-emerald-700",
  INATIVO: "bg-slate-100 text-slate-500",
};

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{titulo}</h3>
      {children}
    </section>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <dt className="text-xs font-semibold text-slate-500 shrink-0">{rotulo}</dt>
      <dd className="text-sm text-slate-800 sm:text-right min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function ServidorDetalhePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useOutletContext<DashboardContext>();
  const podeGerir = pode(usuario, PERMISSOES.INFRA_GERIR);

  const [servidor, setServidor] = useState<Servidor | null>(null);
  const [editando, setEditando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  // Depois de editar, a recarga corre por trás: se falhar, o servidor fica no ecrã e aparece um aviso
  const { carregando, erro, executar } = useCarregamento(t("plataformas.servidor.erroCarregar"));
  const carregar = useCallback(
    () => executar(() => fetchComToken(API_ENDPOINTS.SERVIDOR_BY_ID(id!)), setServidor),
    [executar, id],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Volta para onde se estava (lista ou detalhe da plataforma); aberto por link direto, vai para a lista
  const voltar = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(LISTA_SERVIDORES);
  };

  const eliminar = async () => {
    if (!servidor) return;
    setConfirmarEliminar(false);
    try {
      await fetchComToken(API_ENDPOINTS.SERVIDOR_BY_ID(servidor.id), { method: "DELETE" });
      toast.success(t("plataformas.servidor.eliminado"));
      navigate(LISTA_SERVIDORES, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("plataformas.servidor.erroEliminar"));
    }
  };

  if (carregando && !servidor) {
    return <EstadoCarregando mensagem={t("plataformas.servidor.aCarregar")} />;
  }

  if (erro || !servidor) {
    return (
      <div className="space-y-3 text-center">
        <EstadoErro mensagem={erro || t("plataformas.servidor.naoEncontrado")} onTentarNovamente={carregar} />
        <Link to={LISTA_SERVIDORES} className="text-sm text-slate-500 font-semibold hover:underline">
          {t("plataformas.servidor.voltarServidores")}
        </Link>
      </div>
    );
  }

  if (editando) {
    return (
      <PlataformaFormularioPage
        itemEdicao={{ tipo: "servidor", dados: servidor }}
        onVoltar={() => setEditando(false)}
        onSucesso={carregar}
      />
    );
  }

  const sistemas = agruparSistemasHospedados(servidor);

  return (
    <div className="space-y-6 pb-12">
      {/* ================= CABEÇALHO ================= */}
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-sm space-y-5">
        <button
          onClick={voltar}
          className="text-xs font-semibold text-blue-100/80 hover:text-white transition-colors cursor-pointer"
        >
          {t("plataformas.servidor.voltar")}
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0 max-w-full">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <IconServer className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs uppercase font-semibold text-blue-200/80 tracking-widest block mb-1">
                {t("plataformas.servidor.sobretitulo")}{servidor.plataforma ? ` · ${servidor.plataforma.nome}` : ""}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold break-words lg:truncate">{servidor.nome}</h2>
              <p className="text-sm text-blue-100/80 font-mono mt-1 truncate">{servidor.hostname}</p>
            </div>
          </div>

          {podeGerir && (
            <div className="flex items-center gap-2">
              <BotaoIconeCabecalho rotulo={t("plataformas.servidor.editar")} Icone={IconCaneta} onClick={() => setEditando(true)} />
              <BotaoIconeCabecalho
                rotulo={t("plataformas.servidor.eliminar")}
                Icone={IconLixeira}
                perigoso
                onClick={() => setConfirmarEliminar(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= RECURSOS E ESTADO ================= */}
      {/* 2 colunas no telemóvel/tablet (o "Estado", 5.º cartão, ocupa a linha toda), 3 a 1024px e 5 a partir de xl */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
        <CartaoIndicador rotulo={t("plataformas.servidor.indicadores.cpu")} valor={`${servidor.numeroCpu} vCPU`} Icone={IconCpu} />
        <CartaoIndicador rotulo={t("plataformas.servidor.indicadores.memoriaRam")} valor={formatarRam(servidor)} Icone={IconMemoria} />
        <CartaoIndicador rotulo={t("plataformas.servidor.indicadores.disco")} valor={formatarDisco(servidor)} Icone={IconDisco} />
        <CartaoIndicador rotulo={t("plataformas.servidor.indicadores.larguraBanda")} valor={formatarBanda(servidor)} Icone={IconVelocidade} />
        <CartaoIndicador
          rotulo={t("plataformas.servidor.indicadores.estado")}
          valor={ROTULO_ESTADO_SERVIDOR[servidor.estado]}
          Icone={IconEstado}
          classeIcone={CLASSE_ICONE_ESTADO[servidor.estado]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================= LIGAÇÃO E ACESSO ================= */}
        <Secao titulo={t("plataformas.servidor.ligacaoAcesso")}>
          <dl>
            <Campo rotulo={t("plataformas.servidor.ip")}>
              <span className="font-mono">{servidor.ip || "-"}</span>
            </Campo>
            <Campo rotulo={t("plataformas.servidor.hostname")}>
              <span className="font-mono">{servidor.hostname}</span>
            </Campo>
            <Campo rotulo={t("plataformas.servidor.utilizadorSsh")}>
              <span className="font-mono">{servidor.usernameSsh}</span>
            </Campo>
            <Campo rotulo={t("plataformas.servidor.passwordSsh")}>
              <div className="flex sm:justify-end">
                <SegredoRevelavel
                  descricao={t("plataformas.servidor.passwordDescricao", { nome: servidor.nome })}
                  obter={(tokenElevado) => revelarPasswordServidor(servidor.id, tokenElevado)}
                />
              </div>
            </Campo>
          </dl>
        </Secao>

        {/* ================= SISTEMA E LOCALIZAÇÃO ================= */}
        <Secao titulo={t("plataformas.servidor.soLocalizacao")}>
          <dl>
            <Campo rotulo={t("plataformas.servidor.sistemaOperativo")}>
              {servidor.sistemaOperativo}
              {servidor.versaoSo && <span className="text-slate-500"> {servidor.versaoSo}</span>}
            </Campo>
            <Campo rotulo={t("plataformas.servidor.cloud")}>{servidor.cloud || "-"}</Campo>
            <Campo rotulo={t("plataformas.servidor.regiao")}>{servidor.regiao || "-"}</Campo>
            <Campo rotulo={t("plataformas.servidor.plataforma")}>
              {servidor.plataforma ? (
                <Link
                  to={`/dashboard/plataformas?plataforma=${servidor.plataforma.id}`}
                  className="font-semibold text-blue-900 hover:underline"
                >
                  {servidor.plataforma.nome}
                </Link>
              ) : (
                "-"
              )}
            </Campo>
            <Campo rotulo={t("plataformas.servidor.registosDns")}>{servidor.totais?.subdominios ?? 0}</Campo>
            <Campo rotulo={t("plataformas.servidor.registadoEm")}>{formatarData(servidor.criadoEm)}</Campo>
          </dl>
        </Secao>
      </div>

      {/* ================= SISTEMAS HOSPEDADOS ================= */}
      <Secao titulo={t("plataformas.servidor.sistemasHospedados", { total: sistemas.length })}>
        {sistemas.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 italic">
              {t("plataformas.servidor.semSistemas")}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sistemas.map((sistema) => (
              <li key={sistema.id}>
                <Link
                  to={`/dashboard/sistemas/${sistema.id}`}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/70 hover:border-blue-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                    <IconSistemas className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{sistema.nome}</p>
                    <p className="text-[11px] text-slate-500">{rotuloStatus(sistema.status)}</p>
                    {/* Como o sistema chega a este servidor */}
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {[
                        sistema.temBackend && t("plataformas.comum.backend"),
                        ...sistema.enderecos.map((e) => t("plataformas.servidor.dns", { endereco: e })),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {sistema.ambientes.map((ambiente) => (
                      <span
                        key={ambiente}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          ambiente === "PRODUCAO" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {ROTULO_AMBIENTE[ambiente]}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <ModalConfirmacao
        aberto={confirmarEliminar}
        perigoso
        titulo={t("plataformas.servidor.eliminarTitulo")}
        mensagem={t("plataformas.servidor.eliminarMensagem", { nome: servidor.nome })}
        textoConfirmar={t("plataformas.servidor.eliminarConfirmar")}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarEliminar(false)}
      />
    </div>
  );
}
