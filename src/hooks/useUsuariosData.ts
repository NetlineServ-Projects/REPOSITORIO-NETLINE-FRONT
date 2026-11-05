import { useCallback, useEffect, useState } from "react";
import { useCarregamento } from "./useCarregamento";
import i18n from "../lang/i18n";
import { fetchComToken } from "../utils/api";
import { API_ENDPOINTS } from "../data/client/endpoint";
import type { PerfilResumo } from "../utils/permissoes";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  numero: string;
  cargo: string;
  departamento: string;
  perfilId: number;
  perfil: PerfilResumo;
  ativo?: boolean;
  fotografia?: string | null;
  dataCriacao?: string;
}

export interface UsuarioFormData {
  nome: string;
  email: string;
  senha: string;
  numero: string;
  cargo: string;
  departamento: string;
  // "" enquanto nenhum perfil foi escolhido
  perfilId: number | "";
}

export function useUsuariosData() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  // Perfis para o formulário. Se falharem, a lista de utilizadores aparece na mesma
  const [perfis, setPerfis] = useState<PerfilResumo[]>([]);
  const { carregando, aAtualizar, erro, executar } = useCarregamento(
    i18n.t("comum.erros.carregarUtilizadores"),
  );

  // =========================================================
  // CARREGAR USUÁRIOS
  // =========================================================

  const carregarUsuarios = useCallback(
    () =>
      executar(
        () => fetchComToken(API_ENDPOINTS.USUARIOS),
        (data) => setUsuarios(Array.isArray(data) ? data : []),
      ),
    [executar],
  );

  // =========================================================
  // CARREGAMENTO INICIAL
  // =========================================================

  useEffect(() => {
    carregarUsuarios();
    fetchComToken(API_ENDPOINTS.PERFIS)
      .then((data) => setPerfis(Array.isArray(data) ? data : []))
      .catch(() => setPerfis([]));
  }, [carregarUsuarios]);

  // =========================================================
  // CRIAR / EDITAR USUÁRIO
  // =========================================================

  const salvarUsuario = async (
    dados: Partial<UsuarioFormData>,
    editandoId: number | null,
  ) => {
    const isEdit = editandoId !== null;

    const endpoint = isEdit
      ? API_ENDPOINTS.USUARIO_BY_ID(editandoId)
      : API_ENDPOINTS.USUARIOS;

    // Antes: "PUT" — a rota do backend é PATCH /usuarios/:id (atualização parcial), não PUT.
    const method = isEdit ? "PATCH" : "POST";

    const payload = { ...dados };

    // Durante a edição, senha vazia não deve ser enviada
    if (isEdit && !payload.senha) {
      delete payload.senha;
    }

    const data = await fetchComToken(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    await carregarUsuarios();

    return data;
  };

  // =========================================================
  // ELIMINAR USUÁRIO
  // =========================================================

  const eliminarUsuario = async (id: number) => {
    await fetchComToken(
      API_ENDPOINTS.USUARIO_BY_ID(id),
      {
        method: "DELETE",
      },
    );

    await carregarUsuarios();
  };

  return {
    usuarios,
    perfis,
    carregando,
    aAtualizar,
    erro,
    carregarUsuarios,
    salvarUsuario,
    eliminarUsuario,
  };
}