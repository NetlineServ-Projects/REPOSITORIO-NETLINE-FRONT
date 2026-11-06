import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type {
  CatalogoFornecedores,
  DadosPlataforma,
  Plataforma,
  TipoPlataforma,
} from "../../../types/plataforma";
import { API_URL } from "../../../utils/api";
import { listarFornecedores } from "../../../hooks/usePlataformasData";
import ContasAcesso from "./ContasAcesso";
import { linhasIniciais, linhasParaDados, type LinhaAcesso } from "./linhasAcesso";
import SelectPesquisavel from "../../../components/selectPesquisavel";
import i18n from "../../../lang/i18n";

interface FormPlataformaProps {
  plataformaExistente?: Plataforma | null;
  salvando: boolean;
  onCancelar: () => void;
  onSubmit: (dados: DadosPlataforma, logotipo: File | null) => Promise<void>;
}

// Rótulo e descrição de cada tipo em plataformas.tipos.* e plataformas.form.plataforma.tipoDescricoes.*
const OPCOES_TIPO: TipoPlataforma[] = ["CONTAINERIZACAO", "CLOUD_BASE_DADOS", "GESTAO_DOMINIO"];

const FORNECEDOR_OUTRO = "OUTRO";
const FORMATOS_LOGOTIPO = ["image/png", "image/jpeg", "image/webp"];
const TAMANHO_MAXIMO_LOGOTIPO = 2 * 1024 * 1024; // 2 MB

const CLASSE_CAMPO =
  "w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all text-slate-800";
const CLASSE_ROTULO =
  "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2";

export default function FormPlataforma({
  plataformaExistente,
  salvando,
  onCancelar,
  onSubmit,
}: FormPlataformaProps) {
  const { t } = useTranslation();
  // Lista de fornecedores de cada tipo (vem do backend)
  const [catalogo, setCatalogo] = useState<CatalogoFornecedores | null>(null);

  const [tipo, setTipo] = useState<TipoPlataforma>(
    plataformaExistente?.tipo ?? "CONTAINERIZACAO",
  );
  const [fornecedor, setFornecedor] = useState(plataformaExistente?.fornecedor ?? "");
  // O nome só se escreve quando o fornecedor é "Outro"; nos restantes vem do fornecedor
  const [nome, setNome] = useState(
    plataformaExistente?.fornecedor === FORNECEDOR_OUTRO ? plataformaExistente.nome : "",
  );
  const [urlPainel, setUrlPainel] = useState(plataformaExistente?.urlPainel ?? "");
  const [ativo, setAtivo] = useState(plataformaExistente?.ativo ?? true);

  // Contas de acesso (todos os tipos): uma ou mais, ex: a da Netline e a de um cliente
  const [contas, setContas] = useState<LinhaAcesso[]>(() => linhasIniciais(plataformaExistente?.acessos));

  // Registry (só containerização)
  const [registryUrl, setRegistryUrl] = useState(plataformaExistente?.registryUrl ?? "");
  const [namespace, setNamespace] = useState(plataformaExistente?.namespace ?? "");

  // Logótipo
  const [logotipo, setLogotipo] = useState<File | null>(null);
  const [previewLogotipo, setPreviewLogotipo] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarFornecedores()
      .then((dados) => {
        if (!cancelado) setCatalogo(dados);
      })
      // i18n.t (e não o t do hook) para o pedido não se repetir quando o idioma muda
      .catch(() => toast.error(i18n.t("plataformas.form.plataforma.erroFornecedores")));
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!logotipo) {
      setPreviewLogotipo(null);
      return;
    }
    const url = URL.createObjectURL(logotipo);
    setPreviewLogotipo(url);
    return () => URL.revokeObjectURL(url);
  }, [logotipo]);

  const ehContainerizacao = tipo === "CONTAINERIZACAO";
  const ehOutro = fornecedor === FORNECEDOR_OUTRO;
  const opcoes = catalogo?.[tipo] ?? [];
  const fornecedorEscolhido = opcoes.find((o) => o.valor === fornecedor);

  const logotipoMostrado =
    previewLogotipo ??
    (plataformaExistente?.logotipo ? `${API_URL}${plataformaExistente.logotipo}` : null);

  const escolherTipo = (novo: TipoPlataforma) => {
    setTipo(novo);
    // O fornecedor escolhido tem de pertencer ao novo tipo
    if (fornecedor && !catalogo?.[novo]?.some((o) => o.valor === fornecedor)) {
      setFornecedor("");
    }
  };

  // O fornecedor preenche o URL do painel e o do registry, sem apagar o que a pessoa escreveu
  const escolherFornecedor = (valor: string) => {
    const anterior = opcoes.find((o) => o.valor === fornecedor);
    const novo = opcoes.find((o) => o.valor === valor);

    setFornecedor(valor);

    if (!urlPainel.trim() || urlPainel === anterior?.urlPainel) {
      setUrlPainel(novo?.urlPainel ?? "");
    }
    if (ehContainerizacao && (!registryUrl.trim() || registryUrl === anterior?.registryUrl)) {
      setRegistryUrl(novo?.registryUrl ?? "");
    }
  };

  const escolherLogotipo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ficheiro = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!ficheiro) return;

    if (!FORMATOS_LOGOTIPO.includes(ficheiro.type)) {
      toast.error(t("plataformas.form.plataforma.logotipoFormato"));
      return;
    }
    if (ficheiro.size > TAMANHO_MAXIMO_LOGOTIPO) {
      toast.error(t("plataformas.form.plataforma.logotipoTamanho"));
      return;
    }
    setLogotipo(ficheiro);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fornecedor) {
      toast.error(t("plataformas.form.plataforma.escolhaFornecedor"));
      return;
    }
    if (ehOutro && nome.trim().length < 2) {
      toast.error(t("plataformas.form.plataforma.indiqueNome"));
      return;
    }

    if (urlPainel.trim()) {
      try {
        const url = new URL(urlPainel.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error();
        }
      } catch {
        toast.error(t("plataformas.form.plataforma.urlInvalido"));
        return;
      }
    }

    // Lista completa das contas (as removidas no formulário são apagadas no backend)
    const acessos = linhasParaDados(contas);
    if (!acessos) {
      toast.error(t("plataformas.form.plataforma.contaIncompleta"));
      return;
    }

    const dados: DadosPlataforma = {
      tipo,
      fornecedor,
      urlPainel: urlPainel.trim() || null,
      ativo,
      acessos,
    };

    if (ehOutro) dados.nome = nome.trim();

    // Nos outros tipos estes campos nem são enviados (o backend recusa-os)
    if (ehContainerizacao) {
      dados.registryUrl = registryUrl.trim() || null;
      dados.namespace = namespace.trim() || null;
    }

    await onSubmit(dados, logotipo);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {plataformaExistente ? t("plataformas.form.plataforma.tituloEditar") : t("plataformas.form.plataforma.tituloNova")}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("plataformas.form.plataforma.descricao")}
          </p>
        </div>

        {/* Tipo da Plataforma */}
        <div>
          <label className={CLASSE_ROTULO}>{t("plataformas.form.plataforma.tipo")}</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {OPCOES_TIPO.map((valor) => (
              <label
                key={valor}
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  tipo === valor
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <input
                    type="radio"
                    name="tipoPlataforma"
                    value={valor}
                    checked={tipo === valor}
                    onChange={() => escolherTipo(valor)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-800">
                    {/* No formulário a gestão de domínio mostra-se com "& DNS" */}
                    {valor === "GESTAO_DOMINIO" ? t("plataformas.form.plataforma.tipoGestaoDominio") : t(`plataformas.tipos.${valor}`)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 pl-5 leading-relaxed">{t(`plataformas.form.plataforma.tipoDescricoes.${valor}`)}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Fornecedor (dele sai o nome) */}
        <div>
          <label htmlFor="plataforma-fornecedor" className={CLASSE_ROTULO}>{t("plataformas.form.plataforma.fornecedor")}</label>
          <SelectPesquisavel
            id="plataforma-fornecedor"
            valor={fornecedor}
            onChange={escolherFornecedor}
            disabled={!catalogo}
            placeholder={catalogo ? t("plataformas.form.plataforma.selecioneFornecedor") : t("plataformas.form.plataforma.aCarregar")}
            opcoes={opcoes.map((o) => ({ valor: o.valor, label: o.rotulo }))}
          />
          {fornecedorEscolhido && !ehOutro && (
            <p className="text-xs text-slate-500 mt-1.5">
              {t("plataformas.form.plataforma.nomeDaPlataforma")} <strong>{fornecedorEscolhido.rotulo}</strong>
            </p>
          )}
        </div>

        {/* Nome (só quando o fornecedor é "Outro") */}
        {ehOutro && (
          <div>
            <label className={CLASSE_ROTULO}>{t("plataformas.form.plataforma.nome")}</label>
            <input
              type="text"
              placeholder={t("plataformas.form.plataforma.nomePlaceholder")}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={CLASSE_CAMPO}
            />
          </div>
        )}

        {/* URL Painel */}
        <div>
          <label className={CLASSE_ROTULO}>{t("plataformas.form.plataforma.urlPainel")}</label>
          <input
            type="url"
            placeholder={t("plataformas.form.plataforma.urlPainelPlaceholder")}
            value={urlPainel}
            onChange={(e) => setUrlPainel(e.target.value)}
            className={CLASSE_CAMPO}
          />
        </div>

        {/* Contas de acesso (todos os tipos) */}
        <ContasAcesso
          linhas={contas}
          onChange={setContas}
          plataformaId={plataformaExistente?.id}
          nomePlataforma={plataformaExistente?.nome}
          classeCampo={`${CLASSE_CAMPO} bg-white`}
        />

        {/* Registry (só containerização) */}
        {ehContainerizacao && (
          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t("plataformas.form.plataforma.registry")}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t("plataformas.form.plataforma.urlRegistry")}
                </label>
                <input
                  type="text"
                  placeholder={t("plataformas.form.plataforma.urlRegistryPlaceholder")}
                  value={registryUrl}
                  onChange={(e) => setRegistryUrl(e.target.value)}
                  className={`${CLASSE_CAMPO} bg-white`}
                />
                <p className="text-[11px] text-slate-400 mt-1">{t("plataformas.form.plataforma.urlRegistryAjuda")}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {t("plataformas.form.plataforma.namespace")}
                </label>
                <input
                  type="text"
                  placeholder={t("plataformas.form.plataforma.namespacePlaceholder")}
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  className={`${CLASSE_CAMPO} bg-white`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Logótipo */}
        <div>
          <label className={CLASSE_ROTULO}>{t("plataformas.form.plataforma.logotipo")}</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {logotipoMostrado ? (
                <img
                  src={logotipoMostrado}
                  alt={t("plataformas.form.plataforma.logotipoAlt")}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <span className="text-[11px] text-slate-400">{t("plataformas.form.plataforma.semLogotipo")}</span>
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <input
                type="file"
                accept={FORMATOS_LOGOTIPO.join(",")}
                onChange={escolherLogotipo}
                className="w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200 file:cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">{t("plataformas.form.plataforma.logotipoAjuda")}</p>
            </div>
          </div>
        </div>

        {/* Ativo */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="platAtivo"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="platAtivo" className="text-sm font-medium text-slate-700 cursor-pointer">
            {t("plataformas.form.plataforma.ativa")}
          </label>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all cursor-pointer"
        >
          {t("plataformas.comum.cancelar")}
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="px-6 py-2.5 bg-netline-azul hover:bg-blue-900 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          {salvando ? t("plataformas.comum.aGuardar") : plataformaExistente ? t("plataformas.form.plataforma.atualizar") : t("plataformas.form.plataforma.criar")}
        </button>
      </div>
    </form>
  );
}