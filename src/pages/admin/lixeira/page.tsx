import { useState } from "react";
import { toast } from "sonner";
import { Trans, useTranslation } from "react-i18next";
import { useLixeiraData } from "../../../hooks/useLixeiraData";
import { useConfirmacao } from "../../../components/confirmacao";
import { useAcoesEmCurso } from "../../../hooks/useAcoesEmCurso";
import { EstadoCarregando, EstadoErro, EstadoVazio, IndicadorAtualizar } from "../../../components/estados";
import { usePaginacao } from "../../../hooks/usePaginacao";
import Paginacao from "../../../components/paginacao";

// Dias até à exclusão definitiva (vermelho quando faltam 5 ou menos)
function BadgeDiasRestantes({ dias }: { dias: number }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${
        dias <= 5
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
    >
      {dias === 0 ? t("admin.lixeira.expiraHoje") : t("admin.lixeira.dias", { count: dias })}
    </span>
  );
}

export default function LixeiraPage() {
  const { t } = useTranslation();
  const {
    documentos,
    loading,
    aAtualizar,
    erro,
    refetch,
    restaurar,
    excluirDefinitivo,
    esvaziar,
  } = useLixeiraData();

  const [termoPesquisa, setTermoPesquisa] = useState("");
  const confirmar = useConfirmacao();
  const { executar, estaEmCurso } = useAcoesEmCurso();

  // =========================================================
  // FORMATAR TAMANHO
  // =========================================================

  const formatarTamanho = (
    bytes?: string | number | null,
  ): string => {
    if (bytes === undefined || bytes === null || bytes === "") {
      return t("admin.lixeira.semTamanho");
    }

    const numBytes = Number(bytes);

    if (Number.isNaN(numBytes)) {
      return t("admin.lixeira.semTamanho");
    }

    if (numBytes === 0) {
      return "0 B";
    }

    const k = 1024;
    const tamanhos = ["B", "KB", "MB", "GB"];

    const indice = Math.min(
      Math.floor(Math.log(numBytes) / Math.log(k)),
      tamanhos.length - 1,
    );

    return `${parseFloat(
      (numBytes / Math.pow(k, indice)).toFixed(1),
    )} ${tamanhos[indice]}`;
  };

  // =========================================================
  // CALCULAR DIAS RESTANTES
  // =========================================================

  const calcularDiasRestantes = (
    apagadoEm?: string | null,
  ): number => {
    if (!apagadoEm) {
      return 30;
    }

    const dataEliminacao = new Date(apagadoEm);

    if (Number.isNaN(dataEliminacao.getTime())) {
      return 30;
    }

    const dataLimite = new Date(dataEliminacao);

    dataLimite.setDate(
      dataLimite.getDate() + 30,
    );

    const hoje = new Date();

    const diferenca =
      dataLimite.getTime() - hoje.getTime();

    const dias = Math.ceil(
      diferenca / (1000 * 60 * 60 * 24),
    );

    return Math.max(dias, 0);
  };

  // =========================================================
  // RESTAURAR DOCUMENTO
  // =========================================================

  const handleRestaurar = (id: number, titulo: string) =>
    executar(id, async () => {
      try {
        await restaurar(id);
        toast.success(t("admin.lixeira.restaurado", { titulo }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("comum.erros.restaurarDocumento"));
      }
    });

  // =========================================================
  // ELIMINAR DEFINITIVAMENTE
  // =========================================================

  const handleExcluirDefinitivo = async (id: number, titulo: string) => {
    try {
      const apagado = await confirmar({
        titulo: t("admin.lixeira.modalEliminar.titulo"),
        mensagem: (
          <Trans
            i18nKey="admin.lixeira.modalEliminar.mensagem"
            values={{ titulo }}
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("admin.lixeira.modalEliminar.confirmar"),
        textoCarregando: t("admin.lixeira.modalEliminar.aEliminar"),
        perigoso: true,
        acao: () => excluirDefinitivo(id),
      });
      if (apagado) toast.success(t("admin.lixeira.eliminado", { titulo }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("comum.erros.eliminarDocumento"));
    }
  };

  // =========================================================
  // ESVAZIAR LIXEIRA
  // =========================================================

  const handleEsvaziar = async () => {
    try {
      const esvaziada = await confirmar({
        titulo: t("admin.lixeira.modalEsvaziar.titulo"),
        mensagem: (
          <Trans
            i18nKey="admin.lixeira.modalEsvaziar.mensagem"
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("admin.lixeira.modalEsvaziar.confirmar"),
        textoCarregando: t("admin.lixeira.modalEsvaziar.aEsvaziar"),
        perigoso: true,
        acao: esvaziar,
      });
      if (esvaziada) toast.success(t("admin.lixeira.esvaziada"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("comum.erros.esvaziarLixeira"));
    }
  };

  // =========================================================
  // FILTRAR DOCUMENTOS
  // =========================================================

  const documentosFiltrados = documentos.filter((doc) => {
    const termo = termoPesquisa.toLowerCase();
    const titulo = (doc.titulo || "").toLowerCase();
    const autor = (doc.usuario?.nome || "").toLowerCase();

    return titulo.includes(termo) || autor.includes(termo);
  });

  // =========================================================
  // LOADING
  // =========================================================

  // Mostra 10 de cada vez
  const paginacao = usePaginacao(documentosFiltrados);

  if (loading) {
    return <EstadoCarregando mensagem={t("admin.lixeira.carregando")} />;
  }

  // =========================================================
  // ERRO
  // =========================================================

  if (erro) {
    return (
      <EstadoErro
        titulo={t("admin.lixeira.erroTitulo")}
        mensagem={erro}
        onTentarNovamente={refetch}
      />
    );
  }

  // =========================================================
  // PÁGINA
  // =========================================================

  return (
    <div className="w-full space-y-6">

      {/* BANNER SUPERIOR */}
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
            {t("documentos.repositorio")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{t("admin.lixeira.titulo")}</h1>
          <p className="text-sm text-blue-100/90 mt-1">
            {t("admin.lixeira.subtitulo")}
          </p>
        </div>

        {documentos.length > 0 && (
          <button
            type="button"
            onClick={handleEsvaziar}
            className="px-4 py-2.5 bg-red-50/10 hover:bg-red-500/20 text-red-200 font-medium rounded-xl text-sm transition-colors border border-red-400/30 w-full sm:w-auto sm:self-auto cursor-pointer whitespace-nowrap backdrop-blur-sm"
          >
            {t("admin.lixeira.esvaziar")}
          </button>
        )}
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            placeholder={t("documentos.pesquisarPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-netline-azul/20 focus:border-netline-azul transition-all"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <IndicadorAtualizar ativo={aAtualizar} />
      </div>

      {/* CONTAINER DA TABELA */}
      {documentosFiltrados.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <>
          {/* Telemóvel: um cartão por documento, com as mesmas ações da tabela */}
          <ul className="xl:hidden divide-y divide-slate-100">
            {paginacao.itens.map((documento) => {
              const titulo = documento.titulo || t("comum.documentoSemTitulo");
              const diasRestantes = calcularDiasRestantes(documento.apagadoEm);

              return (
                <li key={documento.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate" title={titulo}>
                        {titulo}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {t("admin.lixeira.por", { autor: documento.usuario?.nome || t("componentes.documento.sistema") })} · {formatarTamanho(documento.tamanho)}
                      </p>
                    </div>
                    <BadgeDiasRestantes dias={diasRestantes} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs text-slate-600 font-medium mr-auto">
                      {documento.categoria?.nome || t("dashboard.documentosRecentes.geral")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRestaurar(documento.id, titulo)}
                      disabled={estaEmCurso(documento.id)}
                      className="disabled:opacity-50 disabled:cursor-wait px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg text-xs transition-colors border border-emerald-200 cursor-pointer"
                    >
                      {t("admin.lixeira.restaurar")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirDefinitivo(documento.id, titulo)}
                      className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium rounded-lg text-xs transition-colors border border-slate-200 cursor-pointer"
                    >
                      {t("comum.apagar")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">{t("documentos.tabela.documento")}</th>
                  <th className="py-3 px-4">{t("documentos.tabela.categoria")}</th>
                  <th className="py-3 px-4">{t("documentos.detalhes.tamanho")}</th>
                  <th className="py-3 px-4">{t("admin.lixeira.eliminacaoEm")}</th>
                  <th className="py-3 px-4 text-right">{t("comum.acoes")}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm">
                {paginacao.itens.map((documento) => {
                  const titulo =
                    documento.titulo || t("comum.documentoSemTitulo");

                  const categoria =
                    documento.categoria?.nome || t("dashboard.documentosRecentes.geral");

                  const autor =
                    documento.usuario?.nome || t("componentes.documento.sistema");

                  const diasRestantes =
                    calcularDiasRestantes(documento.apagadoEm);

                  return (
                    <tr
                      key={documento.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div
                          className="truncate max-w-xs font-medium text-slate-800"
                          title={titulo}
                        >
                          {titulo}
                        </div>
                        <span className="text-xs text-slate-400">
                          {t("admin.lixeira.por", { autor })}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs text-slate-600 font-medium">
                          {categoria}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {formatarTamanho(documento.tamanho)}
                      </td>

                      <td className="py-4 px-4">
                        <BadgeDiasRestantes dias={diasRestantes} />
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleRestaurar(documento.id, titulo)
                          }
                          disabled={estaEmCurso(documento.id)}
                          className="disabled:opacity-50 disabled:cursor-wait px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg text-xs transition-colors border border-emerald-200 cursor-pointer mr-2"
                        >
                          {t("admin.lixeira.restaurar")}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleExcluirDefinitivo(documento.id, titulo)
                          }
                          className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium rounded-lg text-xs transition-colors border border-slate-200 cursor-pointer"
                        >
                          {t("comum.apagar")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        </div>
      ) : (
        <EstadoVazio
          mensagem={termoPesquisa ? t("admin.lixeira.semResultados") : t("admin.lixeira.vazia")}
          descricao={
            termoPesquisa
              ? t("admin.lixeira.semResultadosDescricao", { termo: termoPesquisa })
              : t("admin.lixeira.vaziaDescricao")
          }
        />
      )}

      <Paginacao {...paginacao} />
    </div>
  );
}