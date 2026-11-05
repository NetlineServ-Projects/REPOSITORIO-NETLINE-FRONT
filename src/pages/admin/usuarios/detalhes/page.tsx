import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Trans, useTranslation } from "react-i18next";
import AvatarUsuario from "../../../../components/avatarUsuario";
import BotaoIconeCabecalho from "../../../../components/plataformas/botaoIconeCabecalho";
import { Secao, Painel, Campo, TextoVazio } from "../../../../components/secaoDetalhe";
import { EstadoCarregando, EstadoErro } from "../../../../components/estados";
import { useConfirmacao } from "../../../../components/confirmacao";
import { useCarregamento } from "../../../../hooks/useCarregamento";
import { IconCaneta, IconLixeira } from "../../../../components/icons";
import { fetchComToken } from "../../../../utils/api";
import { API_ENDPOINTS } from "../../../../data/client/endpoint";
import type { Usuario } from "../../../../hooks/useUsuariosData";
import { useUsuario } from "../../../../components/usuarioContext";
import { ehAdministrador } from "../../../../utils/permissoes";

// A API devolve mais campos do que a tabela mostra (nunca a palavra-passe)
type UsuarioCompleto = Usuario & { ativo?: boolean; idioma?: string; temaEscuro?: boolean };

// Os nomes dos idiomas ficam sempre na própria língua
const IDIOMAS: Record<string, string> = { pt: "Português", en: "English" };
const CAMINHO_LISTA = "/dashboard/usuarios";

// Página de detalhes de um utilizador (só administradores), no mesmo padrão dos detalhes
// do servidor e da plataforma: cabeçalho azul com as ações em ícones e secções por baixo
export default function UsuarioDetalhesPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmar = useConfirmacao();
  const { usuarioLogado } = useUsuario();
  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);
  const { carregando, erro, executar } = useCarregamento(t("admin.usuarios.detalhes.erroCarregar"));

  const carregar = useCallback(
    () => executar(() => fetchComToken(API_ENDPOINTS.USUARIO_BY_ID(id ?? "")), setUsuario),
    [executar, id],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Volta para onde se estava (a lista, com a pesquisa); aberta por link, vai para a lista
  const voltar = () => (location.key !== "default" ? navigate(-1) : navigate(CAMINHO_LISTA));

  const eliminar = async () => {
    if (!usuario) return;
    try {
      const eliminado = await confirmar({
        titulo: t("admin.usuarios.modalEliminar.titulo"),
        mensagem: (
          <Trans
            i18nKey="admin.usuarios.modalEliminar.mensagem"
            values={{ nome: usuario.nome }}
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("admin.usuarios.modalEliminar.confirmar"),
        textoCarregando: t("admin.usuarios.modalEliminar.aEliminar"),
        perigoso: true,
        acao: () => fetchComToken(API_ENDPOINTS.USUARIO_BY_ID(usuario.id), { method: "DELETE" }),
      });
      if (!eliminado) return;
      toast.success(t("admin.usuarios.eliminado", { nome: usuario.nome }));
      navigate(CAMINHO_LISTA, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.usuarios.erroEliminar"));
    }
  };

  if (carregando) return <EstadoCarregando mensagem={t("admin.usuarios.detalhes.carregando")} />;
  if (erro || !usuario) {
    return (
      <div className="space-y-4">
        <button onClick={voltar} className="text-xs font-semibold text-blue-900 hover:underline cursor-pointer">
          ← {t("admin.usuarios.detalhes.voltar")}
        </button>
        <EstadoErro mensagem={erro ?? t("admin.usuarios.detalhes.naoEncontrado")} onTentarNovamente={erro ? carregar : undefined} />
      </div>
    );
  }

  const ehAdmin = Boolean(usuario.perfil?.administrador);
  const nomeDoPerfil = usuario.perfil?.nome ?? "-";
  // Contas de administrador só um administrador as altera; ninguém elimina a própria conta
  const podeEditar = ehAdministrador(usuarioLogado) || !ehAdmin;
  const podeEliminar = podeEditar && usuario.id !== usuarioLogado?.id;
  const ativo = usuario.ativo !== false;
  const vazio = <TextoVazio>{t("admin.usuarios.detalhes.naoDefinido")}</TextoVazio>;

  return (
    <div className="space-y-8 pb-12">
      {/* ================= CABEÇALHO ================= */}
      <div className="bg-netline-azul text-white p-5 sm:p-8 rounded-2xl shadow-sm space-y-5">
        <button
          onClick={voltar}
          className="text-xs font-semibold text-blue-100/80 hover:text-white transition-colors cursor-pointer"
        >
          ← {t("admin.usuarios.detalhes.voltar")}
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0 max-w-full">
            <div className="rounded-full ring-4 ring-white bg-white shrink-0">
              <AvatarUsuario nome={usuario.nome} fotografia={usuario.fotografia} tamanho="lg" />
            </div>
            <div className="min-w-0">
              <span className="text-xs uppercase font-semibold text-blue-200/80 tracking-widest block mb-1">
                {nomeDoPerfil}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold break-words">{usuario.nome}</h2>
              <p className="text-sm text-blue-100/80 mt-1 break-all">{usuario.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {podeEditar && (
              <BotaoIconeCabecalho
                rotulo={t("admin.usuarios.detalhes.editar")}
                Icone={IconCaneta}
                onClick={() => navigate(`${CAMINHO_LISTA}?editar=${usuario.id}`)}
              />
            )}
            {podeEliminar && (
              <BotaoIconeCabecalho rotulo={t("admin.usuarios.detalhes.eliminar")} Icone={IconLixeira} perigoso onClick={eliminar} />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* ================= CONTA ================= */}
        <Secao titulo={t("admin.usuarios.detalhes.conta")}>
          <Painel>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Campo rotulo={t("admin.usuarios.detalhes.perfil")}>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    ehAdmin ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {nomeDoPerfil}
                </span>
              </Campo>
              <Campo rotulo={t("admin.usuarios.detalhes.estado")}>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    ativo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {ativo ? t("admin.usuarios.detalhes.contaAtiva") : t("admin.usuarios.detalhes.contaDesativada")}
                </span>
              </Campo>
              <Campo rotulo={t("admin.usuarios.detalhes.registadoEm")}>
                {usuario.dataCriacao ? new Date(usuario.dataCriacao).toLocaleDateString(i18n.language === "en" ? "en-GB" : "pt-PT") : vazio}
              </Campo>
              <Campo rotulo={t("admin.usuarios.detalhes.idioma")}>{usuario.idioma ? IDIOMAS[usuario.idioma] ?? usuario.idioma : vazio}</Campo>
            </dl>
          </Painel>
        </Secao>

        {/* ================= CONTACTO E FUNÇÃO ================= */}
        <Secao titulo={t("admin.usuarios.detalhes.contacto")}>
          <Painel>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Campo rotulo={t("admin.usuarios.detalhes.email")}>
                <a href={`mailto:${usuario.email}`} className="text-blue-900 hover:underline break-all">
                  {usuario.email}
                </a>
              </Campo>
              <Campo rotulo={t("admin.usuarios.detalhes.telemovel")}>{usuario.numero || vazio}</Campo>
              <Campo rotulo={t("admin.usuarios.detalhes.cargo")}>{usuario.cargo || vazio}</Campo>
              <Campo rotulo={t("admin.usuarios.detalhes.departamento")}>{usuario.departamento || vazio}</Campo>
            </dl>
          </Painel>
        </Secao>
      </div>
    </div>
  );
}
