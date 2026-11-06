import { useState } from "react";
import { useTranslation } from "react-i18next";
import { linhaVazia, type LinhaAcesso } from "./linhasAcesso";
import SegredoRevelavel from "../../../components/segredoRevelavel";
import { revelarTokenPlataforma } from "../../../hooks/usePlataformasData";
import { IconLixeira, IconOlhoAberto, IconOlhoFechado } from "../../../components/icons";

interface ContasAcessoProps {
  linhas: LinhaAcesso[];
  onChange: (linhas: LinhaAcesso[]) => void;
  plataformaId?: number;
  nomePlataforma?: string;
  classeCampo: string;
}

export default function ContasAcesso({
  linhas,
  onChange,
  plataformaId,
  nomePlataforma,
  classeCampo,
}: ContasAcessoProps) {
  const { t } = useTranslation();
  // Linhas com o token visível enquanto se escreve
  const [tokensVisiveis, setTokensVisiveis] = useState<Set<string>>(new Set());

  const alterar = (chave: string, campo: "descricao" | "utilizador" | "token", valor: string) =>
    onChange(linhas.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)));

  const remover = (chave: string) => onChange(linhas.filter((l) => l.chave !== chave));

  const alternarToken = (chave: string) =>
    setTokensVisiveis((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });

  const adicionar = () => onChange([...linhas, linhaVazia()]);

  // Com uma só conta nova, os campos aparecem soltos (como no formulário original).
  // Com várias, cada conta fica no seu cartão, com o número e o botão de remover.
  const variasContas = linhas.length > 1;

  return (
    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
        {t("plataformas.form.plataforma.credenciais")}
      </span>

      {linhas.map((linha, indice) => {
        const mostrarToken = tokensVisiveis.has(linha.chave);
        const nomeConta = linha.descricao.trim() || linha.utilizador.trim() || t("plataformas.form.plataforma.contaN", { n: indice + 1 });
        // Uma conta já gravada pode sempre ser removida; uma nova só quando há mais do que uma
        const podeRemover = variasContas || linha.id !== undefined;
        const emCartao = variasContas || linha.id !== undefined;

        return (
          <div
            key={linha.chave}
            className={emCartao ? "bg-white border border-slate-200 rounded-xl p-3.5 space-y-3" : "space-y-4"}
          >
            {emCartao && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600 truncate">
                  {t("plataformas.form.plataforma.contaN", { n: indice + 1 })}
                </span>
                {podeRemover && (
                  <button
                    type="button"
                    onClick={() => remover(linha.chave)}
                    title={t("plataformas.form.plataforma.removerConta")}
                    aria-label={t("plataformas.form.plataforma.removerConta")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <IconLixeira />
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {t("plataformas.form.plataforma.descricaoConta")}
              </label>
              <input
                type="text"
                placeholder={t("plataformas.form.plataforma.descricaoContaPlaceholder")}
                value={linha.descricao}
                onChange={(e) => alterar(linha.chave, "descricao", e.target.value)}
                maxLength={255}
                className={classeCampo}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t("plataformas.form.plataforma.utilizador")}
                </label>
                <input
                  type="text"
                  placeholder={t("plataformas.form.plataforma.utilizadorPlaceholder")}
                  value={linha.utilizador}
                  onChange={(e) => alterar(linha.chave, "utilizador", e.target.value)}
                  autoComplete="off"
                  maxLength={255}
                  className={classeCampo}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t("plataformas.form.plataforma.token")}
                </label>
                <div className="relative">
                  <input
                    type={mostrarToken ? "text" : "password"}
                    placeholder={
                      linha.temToken
                        ? t("plataformas.form.plataforma.tokenManter")
                        : t("plataformas.form.plataforma.tokenPlaceholder")
                    }
                    value={linha.token}
                    onChange={(e) => alterar(linha.chave, "token", e.target.value)}
                    autoComplete="new-password"
                    maxLength={1000}
                    className={`${classeCampo} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => alternarToken(linha.chave)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarToken ? <IconOlhoFechado /> : <IconOlhoAberto />}
                  </button>
                </div>
              </div>
            </div>

            {linha.id !== undefined && linha.temToken && plataformaId !== undefined && (
              <div className="space-y-1 bg-white border border-slate-200 rounded-lg p-2.5">
                <p className="text-[11px] font-semibold text-slate-500">{t("plataformas.form.plataforma.tokenGuardado")}</p>
                <SegredoRevelavel
                  descricao={t("plataformas.form.plataforma.tokenDescricao", { conta: nomeConta, nome: nomePlataforma })}
                  obter={(tokenElevado) => revelarTokenPlataforma(plataformaId, linha.id!, tokenElevado)}
                />
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={adicionar}
        className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-blue-900 hover:bg-blue-50/60 hover:border-blue-300 transition-colors cursor-pointer"
      >
        + {t("plataformas.form.plataforma.adicionarConta")}
      </button>
    </div>
  );
}
