import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSistemasData, podeEditarSistema } from "../../../hooks/useSistemasData";
import SistemaFormulario from "../formulario/page";
import { EstadoCarregando, EstadoErro } from "../../../components/estados";
import { PERMISSOES, pode, type PerfilResumo } from "../../../utils/permissoes";

interface DashboardContext {
  usuario: { id?: number; nome: string; perfil?: PerfilResumo | null; permissoes?: string[] } | null;
}

export default function EditarSistemaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { usuario } = useOutletContext<DashboardContext>();
  const { sistemas, editarSistema, loading, erro, recarregar } = useSistemasData();
  const [salvando, setSalvando] = useState(false);

  const sistema = sistemas.find((s) => String(s.id) === id);
  const caminhoDoSistema = `/dashboard/sistemas/${id}`;

  const handleSubmit = async (dados: Record<string, unknown>) => {
    if (!sistema) return;
    setSalvando(true);
    try {
      await editarSistema(sistema.id, dados);
      toast.success(t("sistemas.detalhe.sistemaAtualizado"));
      navigate(caminhoDoSistema);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : t("sistemas.detalhe.erroGuardarAlteracoes"));
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <EstadoCarregando mensagem={t("comum.estados.carregando")} />;
  }

  // Sem isto, uma falha de rede aparecia como "Sistema não encontrado"
  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={recarregar} />;
  }

  if (!sistema || !podeEditarSistema(usuario)) {
    return (
      <div className="space-y-3 text-center">
        <EstadoErro
          titulo={sistema ? t("sistemas.detalhe.semPermissaoTitulo") : t("sistemas.detalhe.naoEncontradoTitulo")}
          mensagem={
            sistema
              ? t("sistemas.detalhe.semPermissaoMensagem")
              : t("sistemas.detalhe.naoEncontradoMensagem")
          }
        />
        <button onClick={() => navigate("/dashboard/sistemas")} className="text-sm text-netline-azul font-semibold hover:underline cursor-pointer">
          {t("sistemas.comum.voltar")}
        </button>
      </div>
    );
  }

  return (
    <SistemaFormulario
      sistemaExistente={sistema}
      salvando={salvando}
      onCancelar={() => navigate(caminhoDoSistema)}
      onSubmit={handleSubmit}
      gerirAlojamento={pode(usuario, PERMISSOES.SISTEMAS_INFRA_GERIR)}
    />
  );
}
