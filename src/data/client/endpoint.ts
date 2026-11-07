export const API_ENDPOINTS = {
  USUARIOS: "/usuarios",
  USUARIO_BY_ID: (id: number | string) => `/usuarios/${id}`,
  USUARIO_FOTOGRAFIA: "/usuarios/me/fotografia",
  PERFIS: "/perfis",
  PERFIS_PERMISSOES: "/perfis/permissoes",
  PERFIL_BY_ID: (id: number | string) => `/perfis/${id}`,

  PERFIL: "/auth/me",
  ALTERAR_SENHA: "/auth/senha",

  DOCUMENTOS: "/documentos",
  DOCUMENTO_BY_ID: (id: number | string) => `/documentos/${id}`,
  DOCUMENTOS_LIXEIRA: "/documentos?lixeira=true",
  DOCUMENTO_DEFINITIVO: (id: number | string) => `/documentos/${id}?definitivo=true`,

  CATEGORIAS: "/categorias",

  SISTEMAS: "/sistemas",
  SISTEMA_BY_ID: (id: number | string) => `/sistemas/${id}`,
  // Infraestrutura (só do backend), por ambiente: PRODUCAO | TESTES
  SISTEMA_INFRAESTRUTURAS: (sistemaId: number | string) =>
    `/sistemas/${sistemaId}/infraestruturas`,
  SISTEMA_INFRAESTRUTURA: (sistemaId: number | string, ambiente: string) =>
    `/sistemas/${sistemaId}/infraestruturas/${ambiente}`,
  SISTEMA_CREDENCIAIS: (sistemaId: number | string, ambiente: string) =>
    `/sistemas/${sistemaId}/infraestruturas/${ambiente}/credenciais`,
  SISTEMA_CREDENCIAL: (
    sistemaId: number | string,
    ambiente: string,
    credencialId: number | string,
  ) =>
    `/sistemas/${sistemaId}/infraestruturas/${ambiente}/credenciais/${credencialId}`,
  // Plataformas, Servidores e Domínios
  PLATAFORMAS: "/plataformas",
  PLATAFORMA_ARVORE: "/plataformas/arvore",
  PLATAFORMA_BY_ID: (id: number | string) => `/plataformas/${id}`,
  PLATAFORMA_ARVORE_BY_ID: (id: number | string) => `/plataformas/${id}/arvore`,
  PLATAFORMA_FORNECEDORES: "/plataformas/fornecedores",
  PLATAFORMA_TOKEN: (id: number | string, acessoId: number | string) =>
    `/plataformas/${id}/acessos/${acessoId}/token`,
  PLATAFORMA_LOGOTIPO: (id: number | string) => `/plataformas/${id}/logotipo`,



  SERVIDORES: "/servidores",
  SERVIDOR_BY_ID: (id: number | string) => `/servidores/${id}`,
  SERVIDOR_PASSWORD: (id: number | string) => `/servidores/${id}/password`,

  IMAGENS: "/imagens",
  IMAGEM_BY_ID: (id: number | string) => `/imagens/${id}`,

  DOMINIOS: "/dominios",
  DOMINIO_BY_ID: (id: number | string) => `/dominios/${id}`,

  SUBDOMINIOS: "/subdominios",

  ATIVIDADES_RECENTES: "/atividades/recentes",

  AUDITORIA: "/auditoria",
  AUDITORIA_FUNCIONALIDADES: "/auditoria/funcionalidades",
  AUDITORIA_BY_ID: (id: number | string) => `/auditoria/${id}`,
  NOTIFICACOES: "/notificacoes",
  NOTIFICACOES_CONTAGEM: "/notificacoes/contagem",
  NOTIFICACOES_LIDAS: "/notificacoes/lidas",
  NOTIFICACAO_LIDA: (id: number | string) => `/notificacoes/${id}/lida`,
};