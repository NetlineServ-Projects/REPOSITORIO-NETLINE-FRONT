export type TipoPlataforma = "CLOUD_BASE_DADOS" | "CONTAINERIZACAO" | "GESTAO_DOMINIO";

// Chave do fornecedor (ex: "DOCKER_HUB", "VERCEL", "OUTRO"). A lista vem do backend.
export type FornecedorPlataforma = string;

export interface FornecedorCatalogo {
  valor: FornecedorPlataforma;
  rotulo: string;
  urlPainel?: string;
  registryUrl?: string;
}

export type CatalogoFornecedores = Record<TipoPlataforma, FornecedorCatalogo[]>;

export interface Plataforma {
  id: number;
  nome: string;
  tipo: TipoPlataforma;
  fornecedor: FornecedorPlataforma;
  logotipo: string | null;
  urlPainel?: string | null;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  totais?: {
    dominios: number;
    servidores: number;
    sistemas: number;
    imagens: number;
  };
  // Sistemas que usam a plataforma: frontend alojado nela e/ou backend nela ou num servidor dela
  sistemasHospedados?: SistemaDaPlataforma[];
  // Contas de acesso (utilizador + token); o token só se revela com reautenticação
  acessos: AcessoPlataforma[];
  registryUrl: string | null;
  namespace: string | null;
  dominios?: Dominio[];
  servidores?: Servidor[];
  imagens?: ImagemContainer[];
}

export interface Servidor {
  id: number;
  nome: string;
  hostname: string;
  ip?: string;
  ipCifrado?: string;
  usernameSsh: string;
  password?: string;
  numeroCpu: number;
  memoriaRam: number;
  memoriaRamUnidade?: "MB" | "GB" | "TB";
  disco: number;
  discoUnidade?: "MB" | "GB" | "TB";
  larguraBanda: number;
  larguraBandaUnidade?: "MBPS" | "GBPS";
  sistemaOperativo: string;
  versaoSo?: string | null;
  cloud?: string | null;
  regiao?: string | null;
  estado: "ATIVO" | "INATIVO";
  plataformaId: number;
  plataforma?: {
    id: number;
    nome: string;
    tipo: TipoPlataforma;
  };
  // Um registo por sistema, ambiente e origem: BACKEND = a infraestrutura do sistema usa
  // este servidor; DNS = o endereço do sistema (registo A/AAAA) aponta para ele
  sistemasHospedados?: Array<{
    ambiente: "PRODUCAO" | "TESTES";
    sistema: { id: number; nome: string; status: string };
    origem: "BACKEND" | "DNS";
    endereco?: string; // só quando origem = DNS
  }>;
  totais?: {
    subdominios: number;
    sistemas: number; // sistemas distintos
  };
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Dominio {
  id: number;
  nome: string;
  dataExpiracao: string;
  plataformaId: number;
  criadoEm?: string;
  atualizadoEm?: string;
  plataforma?: {
    id: number;
    nome: string;
  };
  // Conta da plataforma (instituição) onde o domínio está registado, ex: Netline ou um cliente
  acessoId?: number | null;
  acesso?: { id: number; descricao: string | null; utilizador: string | null } | null;
  subdominios?: Subdominio[];
}

export interface DadosDominio {
  nome: string;
  dataExpiracao: string;
  plataformaId: number;
  acessoId: number | null; // null = sem conta
}

export type TipoDns =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SRV"
  | "CAA"
  | "PTR"
  | "SOA"
  | "DS"
  | "DNSKEY"
  | "RRSIG"
  | "TLSA"
  | "SSHFP"
  | "OUTRO";

// Cada subdomínio é o endereço público de um sistema num ambiente (gerido no formulário do sistema)
export interface Subdominio {
  id: number;
  dominioId: number;
  nome: string;
  nomeCompleto?: string;
  tipoDns: TipoDns;
  servidorId?: number | null;
  destino?: string | null;
  servidor?: Pick<Servidor, "id" | "nome" | "hostname"> | null;
  dominio?: Pick<Dominio, "id" | "nome">;
  sistemaId: number;
  ambiente: "PRODUCAO" | "TESTES";
  sistema?: { id: number; nome: string };
}

export type VisibilidadeImagem = "PUBLICA" | "PRIVADA";
export type OrigemImagem = "PROPRIA" | "TERCEIROS";

export interface ImagemContainer {
  id: number;
  nome: string;
  tag: string;
  portaExposta: number | null;
  digest: string | null;
  ultimoPushEm: string | null;
  visibilidade: VisibilidadeImagem;
  origem: OrigemImagem;
  ativo: boolean;
  plataformaId: number;
  plataforma: { id: number; nome: string; tipo: string };
  criadoEm: string;
  atualizadoEm: string;
}

export interface DadosPlataforma {
  nome?: string; // só quando o fornecedor é "OUTRO": nos outros vem do fornecedor
  tipo: TipoPlataforma;
  fornecedor: FornecedorPlataforma;
  urlPainel?: string | null;
  ativo?: boolean;
  // Lista completa das contas: as que não forem enviadas (pelo id) são apagadas
  acessos?: DadosAcessoPlataforma[];
  registryUrl?: string | null;
  namespace?: string | null;
} 
export interface SistemaDaPlataforma {
  id: number;
  nome: string;
  status: string;
  frontend: boolean;
  // viaImagem: o backend corre noutro lado a partir de uma imagem guardada nesta plataforma
  backend: { ambiente: "PRODUCAO" | "TESTES"; servidor: string | null; imagem: string | null; viaImagem: boolean }[];
}

// Uma conta de acesso da plataforma (ex: a da Netline e a de um cliente que gerimos)
export interface AcessoPlataforma {
  id: number;
  descricao: string | null;
  utilizador: string | null;
  temToken: boolean;
}

export interface DadosAcessoPlataforma {
  id?: number; // sem id = conta nova
  descricao?: string | null;
  utilizador?: string | null;
  token?: string | null; // omitido = manter o token atual
}
