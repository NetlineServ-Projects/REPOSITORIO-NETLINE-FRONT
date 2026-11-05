  import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconUsuario, IconLogout } from "./icons";
import AvatarUsuario from "./avatarUsuario";
import SinoNotificacoes from "./sinoNotificacoes";
import { useUsuario } from "./usuarioContext";

interface HeaderDashboardProps {
  sidebarFechada: boolean;
  setSidebarFechada: (fechada: boolean) => void;
  usuario?: { nome: string; email?: string; perfil?: { nome: string } | null; fotografia?: string | null } | null;
  onDeletarConta?: () => void;
}

export default function HeaderDashboard({
  sidebarFechada,
  setSidebarFechada,
  usuario,
}: HeaderDashboardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();     
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const nomeUsuario = usuario?.nome || t("componentes.header.utilizador");

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const { fazerLogout } = useUsuario();
  const lidarComLogout = fazerLogout;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarFechada(!sidebarFechada)}
          className="p-2.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          title={sidebarFechada ? t("componentes.header.expandirMenu") : t("componentes.header.recolherMenu")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 whitespace-nowrap bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>{t("componentes.header.repositorioInterno")}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <SinoNotificacoes />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4 cursor-pointer"
          >
            <AvatarUsuario nome={nomeUsuario} fotografia={usuario?.fotografia} tamanho="sm" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">
              {nomeUsuario}
            </span>
          </button>

          {menuAberto && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-20">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                <AvatarUsuario nome={nomeUsuario} fotografia={usuario?.fotografia} tamanho="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{nomeUsuario}</p>
                  {usuario?.email && (
                    <p className="text-xs text-slate-400 truncate">{usuario.email}</p>
                  )}
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {usuario?.perfil?.nome ?? t("componentes.header.utilizador")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setMenuAberto(false); navigate("/dashboard/perfil"); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <IconUsuario className="w-4 h-4" />
                {t("componentes.header.meuPerfil")}
              </button>

              <button
                onClick={lidarComLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <IconLogout className="w-4 h-4" />
                {t("componentes.header.terminarSessao")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}