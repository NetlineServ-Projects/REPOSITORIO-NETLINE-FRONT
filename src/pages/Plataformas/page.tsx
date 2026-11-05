import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import SelectPesquisavel from "../../components/selectPesquisavel";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { usePlataformasData } from "../../hooks/usePlataformasData";
import { useUsuario } from "../../components/usuarioContext";
import ModalConfirmacao from "../../components/modalConfirmacaoprops";
import BotaoAba, {
  type ComponenteIcone,
} from "../../components/plataformas/botaoAba";
import MenuAdicionar from "../../components/plataformas/menuAdicionar";
import PainelFiltros from "../../components/painelFiltros";
import { EstadoCarregando, EstadoErro, IndicadorAtualizar } from "../../components/estados";
import {
  IconPlataforma,
  IconServer,
  IconDominio,
  IconRede,
  IconPesquisa,
  IconImagem,
} from "../../components/icons";
import PlataformaFormularioPage, {
  type TipoFormularioPlataforma,
} from "./formulario/page";
import DetalhesPlataforma from "./detalhes/page";
import AbaPlataformas from "./abas/abaPlataformas";
import AbaServidores from "./abas/abaServidores";
import AbaDominios from "./abas/abaDominios";
import AbaImagens from "./abas/abaImagens";
import AbaTopologia from "./abas/abaTopologia";
import type {
  DadosItemEdicao,
  AoEditarItem,
  AoEliminarItem,
} from "../../types/plataformaTipos";
import { PERMISSOES, pode } from "../../utils/permissoes";

/* ========================================================================== */
/* Tipos                                                                      */
/* ========================================================================== */

type AbaPrincipal =
  | "plataformas"
  | "servidores"
  | "dominios"
  | "imagens"
  | "arvore";

const ABAS_VALIDAS: AbaPrincipal[] = ["plataformas", "servidores", "dominios", "imagens", "arvore"];

interface EstadoFormulario {
  aberto: boolean;
  tipo: TipoFormularioPlataforma;
  itemEdicao?: {
    tipo: TipoFormularioPlataforma;
    dados: DadosItemEdicao;
  } | null;
}

interface EstadoModalExclusao {
  aberto: boolean;
  tipo: TipoFormularioPlataforma;
  id: number;
  nome: string;
}

function textoContem(valor: string | null | undefined, termo: string): boolean {
  return Boolean(valor) && valor!.toLowerCase().includes(termo);
}

/* ========================================================================== */
/* Página                                                                     */
/* ========================================================================== */

export default function PlataformasPage() {
  const { t } = useTranslation();
  const { usuarioLogado } = useUsuario();
  const podeGerir = pode(usuarioLogado, PERMISSOES.INFRA_GERIR);

  const {
    plataformas,
    arvore,
    servidores,
    dominios,
    subdominios,
    imagens,
    loading,
    aAtualizar,
    erro,
    carregarTodos,
    eliminarPlataforma,
    eliminarServidor,
    eliminarDominio,
    eliminarImagem,
  } = usePlataformasData();

  // O separador (?aba=) e a plataforma aberta (?plataforma=) vivem no URL: assim o
  // "Voltar" do browser (ex: dos detalhes de um servidor) regressa ao mesmo sítio, e
  // as notificações e outros links podem abrir diretamente um separador ou plataforma
  const [searchParams, setSearchParams] = useSearchParams();
  const abaDoUrl = searchParams.get("aba") as AbaPrincipal | null;
  const abaAtiva: AbaPrincipal = abaDoUrl && ABAS_VALIDAS.includes(abaDoUrl) ? abaDoUrl : "plataformas";
  const setAbaAtiva = (aba: AbaPrincipal) =>
    setSearchParams(aba === "plataformas" ? {} : { aba }, { replace: true });
  const [busca, setBusca] = useState("");

  // Estados para os filtros avançados por aba (com base nos formulários)
  const [filtroTipoPlataforma, setFiltroTipoPlataforma] = useState("");
  const [filtroSoServidor, setFiltroSoServidor] = useState("");
  const [filtroCloudServidor, setFiltroCloudServidor] = useState("");
  const [filtroEstadoServidor, setFiltroEstadoServidor] = useState("");
  const [filtroDominioBase, setFiltroDominioBase] = useState("");
  const [, setFiltroTipoDns] = useState("");
  const [filtroOrigemImagem, setFiltroOrigemImagem] = useState("");
  const [filtroVisibilidadeImagem, setFiltroVisibilidadeImagem] = useState("");


  const [formularioAberto, setFormularioAberto] =
    useState<EstadoFormulario | null>(null);
  const [modalExclusao, setModalExclusao] =
    useState<EstadoModalExclusao | null>(null);
  const idDoUrl = Number(searchParams.get("plataforma"));
  const plataformaSelecionadaId = Number.isInteger(idDoUrl) && idDoUrl > 0 ? idDoUrl : null;

  // Abrir acrescenta uma entrada ao histórico (o "Voltar" do browser fecha o detalhe)
  const abrirDetalhe = (id: number) => setSearchParams({ plataforma: String(id) });
  const fecharDetalhe = () => setSearchParams({}, { replace: true });

  const plataformaSelecionada =
    plataformaSelecionadaId !== null
      ? (plataformas.find((p) => p.id === plataformaSelecionadaId) ?? null)
      : null;

  /* ----------------------------- Abas ----------------------------------- */
  const abas: {
    id: AbaPrincipal;
    rotulo: string;
    Icone: ComponenteIcone;
    corIcone: string;
  }[] = [
    {
      id: "plataformas",
      rotulo: t("plataformas.lista.abas.plataformas", { total: plataformas.length }),
      Icone: IconPlataforma,
      corIcone: "text-blue-900",
    },
    {
      id: "servidores",
      rotulo: t("plataformas.lista.abas.servidores", { total: servidores.length }),
      Icone: IconServer,
      corIcone: "text-emerald-900",
    },
    {
      id: "imagens",
      rotulo: t("plataformas.lista.abas.imagens", { total: imagens.length }),
      Icone: IconImagem,
      corIcone: "text-violet-900",
    },
    {
      id: "dominios",
      rotulo: t("plataformas.lista.abas.dominios", { total: dominios.length }),
      Icone: IconDominio,
      corIcone: "text-indigo-900",
    },
    {
      id: "arvore",
      rotulo: t("plataformas.lista.abas.arvore"),
      Icone: IconRede,
      corIcone: "text-amber-900",
    },
  ];

  /* ---------------------------- Filtros --------------------------------- */

  const termoBusca = busca.trim().toLowerCase();

  const plataformasFiltradas = useMemo(() => {
    return plataformas.filter((p) => {
      const matchBusca =
        !termoBusca ||
        textoContem(p.nome, termoBusca) ||
        textoContem(p.tipo, termoBusca);

      const matchTipo =
        !filtroTipoPlataforma || p.tipo === filtroTipoPlataforma;

      return matchBusca && matchTipo;
    });
  }, [plataformas, termoBusca, filtroTipoPlataforma]);

  const servidoresFiltrados = useMemo(() => {
    return servidores.filter((s) => {
      const matchBusca =
        !termoBusca ||
        textoContem(s.nome, termoBusca) ||
        textoContem(s.hostname, termoBusca) ||
        textoContem(s.ip, termoBusca) ||
        textoContem(s.sistemaOperativo, termoBusca);

      const matchSo =
        !filtroSoServidor || s.sistemaOperativo === filtroSoServidor;
      const matchCloud =
        !filtroCloudServidor || s.cloud === filtroCloudServidor;
      const matchEstado =
        !filtroEstadoServidor || s.estado === filtroEstadoServidor;

      return matchBusca && matchSo && matchCloud && matchEstado;
    });
  }, [
    servidores,
    termoBusca,
    filtroSoServidor,
    filtroCloudServidor,
    filtroEstadoServidor,
  ]);

  const dominiosFiltrados = useMemo(() => {
    return dominios.filter((d) => {
      const matchBusca = !termoBusca || textoContem(d.nome, termoBusca);
      const matchBase =
        !filtroDominioBase || String(d.id) === filtroDominioBase;
      return matchBusca && matchBase;
    });
  }, [dominios, termoBusca, filtroDominioBase]);

  const imagensFiltradas = useMemo(() => {
    return imagens.filter((i) => {
      const matchBusca =
        !termoBusca ||
        textoContem(i.nome, termoBusca) ||
        textoContem(i.tag, termoBusca);

      const matchOrigem =
        !filtroOrigemImagem || i.origem === filtroOrigemImagem;
      const matchVisibilidade =
        !filtroVisibilidadeImagem ||
        i.visibilidade === filtroVisibilidadeImagem;

      return matchBusca && matchOrigem && matchVisibilidade;
    });
  }, [imagens, termoBusca, filtroOrigemImagem, filtroVisibilidadeImagem]);

  // Filtros aplicados na aba atual (contados no botão "Filtros" dos ecrãs pequenos)
  const filtrosDaAba: Record<AbaPrincipal, string[]> = {
    plataformas: [filtroTipoPlataforma],
    servidores: [filtroSoServidor, filtroCloudServidor, filtroEstadoServidor],
    dominios: [filtroDominioBase],
    imagens: [filtroOrigemImagem, filtroVisibilidadeImagem],
    arvore: [],
  };
  const filtrosAtivos = filtrosDaAba[abaAtiva].filter(Boolean).length;

  const limparFiltros = () => {
    setBusca("");
    setFiltroTipoPlataforma("");
    setFiltroSoServidor("");
    setFiltroCloudServidor("");
    setFiltroEstadoServidor("");
    setFiltroDominioBase("");
    setFiltroTipoDns("");
    setFiltroOrigemImagem("");
    setFiltroVisibilidadeImagem("");
  };

  /* ---------------------------- Ações ----------------------------------- */

  const abrirFormularioCriacao = (tipo: TipoFormularioPlataforma) =>
    setFormularioAberto({ aberto: true, tipo });

  const abrirFormularioEdicao: AoEditarItem = (tipo, dados) =>
    setFormularioAberto({ aberto: true, tipo, itemEdicao: { tipo, dados } });

  const abrirModalExclusao: AoEliminarItem = (tipo, id, nome) =>
    setModalExclusao({ aberto: true, tipo, id, nome });

  const handleConfirmarExclusao = async () => {
    if (!modalExclusao) return;

    const funcoesEliminar: Record<
      TipoFormularioPlataforma,
      (id: number) => Promise<unknown>
    > = {
      plataforma: eliminarPlataforma,
      servidor: eliminarServidor,
      dominio: eliminarDominio,
      imagem: eliminarImagem,
    };

    try {
      await funcoesEliminar[modalExclusao.tipo](modalExclusao.id);
      toast.success(t(`plataformas.eliminar.sucesso.${modalExclusao.tipo}`));

      if (
        modalExclusao.tipo === "plataforma" &&
        modalExclusao.id === plataformaSelecionadaId
      ) {
        fecharDetalhe();
      }
    } catch (erro: unknown) {
      const mensagem =
        erro instanceof Error ? erro.message : t("plataformas.eliminar.erro");
      toast.error(mensagem);
    } finally {
      setModalExclusao(null);
    }
  };

  /* ------------------------------ Modal --------------------------------- */

  const modalExclusaoElemento = (
    <ModalConfirmacao
      aberto={Boolean(modalExclusao?.aberto)}
      perigoso
      titulo={t("plataformas.eliminar.titulo", {
        recurso: modalExclusao ? t(`plataformas.recursos.${modalExclusao.tipo}`) : "",
      })}
      mensagem={t("plataformas.eliminar.mensagem", { nome: modalExclusao?.nome })}
      textoConfirmar={t("plataformas.eliminar.confirmar")}
      onConfirmar={handleConfirmarExclusao}
      onCancelar={() => setModalExclusao(null)}
    />
  );

  /* ------------------------ Formulário em ecrã inteiro ------------------ */

  if (formularioAberto?.aberto) {
    return (
      <PlataformaFormularioPage
        tipoInicial={formularioAberto.tipo}
        itemEdicao={formularioAberto.itemEdicao}
        onVoltar={() => setFormularioAberto(null)}
        onSucesso={() => carregarTodos()}
      />
    );
  }

  /* ------------------------ Detalhes da plataforma ---------------------- */

  if (plataformaSelecionada) {
    return (
      <>
        <DetalhesPlataforma
          plataforma={plataformaSelecionada}
          servidores={servidores}
          dominios={dominios}
          subdominios={subdominios}
          imagens={imagens}
          podeGerir={podeGerir}
          aoVoltar={fecharDetalhe}
          aoEditar={abrirFormularioEdicao}
          aoEliminar={abrirModalExclusao}
        />
        {modalExclusaoElemento}
      </>
    );
  }

  // Filtro da barra lateral: o mesmo dropdown com pesquisa do resto da aplicação
  const renderDropdownFiltro = (
    id: string,
    rotulo: string,
    valorAtual: string,
    onSelecionar: (val: string) => void,
    opcoes: { valor: string; rotulo: string }[],
  ) => (
    <div>
      <label htmlFor={`filtro-${id}`} className="block text-xs font-semibold text-slate-600 mb-1.5">
        {rotulo}
      </label>
      <SelectPesquisavel
        id={`filtro-${id}`}
        valor={valorAtual}
        onChange={onSelecionar}
        opcoes={opcoes.map((o) => ({ valor: o.valor, label: o.rotulo }))}
        opcaoVazia={t("plataformas.lista.filtros.todos")}
        tamanho="sm"
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ================= HEADER ================= */}
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-6">
        <div>
          <span className="text-xs uppercase font-semibold text-blue-200/80 tracking-widest block mb-1">
            {t("plataformas.lista.sobretitulo")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t("plataformas.lista.titulo")}
          </h2>
          <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
            {t("plataformas.lista.descricao")}
          </p>
        </div>

        {podeGerir && <MenuAdicionar onSelecionar={abrirFormularioCriacao} />}
      </div>

      {/* ================= ABAS ================= */}
      {/* Numa só linha: em ecrãs estreitos desliza na horizontal (o separador ativo fica à vista) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-fit max-w-full min-w-0 [scrollbar-width:none]">
          {abas.map((aba) => (
            <BotaoAba
              key={aba.id}
              rotulo={aba.rotulo}
              Icone={aba.Icone}
              corIcone={aba.corIcone}
              ativa={abaAtiva === aba.id}
              onSelecionar={() => setAbaAtiva(aba.id)}
            />
          ))}
        </div>
        <IndicadorAtualizar ativo={aAtualizar} />
      </div>

      {/* ================= LAYOUT PRINCIPAL (CONTEÚDO À ESQUERDA, FILTROS À DIREITA) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* COLUNA ESQUERDA (3 colunas): PESQUISA E CONTEÚDO */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {/* BARRA DE PESQUISA SUPERIOR */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder={t("plataformas.lista.pesquisar")}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-slate-800 shadow-sm transition-all"
            />
            <IconPesquisa className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
                title={t("plataformas.lista.limparPesquisa")}
              >
                ✕
              </button>
            )}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          {/* "loading" só é verdadeiro na primeira carga; as recargas mantêm as listas no ecrã.
              Se a primeira carga falhar mostra-se o erro (antes ficava uma lista vazia) */}
          {loading ? (
            <EstadoCarregando mensagem={t("plataformas.lista.aCarregar")} />
          ) : erro ? (
            <EstadoErro mensagem={erro} onTentarNovamente={carregarTodos} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              {abaAtiva === "plataformas" && (
                <AbaPlataformas
                  plataformas={plataformasFiltradas}
                  servidores={servidores}
                  dominios={dominios}
                  imagens={imagens}
                  aoAbrirDetalhes={(plataforma) => abrirDetalhe(plataforma.id)}
                />
              )}

              {abaAtiva === "servidores" && (
                <AbaServidores
                  servidores={servidoresFiltrados}
                  plataformas={plataformas}
                  podeGerir={podeGerir}
                  aoEditar={abrirFormularioEdicao}
                  aoEliminar={abrirModalExclusao}
                />
              )}

              {abaAtiva === "dominios" && (
                <AbaDominios
                  dominios={dominiosFiltrados}
                  subdominios={subdominios}
                  servidores={servidores}
                  podeGerir={podeGerir}
                  aoEditar={abrirFormularioEdicao}
                  aoEliminar={abrirModalExclusao}
                />
              )}

              {abaAtiva === "imagens" && (
                <AbaImagens
                  imagens={imagensFiltradas}
                  podeGerir={podeGerir}
                  aoEditar={abrirFormularioEdicao}
                  aoEliminar={abrirModalExclusao}
                />
              )}

              {abaAtiva === "arvore" && <AbaTopologia arvore={arvore} />}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA (1 coluna): CARD DE FILTROS FIXO (abaixo de lg, recolhido atrás do botão "Filtros") */}
        <PainelFiltros ativos={filtrosAtivos} abertoDesde="lg" className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs uppercase font-bold text-slate-700 tracking-wider">
                {t("plataformas.lista.filtros.titulo")}
              </span>
              <button
                type="button"
                onClick={limparFiltros}
                className="text-xs text-slate-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
              >
                {t("plataformas.lista.filtros.limpar")}
              </button>
            </div>

            {/* Filtros para Plataformas */}
            {abaAtiva === "plataformas" && (
              <div className="space-y-4">
                {renderDropdownFiltro(
                  "tipoPlataforma",
                  t("plataformas.lista.filtros.tipo"),
                  filtroTipoPlataforma,
                  setFiltroTipoPlataforma,
                  [
                    {
                      valor: "CONTAINERIZACAO",
                      rotulo: t("plataformas.tipos.CONTAINERIZACAO"),
                    },
                    { valor: "CLOUD_BASE_DADOS", rotulo: t("plataformas.tipos.CLOUD_BASE_DADOS") },
                    {
                      valor: "GESTAO_DOMINIO",
                      rotulo: t("plataformas.lista.filtros.tipoGestaoDominio"),
                    },
                  ],
                )}
              </div>
            )}

            {/* Filtros para Servidores */}
            {abaAtiva === "servidores" && (
              <div className="space-y-4">
                {renderDropdownFiltro(
                  "soServidor",
                  t("plataformas.lista.filtros.sistemaOperativo"),
                  filtroSoServidor,
                  setFiltroSoServidor,
                  Array.from(
                    new Set(
                      servidores.map((s) => s.sistemaOperativo).filter(Boolean),
                    ),
                  ).map((so) => ({
                    valor: so,
                    rotulo: so,
                  })),
                )}
                {renderDropdownFiltro(
                  "cloudServidor",
                  t("plataformas.lista.filtros.fornecedorCloud"),
                  filtroCloudServidor,
                  setFiltroCloudServidor,
                  Array.from(
                    new Set(servidores.map((s) => s.cloud).filter(Boolean)),
                  ).map((c) => ({
                    valor: c!,
                    rotulo: c!,
                  })),
                )}
                {renderDropdownFiltro(
                  "estadoServidor",
                  t("plataformas.lista.filtros.estado"),
                  filtroEstadoServidor,
                  setFiltroEstadoServidor,
                  [
                    { valor: "ATIVO", rotulo: t("plataformas.estadoServidor.ATIVO") },
                    { valor: "INATIVO", rotulo: t("plataformas.estadoServidor.INATIVO") },
                  ],
                )}
              </div>
            )}

            {/* Filtros para Domínios & DNS */}
            {abaAtiva === "dominios" && (
              <div className="space-y-4">
                {renderDropdownFiltro(
                  "dominioBase",
                  t("plataformas.lista.filtros.dominioBase"),
                  filtroDominioBase,
                  setFiltroDominioBase,
                  dominios.map((d) => ({
                    valor: String(d.id),
                    rotulo: d.nome,
                  })),
                )}
              </div>
            )}

            {/* Filtros para Imagens */}
            {abaAtiva === "imagens" && (
              <div className="space-y-4">
                {renderDropdownFiltro(
                  "origemImagem",
                  t("plataformas.lista.filtros.origem"),
                  filtroOrigemImagem,
                  setFiltroOrigemImagem,
                  [
                    { valor: "PROPRIA", rotulo: t("plataformas.lista.filtros.origemPropria") },
                    { valor: "TERCEIROS", rotulo: t("plataformas.lista.filtros.origemExterna") },
                  ],
                )}
                {renderDropdownFiltro(
                  "visibilidadeImagem",
                  t("plataformas.lista.filtros.visibilidade"),
                  filtroVisibilidadeImagem,
                  setFiltroVisibilidadeImagem,
                  [
                    { valor: "PRIVADA", rotulo: t("plataformas.visibilidade.PRIVADA") },
                    { valor: "PUBLICA", rotulo: t("plataformas.visibilidade.PUBLICA") },
                  ],
                )}
              </div>
            )}

            {abaAtiva === "arvore" && (
              <p className="text-xs text-slate-400 italic">
                {t("plataformas.lista.filtros.semFiltrosTopologia")}
              </p>
            )}
          </div>
        </PainelFiltros>
      </div>

      {modalExclusaoElemento}
    </div>
  );
}
