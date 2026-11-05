import { useState, type FormEvent } from "react";
import { useNavigate, Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDocumentosData } from "../../../hooks/useDocumentosData";
import { toast } from "sonner";
import { IconUpload } from "../../../components/icons";
import SelectPesquisavel from "../../../components/selectPesquisavel";
import { PERMISSOES, pode, type PerfilResumo } from "../../../utils/permissoes";

interface DashboardContext {
  usuario: { nome: string; perfil?: PerfilResumo | null; permissoes?: string[] } | null;
}

export default function NovoDocumentoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { categorias, criarDocumento } = useDocumentosData();
  const { usuario } = useOutletContext<DashboardContext>();
  const publicaDireto = pode(usuario, PERMISSOES.DOCUMENTOS_APROVAR);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  // Vindo de Categorias, a categoria chega em ?categoria=ID e fica pré-selecionada
  const [searchParams] = useSearchParams();
  const [categoriaId, setCategoriaId] = useState(searchParams.get("categoria") ?? "");
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error(t("documentos.form.tituloObrigatorio"));
      return;
    }

    if (!ficheiro) {
      toast.error(t("documentos.form.ficheiroObrigatorio"));
      return;
    }

    setSalvando(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descricao", descricao);
      formData.append("categoriaId", categoriaId);
      formData.append("ficheiro", ficheiro);

      await criarDocumento(formData);
      toast.success(
        publicaDireto
          ? t("documentos.publicadoComSucesso")
          : t("documentos.submetidoParaAprovacao")
      );
      navigate("/dashboard/documentos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("documentos.form.erroCriar"));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Link
        to="/dashboard/documentos"
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
      >
        ← {t("documentos.form.voltar")}
      </Link>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5">
        <h1 className="font-bold text-slate-800 text-lg">{t("documentos.novoDocumento")}</h1>

        {/* Título */}
        <div className="space-y-1.5">
          <label htmlFor="titulo" className="text-xs font-semibold text-slate-500 uppercase">
            {t("documentos.form.tituloLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="titulo"
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={t("documentos.form.tituloPlaceholder")}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-netline-azul/20 focus:border-netline-azul transition-all"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label htmlFor="descricao" className="text-xs font-semibold text-slate-500 uppercase">
            {t("documentos.form.descricaoLabel")}
          </label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder={t("documentos.form.descricaoPlaceholder")}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-netline-azul/20 focus:border-netline-azul transition-all resize-none"
          />
        </div>

        {/* Categoria */}
        <div className="space-y-1.5">
          <label htmlFor="categoria" className="text-xs font-semibold text-slate-500 uppercase">
            {t("documentos.form.categoriaLabel")}
          </label>
          <SelectPesquisavel
            id="categoria"
            valor={categoriaId}
            onChange={setCategoriaId}
            opcaoVazia={t("documentos.form.semCategoria")}
            opcoes={categorias.map((cat) => ({ valor: String(cat.id), label: cat.nome }))}
          />
        </div>

        {/* Área de Seleção de Ficheiro */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">
            {t("documentos.form.ficheiroLabel")} <span className="text-red-500">*</span>
          </label>
          <div className="relative border-2 border-dashed border-slate-200 hover:border-netline-azul/50 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center cursor-pointer">
            <input
              type="file"
              required
              onChange={(e) => setFicheiro(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <IconUpload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-500 font-medium">
                {ficheiro ? (
                  <span className="text-netline-azul font-semibold break-all">{ficheiro.name}</span>
                ) : (
                  t("documentos.form.clicarOuArrastar")
                )}
              </span>
              <span className="text-[11px] text-slate-400">
                {ficheiro ? `${(ficheiro.size / (1024 * 1024)).toFixed(2)} MB` : t("documentos.form.formatosAceites")}
              </span>
            </div>
          </div>
        </div>

        {/* Aviso para funcionario sobre fluxo de aprovação */}
        {!publicaDireto && (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            {t("documentos.avisoAprovacao")}
          </p>
        )}

        {/* Ações */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
          <Link
            to="/dashboard/documentos"
            className="flex-1 text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            {t("documentos.form.cancelar")}
          </Link>
          <button
            type="submit"
            disabled={salvando || !titulo || !ficheiro}
            className="flex-1 py-2.5 bg-netline-azul hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando
              ? publicaDireto ? t("documentos.aGuardar") : t("documentos.aSubmeter")
              : publicaDireto ? t("documentos.guardar") : t("documentos.submeter")}
          </button>
        </div>
      </form>
    </div>
  );
}