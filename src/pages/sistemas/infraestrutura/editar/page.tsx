import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "../../../../lang/i18n";
import {
  buscarInfraestrutura,
  listarImagens,
  listarPlataformas,
  listarServidores,
  salvarInfraestrutura,
  type ImagemOpcao,
  type OpcaoHospedagem,
  type TipoAmbiente,
} from "../../../../hooks/useSistemasData";
import { AcessoCancelado, useAcessoInfraestrutura } from "../acessoInfraestrutura";
import {
  CLASSE_CAMPO,
  CLASSE_ROTULO,
  caminhosInfraestrutura,
  rotuloAmbiente,
} from "../constantes";
import SelectPesquisavel from "../../../../components/selectPesquisavel";
import { EstadoCarregando, EstadoErro } from "../../../../components/estados";
import { PERMISSOES, pode, type PerfilResumo } from "../../../../utils/permissoes";

interface DashboardContext {
  usuario: { nome: string; perfil?: PerfilResumo | null; permissoes?: string[] } | null;
}

export default function EditarInfraestruturaPage() {
  const { id, ambiente: parametroAmbiente } = useParams<{ id: string; ambiente: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { usuario } = useOutletContext<DashboardContext>();
  const podeGerirInfra = pode(usuario, PERMISSOES.SISTEMAS_INFRA_GERIR);
  const { comAcesso } = useAcessoInfraestrutura();

  const sistemaId = id ?? "";
  const ambiente: TipoAmbiente = parametroAmbiente === "TESTES" ? "TESTES" : "PRODUCAO";
  const caminhos = caminhosInfraestrutura(sistemaId, ambiente);

  // Listas dos dropdowns
  const [plataformas, setPlataformas] = useState<OpcaoHospedagem[]>([]);
  const [servidores, setServidores] = useState<OpcaoHospedagem[]>([]);
  const [imagens, setImagens] = useState<ImagemOpcao[]>([]);
  // Nome de cada registo (containerização), para mostrar de onde vem cada imagem
  const [nomesRegistos, setNomesRegistos] = useState<Record<number, string>>({});

  // Campos do formulário
  const [plataformaId, setPlataformaId] = useState("");
  const [servidorId, setServidorId] = useState("");
  const [imagemId, setImagemId] = useState("");
  const [url, setUrl] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  // Se o carregamento falhar, o formulário não aparece: vazio, guardá-lo apagaria a infraestrutura atual
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!podeGerirInfra) return;
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      setErroCarregamento(null);
      try {
        const [plt, srv, img] = await Promise.all([
          listarPlataformas(),
          listarServidores(),
          listarImagens().catch(() => []), // sem imagens a página continua a funcionar
        ]);
        const dados = await comAcesso((token) =>
          buscarInfraestrutura(sistemaId, ambiente, token),
        );
        if (cancelado) return;

        // O backend corre numa Cloud; a imagem pode vir de qualquer registo
        const plataformasCloud = plt.filter((p) => p.tipo === "CLOUD_BASE_DADOS");
        setPlataformas(plataformasCloud);
        setNomesRegistos(Object.fromEntries(plt.map((p) => [p.id, p.nome])));
        setServidores(srv);
        setImagens(img);

        if (dados) {
          // Um registo antigo noutra plataforma (ex: um registo de imagens) obriga a escolher a Cloud certa
          const plataformaValida = plataformasCloud.some((p) => p.id === dados.plataformaId);
          setPlataformaId(plataformaValida ? String(dados.plataformaId) : "");
          setServidorId(dados.servidorId != null ? String(dados.servidorId) : "");
          setImagemId(dados.imagemId != null ? String(dados.imagemId) : "");
          setUrl(dados.url ?? "");
        }
      } catch (erro) {
        if (cancelado) return;
        if (erro instanceof AcessoCancelado) {
          navigate(caminhosInfraestrutura(sistemaId, ambiente).sistema, { replace: true });
          return;
        }
        setErroCarregamento(erro instanceof Error ? erro.message : i18n.t("sistemas.infraestrutura.erroCarregarToast"));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [podeGerirInfra, sistemaId, ambiente, comAcesso, navigate, tentativa]);

  if (!podeGerirInfra) return <Navigate to={caminhos.sistema} replace />;

  const servidoresDaPlataforma = servidores.filter(
    (s) => String(s.plataformaId) === plataformaId,
  );

  // Ao mudar de plataforma, o servidor anterior deixa de servir (a imagem não depende dela)
  const escolherPlataforma = (valor: string) => {
    setPlataformaId(valor);
    setServidorId("");
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plataformaId) {
      toast.error(t("sistemas.infraestrutura.editar.erroEscolherPlataforma"));
      return;
    }

    const dados = {
      plataformaId: Number(plataformaId),
      servidorId: servidorId ? Number(servidorId) : null,
      imagemId: imagemId ? Number(imagemId) : null,
      url: url.trim() || null,
    };

    setSalvando(true);
    try {
      await comAcesso((token) => salvarInfraestrutura(sistemaId, ambiente, dados, token));
      toast.success(t("sistemas.infraestrutura.editar.guardada"));
      navigate(caminhos.sistema);
    } catch (erro) {
      if (erro instanceof AcessoCancelado) return; // fica na página, sem perder nada
      toast.error(erro instanceof Error ? erro.message : t("sistemas.infraestrutura.editar.erroGuardar"));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return <EstadoCarregando mensagem={t("comum.estados.carregando")} />;
  }

  if (erroCarregamento) {
    return (
      <div className="space-y-3 text-center max-w-2xl">
        <EstadoErro mensagem={erroCarregamento} onTentarNovamente={() => setTentativa((n) => n + 1)} />
        <Link to={caminhos.sistema} className="text-sm text-slate-500 font-semibold hover:underline">
          {t("sistemas.comum.voltarAoSistema")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to={caminhos.sistema}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
      >
        ← {t("sistemas.comum.voltarAoSistema")}
      </Link>

      <form
        onSubmit={handleSalvar}
        className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6 space-y-5"
      >
        <h1 className="font-bold text-slate-800 text-lg">
          {t("sistemas.infraestrutura.editar.titulo", { ambiente: rotuloAmbiente(ambiente) })}
        </h1>

        <div className="space-y-1.5">
          <label htmlFor="infra-plataforma" className={CLASSE_ROTULO}>{t("sistemas.infraestrutura.editar.ondeCorre")}</label>
          <SelectPesquisavel
            id="infra-plataforma"
            valor={plataformaId}
            onChange={escolherPlataforma}
            opcaoVazia={t("sistemas.comum.selecionar")}
            opcoes={plataformas.map((p) => ({ valor: String(p.id), label: p.nome }))}
          />
        </div>

        {plataformaId &&
          (servidoresDaPlataforma.length > 0 ? (
            <div className="space-y-1.5">
              <label htmlFor="infra-servidor" className={CLASSE_ROTULO}>{t("sistemas.infraestrutura.editar.servidor")}</label>
              <SelectPesquisavel
                id="infra-servidor"
                valor={servidorId}
                onChange={setServidorId}
                opcaoVazia={t("sistemas.infraestrutura.editar.semServidor")}
                opcoes={servidoresDaPlataforma.map((s) => ({ valor: String(s.id), label: s.nome }))}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              {t("sistemas.infraestrutura.editar.semServidoresPlataforma")}
            </p>
          ))}

        {/* A imagem é independente da plataforma: vem de um registo (Docker Hub, GHCR...) */}
        <div className="space-y-1.5">
          <label htmlFor="infra-imagem" className={CLASSE_ROTULO}>{t("sistemas.infraestrutura.editar.imagem")}</label>
          {imagens.length > 0 ? (
            <SelectPesquisavel
              id="infra-imagem"
              valor={imagemId}
              onChange={setImagemId}
              opcaoVazia={t("sistemas.infraestrutura.editar.semImagem")}
              opcoes={imagens.map((i) => {
                const registoId = i.plataformaId ?? i.plataforma?.id;
                return {
                  valor: String(i.id),
                  label: `${i.nome}:${i.tag}`,
                  descricao: registoId != null ? nomesRegistos[registoId] : undefined,
                };
              })}
            />
          ) : (
            <p className="text-xs text-slate-400">{t("sistemas.infraestrutura.editar.semImagens")}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={CLASSE_ROTULO}>{t("sistemas.infraestrutura.editar.endereco")}</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className={CLASSE_CAMPO}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            to={caminhos.sistema}
            className="flex-1 text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-sm font-semibold rounded-lg transition-colors"
          >
            {t("sistemas.comum.cancelar")}
          </Link>
          <button
            type="submit"
            disabled={salvando || !plataformaId}
            className="flex-1 py-2.5 bg-netline-azul hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {salvando ? t("sistemas.comum.aGuardar") : t("sistemas.comum.guardar")}
          </button>
        </div>
      </form>
    </div>
  );
}