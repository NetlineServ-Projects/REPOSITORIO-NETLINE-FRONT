import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  IconVoltar,
  IconPlataforma,
  IconServer,
  IconDominio,
  IconImagem,
} from "../../../components/icons";
import { usePlataformasData } from "../../../hooks/usePlataformasData";
import type {
  Plataforma,
  Servidor,
  Dominio,
  ImagemContainer,
  DadosPlataforma,
  DadosDominio,
} from "../../../types/plataforma";
import FormPlataforma from "./FormPlataforma";
import FormServidor from "./FormServidor";
import FormDominio from "./FormDominio";
import FormImagem from "./FormImagem";

// Os subdomínios (registos DNS) não têm formulário aqui: são o endereço de um
// sistema num ambiente e geram-se no formulário do sistema
export type TipoFormularioPlataforma =
  | "plataforma"
  | "servidor"
  | "dominio"
  | "imagem";

interface PlataformaFormularioPageProps {
  tipoInicial?: TipoFormularioPlataforma;
  itemEdicao?: {
    tipo: TipoFormularioPlataforma;
    dados: Plataforma | Servidor | Dominio | ImagemContainer;
  } | null;
  onVoltar: () => void;
  onSucesso?: () => void;
}

export default function PlataformaFormularioPage({
  tipoInicial = "plataforma",
  itemEdicao = null,
  onVoltar,
  onSucesso,
}: PlataformaFormularioPageProps) {
  const { t } = useTranslation();
  const [tipoAtivo, setTipoAtivo] = useState<TipoFormularioPlataforma>(
    itemEdicao?.tipo ?? tipoInicial,
  );
  const [salvando, setSalvando] = useState(false);

  const {
    plataformas,
    criarPlataforma,
    atualizarPlataforma,
    enviarLogotipoPlataforma,
    criarServidor,
    atualizarServidor,
    criarDominio,
    atualizarDominio,
    criarImagem,
    atualizarImagem,
  } = usePlataformasData();

  const emEdicao = Boolean(itemEdicao);

  // Submissão: Plataforma
   // Submissão: Plataforma (o logótipo segue num segundo pedido, depois de a plataforma existir)
  const handleSalvarPlataforma = async (
    dados: DadosPlataforma,
    logotipo: File | null,
  ) => {
    setSalvando(true);
    try {
      let plataformaId: number;

      if (itemEdicao?.tipo === "plataforma") {
        await atualizarPlataforma(itemEdicao.dados.id, dados);
        plataformaId = itemEdicao.dados.id;
        toast.success(t("plataformas.form.plataforma.atualizada"));
      } else {
        const criada = await criarPlataforma(dados);
        plataformaId = criada.id;
        toast.success(t("plataformas.form.plataforma.registada"));
      }

      if (logotipo) {
        try {
          await enviarLogotipoPlataforma(plataformaId, logotipo);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : t("plataformas.comum.erroDesconhecido");
          toast.error(t("plataformas.form.plataforma.logotipoFalhou", { erro: msg }));
        }
      }

      onSucesso?.();
      onVoltar();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("plataformas.form.plataforma.erroGuardar");
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  // Submissão: Servidor
  const handleSalvarServidor = async (dados: Record<string, unknown>) => {
    setSalvando(true);
    try {
      if (itemEdicao?.tipo === "servidor") {
        await atualizarServidor(itemEdicao.dados.id, dados);
        toast.success(t("plataformas.form.servidor.atualizado"));
      } else {
        await criarServidor(dados);
        toast.success(t("plataformas.form.servidor.registado"));
      }
      onSucesso?.();
      onVoltar();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("plataformas.form.servidor.erroGuardar");
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  // Submissão: Domínio
  const handleSalvarDominio = async (dados: DadosDominio) => {
    setSalvando(true);
    try {
      if (itemEdicao?.tipo === "dominio") {
        await atualizarDominio(itemEdicao.dados.id, dados);
        toast.success(t("plataformas.form.dominio.atualizado"));
      } else {
        await criarDominio(dados);
        toast.success(t("plataformas.form.dominio.registado"));
      }
      onSucesso?.();
      onVoltar();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("plataformas.form.dominio.erroGuardar");
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  // Submissão: Imagem
  const handleSalvarImagem = async (dados: Record<string, unknown>) => {
    setSalvando(true);
    try {
      if (itemEdicao?.tipo === "imagem") {
        await atualizarImagem(itemEdicao.dados.id, dados);
        toast.success(t("plataformas.form.imagem.atualizada"));
      } else {
        await criarImagem(dados);
        toast.success(t("plataformas.form.imagem.registada"));
      }
      onSucesso?.();
      onVoltar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("plataformas.form.imagem.erroGuardar");
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const tabsConfig = [
    {
      tipo: "plataforma" as const,
      label: t("plataformas.form.separadores.plataforma"),
      icon: <IconPlataforma className="w-4 h-4" />,
      sublabel: t("plataformas.form.separadores.plataformaDescricao"),
    },
    {
      tipo: "servidor" as const,
      label: t("plataformas.form.separadores.servidor"),
      icon: <IconServer className="w-4 h-4" />,
      sublabel: t("plataformas.form.separadores.servidorDescricao"),
    },
    {
      tipo: "dominio" as const,
      label: t("plataformas.form.separadores.dominio"),
      icon: <IconDominio className="w-4 h-4" />,
      sublabel: t("plataformas.form.separadores.dominioDescricao"),
    },
    {
      tipo: "imagem" as const,
      label: t("plataformas.form.separadores.imagem"),
      icon: <IconImagem className="w-4 h-4" />,
      sublabel: t("plataformas.form.separadores.imagemDescricao"),
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVoltar}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <IconVoltar className="w-4 h-4" />
          <span>{t("plataformas.form.voltar")}</span>
        </button>

        {emEdicao && (
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
            {t("plataformas.form.modoEdicao")}
          </span>
        )}
      </div>

      {/* Selector de Abas do Formulário (apenas em modo de criação) */}
      {!emEdicao ? (
        <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-2">
          {tabsConfig.map((tab) => {
            const ativa = tipoAtivo === tab.tipo;
            return (
              <button
                key={tab.tipo}
                type="button"
                onClick={() => setTipoAtivo(tab.tipo)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${
                  ativa
                    ? "bg-netline-azul text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    ativa
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.icon}
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">{tab.label}</p>
                  <p
                    className={`text-[11px] ${
                      ativa ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {tab.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Renderização do Formulário Activo */}
      {tipoAtivo === "plataforma" && (
        <FormPlataforma
          plataformaExistente={
            itemEdicao?.tipo === "plataforma"
              ? (itemEdicao.dados as Plataforma)
              : null
          }
          salvando={salvando}
          onCancelar={onVoltar}
          onSubmit={handleSalvarPlataforma}
        />
      )}

      {tipoAtivo === "servidor" && (
        <FormServidor
          servidorExistente={
            itemEdicao?.tipo === "servidor"
              ? (itemEdicao.dados as Servidor)
              : null
          }
          plataformas={plataformas}
          salvando={salvando}
          onCancelar={onVoltar}
          onSubmit={handleSalvarServidor}
        />
      )}

      {tipoAtivo === "dominio" && (
        <FormDominio
          dominioExistente={
            itemEdicao?.tipo === "dominio"
              ? (itemEdicao.dados as Dominio)
              : null
          }
          plataformas={plataformas}
          salvando={salvando}
          onCancelar={onVoltar}
          onSubmit={handleSalvarDominio}
        />
      )}

      {tipoAtivo === "imagem" && (
        <FormImagem
          imagemExistente={
            itemEdicao?.tipo === "imagem"
              ? (itemEdicao.dados as ImagemContainer)
              : null
          }
          plataformas={plataformas}
          salvando={salvando}
          onCancelar={onVoltar}
          onSubmit={handleSalvarImagem}
        />
      )}
    </div>
  );
}
