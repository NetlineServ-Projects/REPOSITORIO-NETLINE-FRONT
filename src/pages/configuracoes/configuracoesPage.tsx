import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { fetchComToken } from "../../utils/api";
import { aplicarTema } from "../../utils/tema";
import SelectPesquisavel from "../../components/selectPesquisavel";
import { EstadoCarregando, EstadoErro } from "../../components/estados";
import { Link } from "react-router-dom";
import { useUsuario } from "../../components/usuarioContext";
import { ehAdministrador } from "../../utils/permissoes";

export default function ConfiguracoesPage() {
  const { t, i18n } = useTranslation();
  const { usuarioLogado } = useUsuario();

  const [darkTheme, setDarkTheme] = useState<boolean>(false);
  const [idioma, setIdioma] = useState<string>("pt");

  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Se as preferências não carregarem, mostra-se o erro em vez do formulário: com os
  // valores por omissão, "Salvar" sobrescreveria as preferências reais do utilizador
  const [tentativa, setTentativa] = useState(0);

  const tentarNovamente = () => {
    setLoading(true);
    setErroCarregamento(null);
    setTentativa((n) => n + 1);
  };

  useEffect(() => {
    const carregarPreferencias = async () => {
      try {
        const usuario = await fetchComToken("/auth/me");
        const temaAtivo = Boolean(usuario.temaEscuro);

        setDarkTheme(temaAtivo);
        setIdioma(usuario.idioma || "pt");

        // sincroniza o i18next (troca a UI) — isto já grava em localStorage("idioma")
        i18n.changeLanguage(usuario.idioma || "pt");

        aplicarTema(temaAtivo);
      } catch (err) {
        setErroCarregamento(err instanceof Error ? err.message : t("configuracoes.erroCarregar"));
      } finally {
        setLoading(false);
      }
    };

    carregarPreferencias();
    // Este efeito deve correr só ao montar a página (e em "Tentar novamente").
    // Não incluir i18n/t nas dependências: a função `t` muda de referência
    // sempre que o idioma muda, o que faria este efeito correr de novo
    // e reverter a escolha do usuário buscando outra vez o valor antigo do backend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  // O tema grava-se logo ao mudar: antes só ficava guardado com "Salvar", e quem
  // saísse da página sem guardar via o tema voltar atrás no próximo carregamento
  const handleToggleTema = async () => {
    const novoEstado = !darkTheme;
    setDarkTheme(novoEstado);
    aplicarTema(novoEstado);
    try {
      await fetchComToken("/usuarios/me/preferencias", {
        method: "PATCH",
        body: JSON.stringify({ temaEscuro: novoEstado }),
      });
    } catch (err) {
      setDarkTheme(!novoEstado);
      aplicarTema(!novoEstado);
      toast.error(err instanceof Error ? err.message : t("configuracoes.erroSalvar"));
    }
  };

  const handleChangeIdioma = (novoIdioma: string) => {
    setIdioma(novoIdioma);
    i18n.changeLanguage(novoIdioma); // muda a UI imediatamente, sem esperar pelo Save
  };

  const salvarConfiguracoes = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      await fetchComToken("/usuarios/me/preferencias", {
        method: "PATCH",
        body: JSON.stringify({ temaEscuro: darkTheme, idioma }),
      });

      i18n.changeLanguage(idioma);

      toast.success(t("configuracoes.salvoComSucesso"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("configuracoes.erroSalvar"));
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <EstadoCarregando mensagem={t("configuracoes.carregando")} />;
  }

  if (erroCarregamento) {
    return <EstadoErro mensagem={erroCarregamento} onTentarNovamente={tentarNovamente} />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
            {t("configuracoes.preferencias")}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{t("configuracoes.titulo")}</h1>
          <p className="text-sm text-blue-100/90 mt-1">{t("configuracoes.subtitulo")}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8">
        <form onSubmit={salvarConfiguracoes} className="space-y-6">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {t("configuracoes.aparencia")}
              </p>
              <p className="text-xs text-slate-400">
                {darkTheme ? t("configuracoes.modoEscuro") : t("configuracoes.modoClaro")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkTheme}
              aria-label={t("configuracoes.aparencia")}
              onClick={handleToggleTema}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                darkTheme ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              {/* Branco fixo: o bg-white passa a cor de cartão no tema escuro */}
              <div
                className={`bg-[#ffffff] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  darkTheme ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {t("configuracoes.idioma")}
              </p>
              <p className="text-xs text-slate-400">
                {t("configuracoes.idiomaDesc")}
              </p>
            </div>
            <SelectPesquisavel
              aria-label={t("configuracoes.idioma")}
              tamanho="sm"
              className="w-full sm:w-48 shrink-0"
              valor={idioma}
              onChange={handleChangeIdioma}
              opcoes={[
                { valor: "pt", label: "Português (PT)" },
                { valor: "en", label: "English (EN)" },
              ]}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-5 py-2.5 bg-netline-azul hover:bg-[#142847] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              {salvando ? t("configuracoes.salvando") : t("configuracoes.salvar")}
            </button>
          </div>
        </form>
      </div>

      {/* Perfis e permissões: só o Administrador os configura */}
      {ehAdministrador(usuarioLogado) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">{t("configuracoes.perfisTitulo")}</p>
            <p className="text-xs text-slate-400">{t("configuracoes.perfisDescricao")}</p>
          </div>
          <Link
            to="/dashboard/configuracoes/perfis"
            className="w-full sm:w-auto text-center px-5 py-2.5 bg-netline-azul hover:bg-netline-azul-escuro text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
          >
            {t("configuracoes.perfisAbrir")}
          </Link>
        </div>
      )}
    </div>
  );
}