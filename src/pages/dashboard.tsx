import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/sidebar";
import HeaderDashboard from "../components/headerDashboard";
import { useUsuarioAtual } from "../hooks/useUsuarioAtual";
import { EstadoCarregando, EstadoErro } from "../components/estados";
import { fetchComToken } from "../utils/api";
import { toast } from "sonner";
import ModalConfirmacao from "../components/modalConfirmacaoprops";

export default function Dashboard() {
  const { t } = useTranslation();
  const location = useLocation();

  // Fecha a sidebar por padrão se o ecrã for pequeno (< 768px)
  const [sidebarFechada, setSidebarFechada] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [modalApagarContaAberto, setModalApagarContaAberto] = useState(false);

  // Só o perfil: o menu e o cabeçalho aparecem logo, e cada página carrega os seus dados
  const { usuario, carregando, erro, recarregar } = useUsuarioAtual();

  // Redimensionamento do ecrã ajusta automaticamente a barra lateral
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarFechada(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fecha o menu mobile automaticamente ao mudar de rota/página
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarFechada(true);
    }
  }, [location.pathname]);

  const confirmarDeletarConta = async () => {
    setModalApagarContaAberto(false);
    try {
      await fetchComToken("/usuarios/me", { method: "DELETE" });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("layout.erroApagarConta"),
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Sidebar com posicionamento dinâmico no mobile */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out ${
          sidebarFechada
            ? "-translate-x-full md:translate-x-0"
            : "translate-x-0"
        }`}
      >
        <Sidebar fechada={sidebarFechada} />
      </div>

      {/* Overlay transparente para fechar a sidebar ao clicar fora (Apenas Mobile) */}
      {!sidebarFechada && (
        <div
          onClick={() => setSidebarFechada(true)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Conteúdo Principal Flexível */}
      <div className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300">
        <HeaderDashboard
          sidebarFechada={sidebarFechada}
          setSidebarFechada={setSidebarFechada}
          usuario={usuario}
          onDeletarConta={() => setModalApagarContaAberto(true)}
        />

        {/* Main com p-4 no Mobile e p-8 a partir de ecrãs médios (md) */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-full overflow-x-hidden">
          {/* As páginas dependem do perfil (permissões): esperam por ele dentro do layout */}
          {carregando ? (
            <EstadoCarregando mensagem={t("layout.carregandoPainel")} />
          ) : erro ? (
            <EstadoErro mensagem={erro} onTentarNovamente={recarregar} />
          ) : (
            <Outlet context={{ usuario, recarregarDashboard: recarregar }} />
          )}
        </main>
      </div>

      <ModalConfirmacao
        aberto={modalApagarContaAberto}
        titulo={t("layout.modalApagarConta.titulo")}
        mensagem={t("layout.modalApagarConta.mensagem")}
        textoConfirmar={t("layout.modalApagarConta.confirmar")}
        perigoso
        onConfirmar={confirmarDeletarConta}
        onCancelar={() => setModalApagarContaAberto(false)}
      />
    </div>
  );
}