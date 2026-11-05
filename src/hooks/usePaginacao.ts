import { useMemo, useState } from "react";

export const ITENS_POR_PAGINA = 10;

// Paginação no ecrã: a lista chega inteira da API e mostra-se de 10 em 10.
// Quando a lista muda (pesquisa, filtros, um item apagado), volta à página 1;
// se a página atual deixar de existir, recua para a última.
export function usePaginacao<T>(itens: T[], porPagina = ITENS_POR_PAGINA) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));

  // Pesquisa ou filtros novos começam na primeira página (reposto durante o render,
  // como recomenda o React, em vez de num efeito)
  const [tamanhoAnterior, setTamanhoAnterior] = useState(itens.length);
  if (tamanhoAnterior !== itens.length) {
    setTamanhoAnterior(itens.length);
    setPagina(1);
  }

  const paginaAtual = Math.min(pagina, totalPaginas);

  const itensDaPagina = useMemo(
    () => itens.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
    [itens, paginaAtual, porPagina],
  );

  return {
    itens: itensDaPagina,
    pagina: paginaAtual,
    totalPaginas,
    totalItens: itens.length,
    porPagina,
    irPara: setPagina,
  };
}

export type EstadoPaginacao = Omit<ReturnType<typeof usePaginacao>, "itens">;
