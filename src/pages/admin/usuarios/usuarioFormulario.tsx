import { useState } from "react";
import {
  IconOlhoAberto,
  IconOlhoFechado,
  IconVoltar,
} from "../../../components/icons";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faSave } from "@fortawesome/free-solid-svg-icons";
import type { UsuarioFormData } from "../../../hooks/useUsuariosData";
import type { PerfilResumo } from "../../../utils/permissoes";
import SelectPesquisavel from "../../../components/selectPesquisavel";

interface UsuarioFormularioProps {
  editandoId: number | null;
  formData: UsuarioFormData;
  onFormDataChange: (dados: UsuarioFormData) => void;
  // Perfis que quem está a editar pode atribuir (o Administrador só aparece a administradores)
  perfis: PerfilResumo[];
  // A própria conta: o perfil não se pode mudar
  perfilBloqueado?: boolean;
  salvando: boolean;
  erro: string | null;
  onVoltar: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function UsuarioFormulario({
  editandoId,
  formData,
  onFormDataChange,
  perfis,
  perfilBloqueado = false,
  salvando,
  erro,
  onVoltar,
  onSubmit,
}: UsuarioFormularioProps) {
  const { t } = useTranslation();
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onVoltar}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <IconVoltar className="w-4 h-4" />
            <span>{t("admin.usuarios.form.voltar")}</span>
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              {editandoId ? t("admin.usuarios.form.tituloEditar") : t("admin.usuarios.form.tituloNovo")}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {editandoId
                ? t("admin.usuarios.form.subtituloEditar")
                : t("admin.usuarios.form.subtituloNovo")}
            </p>
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {erro}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5 text-sm">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            {t("admin.usuarios.form.nome")}
          </label>
          <input
            type="text"
            required
            placeholder={t("admin.usuarios.form.nomePlaceholder")}
            value={formData.nome}
            onChange={(e) =>
              onFormDataChange({ ...formData, nome: e.target.value })
            }
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {t("admin.usuarios.form.email")}
            </label>
            <input
              type="email"
              required
              placeholder={t("admin.usuarios.form.emailPlaceholder")}
              value={formData.email}
              onChange={(e) =>
                onFormDataChange({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700"
            />
            <p className="text-xs text-slate-400 mt-1.5">{t("admin.usuarios.form.emailInstitucional")}</p>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {editandoId ? t("admin.usuarios.form.novaSenha") : t("admin.usuarios.form.senhaInicial")}
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                required={!editandoId}
                minLength={8}
                placeholder={
                  editandoId
                    ? t("admin.usuarios.form.senhaManter")
                    : t("admin.usuarios.form.senhaMinimo")
                }
                value={formData.senha}
                onChange={(e) =>
                  onFormDataChange({ ...formData, senha: e.target.value })
                }
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                aria-label={mostrarSenha ? t("admin.usuarios.form.ocultarSenha") : t("admin.usuarios.form.mostrarSenha")}
              >
                {mostrarSenha ? (
                  <IconOlhoFechado className="w-4 h-4" />
                ) : (
                  <IconOlhoAberto className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {t("admin.usuarios.form.telemovel")}
            </label>
            <input
              type="text"
              required
              placeholder={t("admin.usuarios.form.telemovelPlaceholder")}
              value={formData.numero}
              onChange={(e) =>
                onFormDataChange({ ...formData, numero: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {t("admin.usuarios.form.cargo")}
            </label>
            <input
              type="text"
              required
              placeholder={t("admin.usuarios.form.cargoPlaceholder")}
              value={formData.cargo}
              onChange={(e) =>
                onFormDataChange({ ...formData, cargo: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {t("admin.usuarios.form.departamento")}
            </label>
            <input
              type="text"
              required
              placeholder={t("admin.usuarios.form.departamentoPlaceholder")}
              value={formData.departamento}
              onChange={(e) =>
                onFormDataChange({ ...formData, departamento: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-sm text-slate-700"
            />
          </div>
          <div>
            <label htmlFor="usuario-perfil" className="block font-semibold text-slate-700 mb-1.5">
              {t("admin.usuarios.form.perfil")}
            </label>
            <SelectPesquisavel
              id="usuario-perfil"
              valor={formData.perfilId === "" ? "" : String(formData.perfilId)}
              onChange={(v) =>
                onFormDataChange({
                  ...formData,
                  perfilId: v ? Number(v) : "",
                })
              }
              opcoes={perfis.map((p) => ({ valor: String(p.id), label: p.nome }))}
              placeholder={t("admin.usuarios.form.escolherPerfil")}
              disabled={perfilBloqueado}
            />
            {perfilBloqueado && (
              <p className="text-xs text-slate-400 mt-1.5">{t("admin.usuarios.form.perfilProprio")}</p>
            )}
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            {t("componentes.confirmacao.cancelar")}
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3 bg-[#1B2A4A] text-white rounded-xl text-sm font-semibold hover:bg-[#14203A] transition-colors disabled:opacity-50 shadow-sm"
          >
            {salvando ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="w-4 h-4" />
                <span>{t("documentos.aGuardar")}</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                <span>{editandoId ? t("admin.usuarios.form.atualizarConta") : t("admin.usuarios.form.criarConta")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}