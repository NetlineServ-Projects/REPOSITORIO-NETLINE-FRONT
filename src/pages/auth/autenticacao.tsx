import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUsuario } from "../../components/usuarioContext";
import Button from "./button";
import Fundo1 from "../../assets/fundo.jpg";
import logoNetline from "../../assets/netline.jpg";
import {
  IconOlhoAberto,
  IconOlhoFechado,
  IconEmail,
} from "../../components/icons";
import { API_BASE, TIMEOUT_PADRAO_MS, erroDeLigacao, guardarUsuarioLocal } from "../../utils/api";
import { aplicarTema } from "../../utils/tema";

export default function Autenticacao() {
  const { t, i18n } = useTranslation();
  const { fazerLogin } = useUsuario();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // fetchComToken redireciona para aqui com ?sessao=expirada quando o token deixa de ser válido
  const [erro, setErro] = useState(() =>
    new URLSearchParams(window.location.search).get("sessao") === "expirada"
      ? t("auth.sessaoExpirada")
      : "",
  );
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const trocarIdioma = (novoIdioma: string) => {
    i18n.changeLanguage(novoIdioma);
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
        credentials: "include", // o backend responde com o cookie HttpOnly da sessão
        signal: AbortSignal.timeout(TIMEOUT_PADRAO_MS),
      });

      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo?.mensagem || t("auth.erroCredenciais"));

      const { user } = corpo.data;

      // O token fica no cookie; localmente só o que o ecrã precisa
      guardarUsuarioLocal(user);
      aplicarTema(Boolean(user.temaEscuro));
      fazerLogin({
        id: user.id,
        name: user.name || user.nome,
        perfil: user.perfil ?? null,
        permissoes: user.permissoes ?? [],
      });

      window.location.href = "/dashboard";
    } catch (err: any) {
      const erro = erroDeLigacao(err) as Error;
      setErro(erro.message || t("auth.erroPadrao"));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="w-full min-h-dvh flex flex-col lg:flex-row bg-gray-50 antialiased overflow-x-hidden">
      {/* Seção Hero / Imagem de Fundo */}
      <div
        className="w-full lg:w-1/2 min-h-80 lg:min-h-dvh flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 text-white bg-cover bg-center relative"
        style={{ backgroundImage: `url(${Fundo1})` }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-blue-950/90 via-blue-900/85 to-slate-950/90 backdrop-blur-[2px]" />

        <div className="relative z-10 text-center max-w-lg my-auto">
          <span className="inline-block px-3.5 py-1 mb-4 text-xs font-semibold uppercase tracking-widest bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
            {t("auth.marca")}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-4 sm:mb-6 text-white drop-shadow-sm">
            {t("auth.heroTitulo")}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-blue-100/90 leading-relaxed max-w-md mx-auto">
            {t("auth.heroTexto")}
          </p>
        </div>
      </div>

      {/* Seção Formuário */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-between p-6 sm:p-10 lg:p-16 relative bg-white min-h-[calc(100dvh-320px)] lg:min-h-dvh overflow-y-auto">
        {/* Seletor de idioma */}
        <div className="w-full flex justify-end mb-6 lg:absolute lg:top-8 lg:right-8 lg:mb-0">
          <div className="inline-flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 text-xs font-medium">
            <button
              type="button"
              onClick={() => trocarIdioma("pt")}
              className={`px-3 py-1 rounded-md transition-all ${
                i18n.language === "pt"
                  ? "bg-white text-blue-700 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => trocarIdioma("en")}
              className={`px-3 py-1 rounded-md transition-all ${
                i18n.language === "en"
                  ? "bg-white text-blue-700 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="w-full max-w-md my-auto px-4 py-2 sm:px-8">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-3 bg-blue-50/50 rounded-2xl mb-4 border border-blue-100/50">
              <img
                src={logoNetline}
                alt="Logotipo Netline"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
              {t("auth.painelAcesso")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t("auth.acederConta")}
            </h2>
          </div>

          <form onSubmit={entrar} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                {t("auth.emailLabel")}
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full pl-4 pr-11 py-3.5 bg-gray-50/80 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <IconEmail className="absolute right-4 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                {t("auth.senhaLabel")}
              </label>
              <div className="relative flex items-center">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3.5 bg-gray-50/80 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white focus:outline-none transition-all placeholder:text-gray-400"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1"
                >
                  {mostrarSenha ? (
                    <IconOlhoAberto className="w-5 h-5" />
                  ) : (
                    <IconOlhoFechado className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="p-3.5 text-xs sm:text-sm text-red-600 bg-red-50/80 border border-red-200/60 rounded-xl text-center font-medium animate-shake">
                {erro}
              </div>
            )}

            <div className="pt-2">
              <Button
                title={carregando ? t("auth.processando") : t("auth.entrar")}
                type="submit"
                disabled={carregando}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.99] disabled:opacity-70"
              />
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">
            {t("auth.direitosReservados", { ano: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}