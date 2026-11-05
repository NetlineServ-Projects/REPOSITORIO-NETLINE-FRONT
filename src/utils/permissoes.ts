// Permissões dos perfis de acesso (iguais às do backend: src/constants/permissoes.js).
// O ecrã usa-as só para mostrar ou esconder: a API volta a verificar tudo.

export const PERMISSOES = {
  DOCUMENTOS_APROVAR: "documentos.aprovar",
  DOCUMENTOS_ELIMINAR: "documentos.eliminar",
  DOCUMENTOS_SENSIVEIS: "documentos.sensiveis",
  DOCUMENTOS_LIXEIRA: "documentos.lixeira",
  SISTEMAS_CRIAR: "sistemas.criar",
  SISTEMAS_GERIR: "sistemas.gerir",
  SISTEMAS_INFRA_VER: "sistemas.infraestrutura.ver",
  SISTEMAS_INFRA_GERIR: "sistemas.infraestrutura.gerir",
  INFRA_VER: "infraestrutura.ver",
  INFRA_GERIR: "infraestrutura.gerir",
  ATIVIDADE_VER: "atividade.ver",
  UTILIZADORES_GERIR: "utilizadores.gerir",
} as const;

export type Permissao = (typeof PERMISSOES)[keyof typeof PERMISSOES];

export interface PerfilResumo {
  id: number;
  nome: string;
  administrador: boolean;
}

// O que o backend devolve no login e em /auth/me
export interface ComAcesso {
  id?: number;
  perfil?: PerfilResumo | string | null;
  permissoes?: string[];
}

export function ehAdministrador(usuario: ComAcesso | null | undefined): boolean {
  const perfil = usuario?.perfil;
  return typeof perfil === "object" && perfil !== null && perfil.administrador;
}

export function pode(usuario: ComAcesso | null | undefined, permissao: Permissao): boolean {
  if (!usuario) return false;
  if (ehAdministrador(usuario)) return true;
  return Array.isArray(usuario.permissoes) && usuario.permissoes.includes(permissao);
}

export function nomePerfil(usuario: ComAcesso | null | undefined): string {
  const perfil = usuario?.perfil;
  return typeof perfil === "object" && perfil !== null ? perfil.nome : "";
}
