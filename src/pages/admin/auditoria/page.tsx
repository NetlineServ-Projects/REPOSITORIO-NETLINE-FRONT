import { useState, type SetStateAction } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuditoria, filtrosDoUrl, paginaDoUrl, paraUrl } from "../../../hooks/useAuditoria";
import { ACOES_AUDITORIA, FILTROS_AUDITORIA_VAZIOS, type FiltrosAuditoria } from "../../../types/auditoria";
import SelectPesquisavel from "../../../components/selectPesquisavel";
import Paginacao from "../../../components/paginacao";
import { IconPesquisa, IconVer } from "../../../components/icons";
import { CLASSE_ACAO, classeEstado, formatarDataHora } from "./estilos";

const CLASSE_CAMPO =
  "w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-800";

// Auditoria (só administradores): cada pedido feito à API, com quem, quando, o quê e o resultado.
// Não substitui a "Atividade recente" do painel, que continua a mostrar as acções em linguagem simples.
export default function AuditoriaPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Filtros aplicados e página vêm do URL (voltar dos detalhes reabre a lista onde estava)
  const filtrosAplicados = filtrosDoUrl(searchParams);
  const pagina = paginaDoUrl(searchParams);
  const auditoria = useAuditoria(filtrosAplicados, pagina);
  // O formulário pode ter alterações ainda não aplicadas (só valem ao carregar em "Filtrar")
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(filtrosAplicados);

  const mudar = (campo: keyof FiltrosAuditoria, valor: string) => setFiltros((f) => ({ ...f, [campo]: valor }));

  // Filtros novos começam na primeira página
  const filtrar = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(paraUrl(filtros, 1));
  };

  const limpar = () => {
    setFiltros(FILTROS_AUDITORIA_VAZIOS);
    setSearchParams({});
  };

  // A paginação chama-o como um setState (número ou função da página atual)
  const irPara = (n: SetStateAction<number>) =>
    setSearchParams(paraUrl(filtrosAplicados, typeof n === "function" ? n(pagina) : n));

  const nomeFuncionalidade = (f: string | null) =>
    f ? t(`auditoria.funcionalidades.${f}`, { defaultValue: f }) : "";

  const dados = auditoria.dados;
  const registos = dados?.registos ?? [];

  return (
    <div className="space-y-5 pb-10">
      {/* Cabeçalho: o banner azul das outras páginas */}
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
            {t("auditoria.sobretitulo")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{t("auditoria.titulo")}</h1>
          <p className="text-sm text-blue-100/90 mt-1">{t("auditoria.descricao")}</p>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={filtrar} className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <label className="block">
            <span className="sr-only">{t("auditoria.filtros.desde")}</span>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => mudar("desde", e.target.value)}
              title={t("auditoria.filtros.desde")}
              className={CLASSE_CAMPO}
            />
          </label>
          <label className="block">
            <span className="sr-only">{t("auditoria.filtros.ate")}</span>
            <input
              type="date"
              value={filtros.ate}
              min={filtros.desde || undefined}
              onChange={(e) => mudar("ate", e.target.value)}
              title={t("auditoria.filtros.ate")}
              className={CLASSE_CAMPO}
            />
          </label>
          <input
            type="search"
            value={filtros.utilizador}
            onChange={(e) => mudar("utilizador", e.target.value)}
            placeholder={t("auditoria.filtros.utilizador")}
            aria-label={t("auditoria.filtros.utilizador")}
            className={CLASSE_CAMPO}
          />
          <SelectPesquisavel
            valor={filtros.acao}
            onChange={(v) => mudar("acao", v)}
            opcaoVazia={t("auditoria.filtros.todasAcoes")}
            aria-label={t("auditoria.filtros.acao")}
            comBusca={false}
            opcoes={ACOES_AUDITORIA.map((a) => ({ valor: a, label: t(`auditoria.acoes.${a}`) }))}
          />
          <SelectPesquisavel
            valor={filtros.funcionalidade}
            onChange={(v) => mudar("funcionalidade", v)}
            opcaoVazia={t("auditoria.filtros.todasFuncionalidades")}
            aria-label={t("auditoria.filtros.funcionalidade")}
            opcoes={auditoria.funcionalidades.map((f) => ({ valor: f, label: nomeFuncionalidade(f), descricao: f }))}
          />
          <SelectPesquisavel
            valor={filtros.resultado}
            onChange={(v) => mudar("resultado", v)}
            opcaoVazia={t("auditoria.filtros.todosResultados")}
            aria-label={t("auditoria.filtros.resultado")}
            comBusca={false}
            opcoes={[
              { valor: "sucesso", label: t("auditoria.filtros.sucesso") },
              { valor: "erro", label: t("auditoria.filtros.erro") },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-netline-azul hover:bg-blue-900 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <IconPesquisa />
            {t("auditoria.filtrar")}
          </button>
          <button
            type="button"
            onClick={limpar}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            {t("auditoria.limpar")}
          </button>
        </div>
      </form>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
        {auditoria.erro ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-red-600">{auditoria.erro}</p>
            <button
              type="button"
              onClick={() => auditoria.recarregar()}
              className="text-sm font-semibold text-netline-azul hover:underline cursor-pointer"
            >
              {t("auditoria.tentarNovamente")}
            </button>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${auditoria.aCarregar ? "opacity-60" : ""}`}>
            <table className="w-full min-w-240 text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-3">{t("auditoria.colunas.data")}</th>
                  <th className="px-4 py-3">{t("auditoria.colunas.utilizador")}</th>
                  <th className="px-4 py-3">{t("auditoria.colunas.perfil")}</th>
                  <th className="px-4 py-3">{t("auditoria.colunas.acao")}</th>
                  <th className="px-4 py-3">{t("auditoria.colunas.funcionalidade")}</th>
                  <th className="px-4 py-3">{t("auditoria.colunas.pedido")}</th>
                  <th className="px-4 py-3">{t("auditoria.colunas.estado")}</th>
                  <th className="px-2 py-3">
                    <span className="sr-only">{t("auditoria.colunas.ver")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                      {auditoria.aCarregar ? t("auditoria.aCarregar") : t("auditoria.vazio")}
                    </td>
                  </tr>
                ) : (
                  registos.map((r) => {
                    const anonimo = !r.usuarioNome && !r.usuarioEmail;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                          {formatarDataHora(r.criadoEm, i18n.language)}
                        </td>
                        <td className="px-4 py-2.5 max-w-56">
                          {anonimo ? (
                            <span className="text-slate-400 font-semibold text-xs uppercase">{t("auditoria.anonimo")}</span>
                          ) : (
                            <span className="block truncate text-slate-800" title={r.usuarioEmail ?? undefined}>
                              {r.usuarioNome || r.usuarioEmail}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{r.perfilNome || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-md border ${CLASSE_ACAO[r.acao] ?? ""}`}
                          >
                            {t(`auditoria.acoes.${r.acao}`, { defaultValue: r.acao })}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                          {nomeFuncionalidade(r.funcionalidade) || "—"}
                        </td>
                        <td className="px-4 py-2.5 max-w-80">
                          <code className="block truncate font-mono text-xs text-slate-600" title={`${r.metodo} ${r.caminho}`}>
                            <span className="font-semibold text-slate-800">{r.metodo}</span> {r.caminho}
                          </code>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded-md ${classeEstado(r.estado)}`}>
                            {r.estado}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          {/* Abre a página do registo; a lista (com os filtros) fica no "Voltar" */}
                          <Link
                            to={`/dashboard/auditoria/${r.id}`}
                            state={{ voltarPara: `${location.pathname}${location.search}` }}
                            title={t("auditoria.colunas.ver")}
                            aria-label={t("auditoria.verRegisto", { id: r.id })}
                            className="inline-flex p-2 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <IconVer />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dados && (
        <>
          {dados.totalPaginas <= 1 && (
            <p className="text-xs text-slate-400 px-1">{t("auditoria.total", { count: dados.total })}</p>
          )}
          <Paginacao
            pagina={dados.pagina}
            totalPaginas={dados.totalPaginas}
            totalItens={dados.total}
            porPagina={dados.porPagina}
            irPara={irPara}
          />
        </>
      )}
    </div>
  );
}
