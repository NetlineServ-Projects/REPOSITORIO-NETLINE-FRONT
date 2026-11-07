import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Home from "./pages/home/home";
import Autenticacao from "./pages/auth/autenticacao";
import Dashboard from "./pages/dashboard";
import DashboardHome from "./pages/dashboardHome";
import Documentos from "./pages/documentos/page";
import DocumentoDetalhesPage from "./pages/documentos/details/page";
import Categorias from "./pages/categorias/page";
import Usuarios from "./pages/admin/usuarios/page";
import UsuarioDetalhesPage from "./pages/admin/usuarios/detalhes/page";
import Perfil from "./pages/perfil/page";
import ConfiguracoesPage from "./pages/configuracoes/configuracoesPage";
import Lixeira from "./pages/admin/lixeira/page";
import AprovacoesPage from "./pages/admin/aprovacoes/page";
import AprovacaoDetalhesPage from "./pages/admin/aprovacoes/details/page";
import AprovacaoEditPage from "./pages/admin/aprovacoes/edit/page";
import { UsuarioProvider, useUsuario } from "./components/usuarioContext";
import SistemasPage from "./pages/sistemas/page";
import PlataformasPage from "./pages/Plataformas/page";
import ServidorDetalhePage from "./pages/Plataformas/servidor/page";
import { Toaster } from "sonner";
import { ProvedorConfirmacao } from "./components/confirmacao";
import NovoDocumentoPage from "./pages/documentos/new/page";
import { AcessoInfraestruturaLayout } from "./pages/sistemas/infraestrutura/acessoInfraestrutura";
import { AcessoElevadoLayout } from "./components/acessoElevado";
import { PERMISSOES, pode, ehAdministrador, type Permissao } from "./utils/permissoes";
import PerfisPage from "./pages/configuracoes/perfis/page";
import AuditoriaPage from "./pages/admin/auditoria/page";
import AuditoriaDetalhePage from "./pages/admin/auditoria/detalhe/page";

import EditarDocumentoPage from "./pages/documentos/[id]/editar/page";
import EditarSistemaPage from "./pages/sistemas/editar/page";

import EditarInfraestruturaPage from "./pages/sistemas/infraestrutura/editar/page";
import CredencialPage from "./pages/sistemas/infraestrutura/credenciais/page";

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { usuarioLogado } = useUsuario();
  if (!usuarioLogado) return <Navigate to="/autenticacao" replace />;
  return <>{children}</>;
}

// Só entra quem tem a permissão (ou, sem permissão indicada, só o Administrador).
// A API verifica de novo: isto só evita mostrar páginas que dariam 403.
function RotaComPermissao({ permissao }: { permissao?: Permissao }) {
  const { usuarioLogado } = useUsuario();
  if (!usuarioLogado) return <Navigate to="/autenticacao" replace />;
  // Sessão de uma versão antiga, ainda sem perfil: espera que /auth/me o traga
  if (!usuarioLogado.perfil) return null;
  const permitido = permissao ? pode(usuarioLogado, permissao) : ehAdministrador(usuarioLogado);
  if (!permitido) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <UsuarioProvider>
      <ProvedorConfirmacao>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/autenticacao" element={<Autenticacao />} />

          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="documentos" element={<Documentos />} />
            <Route path="documentos/:id" element={<DocumentoDetalhesPage />} />
            <Route path="documentos/new" element={<NovoDocumentoPage />} />
            <Route
              path="documentos/:id/editar"
              element={<EditarDocumentoPage />}
            />
            <Route path="categorias" element={<Categorias />} />
            <Route path="sistemas" element={<SistemasPage />} />
            <Route element={<RotaComPermissao permissao={PERMISSOES.DOCUMENTOS_APROVAR} />}>
              <Route path="aprovacoes" element={<AprovacoesPage />} />
              <Route
                path="aprovacoes/details/:id"
                element={<AprovacaoDetalhesPage />}
              />
              <Route
                path="aprovacoes/edit/:id"
                element={<AprovacaoEditPage />}
              />
            </Route>
            <Route element={<RotaComPermissao permissao={PERMISSOES.UTILIZADORES_GERIR} />}>
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="usuarios/:id" element={<UsuarioDetalhesPage />} />
            </Route>
            <Route element={<RotaComPermissao permissao={PERMISSOES.DOCUMENTOS_LIXEIRA} />}>
              <Route path="lixeira" element={<Lixeira />} />
            </Route>
            <Route element={<RotaComPermissao />}>
              <Route path="configuracoes/perfis" element={<PerfisPage />} />
              <Route path="auditoria" element={<AuditoriaPage />} />
              <Route path="auditoria/:id" element={<AuditoriaDetalhePage />} />
            </Route>
            <Route path="perfil" element={<Perfil />} />
            <Route path="sistemas/:id" element={<AcessoInfraestruturaLayout />}>
              <Route index element={<SistemasPage />} />
              <Route path="editar" element={<EditarSistemaPage />} />
              <Route
                path="infraestrutura/:ambiente/editar"
                element={<EditarInfraestruturaPage />}
              />
              <Route
                path="infraestrutura/:ambiente/credenciais/nova"
                element={<CredencialPage />}
              />
              <Route
                path="infraestrutura/:ambiente/credenciais/:credencialId/editar"
                element={<CredencialPage />}
              />
            </Route>
            <Route element={<RotaComPermissao permissao={PERMISSOES.INFRA_VER} />}>
              <Route path="plataformas" element={<AcessoElevadoLayout />}>
                <Route index element={<PlataformasPage />} />
                <Route path="servidores/:id" element={<ServidorDetalhePage />} />
              </Route>
            </Route>

            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Route>
        </Routes>
      </ProvedorConfirmacao>
      </UsuarioProvider>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
