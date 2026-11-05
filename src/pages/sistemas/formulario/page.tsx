import { useEffect, useState } from "react";
import { IconVoltar } from "../../../components/icons";
import { toast } from "sonner";
import {
  listarDominios,
  listarPlataformas,
  listarServidores,
  type OpcaoHospedagem,
  type Sistema,
} from "../../../hooks/useSistemasData";
import EnderecoAmbiente from "./enderecoAmbiente";
import {
  estadoInicialEndereco,
  montarSubdominio,
  tinhaSubdominio,
  validarEndereco,
  type EstadoEndereco,
} from "./enderecos";
import SelectPesquisavel from "../../../components/selectPesquisavel";
import { useTranslation } from "react-i18next";
import i18n from "../../../lang/i18n";
import { rotuloAmbiente } from "../infraestrutura/constantes";

interface SistemaFormularioProps {
  sistemaExistente?: Sistema | null; // presente = modo edição
  salvando: boolean;
  onCancelar: () => void;
  onSubmit: (dados: Record<string, unknown>) => Promise<void>;
  // Alojamento do frontend e endereços (domínio, servidor): só quem gere a infraestrutura
  // dos sistemas os vê e altera. Sem isto, os campos não aparecem nem são enviados.
  gerirAlojamento?: boolean;
}

function ListaEditavel({
  label,
  placeholder,
  itens,
  onAdicionar,
  onRemover,
  corTag,
}: {
  label: string;
  placeholder: string;
  itens: string[];
  onAdicionar: (v: string) => void;
  onRemover: (i: number) => void;
  corTag: string;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const adicionar = () => {
    if (input.trim() && !itens.includes(input.trim())) {
      onAdicionar(input.trim());
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), adicionar())
          }
          className="flex-1 min-w-0 px-3 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
        />
        <button
          type="button"
          onClick={adicionar}
          className="shrink-0 px-3 py-2 sm:py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900"
        >
          {t("sistemas.formulario.adicionar")}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((item, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 ${corTag}`}
          >
            {item}
            <button
              type="button"
              onClick={() => onRemover(idx)}
              className="hover:text-red-600 font-bold"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

const STATUS_VALIDOS = ["Em Produção", "Em Desenvolvimento", "Manutenção"];
const STATUS_PADRAO = "Em Desenvolvimento";

// A API devolve as chaves do enum; o formulário trabalha com os rótulos
const ROTULO_POR_CHAVE: Record<string, string> = {
  EM_PRODUCAO: "Em Produção",
  EM_DESENVOLVIMENTO: "Em Desenvolvimento",
  MANUTENCAO: "Manutenção",
};

function statusInicial(status?: string): string {
  if (!status) return STATUS_PADRAO;
  if (STATUS_VALIDOS.includes(status)) return status;
  return ROTULO_POR_CHAVE[status] ?? STATUS_PADRAO;
}

export default function SistemaFormulario({
  sistemaExistente,
  salvando,
  onCancelar,
  onSubmit,
  gerirAlojamento = false,
}: SistemaFormularioProps) {
  const emEdicao = Boolean(sistemaExistente);
  const { t } = useTranslation();

  const [nome, setNome] = useState(sistemaExistente?.nome ?? "");
  const [descCurta, setDescCurta] = useState(
    sistemaExistente?.descricaoCurta ?? "",
  );
  const [descLonga, setDescLonga] = useState(
    sistemaExistente?.descricaoLonga ?? "",
  );

  const [status, setStatus] = useState(statusInicial(sistemaExistente?.status));
  const [dataInicio, setDataInicio] = useState(
    sistemaExistente?.dataInicio?.slice(0, 10) ?? "",
  );
  const [dataEntrega, setDataEntrega] = useState(
    sistemaExistente?.dataEntrega?.slice(0, 10) ?? "",
  );
  const [repositorioUrl, setRepositorioUrl] = useState(
    sistemaExistente?.repositorioUrl ?? "",
  );
  const [responsavelTecnico, setResponsavelTecnico] = useState(
    sistemaExistente?.responsavelTecnico ?? "",
  );
  const [versaoAtual, setVersaoAtual] = useState(
    sistemaExistente?.versaoAtual ?? "",
  );

  // Onde está o frontend e o endereço de cada ambiente
  const [plataformaFrontendId, setPlataformaFrontendId] = useState(
    sistemaExistente?.plataformaFrontendId != null
      ? String(sistemaExistente.plataformaFrontendId)
      : "",
  );
  const [producao, setProducao] = useState<EstadoEndereco>(() =>
    estadoInicialEndereco(sistemaExistente, "PRODUCAO"),
  );
  const [testes, setTestes] = useState<EstadoEndereco>(() =>
    estadoInicialEndereco(sistemaExistente, "TESTES"),
  );
  const alterarProducao = (alteracoes: Partial<EstadoEndereco>) =>
    setProducao((atual) => ({ ...atual, ...alteracoes }));
  const alterarTestes = (alteracoes: Partial<EstadoEndereco>) =>
    setTestes((atual) => ({ ...atual, ...alteracoes }));

  // Listas dos dropdowns
  const [plataformas, setPlataformas] = useState<OpcaoHospedagem[]>([]);
  const [dominios, setDominios] = useState<OpcaoHospedagem[]>([]);
  const [servidores, setServidores] = useState<OpcaoHospedagem[]>([]);

  useEffect(() => {
    if (!gerirAlojamento) return;
    let cancelado = false;
    Promise.all([listarPlataformas(), listarDominios(), listarServidores()])
      .then(([plt, dom, srv]) => {
        if (cancelado) return;
        // O frontend só pode estar alojado numa Cloud (ex: Vercel), não num registo de imagens
        setPlataformas(plt.filter((p) => p.tipo === "CLOUD_BASE_DADOS"));
        setDominios(dom);
        setServidores(srv);
      })
      .catch(() => {
        if (!cancelado) {
          toast.error(i18n.t("sistemas.formulario.erroCarregarOpcoes"));
        }
      });
    return () => {
      cancelado = true;
    };
  }, [gerirAlojamento]);

  const [devs, setDevs] = useState<string[]>(
    sistemaExistente?.desenvolvedores ?? [],
  );
  const [clientes, setClientes] = useState<string[]>(
    sistemaExistente?.empresasClientes ?? [],
  );
  const [techsFrontend, setTechsFrontend] = useState<string[]>(
    sistemaExistente?.tecnologiasFrontend ?? [],
  );
  const [techsBackend, setTechsBackend] = useState<string[]>(
    sistemaExistente?.tecnologiasBackend ?? [],
  );
  const [techsInfra, setTechsInfra] = useState<string[]>(
    sistemaExistente?.tecnologiasInfraestrutura ?? [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error(t("sistemas.formulario.erroNomeObrigatorio"));

    if (dataInicio && dataEntrega && dataEntrega < dataInicio) {
      return toast.error(
        t("sistemas.formulario.erroDatas"),
      );
    }

    const erroEndereco =
      validarEndereco(rotuloAmbiente("PRODUCAO"), producao) ?? validarEndereco(rotuloAmbiente("TESTES"), testes);
    if (erroEndereco) return toast.error(erroEndereco);

    await onSubmit({
      nome,
      descricaoCurta: descCurta,
      descricaoLonga: descLonga,
      status,
      dataInicio: dataInicio || null,
      dataEntrega: dataEntrega || null,
      desenvolvedores: devs,
      empresasClientes: clientes,
      tecnologiasFrontend: techsFrontend,
      tecnologiasBackend: techsBackend,
      tecnologiasInfraestrutura: techsInfra,
      repositorioUrl: repositorioUrl || undefined,
      ...(gerirAlojamento && {
        // Com subdomínio, o endereço calcula-se sozinho: o URL à parte não é usado
        urlProducao: producao.temSubdominio ? undefined : producao.url.trim() || undefined,
        urlTestes: testes.temSubdominio ? null : testes.url.trim() || null,
        plataformaFrontendId: plataformaFrontendId ? Number(plataformaFrontendId) : null,
        subdominios: {
          PRODUCAO: montarSubdominio(producao, tinhaSubdominio(sistemaExistente, "PRODUCAO")),
          TESTES: montarSubdominio(testes, tinhaSubdominio(sistemaExistente, "TESTES")),
        },
      }),
      responsavelTecnico: responsavelTecnico || undefined,
      versaoAtual: versaoAtual || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancelar}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <IconVoltar />
            <span>{t("sistemas.comum.cancelar")}</span>
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 break-words">
              {emEdicao
                ? t("sistemas.formulario.tituloEditar", { nome: sistemaExistente!.nome })
                : t("sistemas.formulario.tituloNovo")}
            </h2>
            <p className="text-xs text-slate-500">
              {emEdicao
                ? t("sistemas.formulario.subtituloEditar")
                : t("sistemas.formulario.subtituloNovo")}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.nome")}
            </label>
            <input
              type="text"
              required
              placeholder={t("sistemas.formulario.nomePlaceholder")}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            />
          </div>

          <div>
            <label htmlFor="sistema-status" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.estado")}
            </label>
            <SelectPesquisavel
              id="sistema-status"
              valor={status}
              onChange={setStatus}
              opcoes={[
                { valor: "Em Desenvolvimento", label: t("sistemas.status.EM_DESENVOLVIMENTO") },
                { valor: "Em Produção", label: t("sistemas.status.EM_PRODUCAO") },
                { valor: "Manutenção", label: t("sistemas.status.MANUTENCAO") },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t("sistemas.formulario.dataInicio")}
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t("sistemas.formulario.dataEntrega")}
              </label>
              <input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.descricaoCurta")}
            </label>
            <input
              type="text"
              maxLength={255}
              placeholder={t("sistemas.formulario.descricaoCurtaPlaceholder")}
              value={descCurta}
              onChange={(e) => setDescCurta(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.descricaoLonga")}
            </label>
            <textarea
              rows={3}
              placeholder={t("sistemas.formulario.descricaoLongaPlaceholder")}
              value={descLonga}
              onChange={(e) => setDescLonga(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.repositorio")}
            </label>
            <input
              type="url"
              placeholder="https://github.com/..."
              value={repositorioUrl}
              onChange={(e) => setRepositorioUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            />
          </div>

          {gerirAlojamento && (
          <div>
            <label htmlFor="sistema-plataforma-frontend" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.plataformaFrontend")}
            </label>
            <SelectPesquisavel
              id="sistema-plataforma-frontend"
              valor={plataformaFrontendId}
              onChange={setPlataformaFrontendId}
              opcaoVazia={t("sistemas.formulario.semPlataforma")}
              opcoes={plataformas.map((p) => ({ valor: String(p.id), label: p.nome }))}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {t("sistemas.formulario.plataformaFrontendAjuda")}
            </p>
          </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.responsavel")}
            </label>
            <input
              type="text"
              placeholder={t("sistemas.formulario.responsavelPlaceholder")}
              value={responsavelTecnico}
              onChange={(e) => setResponsavelTecnico(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t("sistemas.formulario.versao")}
            </label>
            <input
              type="text"
              placeholder={t("sistemas.formulario.versaoPlaceholder")}
              value={versaoAtual}
              onChange={(e) => setVersaoAtual(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            />
          </div>

          {gerirAlojamento && (
          <>
          <EnderecoAmbiente
            titulo={rotuloAmbiente("PRODUCAO")}
            estado={producao}
            onChange={alterarProducao}
            dominios={dominios}
            servidores={servidores}
            tinhaSubdominio={tinhaSubdominio(sistemaExistente, "PRODUCAO")}
          />
          <EnderecoAmbiente
            titulo={rotuloAmbiente("TESTES")}
            estado={testes}
            onChange={alterarTestes}
            dominios={dominios}
            servidores={servidores}
            tinhaSubdominio={tinhaSubdominio(sistemaExistente, "TESTES")}
          />
          </>
          )}

          <ListaEditavel
            label={t("sistemas.formulario.equipa")}
            placeholder={t("sistemas.formulario.equipaPlaceholder")}
            itens={devs}
            onAdicionar={(v) => setDevs([...devs, v])}
            onRemover={(i) => setDevs(devs.filter((_, idx) => idx !== i))}
            corTag="bg-blue-50 text-blue-900 border-blue-200"
          />
          <ListaEditavel
            label={t("sistemas.formulario.clientes")}
            placeholder={t("sistemas.formulario.clientesPlaceholder")}
            itens={clientes}
            onAdicionar={(v) => setClientes([...clientes, v])}
            onRemover={(i) =>
              setClientes(clientes.filter((_, idx) => idx !== i))
            }
            corTag="bg-emerald-50 text-emerald-800 border-emerald-200"
          />

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ListaEditavel
              label={t("sistemas.formulario.tecnologiasFrontend")}
              placeholder={t("sistemas.formulario.tecnologiasFrontendPlaceholder")}
              itens={techsFrontend}
              onAdicionar={(v) => setTechsFrontend([...techsFrontend, v])}
              onRemover={(i) =>
                setTechsFrontend(techsFrontend.filter((_, idx) => idx !== i))
              }
              corTag="bg-slate-100 text-slate-700 border-slate-200"
            />
            <ListaEditavel
              label={t("sistemas.formulario.tecnologiasBackend")}
              placeholder={t("sistemas.formulario.tecnologiasBackendPlaceholder")}
              itens={techsBackend}
              onAdicionar={(v) => setTechsBackend([...techsBackend, v])}
              onRemover={(i) =>
                setTechsBackend(techsBackend.filter((_, idx) => idx !== i))
              }
              corTag="bg-slate-100 text-slate-700 border-slate-200"
            />
            <ListaEditavel
              label={t("sistemas.formulario.infraestrutura")}
              placeholder={t("sistemas.formulario.infraestruturaPlaceholder")}
              itens={techsInfra}
              onAdicionar={(v) => setTechsInfra([...techsInfra, v])}
              onRemover={(i) =>
                setTechsInfra(techsInfra.filter((_, idx) => idx !== i))
              }
              corTag="bg-slate-100 text-slate-700 border-slate-200"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
          >
            {t("sistemas.comum.cancelar")}
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {salvando
              ? t("sistemas.comum.aGuardar")
              : emEdicao
                ? t("sistemas.formulario.guardarAlteracoes")
                : t("sistemas.formulario.guardarSistema")}
          </button>
        </div>
      </form>
    </div>
  );
}