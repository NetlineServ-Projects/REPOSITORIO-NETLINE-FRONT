import { useState } from "react";
import EtiquetaSistema from "../../../../components/etiquetaSistema";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDocumentoDetalhe } from "../../../../hooks/useDocumentoDetalhe";
import StatusBadge from "../../../../components/statusBadge";
import { formatarExtensao, obterNomeExibicao, formatarTamanho, obterUrlTransferencia } from "../../../../utils/documentos";
import { API_URL } from "../../../../utils/api";
import { IconDownload } from "../../../../components/icons";
import { toast } from "sonner";
import ModalMotivoRejeicao from "../modalMotivoRejeicao";
import { EstadoCarregando, EstadoErro } from "../../../../components/estados";

export default function AprovacaoDetalhesPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documento, loading, erro, recarregar, alterarEstado } = useDocumentoDetalhe(id!);
  const [modalRejeicaoAberto, setModalRejeicaoAberto] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  const handleAprovar = async () => {
    setAEnviar(true);
    try {
      await alterarEstado("APROVADO");
      toast.success(t("admin.aprovacoes.aprovado"));
      navigate("/dashboard/aprovacoes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.aprovacoes.erroAprovar"));
    } finally {
      setAEnviar(false);
    }
  };

  // Cancelar no modal não faz nada; só "Confirmar rejeição" rejeita o documento
  const confirmarRejeicao = async (motivo: string) => {
    setModalRejeicaoAberto(false);
    setAEnviar(true);
    try {
      await alterarEstado("REJEITADO", motivo.trim() || undefined);
      toast.success(t("admin.aprovacoes.rejeitado"));
      navigate("/dashboard/aprovacoes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.aprovacoes.erroRejeitar"));
    } finally {
      setAEnviar(false);
    }
  };

  if (loading) {
    return <EstadoCarregando mensagem={t("documentos.detalhes.carregando")} />;
  }

  if (erro || !documento) {
    return (
      <div className="space-y-3 text-center">
        {erro ? (
          <EstadoErro mensagem={erro} onTentarNovamente={recarregar} />
        ) : (
          <EstadoErro mensagem={t("documentos.detalhes.naoEncontrado")} />
        )}
        <Link to="/dashboard/aprovacoes" className="text-sm text-netline-azul font-semibold hover:underline">{t("admin.aprovacoes.voltar")}</Link>
      </div>
    );
  }

  const ext = formatarExtensao(documento.tipoArquivo, documento.nomeArquivo);
  const nomeExibicao = obterNomeExibicao(documento);

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/dashboard/aprovacoes" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 font-medium">← {t("admin.aprovacoes.voltar")}</Link>

      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-wrap-reverse items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 bg-blue-50 text-netline-azul rounded-lg text-xs font-extrabold uppercase border border-blue-100/50 shrink-0">{ext}</span>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-lg wrap-break-word">{nomeExibicao}</h1>
              {documento.descricao && <p className="text-sm text-slate-400 mt-0.5 wrap-break-word">{documento.descricao}</p>}
            </div>
          </div>
          <StatusBadge estado={documento.estado} />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-4">
          <div>
            <dt className="text-slate-400 text-xs uppercase font-semibold">{t("documentos.detalhes.categoria")}</dt>
            <dd className="text-slate-700 mt-0.5">{documento.categoria?.nome || t("documentos.detalhes.semCategoria")}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase font-semibold">{t("componentes.documento.pertenceSistema")}</dt>
            <dd className="text-slate-700 mt-0.5">
              {documento.sistema ? <EtiquetaSistema sistema={documento.sistema} /> : t("componentes.documento.semSistema")}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase font-semibold">{t("documentos.detalhes.submetidoPor")}</dt>
            <dd className="text-slate-700 mt-0.5">{documento.usuario?.nome || t("documentos.detalhes.sistema")}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase font-semibold">{t("documentos.detalhes.data")}</dt>
            <dd className="text-slate-700 mt-0.5">{documento.dataSubmissao ? new Date(documento.dataSubmissao).toLocaleDateString(i18n.language === "en" ? "en-GB" : "pt-PT") : t("componentes.documento.semData")}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs uppercase font-semibold">{t("documentos.detalhes.tamanho")}</dt>
            <dd className="text-slate-700 mt-0.5">{formatarTamanho(documento.tamanho)}</dd>
          </div>
        </dl>

        <a href={obterUrlTransferencia(documento.caminho, API_URL)} download={documento.nomeArquivo} className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-netline-azul text-sm font-semibold rounded-lg transition-colors border border-blue-100">
          <IconDownload /> {t("documentos.detalhes.baixarFicheiro")}
        </a>

        {documento.estado === "PENDENTE" && (
          <div className="flex flex-col-reverse sm:flex-row gap-3 border-t border-slate-100 pt-4">
            <button onClick={() => setModalRejeicaoAberto(true)} disabled={aEnviar} className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">{t("admin.aprovacoes.rejeitar")}</button>
            <button onClick={handleAprovar} disabled={aEnviar} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50">{aEnviar ? t("admin.aprovacoes.aEnviar") : t("admin.aprovacoes.aprovar")}</button>
          </div>
        )}
      </div>

      <ModalMotivoRejeicao
        aberto={modalRejeicaoAberto}
        onConfirmar={confirmarRejeicao}
        onCancelar={() => setModalRejeicaoAberto(false)}
      />
    </div>
  );
}