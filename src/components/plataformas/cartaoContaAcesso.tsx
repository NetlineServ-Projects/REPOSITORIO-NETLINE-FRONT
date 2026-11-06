import { useTranslation } from "react-i18next";
import { Campo } from "../secaoDetalhe";
import SegredoRevelavel from "../segredoRevelavel";
import { revelarTokenPlataforma } from "../../hooks/usePlataformasData";
import { IconChave, IconSetaDireita } from "../icons";
import type { AcessoPlataforma } from "../../types/plataforma";

interface CartaoContaAcessoProps {
  conta: AcessoPlataforma;
  plataformaId: number;
  nomePlataforma: string;
  // Só nas plataformas de gestão de domínio: abre a página com os domínios desta conta
  onAbrir?: () => void;
  totalDominios?: number;
}

// Conta de acesso de uma plataforma: a quem pertence, utilizador e token
export default function CartaoContaAcesso({
  conta,
  plataformaId,
  nomePlataforma,
  onAbrir,
  totalDominios = 0,
}: CartaoContaAcessoProps) {
  const { t } = useTranslation();
  const nome = conta.descricao || conta.utilizador || t("plataformas.detalhe.contaSemDescricao");
  const clicavel = onAbrir !== undefined;

  return (
    <div
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (clicavel && (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
          e.preventDefault();
          onAbrir();
        }
      }}
      role={clicavel ? "link" : undefined}
      tabIndex={clicavel ? 0 : undefined}
      aria-label={clicavel ? t("plataformas.detalhe.verDominiosDaConta", { nome }) : undefined}
      className={`bg-white rounded-2xl border border-slate-200/70 shadow-xs p-5 space-y-4 ${
        clicavel
          ? "cursor-pointer transition-all hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/30"
          : ""
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="p-1.5 rounded-lg bg-blue-50 text-blue-900 shrink-0">
          <IconChave className="w-3.5 h-3.5" />
        </span>
        <h4 className={`text-sm font-bold truncate ${conta.descricao ? "text-slate-800" : "text-slate-400 italic"}`}>
          {nome}
        </h4>
      </div>

      <dl className="space-y-4">
        <Campo rotulo={t("plataformas.detalhe.utilizador")}>
          {conta.utilizador ? (
            <span className="font-mono break-all">{conta.utilizador}</span>
          ) : (
            <span className="text-slate-400 font-normal">{t("plataformas.detalhe.naoDefinido")}</span>
          )}
        </Campo>
        <Campo rotulo={t("plataformas.detalhe.token")}>
          {conta.temToken ? (
            // Mostrar/copiar o token não abre a página da conta
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <SegredoRevelavel
                descricao={t("plataformas.detalhe.tokenDescricao", { conta: nome, nome: nomePlataforma })}
                obter={(tokenElevado) => revelarTokenPlataforma(plataformaId, conta.id, tokenElevado)}
              />
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{t("plataformas.detalhe.naoDefinido")}</span>
          )}
        </Campo>
      </dl>

      {clicavel && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-900">
          <span>{t("plataformas.detalhe.verDominios", { count: totalDominios })}</span>
          <IconSetaDireita className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
