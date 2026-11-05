import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface Atividade {
  id: string;
  usuario: { id: number; nome: string; perfil?: { id: number; nome: string } | null };
  acao: string;
  documento?: { id: string | number; titulo: string } | null;
  sistema?: { id: string | number; nome: string } | null;
  criadoEm: string;
}

interface AtividadeRecenteProps {
  atividades: Atividade[];
  // Com a permissão atividade.ver vê-se a atividade de todos, com filtro por perfil
  verTodas?: boolean;
}

export default function AtividadeRecente({
  atividades,
  verTodas = false,
}: AtividadeRecenteProps) {
  const { t, i18n } = useTranslation();
  // null = todos os perfis; senão, o nome do perfil escolhido
  const [filtroPerfil, setFiltroPerfil] = useState<string | null>(null);

  // Os filtros são os perfis de quem aparece na lista
  const perfisPresentes = useMemo(
    () => [...new Set(atividades.map((a) => a.usuario.perfil?.nome).filter((n): n is string => Boolean(n)))],
    [atividades],
  );

  const atividadesFiltradas = useMemo(() => {
    if (!verTodas || filtroPerfil === null) return atividades;
    return atividades.filter((item) => item.usuario.perfil?.nome === filtroPerfil);
  }, [atividades, verTodas, filtroPerfil]);

  const classeFiltro = (ativo: boolean) =>
    `shrink-0 px-2.5 py-1.5 sm:py-1 rounded-md font-semibold transition-all cursor-pointer ${
      ativo ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
    }`;

  const obterCorAcao = (acao: string) => {
    const acaoLower = acao.toLowerCase();
    if (acaoLower.includes("aprov") || acaoLower.includes("cri") || acaoLower.includes("cadastr") || acaoLower.includes("sucess")) {
      return "bg-emerald-500";
    }
    if (acaoLower.includes("rejeit") || acaoLower.includes("elimin") || acaoLower.includes("apag") || acaoLower.includes("remov")) {
      return "bg-rose-500";
    }
    if (acaoLower.includes("edit") || acaoLower.includes("atualiz") || acaoLower.includes("alter")) {
      return "bg-amber-500";
    }
    return "bg-blue-600";
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-120">
      {/* Cabeçalho fixo no topo do card */}
      <div className="flex-none mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {verTodas
                ? t("dashboard.atividadeRecente.tituloAdmin")
                : t("dashboard.atividadeRecente.minhasAtividades")}
            </h3>
            <p className="text-[11px] text-slate-400">
              {verTodas
                ? t("dashboard.atividadeRecente.subtituloAdmin")
                : t("dashboard.atividadeRecente.subtituloProprio")}
            </p>
          </div>

          {/* Filtro por perfil, para quem vê a atividade de todos */}
          {verTodas && perfisPresentes.length > 1 && (
            <div className="inline-flex max-w-full overflow-x-auto whitespace-nowrap p-0.5 bg-slate-100 rounded-lg text-[11px]">
              <button type="button" onClick={() => setFiltroPerfil(null)} className={classeFiltro(filtroPerfil === null)}>
                {t("dashboard.atividadeRecente.filtroTodos")}
              </button>
              {perfisPresentes.map((nome) => (
                <button key={nome} type="button" onClick={() => setFiltroPerfil(nome)} className={classeFiltro(filtroPerfil === nome)}>
                  {nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Atividades com Scroll Interno */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {atividadesFiltradas.length === 0 ? (
          <p className="text-slate-400 text-xs py-8 text-center italic">
            {t("dashboard.atividadeRecente.semAtividade")}
          </p>
        ) : (
          atividadesFiltradas.map((item) => {
            const alvo = item.documento?.titulo ?? item.sistema?.nome;

            return (
              <div key={item.id} className="flex items-start gap-3 text-xs">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${obterCorAcao(item.acao)}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 leading-snug">
                    <strong className="text-slate-900 font-bold">
                      {item.usuario.nome}
                    </strong>
                    {verTodas && item.usuario.perfil && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {item.usuario.perfil.nome}
                      </span>
                    )}{" "}
                    <span className="text-slate-600">{item.acao}</span>{" "}
                    {alvo && (
                      <span className="font-semibold text-slate-800 italic">
                        "{alvo}"
                      </span>
                    )}
                  </p>
                  <span className="text-slate-400 text-[10px] block mt-0.5">
                    {new Date(item.criadoEm).toLocaleString(
                      i18n.language === "en" ? "en-GB" : "pt-PT"
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}