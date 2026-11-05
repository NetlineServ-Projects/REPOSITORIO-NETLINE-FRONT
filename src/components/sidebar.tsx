import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUsuario } from "./usuarioContext";
import { PERMISSOES, pode } from "../utils/permissoes";
import logoNetline from "../assets/netline.jpg";
import {
  IconHome,
  IconDocumento,
  IconConfig,
  IconPasta,
  IconLixeira,
  IconBarras,
  IconSistemas,
  IconPlataforma,
  IconUsuarios,
} from "../components/icons";

interface SidebarProps {
  fechada?: boolean;
}

interface ItemMenu {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SeccaoMenu {
  titulo?: string;
  itens: ItemMenu[];
}

export default function Sidebar({ fechada = false }: SidebarProps) {
  const { t } = useTranslation();
  const { usuarioLogado } = useUsuario();
  const podeAprovar = pode(usuarioLogado, PERMISSOES.DOCUMENTOS_APROVAR);
  const podeLixeira = pode(usuarioLogado, PERMISSOES.DOCUMENTOS_LIXEIRA);
  const podePlataformas = pode(usuarioLogado, PERMISSOES.INFRA_VER);
  const podeUtilizadores = pode(usuarioLogado, PERMISSOES.UTILIZADORES_GERIR);

  const seccoesMenu: SeccaoMenu[] = [
    {
      titulo: t("sidebar.seccoes.principal"),
      itens: [
        {
          path: "/dashboard",
          label: t("sidebar.itens.dashboard"),
          icon: <IconHome />,
        },
        {
          path: "/dashboard/documentos",
          label: t("sidebar.itens.documentos"),
          icon: <IconDocumento />,
        },
        {
          path: "/dashboard/categorias",
          label: t("sidebar.itens.categorias"),
          icon: <IconPasta />,
        },
        ...(podeAprovar
          ? [
              {
                path: "/dashboard/aprovacoes",
                label: t("sidebar.itens.aprovacoes"),
                icon: <IconBarras />,
              },
            ]
          : []),
        ...(podeLixeira
          ? [
              {
                path: "/dashboard/lixeira",
                label: t("sidebar.itens.lixeira"),
                icon: <IconLixeira />,
              },
            ]
          : []),
      ],
    },
    {
      titulo: t("sidebar.seccoes.sistemasNetline"),
      itens: [
        {
          path: "/dashboard/sistemas",
          label: t("sidebar.itens.sistemasDesenvolvidos"),
          icon: <IconSistemas />,
        },
        ...(podePlataformas
          ? [
              {
                path: "/dashboard/plataformas",
                label: t("sidebar.itens.plataformas"),
                icon: <IconPlataforma />,
              },
            ]
          : []),
      ],
    },
    {
      titulo: t("sidebar.seccoes.configuracoes"),
      itens: [
        ...(podeUtilizadores
          ? [
              {
                path: "/dashboard/usuarios",
                label: t("sidebar.itens.usuarios"),
                icon: <IconUsuarios />,
              },
            ]
          : []),
        {
          path: "/dashboard/configuracoes",
          label: t("sidebar.itens.configuracoes"),
          icon: <IconConfig />,
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#092565] text-white flex flex-col p-4 select-none shadow-lg transition-all duration-300 sticky top-0 h-full overflow-y-auto shrink-0 ${
        fechada ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center gap-3 font-bold text-xl tracking-wide border-b border-blue-900/60 pb-4 mb-6 ${fechada ? "justify-center" : ""}`}
      >
        <img
          src={logoNetline}
          alt={t("sidebar.logotipo")}
          className="w-8 h-8 rounded object-cover shadow-sm shrink-0"
        />
        {!fechada && (
          <span className="text-white truncate">{t("sidebar.marca")}</span>
        )}
      </div>

      <nav className="space-y-6">
        {seccoesMenu.map((seccao, idx) => (
          <div key={idx} className="space-y-2">
            {seccao.titulo && !fechada && (
              <p className="px-3 text-xs font-bold text-slate-400 tracking-wider uppercase transition-all">
                {seccao.titulo}
              </p>
            )}
            <ul className="space-y-1">
              {seccao.itens.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/dashboard"}
                    title={fechada ? item.label : undefined}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left relative ${
                        fechada ? "justify-center" : ""
                      } ${
                        isActive
                          ? "bg-white/15 text-white font-semibold border border-white/10 shadow-sm backdrop-blur-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-400 rounded-r-md" />
                        )}
                        <span className="text-lg shrink-0">{item.icon}</span>
                        {!fechada && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
