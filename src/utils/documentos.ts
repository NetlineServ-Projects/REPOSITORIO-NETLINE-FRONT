import i18n from "../lang/i18n";

export function obterUrlFicheiro(caminho: string, apiUrl: string): string {
  if (!caminho) return "#";
  if (caminho.startsWith("http")) return caminho;
  return `${apiUrl}/${caminho.replace(/^\/+/, "")}`;
}

// Endereço que faz o browser gravar o ficheiro (a API responde com Content-Disposition:
// attachment). O atributo "download" dos links não chega: o browser ignora-o quando o
// ficheiro vem de outra origem, como a API, e abre-o num separador.
export function obterUrlTransferencia(caminho: string, apiUrl: string): string {
  const url = obterUrlFicheiro(caminho, apiUrl);
  return url === "#" ? url : `${url}${url.includes("?") ? "&" : "?"}transferir=1`;
}

export function formatarExtensao(tipo?: string, nomeArquivo?: string): string {
  const t = (tipo || "").toLowerCase();

  if (t.includes("pdf")) return "PDF";
  if (t.includes("word") || t.includes("processingml") || t.includes("doc")) return "DOCX";
  if (t.includes("excel") || t.includes("spreadsheetml") || t.includes("xls")) return "XLSX";
  if (t.includes("image") || t.includes("png") || t.includes("jpeg") || t.includes("jpg")) return "PNG";
  if (t.includes("zip") || t.includes("rar")) return "ZIP";

  if (nomeArquivo && nomeArquivo.includes(".")) {
    const ext = nomeArquivo.split(".").pop();
    if (ext && ext.length <= 5) return ext.toUpperCase();
  }

  return "DOC";
}

export function obterNomeExibicao(doc: { titulo?: string; nomeArquivo?: string }): string {
  if (doc.titulo && doc.titulo.trim() !== "") return doc.titulo;
  if (doc.nomeArquivo && doc.nomeArquivo.trim() !== "") return doc.nomeArquivo;
  return i18n.t("comum.documentoSemTitulo");
}

export function formatarTamanho(bytes?: string | number): string {
  if (!bytes) return "N/A";
  const num = Number(bytes);
  if (isNaN(num)) return "N/A";
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}