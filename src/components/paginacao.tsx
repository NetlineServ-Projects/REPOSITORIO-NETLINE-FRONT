import { useTranslation } from "react-i18next";
import type { EstadoPaginacao } from "../hooks/usePaginacao";

// Números a mostrar: a primeira, a última e as vizinhas da atual; "…" nos saltos.
// Ex.: 1 … 4 5 6 … 12
function numerosVisiveis(pagina: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const numeros = new Set([1, total, pagina - 1, pagina, pagina + 1]);
  const ordenados = [...numeros].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const resultado: (number | "…")[] = [];
  ordenados.forEach((n, i) => {
    if (i > 0 && n - ordenados[i - 1] > 1) resultado.push("…");
    resultado.push(n);
  });
  return resultado;
}

// "Anterior 1 2 3 Seguinte", como no GitHub. Com uma só página não aparece.
// O col-span-full deixa-a ocupar a linha inteira quando fica dentro de uma grelha.
export default function Paginacao({ pagina, totalPaginas, totalItens, porPagina, irPara }: EstadoPaginacao) {
  const { t } = useTranslation();
  if (totalPaginas <= 1) return null;

  const primeiro = (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, totalItens);
  const mudar = (n: number) => {
    irPara(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const botaoSeta =
    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-slate-300 disabled:cursor-not-allowed text-netline-azul hover:bg-blue-50 cursor-pointer";

  return (
    <nav
      aria-label={t("componentes.paginacao.rotulo")}
      className="col-span-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
    >
      <p className="text-xs text-slate-400">
        {t("componentes.paginacao.intervalo", { primeiro, ultimo, total: totalItens })}
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button type="button" onClick={() => mudar(pagina - 1)} disabled={pagina === 1} className={botaoSeta}>
          ‹ {t("componentes.paginacao.anterior")}
        </button>
        {numerosVisiveis(pagina, totalPaginas).map((n, i) =>
          n === "…" ? (
            <span key={`salto-${i}`} className="px-2 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => mudar(n)}
              aria-current={n === pagina ? "page" : undefined}
              className={`min-w-9 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                n === pagina ? "bg-netline-azul text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {n}
            </button>
          ),
        )}
        <button type="button" onClick={() => mudar(pagina + 1)} disabled={pagina === totalPaginas} className={botaoSeta}>
          {t("componentes.paginacao.seguinte")} ›
        </button>
      </div>
    </nav>
  );
}
