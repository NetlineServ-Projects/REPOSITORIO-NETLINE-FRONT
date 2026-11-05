import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Trans, useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faPlus, faUserShield, faUsers } from "@fortawesome/free-solid-svg-icons";
import { fetchComToken } from "../../../utils/api";
import { API_ENDPOINTS } from "../../../data/client/endpoint";
import { useCarregamento } from "../../../hooks/useCarregamento";
import { useConfirmacao } from "../../../components/confirmacao";
import { EstadoCarregando, EstadoErro } from "../../../components/estados";
import { useUsuario } from "../../../components/usuarioContext";
import { PERMISSOES } from "../../../utils/permissoes";

interface PerfilAcesso {
  id: number;
  nome: string;
  descricao: string;
  administrador: boolean;
  permissoes: string[];
  totalUtilizadores: number;
}

interface GrupoPermissoes {
  grupo: string;
  permissoes: string[];
}

interface Formulario {
  nome: string;
  descricao: string;
  permissoes: string[];
}

// Iguais ao backend (constants/permissoes.js): quem gere tem de conseguir ver
const DEPENDENCIAS: Record<string, string[]> = {
  [PERMISSOES.SISTEMAS_GERIR]: [PERMISSOES.SISTEMAS_CRIAR],
  [PERMISSOES.SISTEMAS_INFRA_GERIR]: [PERMISSOES.SISTEMAS_INFRA_VER],
  [PERMISSOES.INFRA_GERIR]: [PERMISSOES.INFRA_VER],
};

const FORM_VAZIO: Formulario = { nome: "", descricao: "", permissoes: [] };

// Configurações → Perfis e permissões (só o Administrador). À esquerda os perfis,
// à direita o perfil escolhido com as permissões agrupadas por área.
export default function PerfisPage() {
  const { t } = useTranslation();
  const confirmar = useConfirmacao();
  const { atualizarAcesso } = useUsuario();
  const { carregando, erro, executar } = useCarregamento(t("admin.perfis.erroCarregar"));

  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [grupos, setGrupos] = useState<GrupoPermissoes[]>([]);
  // id do perfil aberto, "novo" para criar, ou null antes de carregar
  const [selecionado, setSelecionado] = useState<number | "novo" | null>(null);
  const [form, setForm] = useState<Formulario>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(
    (manterSelecao?: number) =>
      executar(
        () =>
          Promise.all([
            fetchComToken(API_ENDPOINTS.PERFIS) as Promise<PerfilAcesso[]>,
            fetchComToken(API_ENDPOINTS.PERFIS_PERMISSOES) as Promise<GrupoPermissoes[]>,
          ]),
        ([listaPerfis, listaGrupos]) => {
          setPerfis(listaPerfis);
          setGrupos(listaGrupos);
          const alvo = listaPerfis.find((p) => p.id === manterSelecao) ?? listaPerfis[0];
          if (alvo) abrir(alvo);
        },
      ),
    [executar],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const perfilAberto = typeof selecionado === "number" ? perfis.find((p) => p.id === selecionado) : undefined;
  const bloqueado = Boolean(perfilAberto?.administrador);

  function abrir(perfil: PerfilAcesso) {
    setSelecionado(perfil.id);
    setForm({ nome: perfil.nome, descricao: perfil.descricao, permissoes: perfil.permissoes });
  }

  function abrirNovo() {
    setSelecionado("novo");
    setForm(FORM_VAZIO);
  }

  // Marcar uma permissão marca também aquelas de que depende; desmarcar uma
  // permissão base desmarca as que dependem dela
  function alternar(permissao: string) {
    setForm((atual) => {
      const marcadas = new Set(atual.permissoes);
      if (marcadas.has(permissao)) {
        marcadas.delete(permissao);
        for (const [quem, precisa] of Object.entries(DEPENDENCIAS)) {
          if (precisa.includes(permissao)) marcadas.delete(quem);
        }
      } else {
        marcadas.add(permissao);
        for (const dependencia of DEPENDENCIAS[permissao] ?? []) marcadas.add(dependencia);
      }
      return { ...atual, permissoes: [...marcadas] };
    });
  }

  const semAlteracoes = useMemo(() => {
    if (!perfilAberto) return false;
    return (
      perfilAberto.nome === form.nome.trim() &&
      perfilAberto.descricao === form.descricao.trim() &&
      [...perfilAberto.permissoes].sort().join() === [...form.permissoes].sort().join()
    );
  }, [perfilAberto, form]);

  // Depois de mudar perfis, o próprio menu acompanha (ex: se o Admin mexeu no perfil de alguém
  // e depois no seu, ou para refletir nomes novos)
  async function sincronizarSessao() {
    try {
      atualizarAcesso(await fetchComToken(API_ENDPOINTS.PERFIL));
    } catch {
      // Não é crítico: o menu atualiza-se no próximo carregamento do painel
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (bloqueado || salvando) return;
    if (semAlteracoes) {
      toast.info(t("admin.perfis.semAlteracoes"));
      return;
    }

    setSalvando(true);
    try {
      const corpo = JSON.stringify({
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        permissoes: form.permissoes,
      });
      const guardado = (await (selecionado === "novo"
        ? fetchComToken(API_ENDPOINTS.PERFIS, { method: "POST", body: corpo })
        : fetchComToken(API_ENDPOINTS.PERFIL_BY_ID(selecionado as number), { method: "PATCH", body: corpo }))) as PerfilAcesso;

      toast.success(
        selecionado === "novo"
          ? t("admin.perfis.criado", { nome: guardado.nome })
          : t("admin.perfis.atualizado", { nome: guardado.nome }),
      );
      await carregar(guardado.id);
      sincronizarSessao();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("comum.erros.comunicarServidor"));
    } finally {
      setSalvando(false);
    }
  }

  async function eliminar() {
    if (!perfilAberto || bloqueado) return;
    if (perfilAberto.totalUtilizadores > 0) {
      toast.error(t("admin.perfis.emUso"));
      return;
    }
    try {
      const eliminado = await confirmar({
        titulo: t("admin.perfis.modalEliminar.titulo"),
        mensagem: (
          <Trans
            i18nKey="admin.perfis.modalEliminar.mensagem"
            values={{ nome: perfilAberto.nome }}
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("admin.perfis.modalEliminar.confirmar"),
        textoCarregando: t("admin.perfis.modalEliminar.aEliminar"),
        perigoso: true,
        acao: async () => {
          await fetchComToken(API_ENDPOINTS.PERFIL_BY_ID(perfilAberto.id), { method: "DELETE" });
        },
      });
      if (!eliminado) return;
      toast.success(t("admin.perfis.eliminado", { nome: perfilAberto.nome }));
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("comum.erros.comunicarServidor"));
    }
  }

  const nomePermissao = (p: string) => t(`admin.perfis.itens.${p}.nome`);

  if (carregando) return <EstadoCarregando mensagem={t("admin.perfis.carregando")} />;
  if (erro) return <EstadoErro mensagem={erro} onTentarNovamente={() => carregar()} />;

  return (
    <div className="w-full space-y-6">
      {/* ================= CABEÇALHO ================= */}
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-sm space-y-4">
        <Link
          to="/dashboard/configuracoes"
          className="text-xs font-semibold text-blue-100/80 hover:text-white transition-colors"
        >
          ← {t("admin.perfis.voltar")}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
              {t("admin.perfis.eyebrow")}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">{t("admin.perfis.titulo")}</h1>
            <p className="text-sm text-blue-100/90 mt-1">{t("admin.perfis.subtitulo")}</p>
          </div>
          <button
            type="button"
            onClick={abrirNovo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-netline-azul text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            {t("admin.perfis.novo")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6 items-start">
        {/* ================= LISTA DE PERFIS ================= */}
        <ul className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {perfis.map((perfil) => {
            const ativo = perfil.id === selecionado;
            return (
              <li key={perfil.id}>
                <button
                  type="button"
                  onClick={() => abrir(perfil)}
                  aria-current={ativo ? "true" : undefined}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    ativo ? "bg-blue-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={perfil.administrador ? faUserShield : faUsers}
                    className={`w-4 h-4 mt-0.5 shrink-0 ${perfil.administrador ? "text-purple-600" : "text-netline-azul"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${ativo ? "text-netline-azul" : "text-slate-800"}`}>
                      {perfil.nome}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {t("admin.perfis.utilizadores", { count: perfil.totalUtilizadores })}
                    </span>
                  </span>
                  {perfil.administrador && (
                    <FontAwesomeIcon icon={faLock} className="w-3 h-3 mt-1 text-slate-400" aria-label={t("admin.perfis.bloqueado")} />
                  )}
                </button>
              </li>
            );
          })}
          {selecionado === "novo" && (
            <li className="px-4 py-3.5 bg-blue-50/70 text-sm font-semibold text-netline-azul">
              {form.nome.trim() || t("admin.perfis.novo")}
            </li>
          )}
        </ul>

        {/* ================= PERFIL ABERTO ================= */}
        {selecionado !== null && (
          <form
            onSubmit={guardar}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 space-y-6 min-w-0"
          >
            {bloqueado && (
              <p className="flex items-start gap-2.5 text-sm text-purple-800 bg-purple-50 border border-purple-100 rounded-xl p-4">
                <FontAwesomeIcon icon={faLock} className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {t("admin.perfis.administradorInfo")}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="perfil-nome" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t("admin.perfis.nome")}
                </label>
                <input
                  id="perfil-nome"
                  required
                  minLength={2}
                  maxLength={60}
                  disabled={bloqueado}
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder={t("admin.perfis.nomePlaceholder")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="perfil-descricao" className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t("admin.perfis.descricao")}
                </label>
                <input
                  id="perfil-descricao"
                  maxLength={190}
                  disabled={bloqueado}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder={t("admin.perfis.descricaoPlaceholder")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700 disabled:opacity-60"
                />
              </div>
            </div>

            <fieldset className="space-y-5">
              <legend className="text-sm font-semibold text-slate-700 mb-3">{t("admin.perfis.permissoes")}</legend>
              {grupos.map((grupo) => (
                <div key={grupo.grupo} className="rounded-xl border border-slate-100 overflow-hidden">
                  <h3 className="px-4 py-2.5 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t(`admin.perfis.grupos.${grupo.grupo}`)}
                  </h3>
                  <ul className="divide-y divide-slate-100">
                    {grupo.permissoes.map((permissao) => {
                      const marcada = bloqueado || form.permissoes.includes(permissao);
                      const id = `permissao-${permissao}`;
                      const dependencias = DEPENDENCIAS[permissao];
                      return (
                        <li key={permissao}>
                          <label
                            htmlFor={id}
                            className={`flex items-start gap-3 px-4 py-3 ${bloqueado ? "" : "cursor-pointer hover:bg-slate-50/60"}`}
                          >
                            <input
                              id={id}
                              type="checkbox"
                              checked={marcada}
                              disabled={bloqueado}
                              onChange={() => alternar(permissao)}
                              className="w-4 h-4 mt-0.5 shrink-0 text-netline-azul border-slate-300 rounded focus:ring-netline-azul cursor-pointer disabled:cursor-default"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-slate-800">{nomePermissao(permissao)}</span>
                              <span className="block text-xs text-slate-500 mt-0.5">
                                {t(`admin.perfis.itens.${permissao}.descricao`)}
                              </span>
                              {dependencias && (
                                <span className="block text-[11px] text-slate-400 mt-0.5">
                                  {t("admin.perfis.dependencia", { nomes: dependencias.map(nomePermissao).join(", ") })}
                                </span>
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </fieldset>

            {!bloqueado && (
              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                {perfilAberto ? (
                  <button
                    type="button"
                    onClick={eliminar}
                    className="w-full sm:w-auto px-5 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {t("admin.perfis.eliminar")}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full sm:w-auto px-5 py-2.5 bg-netline-azul hover:bg-netline-azul-escuro disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {salvando
                    ? t("admin.perfis.aGuardar")
                    : selecionado === "novo"
                      ? t("admin.perfis.criar")
                      : t("admin.perfis.guardar")}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
