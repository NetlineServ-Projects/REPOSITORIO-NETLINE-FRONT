import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPen, faTrash, faUserShield, faUser } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import type { Usuario } from "../../../hooks/useUsuariosData";
import { API_URL } from "../../../utils/api";
import { EstadoVazio } from "../../../components/estados";
import { usePaginacao } from "../../../hooks/usePaginacao";
import Paginacao from "../../../components/paginacao";

interface UsuariosTabelaProps {
  usuarios: Usuario[];
  onVer: (u: Usuario) => void;
  onEditar: (u: Usuario) => void;
  onEliminar: (id: number, nome: string) => void;
  // Contas de administrador só um administrador as edita; ninguém elimina a própria conta
  podeEditar: (u: Usuario) => boolean;
  podeEliminar: (u: Usuario) => boolean;
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function Avatar({ u }: { u: Usuario }) {
  return u.fotografia ? (
    <img
      src={`${API_URL}${u.fotografia}`}
      alt={u.nome}
      className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-netline-azul/10 text-netline-azul flex items-center justify-center text-xs font-semibold flex-shrink-0">
      {iniciais(u.nome)}
    </div>
  );
}

export function BadgePerfil({ perfil }: { perfil: Usuario["perfil"] | null | undefined }) {
  const admin = Boolean(perfil?.administrador);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${admin ? "bg-purple-100/70 text-purple-700" : "bg-blue-100/70 text-blue-600"}`}>
      <FontAwesomeIcon icon={admin ? faUserShield : faUser} className="w-3.5 h-3.5" />
      {perfil?.nome ?? "-"}
    </span>
  );
}

// Ver / Editar / Eliminar: as mesmas na tabela (lg+) e nos cartões (ecrãs menores)
function AcoesUsuario({ u, onVer, onEditar, onEliminar, podeEditar, podeEliminar }: { u: Usuario } & Omit<UsuariosTabelaProps, "usuarios">) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => onVer(u)} className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" title={t("admin.usuarios.verDetalhes")} aria-label={t("admin.usuarios.verDetalhes")}>
        <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
      </button>
      {podeEditar(u) && (
        <button onClick={() => onEditar(u)} className="p-2.5 text-amber-600 bg-amber-100/60 hover:bg-amber-100 rounded-lg transition-colors" title={t("comum.editar")} aria-label={t("comum.editar")}>
          <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
        </button>
      )}
      {podeEliminar(u) && (
        <button onClick={() => onEliminar(u.id, u.nome)} className="p-2.5 text-rose-600 bg-rose-100/60 hover:bg-rose-100 rounded-lg transition-colors" title={t("comum.apagar")} aria-label={t("comum.apagar")}>
          <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// A primeira carga (e o erro dela) é tratada pela página
export default function UsuariosTabela({ usuarios, ...acoes }: UsuariosTabelaProps) {
  const { t } = useTranslation();
  // Mostra 10 de cada vez
  const paginacao = usePaginacao(usuarios);

  if (usuarios.length === 0) {
    return <EstadoVazio mensagem={t("admin.usuarios.nenhum")} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Ecrãs menores: um cartão por utilizador */}
        <ul className="lg:hidden divide-y divide-slate-100">
          {paginacao.itens.map((u) => (
            <li key={u.id} className="p-4 flex items-start gap-3">
              <Avatar u={u} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800 text-sm">{u.nome}</div>
                <div className="text-xs text-slate-400 mt-0.5 break-all">{u.email}</div>
                {(u.cargo || u.numero) && (
                  <div className="text-xs text-slate-500 mt-1">{[u.cargo, u.numero].filter(Boolean).join(" · ")}</div>
                )}
                <div className="mt-2">
                  <BadgePerfil perfil={u.perfil} />
                </div>
              </div>
              <AcoesUsuario u={u} {...acoes} />
            </li>
          ))}
        </ul>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-400 uppercase font-semibold text-xs tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-4 px-6">{t("admin.usuarios.tabela.nomeEmail")}</th>
                <th className="py-4 px-6">{t("admin.usuarios.tabela.cargo")}</th>
                <th className="py-4 px-6">{t("admin.usuarios.tabela.telemovel")}</th>
                <th className="py-4 px-6">{t("admin.usuarios.tabela.perfil")}</th>
                <th className="py-4 px-6 text-right">{t("comum.acoes")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginacao.itens.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar u={u} />
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{u.nome}</div>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 text-sm">{u.cargo || "-"}</td>
                  <td className="py-4 px-6 text-slate-600 text-sm">{u.numero || "-"}</td>
                  <td className="py-4 px-6">
                    <BadgePerfil perfil={u.perfil} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <AcoesUsuario u={u} {...acoes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      <div className="px-4 pb-4">
        <Paginacao {...paginacao} />
      </div>
    </div>
  );
}