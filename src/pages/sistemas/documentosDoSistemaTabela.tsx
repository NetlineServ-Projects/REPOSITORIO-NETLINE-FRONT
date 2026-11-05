import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { IconPasta, IconDownload, IconVer } from "../../components/icons";
import FilterSelect from "../../components/filterSelect";
import PainelFiltros from "../../components/painelFiltros";
import StatusBadge from "../../components/statusBadge";
import type { Documento } from "../../hooks/useSistemasData";
import type { Categoria } from "../../types/documento";
import { formatarTamanho, obterUrlTransferencia } from "../../utils/documentos";
import { classificarTipo, OPCOES_TIPO } from "../../utils/tipoDocumento";
import { API_URL } from "../../utils/api";
import { useTranslation } from "react-i18next";
import i18n from "../../lang/i18n";

interface DocumentosDoSistemaTabelaProps {
  documentos: Documento[];
  categorias: Categoria[];
  busca: string;
  onBuscaChange: (v: string) => void;
  onEditar: (doc: Documento) => void;
  onApagar: (id: number) => void;
  // Só quem tem documentos.eliminar (DELETE /documentos/:id verifica a permissão)
  podeApagar: boolean;
}

// Ações de cada documento: as mesmas na tabela (lg+) e nos cartões (ecrãs menores)
function AcoesDocumento({
  doc,
  onEditar,
  onApagar,
  podeApagar,
}: {
  doc: Documento;
  onEditar: (doc: Documento) => void;
  onApagar: (id: number) => void;
  podeApagar: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        to={`/dashboard/documentos/${doc.id}`}
        className="p-2 lg:p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200/60"
        title={t("comum.verDocumento")}
        aria-label={t("comum.verDocumento")}
      >
        <IconVer />
      </Link>
      <a
        href={obterUrlTransferencia(doc.caminho, API_URL)}
        download={doc.nomeArquivo}
        className="p-2 lg:p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg transition-colors border border-blue-100"
        title={t("sistemas.documentos.descarregar")}
        aria-label={t("sistemas.documentos.descarregar")}
      >
        <IconDownload />
      </a>
      <button
        onClick={() => onEditar(doc)}
        className="px-3 py-2 lg:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg transition-colors border border-blue-100"
      >
        {t("comum.editar")}
      </button>
      {podeApagar && (
        <button
          onClick={() => onApagar(doc.id)}
          className="px-3 py-2 lg:py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-xs font-semibold rounded-lg transition-colors"
        >
          {t("comum.apagar")}
        </button>
      )}
    </div>
  );
}

function dataDoc(doc: Documento) {
  return doc.dataSubmissao ? new Date(doc.dataSubmissao).toLocaleDateString(i18n.language === "en" ? "en-GB" : "pt-PT") : "-";
}

export default function DocumentosDoSistemaTabela({
  documentos,
  categorias,
  busca,
  onBuscaChange,
  onEditar,
  onApagar,
  podeApagar,
}: DocumentosDoSistemaTabelaProps) {
  const { t } = useTranslation();
  const [categoriaFiltro, setCategoriaFiltro] = useState<string[]>([]);
  const [autorFiltro, setAutorFiltro] = useState<string[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<string[]>([]);

  // Opções formatadas para o FilterSelect ({ valor, label })
  const opcoesCategorias = useMemo(
    () => categorias.map((c) => ({ valor: c.nome, label: c.nome })),
    [categorias],
  );

  const opcoesAutores = useMemo(() => {
    const nomes = documentos
      .map((d) => d.usuario?.nome)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(nomes))
      .sort()
      .map((nome) => ({ valor: nome, label: nome }));
  }, [documentos]);

  const opcoesTipos = useMemo(
    () =>
      OPCOES_TIPO.filter((o) => o.valor !== "TODOS").map((o) => ({
        valor: o.valor,
        label: t(`sistemas.documentos.tipos.${o.valor}`),
      })),
    [t],
  );

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const catDoc = doc.categoria?.nome || "";
      const autorDoc = doc.usuario?.nome || "";

      const atendeCategoria =
        categoriaFiltro.length === 0 || categoriaFiltro.includes(catDoc);
      const atendeAutor =
        autorFiltro.length === 0 || autorFiltro.includes(autorDoc);
      const atendeTipo =
        tipoFiltro.length === 0 ||
        tipoFiltro.includes(classificarTipo(doc.tipoArquivo));

      return atendeCategoria && atendeAutor && atendeTipo;
    });
  }, [documentos, categoriaFiltro, autorFiltro, tipoFiltro]);

  const possuiFiltrosAtivos =
    categoriaFiltro.length > 0 ||
    autorFiltro.length > 0 ||
    tipoFiltro.length > 0;

  const limparFiltros = useCallback(() => {
    setCategoriaFiltro([]);
    setAutorFiltro([]);
    setTipoFiltro([]);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Barra de Pesquisa e Filtros Customizados */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="font-bold text-slate-800 text-sm">
            {t("sistemas.documentos.titulo", { count: documentosFiltrados.length })}
          </h3>

          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              placeholder={t("sistemas.documentos.pesquisarPlaceholder")}
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        <PainelFiltros ativos={categoriaFiltro.length + autorFiltro.length + tipoFiltro.length}>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 lg:flex lg:flex-wrap lg:items-center gap-3 pt-1">
          <div className="lg:w-48">
            <FilterSelect
              label={t("documentos.categoria")}
              placeholder={t("documentos.todasCategorias")}
              opcoes={opcoesCategorias}
              selecionados={categoriaFiltro}
              onChange={setCategoriaFiltro}
            />
          </div>

          <div className="lg:w-48">
            <FilterSelect
              label={t("comum.autor")}
              placeholder={t("comum.todosAutores")}
              opcoes={opcoesAutores}
              selecionados={autorFiltro}
              onChange={setAutorFiltro}
            />
          </div>

          <div className="lg:w-48">
            <FilterSelect
              label={t("sistemas.documentos.tipo")}
              placeholder={t("comum.todosTipos")}
              opcoes={opcoesTipos}
              selecionados={tipoFiltro}
              onChange={setTipoFiltro}
            />
          </div>

          {possuiFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-xs text-rose-600 font-semibold hover:underline px-1 py-1 rounded transition-colors self-end mb-1"
            >
              {t("comum.limparFiltros")}
            </button>
          )}
        </div>
        </PainelFiltros>
      </div>

      {/* Ecrãs menores: um cartão por documento, com as mesmas ações da tabela */}
      <ul className="lg:hidden divide-y divide-slate-100">
        {documentosFiltrados.length > 0 ? (
          documentosFiltrados.map((doc) => (
            <li key={doc.id} className="p-4 space-y-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <IconPasta className="text-blue-900 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-800 break-all">
                    {doc.titulo || doc.nomeArquivo || t("sistemas.documentos.semNome")}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {doc.usuario?.nome || t("sistemas.documentos.autorSistema")} · {formatarTamanho(doc.tamanho)} · {dataDoc(doc)}
                  </p>
                </div>
              </div>
              {doc.estado === "REJEITADO" && doc.motivoRejeicao && (
                <p className="text-[11px] text-rose-600">{doc.motivoRejeicao}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge estado={doc.estado} />
                <AcoesDocumento doc={doc} onEditar={onEditar} onApagar={onApagar} podeApagar={podeApagar} />
              </div>
            </li>
          ))
        ) : (
          <li className="text-center py-10 px-4 text-slate-400 text-xs">
            {t("sistemas.documentos.vazio")}
          </li>
        )}
      </ul>

      {/* Tabela de Listagem de Documentos */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[11px] border-b border-slate-100 tracking-wider">
            <tr>
              <th className="py-3 px-4 font-semibold">{t("sistemas.documentos.colunas.documento")}</th>
              <th className="py-3 px-4 font-semibold">{t("sistemas.documentos.colunas.estado")}</th>
              <th className="py-3 px-4 font-semibold">{t("sistemas.documentos.colunas.autor")}</th>
              <th className="py-3 px-4 font-semibold">{t("sistemas.documentos.colunas.tamanho")}</th>
              <th className="py-3 px-4 font-semibold">{t("sistemas.documentos.colunas.data")}</th>
              <th className="py-3 px-4 font-semibold text-right">{t("comum.acoes")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documentosFiltrados.length > 0 ? (
              documentosFiltrados.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                    <IconPasta className="text-blue-900 shrink-0" />
                    <span className="truncate max-w-xs sm:max-w-md">
                      {doc.titulo || doc.nomeArquivo || t("sistemas.documentos.semNome")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge estado={doc.estado} />
                    {doc.estado === "REJEITADO" && doc.motivoRejeicao && (
                      <p className="text-[11px] text-rose-600 mt-1 max-w-56 whitespace-normal" title={doc.motivoRejeicao}>
                        {doc.motivoRejeicao}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {doc.usuario?.nome || t("sistemas.documentos.autorSistema")}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatarTamanho(doc.tamanho)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {dataDoc(doc)}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <AcoesDocumento doc={doc} onEditar={onEditar} onApagar={onApagar} podeApagar={podeApagar} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-10 text-slate-400 text-xs"
                >
                  {t("sistemas.documentos.vazio")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
