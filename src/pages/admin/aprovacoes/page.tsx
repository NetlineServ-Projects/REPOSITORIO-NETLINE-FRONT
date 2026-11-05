import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAcoesEmCurso } from "../../../hooks/useAcoesEmCurso";
import { useAprovacoesData } from "../../../hooks/useAprovacoesData";
import { Link } from "react-router-dom";
import { IconVer } from "../../../components/icons";
import SearchInput from "../../../components/searchInput";
import ViewToggle from "../../../components/viewToggle";
import DocumentoRow from "../../../components/documentoRow";
import DocumentoCard from "../../../components/documentoCard";
import ModalMotivoRejeicao from "./modalMotivoRejeicao";
import { toast } from "sonner";
import SelectPesquisavel from "../../../components/selectPesquisavel";
import { EstadoCarregando, EstadoErro, EstadoVazio, IndicadorAtualizar } from "../../../components/estados";
import { usePaginacao } from "../../../hooks/usePaginacao";
import Paginacao from "../../../components/paginacao";

export default function AprovacoesPage() {
  const { t } = useTranslation();
  const { documentos, categorias, loading, aAtualizar, erro, recarregar, alterarEstado } =
    useAprovacoesData();

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("PENDENTE");
  const [modoExibicao, setModoExibicao] = useState<"tabela" | "cards">(
    "tabela",
  );
  const [idParaRejeitar, setIdParaRejeitar] = useState<number | null>(null);

  // Um duplo clique em "Aprovar" não envia o pedido duas vezes
  const { executar, estaEmCurso } = useAcoesEmCurso();
  const handleAprovar = (id: number) =>
    executar(id, async () => {
      try {
        await alterarEstado(id, "APROVADO");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("admin.aprovacoes.erroAprovar"));
      }
    });

  const confirmarRejeicao = async (motivo: string) => {
    if (idParaRejeitar === null) return;
    try {
      await alterarEstado(idParaRejeitar, "REJEITADO", motivo || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.aprovacoes.erroRejeitar"));
    } finally {
      setIdParaRejeitar(null);
    }
  };

  const documentosFiltrados = documentos.filter((doc) => {
    const nomeDoc = doc.titulo || doc.nomeArquivo || "";
    const autorDoc = doc.usuario?.nome || "";
    const catDoc = doc.categoria?.nome || "";
    const atendeBusca =
      nomeDoc.toLowerCase().includes(busca.toLowerCase()) ||
      autorDoc.toLowerCase().includes(busca.toLowerCase());
    const atendeCategoria =
      categoriaFiltro === "Todas" ||
      catDoc.toLowerCase() === categoriaFiltro.toLowerCase();
    const atendeStatus =
      statusFiltro === "Todos" || doc.estado === statusFiltro;
    return atendeBusca && atendeCategoria && atendeStatus;
  });

  const totalPendentes = documentos.filter(
    (d) => d.estado === "PENDENTE",
  ).length;

  // Mostra 10 de cada vez
  const paginacao = usePaginacao(documentosFiltrados);

  if (loading) {
    return <EstadoCarregando mensagem={t("admin.aprovacoes.carregando")} />;
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={recarregar} />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
            {t("admin.aprovacoes.eyebrow")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t("admin.aprovacoes.titulo")}
          </h1>
          <p className="text-sm text-blue-100/80 mt-1">
            {t("admin.aprovacoes.subtitulo")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-400/20 text-amber-200 border border-amber-300/30 px-4 py-2.5 rounded-xl backdrop-blur-sm self-start md:self-auto shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-xs font-bold">
            {t("admin.aprovacoes.pendentes", { count: totalPendentes })}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder={t("admin.aprovacoes.pesquisar")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:flex md:flex-wrap md:items-center md:gap-3 md:w-auto">
          <SelectPesquisavel
            aria-label={t("admin.aprovacoes.filtrarEstado")}
            className="w-full md:w-48"
            valor={statusFiltro}
            onChange={setStatusFiltro}
            opcoes={[
              { valor: "PENDENTE", label: t("admin.aprovacoes.apenasPendentes") },
              { valor: "APROVADO", label: t("admin.aprovacoes.apenasAprovados") },
              { valor: "REJEITADO", label: t("admin.aprovacoes.apenasRejeitados") },
              { valor: "Todos", label: t("admin.aprovacoes.todosEstados") },
            ]}
          />
          <SelectPesquisavel
            aria-label={t("admin.aprovacoes.filtrarCategoria")}
            className="w-full md:w-56"
            valor={categoriaFiltro}
            onChange={setCategoriaFiltro}
            opcoes={[
              { valor: "Todas", label: t("documentos.todasCategorias") },
              ...categorias.map((cat) => ({ valor: cat.nome, label: cat.nome })),
            ]}
          />
          <IndicadorAtualizar ativo={aAtualizar} />
          <div className="hidden xl:block">
            <ViewToggle modo={modoExibicao} onChange={setModoExibicao} />
          </div>
        </div>
      </div>

      {/* A tabela só aparece a partir de xl (com a barra lateral não cabe antes); no telemóvel usam-se sempre os cartões */}
      {modoExibicao === "tabela" && (
        <div className="hidden xl:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-xs border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">{t("documentos.tabela.documento")}</th>
                  <th className="py-3.5 px-4 font-semibold">{t("documentos.tabela.categoria")}</th>
                  <th className="py-3.5 px-4 font-semibold">{t("documentos.tabela.submetidoPor")}</th>
                  <th className="py-3.5 px-4 font-semibold">{t("documentos.tabela.data")}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    {t("admin.aprovacoes.acoesGestor")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentosFiltrados.length > 0 ? (
                  paginacao.itens.map((doc) => (
                    <DocumentoRow
                      key={doc.id}
                      doc={doc}
                      acoes={
                        <>
                          <Link
                            to={`/dashboard/aprovacoes/details/${doc.id}`}
                            className="p-2 md:p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200/60 inline-flex"
                            title={t("admin.aprovacoes.verDetalhes")}
                          >
                            <IconVer />
                          </Link>
                          {doc.estado === "PENDENTE" ? (
                            <>
                              <button
                                onClick={() => handleAprovar(doc.id)}
                                disabled={estaEmCurso(doc.id)}
                                className="disabled:opacity-60 disabled:cursor-wait px-3 py-2 md:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                              >
                                {t("admin.aprovacoes.aprovar")}
                              </button>
                              <button
                                onClick={() => setIdParaRejeitar(doc.id)}
                                className="px-3 py-2 md:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-xs font-semibold rounded-lg transition-colors"
                              >
                                {t("admin.aprovacoes.rejeitar")}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic pl-2">
                              {t("admin.aprovacoes.concluido")}
                            </span>
                          )}
                        </>
                      }
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      {t("admin.aprovacoes.nenhuma")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 ${modoExibicao === "tabela" ? "xl:hidden" : ""}`}>
        {documentosFiltrados.length > 0 ? (
          paginacao.itens.map((doc) => (
            <DocumentoCard
              key={doc.id}
              doc={doc}
              acoes={
                <>
                  <Link
                    to={`/dashboard/aprovacoes/details/${doc.id}`}
                    className="p-2 md:p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200/60"
                    title={t("admin.aprovacoes.verDetalhes")}
                  >
                    <IconVer />
                  </Link>
                  {doc.estado === "PENDENTE" ? (
                    <>
                      <button
                        onClick={() => handleAprovar(doc.id)}
                        disabled={estaEmCurso(doc.id)}
                        className="disabled:opacity-60 disabled:cursor-wait px-3 py-2 md:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        {t("admin.aprovacoes.aprovar")}
                      </button>
                      <button
                        onClick={() => setIdParaRejeitar(doc.id)}
                        className="px-3 py-2 md:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-xs font-semibold rounded-lg transition-colors"
                      >
                        {t("admin.aprovacoes.rejeitar")}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic pl-2">
                      {t("admin.aprovacoes.concluido")}
                    </span>
                  )}
                </>
              }
            />
          ))
        ) : (
          <div className="col-span-full">
            <EstadoVazio mensagem={t("admin.aprovacoes.nenhuma")} />
          </div>
        )}
      </div>

      <ModalMotivoRejeicao
        aberto={idParaRejeitar !== null}
        onConfirmar={confirmarRejeicao}
        onCancelar={() => setIdParaRejeitar(null)}
      />
      <Paginacao {...paginacao} />
    </div>
  );
}