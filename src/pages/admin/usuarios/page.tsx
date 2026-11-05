import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  useUsuariosData,
  type Usuario,
  type UsuarioFormData,
} from "../../../hooks/useUsuariosData";

import UsuariosHeader from "./usuariosHeader";
import UsuariosBusca from "./usuariosBusca";
import UsuariosTabela from "./usuariosTabela";
import UsuarioFormulario from "./usuarioFormulario";
import { useConfirmacao } from "../../../components/confirmacao";
import { EstadoCarregando, EstadoErro } from "../../../components/estados";
import { useUsuario } from "../../../components/usuarioContext";
import { ehAdministrador } from "../../../utils/permissoes";

const FORM_VAZIO: UsuarioFormData = {
  nome: "",
  email: "",
  senha: "",
  numero: "",
  cargo: "",
  departamento: "",
  perfilId: "",
};

export default function UsuariosPage() {
  const { t } = useTranslation();
  const {
    usuarios,
    perfis,
    carregando,
    aAtualizar,
    // "erro" local (mais abaixo) é o das ações (gravar/eliminar); este é o da primeira carga
    erro: erroCarregamento,
    carregarUsuarios,
    salvarUsuario,
    eliminarUsuario,
  } = useUsuariosData();

  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [formData, setFormData] =
    useState<UsuarioFormData>(FORM_VAZIO);

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const confirmar = useConfirmacao();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuarioLogado } = useUsuario();
  const souAdministrador = ehAdministrador(usuarioLogado);
  // Só um administrador dá o perfil Administrador ou mexe na conta de um administrador
  const perfisAtribuiveis = perfis.filter((p) => souAdministrador || !p.administrador);
  const podeAlterar = (u: Usuario) => souAdministrador || !u.perfil?.administrador;

  // =========================================================
  // NOVO UTILIZADOR
  // =========================================================

  const abrirNovoForm = () => {
    setFormData({ ...FORM_VAZIO });
    setEditandoId(null);
    setErro(null);
    setSucesso(null);
    setFormAberto(true);
  };

  // =========================================================
  // EDITAR UTILIZADOR
  // =========================================================

  const abrirEditar = (usuario: Usuario) => {
    setEditandoId(usuario.id);

    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: "",
      numero: usuario.numero || "",
      cargo: usuario.cargo || "",
      departamento: usuario.departamento || "",
      perfilId: usuario.perfilId,
    });

    setErro(null);
    setSucesso(null);
    setFormAberto(true);
  };

  // =========================================================
  // FECHAR FORMULÁRIO
  // =========================================================

  const fecharFormulario = () => {
    setFormAberto(false);
    if (searchParams.has("editar")) setSearchParams({}, { replace: true });
    setEditandoId(null);
    setFormData({ ...FORM_VAZIO });
    setErro(null);
  };

  // =========================================================
  // SALVAR UTILIZADOR
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (formData.perfilId === "") {
      setErro(t("admin.usuarios.form.perfilObrigatorio"));
      return;
    }

    setSalvando(true);
    setErro(null);
    setSucesso(null);

    try {
      const resultado = await salvarUsuario(
        formData,
        editandoId,
      );

      const nome =
        resultado?.nome || formData.nome;

      setSucesso(
        editandoId
          ? t("admin.usuarios.atualizado", { nome })
          : t("admin.usuarios.criado", { nome }),
      );

      setFormAberto(false);
      if (searchParams.has("editar")) setSearchParams({}, { replace: true });
      setEditandoId(null);
      setFormData({ ...FORM_VAZIO });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("admin.usuarios.erroGuardar"),
      );
    } finally {
      setSalvando(false);
    }
  };

  // =========================================================
  // ELIMINAR UTILIZADOR
  // =========================================================

  const handleEliminar = async (
    id: number,
    nome: string,
  ) => {
    setErro(null);
    setSucesso(null);

    try {
      const eliminado = await confirmar({
        titulo: t("admin.usuarios.modalEliminar.titulo"),
        mensagem: (
          <Trans
            i18nKey="admin.usuarios.modalEliminar.mensagem"
            values={{ nome }}
            components={{ destaque: <span className="font-semibold text-slate-800" /> }}
          />
        ),
        textoConfirmar: t("admin.usuarios.modalEliminar.confirmar"),
        textoCarregando: t("admin.usuarios.modalEliminar.aEliminar"),
        perigoso: true,
        acao: () => eliminarUsuario(id),
      });
      if (!eliminado) return;

      setSucesso(t("admin.usuarios.eliminado", { nome }));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("admin.usuarios.erroEliminar"),
      );
    }
  };

  // Vindo da página de detalhes ("Editar"): abre o formulário desse utilizador, uma vez
  const editarPedido = searchParams.get("editar");
  const [editarTratado, setEditarTratado] = useState<string | null>(null);
  if (editarPedido && editarPedido !== editarTratado && !carregando) {
    const alvo = usuarios.find((u) => String(u.id) === editarPedido);
    setEditarTratado(editarPedido);
    if (alvo && podeAlterar(alvo)) abrirEditar(alvo);
  }

  // =========================================================
  // PESQUISA
  // =========================================================

  const termoBusca = busca
    .trim()
    .toLowerCase();

  const usuariosFiltrados =
    usuarios.filter((usuario) => {
      if (!termoBusca) {
        return true;
      }

      return (
        usuario.nome
          .toLowerCase()
          .includes(termoBusca) ||
        usuario.email
          .toLowerCase()
          .includes(termoBusca) ||
        usuario.cargo
          ?.toLowerCase()
          .includes(termoBusca)
      );
    });

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  if (formAberto) {
    return (
      <UsuarioFormulario
        editandoId={editandoId}
        formData={formData}
        onFormDataChange={setFormData}
        perfis={perfisAtribuiveis}
        perfilBloqueado={editandoId !== null && editandoId === usuarioLogado?.id}
        salvando={salvando}
        erro={erro}
        onVoltar={fecharFormulario}
        onSubmit={handleSubmit}
      />
    );
  }

  // =========================================================
  // PÁGINA
  // =========================================================

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}

      <UsuariosHeader
        total={usuarios.length}
        onNovoUsuario={abrirNovoForm}
      />

      {/* Mensagem de erro */}

      {erro && (
        <div className="p-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {erro}
        </div>
      )}

      {/* Mensagem de sucesso */}

      {sucesso && (
        <div className="p-4 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          {sucesso}
        </div>
      )}

      {/* Pesquisa */}

      <UsuariosBusca
        busca={busca}
        onBuscaChange={setBusca}
        aAtualizar={aAtualizar}
      />

      {/* Tabela (se a primeira carga falhar, mostra o erro em vez de uma lista vazia) */}

      {carregando ? (
        <EstadoCarregando mensagem={t("admin.usuarios.carregando")} />
      ) : erroCarregamento ? (
        <EstadoErro mensagem={erroCarregamento} onTentarNovamente={carregarUsuarios} />
      ) : (
        <UsuariosTabela
          usuarios={usuariosFiltrados}
          onVer={(u) => navigate(`/dashboard/usuarios/${u.id}`)}
          onEditar={abrirEditar}
          onEliminar={handleEliminar}
          podeEditar={podeAlterar}
          podeEliminar={(u) => podeAlterar(u) && u.id !== usuarioLogado?.id}
        />
      )}

    </div>
  );
}