import { useTranslation } from "react-i18next";

interface AcoesRapidasProps {
  onNavegar: (aba: string) => void;
  podeAprovar?: boolean;
  // undefined = sem acesso às plataformas; "ver" ou "gerir"
  acessoPlataformas?: "ver" | "gerir";
  podeGerirSistemas?: boolean;
}

export default function AcoesRapidas({
  onNavegar,
  podeAprovar = false,
  acessoPlataformas,
  podeGerirSistemas = false,
}: AcoesRapidasProps) {
  const { t } = useTranslation();

  // Só aparecem os atalhos para as áreas a que a pessoa tem acesso
  const acoes = [
    podeAprovar
      ? { aba: "aprovacoes", rotulo: t("dashboard.acoesRapidas.gerirAprovacoes") }
      : { aba: "documentos", rotulo: t("dashboard.acoesRapidas.verDocumentos") },
    { aba: "categorias", rotulo: t("dashboard.acoesRapidas.verCategorias") },
    {
      aba: "sistemas",
      rotulo: podeGerirSistemas ? t("dashboard.acoesRapidas.gerirSistemas") : t("dashboard.acoesRapidas.verSistemas"),
    },
    ...(acessoPlataformas
      ? [{
          aba: "plataformas",
          rotulo: acessoPlataformas === "gerir"
            ? t("dashboard.acoesRapidas.gerirPlataformas")
            : t("dashboard.acoesRapidas.verPlataformas"),
        }]
      : []),
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-3 sm:gap-4 items-center justify-between">
      <span className="text-sm font-semibold text-slate-700">{t("dashboard.acoesRapidas.label")}</span>
      {/* No telemóvel os botões ficam numa grelha de 2 colunas com a mesma largura */}
      <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:gap-3 sm:w-auto">
        {acoes.map((acao) => (
          <button key={acao.aba} onClick={() => onNavegar(acao.aba)} className="px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
            {acao.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}