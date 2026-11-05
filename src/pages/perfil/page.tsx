import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { API_URL, fetchComToken } from "../../utils/api";
import { API_ENDPOINTS } from "../../data/client/endpoint";
import { IconOlhoAberto, IconOlhoFechado, IconUsuario } from "../../components/icons";
import ModalFotografia from "./modalFotografia";
import { EstadoCarregando } from "../../components/estados";
import type { UsuarioData } from "../../hooks/useDashboardData";
import { PERMISSOES, pode } from "../../utils/permissoes";

interface DashboardContext {
  usuario: UsuarioData | null;
  recarregarDashboard: () => void;
}

interface DadosPerfilForm {
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
}

export default function PerfilPage() {
  const { t } = useTranslation();
  const { usuario, recarregarDashboard } = useOutletContext<DashboardContext>();
  // Os próprios dados (nome, e-mail, cargo...) só os edita quem gere utilizadores
  const podeEditarDados = pode(usuario, PERMISSOES.UTILIZADORES_GERIR);

  const [editando, setEditando] = useState(false);
  const [formDados, setFormDados] = useState<DadosPerfilForm>({
    nome: "",
    email: "",
    cargo: "",
    departamento: "",
  });

  const [alterarSenha, setAlterarSenha] = useState(false);
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  // Estados de visibilidade para cada input de senha
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [modalFotoAberto, setModalFotoAberto] = useState(false);

  useEffect(() => {
    if (usuario) {
      setFormDados({
        nome: usuario.nome || "",
        email: usuario.email || "",
        cargo: usuario.cargo || "",
        departamento: usuario.departamento || "",
      });
    }
  }, [usuario]);

  const lidarComMudancaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDados((prev) => ({ ...prev, [name]: value }));
  };

  const lidarComSelecaoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (arquivo) {
      setArquivoFoto(arquivo);
      setModalFotoAberto(true);
    }
    e.target.value = ""; // permite re-selecionar o mesmo ficheiro depois
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setAlterarSenha(false);
    setSenhaForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
    setMostrarSenhaAtual(false);
    setMostrarNovaSenha(false);
    setMostrarConfirmarSenha(false);
    if (usuario) {
      setFormDados({
        nome: usuario.nome || "",
        email: usuario.email || "",
        cargo: usuario.cargo || "",
        departamento: usuario.departamento || "",
      });
    }
  };

  const salvarAlteracoes = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alterarSenha) {
      if (!senhaForm.senhaAtual || !senhaForm.novaSenha || !senhaForm.confirmarSenha) {
        toast.error(t("perfil.senha.preenchaTodos"));
        return;
      }
      if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
        toast.error(t("perfil.senha.naoCoincidem"));
        return;
      }
    }

    setSalvando(true);
    try {
      // Os campos da conta só são editáveis (e só são enviados) por quem gere utilizadores
      if (podeEditarDados && usuario?.id) {
        await fetchComToken(API_ENDPOINTS.USUARIO_BY_ID(usuario.id), {
          method: "PATCH",
          body: JSON.stringify(formDados),
        });
      }

      // Senha: comum a ambos os perfis, sempre via /auth/senha
      if (alterarSenha) {
        await fetchComToken(API_ENDPOINTS.ALTERAR_SENHA, {
          method: "PATCH",
          body: JSON.stringify({
            senhaAtual: senhaForm.senhaAtual,
            novaSenha: senhaForm.novaSenha,
          }),
        });
      }

      recarregarDashboard();
      setEditando(false);
      setAlterarSenha(false);
      setSenhaForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);
      toast.success(t("perfil.atualizado"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("perfil.erroGuardar"));
    } finally {
      setSalvando(false);
    }
  };

  // O utilizador vem do layout (que já trata o erro de carregamento)
  if (!usuario) {
    return <EstadoCarregando mensagem={t("perfil.carregando")} />;
  }

  return (
    // Largura limitada e encostada à esquerda: num ecrã largo os campos ficavam demasiado esticados
    <div className="w-full max-w-3xl space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-netline-azul relative">
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            className="absolute -bottom-10 left-5 sm:left-8 bg-slate-100 border-4 border-white p-0 rounded-full shadow-sm text-slate-600 flex items-center justify-center w-24 h-24 overflow-hidden cursor-pointer group"
            title={t("perfil.alterarFotografia")}
          >
            {usuario.fotografia ? (
              <img src={`${API_URL}${usuario.fotografia}`} alt={usuario.nome} className="w-full h-full object-cover" />
            ) : (
              <IconUsuario className="w-12 h-12" />
            )}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
              {t("perfil.alterar")}
            </span>
          </button>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={lidarComSelecaoFoto}
          />
        </div>

        <form onSubmit={salvarAlteracoes} className="pt-14 px-5 pb-5 sm:px-8 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{usuario.nome || t("perfil.utilizador")}</h2>
              <p className="text-slate-500 font-medium text-sm">{usuario.cargo || t("perfil.colaborador")}</p>
            </div>

            <div className="mt-4 sm:mt-0 space-x-2">
              {editando ? (
                <>
                  <button
                    type="button"
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {t("componentes.confirmacao.cancelar")}
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {salvando ? t("documentos.aGuardar") : t("perfil.guardarAlteracoes")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="px-4 py-2 bg-netline-azul hover:bg-[#142847] text-white font-medium rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {t("perfil.editar")}
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {([
              ["nome", t("perfil.campos.nome")],
              ["email", t("perfil.campos.email")],
              ["cargo", t("perfil.campos.cargo")],
              ["departamento", t("perfil.campos.departamento")],
            ] as const).map(([campo, label]) => (
              <div key={campo}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {label}
                </label>
                {editando && podeEditarDados ? (
                  <input
                    type={campo === "email" ? "email" : "text"}
                    name={campo}
                    value={formDados[campo]}
                    onChange={lidarComMudancaInput}
                    className="w-full px-4 py-2.5 bg-white border border-netline-azul/40 focus:ring-2 focus:ring-netline-azul/20 focus:border-netline-azul rounded-xl text-slate-700 text-sm font-medium outline-none transition-all"
                    required={campo === "nome" || campo === "email"}
                  />
                ) : (
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium break-all">
                    {usuario[campo] || t("perfil.semValor")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {editando && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">{t("perfil.seguranca")}</h3>
                <button
                  type="button"
                  onClick={() => setAlterarSenha(!alterarSenha)}
                  className="text-xs text-netline-azul hover:underline font-semibold cursor-pointer"
                >
                  {alterarSenha ? t("perfil.senha.ocultarAlteracao") : t("perfil.senha.alterar")}
                </button>
              </div>

              {alterarSenha && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* Senha Atual */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t("perfil.senha.atual")}</label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaAtual ? "text" : "password"}
                        value={senhaForm.senhaAtual}
                        onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-netline-azul"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={mostrarSenhaAtual ? t("perfil.senha.ocultar") : t("perfil.senha.mostrar")}
                      >
                        {mostrarSenhaAtual ? (
                          <IconOlhoFechado className="w-3.5 h-3.5" />
                        ) : (
                          <IconOlhoAberto className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t("perfil.senha.nova")}</label>
                    <div className="relative">
                      <input
                        type={mostrarNovaSenha ? "text" : "password"}
                        value={senhaForm.novaSenha}
                        onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-netline-azul"
                        placeholder={t("perfil.senha.novaPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={mostrarNovaSenha ? t("perfil.senha.ocultar") : t("perfil.senha.mostrar")}
                      >
                        {mostrarNovaSenha ? (
                          <IconOlhoFechado className="w-3.5 h-3.5" />
                        ) : (
                          <IconOlhoAberto className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{t("perfil.senha.confirmar")}</label>
                    <div className="relative">
                      <input
                        type={mostrarConfirmarSenha ? "text" : "password"}
                        value={senhaForm.confirmarSenha}
                        onChange={(e) => setSenhaForm({ ...senhaForm, confirmarSenha: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-netline-azul"
                        placeholder={t("perfil.senha.confirmarPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={mostrarConfirmarSenha ? t("perfil.senha.ocultar") : t("perfil.senha.mostrar")}
                      >
                        {mostrarConfirmarSenha ? (
                          <IconOlhoFechado className="w-3.5 h-3.5" />
                        ) : (
                          <IconOlhoAberto className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      <ModalFotografia
        aberto={modalFotoAberto}
        arquivo={arquivoFoto}
        onFechar={() => {
          setModalFotoAberto(false);
          setArquivoFoto(null);
        }}
        onSucesso={recarregarDashboard}
      />
    </div>
  );
}