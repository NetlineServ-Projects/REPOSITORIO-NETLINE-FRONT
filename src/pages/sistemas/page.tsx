import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  useNavigate,
  useParams,
  useOutletContext,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";
import { Trans, useTranslation } from "react-i18next";
import { useSistemasData, podeEditarSistema, podeEliminarSistema, type Sistema } from "../../hooks/useSistemasData";
import type { Documento } from "../../types/documento";
import SistemasHeader from "./sistemasHeader";
import SistemasGrid from "./sistemasGrid";
import SistemaFormulario from "./formulario/page";
import SistemaDetalheHeader from "./sistemaDetalheHeader";
import SistemaFichaTecnica from "./sistemaFichaTecnica";
import AnexarDocumentoForm from "./anexarDocumentoForm";
import DocumentosDoSistemaTabela from "./documentosDoSistemaTabela";
import FilterSelect from "../../components/filterSelect";
import PainelFiltros from "../../components/painelFiltros";
import InfraestruturaTab from "./infraestrutura/infraestruturaTab";
import { useAcessoInfraestruturaOpcional } from "./infraestrutura/acessoInfraestrutura";
import { rotuloStatus } from "../../utils/status";
import { useConfirmacao } from "../../components/confirmacao";
import { EstadoCarregando, EstadoErro, IndicadorAtualizar } from "../../components/estados";
import { PERMISSOES, pode, type PerfilResumo } from "../../utils/permissoes";

interface DashboardContext {
  usuario: { id?: number; nome: string; perfil?: PerfilResumo | null; permissoes?: string[] } | null;
}

type Aba = "geral" | "documentos" | "infraestrutura";

export default function SistemasPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const confirmar = useConfirmacao();
  const { id } = useParams<{ id?: string }>();
  const { usuario } = useOutletContext<DashboardContext>();
  const publicaDireto = pode(usuario, PERMISSOES.DOCUMENTOS_APROVAR);
  const podeApagarDocumentos = pode(usuario, PERMISSOES.DOCUMENTOS_ELIMINAR);
  const verInfraestrutura = pode(usuario, PERMISSOES.SISTEMAS_INFRA_VER);
  const podeGerirInfra = pode(usuario, PERMISSOES.SISTEMAS_INFRA_GERIR);

  // Só existe na página de um sistema (não na lista)
  const acesso = useAcessoInfraestruturaOpcional();

  const {
    sistemas,
    documentos,
    categorias,
    loading,
    aAtualizar,
    erro,
    recarregar,
    criarSistema,
    editarSistema,
    apagarSistema,
    anexarDocumento,
    apagarDocumento,
  } = useSistemasData();

  // Estados de controlo da página
  const [sistemaAtivo, setSistemaAtivo] = useState<Sistema | null>(null);
  const [formularioAberto, setFormularioAberto] = useState<
    "novo" | Sistema | null
  >(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoDoc, setEnviandoDoc] = useState(false);

  // A aba ativa vive no endereço: ?aba=documentos | ?aba=infraestrutura
  const [searchParams, setSearchParams] = useSearchParams();
  const parametroAba = searchParams.get("aba");
  // Sem acesso à infraestrutura dos sistemas, a aba não existe (nem pelo endereço)
  const abaAtiva: Aba =
    parametroAba === "documentos" || (parametroAba === "infraestrutura" && verInfraestrutura)
      ? parametroAba
      : "geral";

  // Sair da aba Infraestrutura bloqueia o acesso; voltar exige nova palavra-passe
  const mudarAba = (aba: Aba) => {
    if (abaAtiva === "infraestrutura" && aba !== "infraestrutura") {
      acesso?.bloquear();
    }
    setSearchParams(aba === "geral" ? {} : { aba }, { replace: true });
  };

  // Com as abas em scroll horizontal, mantém a aba ativa à vista (ex.: ao abrir ?aba=infraestrutura)
  const abasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const barra = abasRef.current;
    const ativa = barra?.querySelector<HTMLElement>("[aria-current=page]");
    if (barra && ativa) barra.scrollLeft = ativa.offsetLeft - (barra.clientWidth - ativa.offsetWidth) / 2;
  }, [abaAtiva, sistemaAtivo]);

  // Estados de busca
  const [busca, setBusca] = useState("");
  const [buscaDoc, setBuscaDoc] = useState("");

  // Estados dos filtros avançados
  const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
  const [clienteFiltro, setClienteFiltro] = useState<string[]>([]);
  const [tecnologiaFiltro, setTecnologiaFiltro] = useState<string[]>([]);

  // Sincroniza sistemaAtivo com o :id da URL
  useEffect(() => {
    if (!id) {
      setSistemaAtivo(null);
      return;
    }
    const encontrado = sistemas.find((s) => String(s.id) === id);
    if (encontrado) setSistemaAtivo(encontrado);
  }, [id, sistemas]);

  // Categorias não sensíveis reutilizadas
  const categoriasPublicas = useMemo(
    () => categorias.filter((c) => !c.sensivel),
    [categorias],
  );

  // Opções dinâmicas derivadas dos dados de sistemas
  const statusExistentes = useMemo(() => {
    const todosStatus = sistemas
      .map((s) => s.status)
      .filter((st): st is string => Boolean(st));
    return Array.from(new Set(todosStatus)).sort();
  }, [sistemas]);
  // Rótulos fora do useMemo, para acompanharem a mudança de idioma
  const opcoesStatus = statusExistentes.map((st) => ({
    valor: st,
    label: rotuloStatus(st),
  }));

  const opcoesClientes = useMemo(() => {
    const todosClientes = sistemas.flatMap((s) => s.empresasClientes || []);
    return Array.from(new Set(todosClientes))
      .sort()
      .map((c) => ({ valor: c, label: c }));
  }, [sistemas]);

  const opcoesTecnologias = useMemo(() => {
    const todasTecs = sistemas.flatMap((s) => s.tecnologias || []);
    return Array.from(new Set(todasTecs))
      .sort()
      .map((t) => ({ valor: t, label: t }));
  }, [sistemas]);

  const limparFiltrosSistemas = useCallback(() => {
    setBusca("");
    setStatusFiltro([]);
    setClienteFiltro([]);
    setTecnologiaFiltro([]);
  }, []);

  const handleSalvarSistema = async (dados: Record<string, unknown>) => {
    setSalvando(true);
    try {
      if (formularioAberto && formularioAberto !== "novo") {
        await editarSistema(formularioAberto.id, dados);
        toast.success(t("sistemas.detalhe.sistemaAtualizado"));
      } else {
        await criarSistema(dados);
        toast.success(t("sistemas.detalhe.sistemaRegistado"));
      }
      setFormularioAberto(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sistemas.detalhe.erroGuardarSistema"),
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleAnexar = async (dados: {
    ficheiro: File;
    categoriaId: string;
    titulo: string;
    descricao: string;
  }) => {
    if (!sistemaAtivo) return;
    setEnviandoDoc(true);
    try {
      const formData = new FormData();
      formData.append("ficheiro", dados.ficheiro);
      formData.append("categoriaId", dados.categoriaId);
      formData.append("sistemaId", String(sistemaAtivo.id));
      formData.append("titulo", dados.titulo);
      formData.append("descricao", dados.descricao);

      await anexarDocumento(formData);
      // Segue o mesmo fluxo da aba Documentos: só quem aprova publica de imediato
      toast.success(
        publicaDireto
          ? t("sistemas.detalhe.documentoPublicado")
          : t("sistemas.detalhe.documentoEnviadoAprovacao"),
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("sistemas.detalhe.erroAnexar"),
      );
    } finally {
      setEnviandoDoc(false);
    }
  };

  const abrirEditarDocumento = (doc: Documento) => {
    navigate(`/dashboard/documentos/${doc.id}/editar`);
  };

  const handleApagarDoc = async (docId: number) => {
    const doc = documentos.find((d) => d.id === docId);
    try {
      const apagado = await confirmar({
        titulo: t("sistemas.detalhe.apagarDocumento.titulo"),
        mensagem: (
          <Trans
            i18nKey="sistemas.detalhe.apagarDocumento.mensagem"
            values={{ nome: doc?.titulo || doc?.nomeArquivo || t("sistemas.detalhe.apagarDocumento.semNome") }}
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("sistemas.detalhe.apagarDocumento.confirmar"),
        textoCarregando: t("sistemas.comum.aApagar"),
        perigoso: true,
        acao: () => apagarDocumento(docId),
      });
      if (apagado) toast.success(t("sistemas.detalhe.documentoRemovido"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("comum.erroApagarDocumento"));
    }
  };

  const handleApagarSistema = async (sistema: Sistema) => {
    try {
      const apagado = await confirmar({
        titulo: t("sistemas.detalhe.apagarSistema.titulo"),
        mensagem: (
          <Trans
            i18nKey="sistemas.detalhe.apagarSistema.mensagem"
            values={{ nome: sistema.nome }}
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("sistemas.detalhe.apagarSistema.confirmar"),
        textoCarregando: t("sistemas.comum.aApagar"),
        perigoso: true,
        acao: () => apagarSistema(sistema.id),
      });
      if (!apagado) return;
      toast.success(t("sistemas.detalhe.sistemaApagado"));
      navigate("/dashboard/sistemas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("sistemas.detalhe.erroApagarSistema"));
    }
  };

  const sistemasFiltrados = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return sistemas.filter((sis) => {
      const atendeBusca =
        !termoBusca ||
        sis.nome.toLowerCase().includes(termoBusca) ||
        (sis.descricaoCurta &&
          sis.descricaoCurta.toLowerCase().includes(termoBusca)) ||
        (sis.desenvolvedores || []).some((d) =>
          d.toLowerCase().includes(termoBusca),
        ) ||
        (sis.empresasClientes || []).some((c) =>
          c.toLowerCase().includes(termoBusca),
        );

      const atendeStatus =
        statusFiltro.length === 0 || statusFiltro.includes(sis.status);

      const atendeCliente =
        clienteFiltro.length === 0 ||
        (sis.empresasClientes || []).some((c) => clienteFiltro.includes(c));

      const atendeTecnologia =
        tecnologiaFiltro.length === 0 ||
        (sis.tecnologias || []).some((tec) => tecnologiaFiltro.includes(tec));

      return atendeBusca && atendeStatus && atendeCliente && atendeTecnologia;
    });
  }, [sistemas, busca, statusFiltro, clienteFiltro, tecnologiaFiltro]);

  const documentosDoSistema = useMemo(() => {
    if (!sistemaAtivo) return [];
    const termoBuscaDoc = buscaDoc.trim().toLowerCase();

    return documentos
      .filter((doc) => Number(doc.sistemaId) === Number(sistemaAtivo.id))
      .filter(
        (doc) =>
          !termoBuscaDoc ||
          (doc.titulo || doc.nomeArquivo || "")
            .toLowerCase()
            .includes(termoBuscaDoc),
      );
  }, [documentos, sistemaAtivo, buscaDoc]);

  const possuiFiltrosAtivos =
    busca !== "" ||
    statusFiltro.length > 0 ||
    clienteFiltro.length > 0 ||
    tecnologiaFiltro.length > 0;

  if (loading) {
    return <EstadoCarregando mensagem={t("sistemas.lista.carregando")} />;
  }

  // A primeira carga falhou: mostra o erro (antes aparecia uma lista vazia, ou
  // "Sistema não encontrado" ao abrir um sistema pelo link)
  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={recarregar} />;
  }

  // Um :id na URL que não corresponde a nenhum sistema (apagado, ou link errado)
  if (id && !sistemas.some((s) => String(s.id) === id)) {
    return (
      <div className="space-y-3 text-center">
        <EstadoErro
          titulo={t("sistemas.detalhe.naoEncontradoTitulo")}
          mensagem={t("sistemas.detalhe.naoEncontradoMensagem")}
        />
        <button
          onClick={() => navigate("/dashboard/sistemas")}
          className="text-sm text-netline-azul font-semibold hover:underline cursor-pointer"
        >
          {t("sistemas.detalhe.voltarAosSistemas")}
        </button>
      </div>
    );
  }

  // Vista 1: Formulário de Criação/Edição de Sistema
  if (formularioAberto) {
    return (
      <SistemaFormulario
        sistemaExistente={formularioAberto === "novo" ? null : formularioAberto}
        salvando={salvando}
        onCancelar={() => setFormularioAberto(null)}
        onSubmit={handleSalvarSistema}
        gerirAlojamento={podeGerirInfra}
      />
    );
  }

  // Vista 2: Lista Principal de Sistemas (Grelha e Filtros)
  if (!sistemaAtivo) {
    return (
      <div className="space-y-6">
        <SistemasHeader
          total={sistemas.length}
          onNovoSistema={pode(usuario, PERMISSOES.SISTEMAS_CRIAR) ? () => setFormularioAberto("novo") : undefined}
        />

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                placeholder={t("sistemas.lista.pesquisarPlaceholder")}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-4 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-slate-800 placeholder-slate-400 transition-all"
              />
            </div>
            <IndicadorAtualizar ativo={aAtualizar} />
          </div>

          <PainelFiltros ativos={statusFiltro.length + clienteFiltro.length + tecnologiaFiltro.length}>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <FilterSelect
              label={t("sistemas.lista.filtroEstado")}
              placeholder={t("sistemas.lista.todosEstados")}
              opcoes={opcoesStatus}
              selecionados={statusFiltro}
              onChange={setStatusFiltro}
            />

            <FilterSelect
              label={t("sistemas.lista.filtroCliente")}
              placeholder={t("sistemas.lista.todosClientes")}
              opcoes={opcoesClientes}
              selecionados={clienteFiltro}
              onChange={setClienteFiltro}
            />

            <FilterSelect
              label={t("sistemas.lista.filtroTecnologia")}
              placeholder={t("sistemas.lista.todasTecnologias")}
              opcoes={opcoesTecnologias}
              selecionados={tecnologiaFiltro}
              onChange={setTecnologiaFiltro}
            />
          </div>
          </PainelFiltros>

          {possuiFiltrosAtivos && (
            <div className="flex justify-end pt-1">
              <button
                onClick={limparFiltrosSistemas}
                className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors border border-rose-100 cursor-pointer"
              >
                ✕ {t("comum.limparFiltros")}
              </button>
            </div>
          )}
        </div>

        <SistemasGrid
          sistemas={sistemasFiltrados}
          documentos={documentos}
          onSelecionar={(sis) => {
            setBuscaDoc("");
            navigate(`/dashboard/sistemas/${sis.id}`);
          }}
        />
      </div>
    );
  }

  // Vista 3: Detalhes do Sistema Selecionado (Com Tabs para Organização)
  return (
    <div className="space-y-6">
      <SistemaDetalheHeader
        sistema={sistemaAtivo}
        onVoltar={() => navigate("/dashboard/sistemas")}
        onEditar={() => setFormularioAberto(sistemaAtivo)}
        onApagar={() => handleApagarSistema(sistemaAtivo)}
        podeEditar={podeEditarSistema(usuario)}
        podeEliminar={podeEliminarSistema(sistemaAtivo, usuario)}
      />

      {/* Navegação por Separadores (Tabs): uma só linha, com scroll horizontal nos ecrãs pequenos */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none] relative" ref={abasRef}>
        <button
          onClick={() => mudarAba("geral")}
          aria-current={abaAtiva === "geral" ? "page" : undefined}
          className={`pb-3 shrink-0 transition-colors relative cursor-pointer ${
            abaAtiva === "geral"
              ? "text-blue-900 font-semibold border-b-2 border-blue-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("sistemas.detalhe.abas.geral")}
        </button>
        <button
          onClick={() => mudarAba("documentos")}
          aria-current={abaAtiva === "documentos" ? "page" : undefined}
          className={`pb-3 shrink-0 transition-colors relative flex items-center gap-2 cursor-pointer ${
            abaAtiva === "documentos"
              ? "text-blue-900 font-semibold border-b-2 border-blue-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("sistemas.detalhe.abas.documentos")}
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-normal">
            {documentosDoSistema.length}
          </span>
        </button>
        {verInfraestrutura && (
        <button
          onClick={() => mudarAba("infraestrutura")}
          aria-current={abaAtiva === "infraestrutura" ? "page" : undefined}
          className={`pb-3 shrink-0 transition-colors relative cursor-pointer ${
            abaAtiva === "infraestrutura"
              ? "text-blue-900 font-semibold border-b-2 border-blue-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("sistemas.detalhe.abas.infraestrutura")}
        </button>
        )}
      </div>

      {/* Conteúdo Alternável pelas Tabs */}
      {abaAtiva === "geral" ? (
        <SistemaFichaTecnica sistema={sistemaAtivo} />
      ) : abaAtiva === "documentos" ? (
        <div className="space-y-6">
          <AnexarDocumentoForm
            categorias={categoriasPublicas}
            enviando={enviandoDoc}
            onSubmit={handleAnexar}
          />

          <DocumentosDoSistemaTabela
            documentos={documentosDoSistema}
            categorias={categoriasPublicas}
            busca={buscaDoc}
            onBuscaChange={setBuscaDoc}
            onEditar={abrirEditarDocumento}
            onApagar={handleApagarDoc}
            podeApagar={podeApagarDocumentos}
          />
        </div>
      ) : (
        <InfraestruturaTab sistema={sistemaAtivo} podeGerir={podeGerirInfra} />
      )}
    </div>
  );
}