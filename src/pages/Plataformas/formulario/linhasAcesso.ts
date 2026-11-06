import type { AcessoPlataforma, DadosAcessoPlataforma } from "../../../types/plataforma";

// Uma conta no formulário. "chave" identifica a linha no React (as contas novas ainda não têm id)
export interface LinhaAcesso {
  chave: string;
  id?: number;
  descricao: string;
  utilizador: string;
  token: string; // em branco numa conta existente = manter o token atual
  temToken: boolean;
}

let contador = 0;
const novaChave = () => `nova-${++contador}`;

export const linhaVazia = (): LinhaAcesso => ({
  chave: novaChave(),
  descricao: "",
  utilizador: "",
  token: "",
  temToken: false,
});

// Contas que já existem; sem nenhuma, começa com uma conta em branco (como no formulário original)
export function linhasIniciais(acessos?: AcessoPlataforma[]): LinhaAcesso[] {
  if (!acessos?.length) return [linhaVazia()];
  return acessos.map((a) => ({
    chave: `conta-${a.id}`,
    id: a.id,
    descricao: a.descricao ?? "",
    utilizador: a.utilizador ?? "",
    token: "",
    temToken: a.temToken,
  }));
}

/**
 * Converte as linhas no que se envia ao backend (a lista completa das contas).
 * As linhas novas deixadas em branco são ignoradas. Devolve null se alguma conta
 * nova tem só a descrição (precisa de um utilizador ou de um token).
 */
export function linhasParaDados(linhas: LinhaAcesso[]): DadosAcessoPlataforma[] | null {
  const dados: DadosAcessoPlataforma[] = [];
  for (const linha of linhas) {
    const descricao = linha.descricao.trim();
    const utilizador = linha.utilizador.trim();
    const emBranco = !descricao && !utilizador && !linha.token;

    if (linha.id === undefined) {
      if (emBranco) continue;
      if (!utilizador && !linha.token) return null;
    }

    const conta: DadosAcessoPlataforma = {
      descricao: descricao || null,
      utilizador: utilizador || null,
    };
    if (linha.id !== undefined) conta.id = linha.id;
    if (linha.token) conta.token = linha.token;
    dados.push(conta);
  }
  return dados;
}

