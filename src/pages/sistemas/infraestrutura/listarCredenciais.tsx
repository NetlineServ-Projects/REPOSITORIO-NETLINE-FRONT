import { useState, type ComponentType } from "react";
import { toast } from "sonner";
import type { Credencial } from "../../../hooks/useSistemasData";
import {
  IconChave,
  IconCopiar,
  IconOlhoAberto,
  IconOlhoFechado,
  IconCaneta,
  IconLixeira,
  IconAprovado,
} from "../../../components/icons";
import { rotuloTipoCredencial } from "./constantes";
import { useTranslation } from "react-i18next";

interface ListaCredenciaisProps {
  credenciais: Credencial[];
  podeGerir: boolean;
  onEditar: (credencial: Credencial) => void;
  onApagar: (credencial: Credencial) => void;
}

function BotaoIcone({
  rotulo,
  Icone,
  onClick,
  perigoso = false,
}: {
  rotulo: string;
  Icone: ComponentType<{ className?: string }>;
  onClick: () => void;
  perigoso?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rotulo}
      aria-label={rotulo}
      className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
        perigoso ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <Icone className="w-3.5 h-3.5" />
    </button>
  );
}

// A aba inteira só abre depois da reautenticação, por isso os valores já vêm no GET
export default function ListaCredenciais({ credenciais, podeGerir, onEditar, onApagar }: ListaCredenciaisProps) {
  const { t } = useTranslation();
  const [revelados, setRevelados] = useState<Set<number>>(new Set());
  const [copiadoId, setCopiadoId] = useState<number | null>(null);

  const alternarRevelado = (id: number) =>
    setRevelados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const copiarValor = async (id: number, valor: string) => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiadoId(id);
      toast.success(t("sistemas.credenciais.valorCopiado"));
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      toast.error(t("sistemas.credenciais.erroCopiar"));
    }
  };

  if (credenciais.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-xs text-slate-400 italic">{t("sistemas.credenciais.vazio")}</p>
      </div>
    );
  }

  return (
    <ul className="bg-white rounded-2xl border border-slate-200/70 shadow-xs divide-y divide-slate-100">
      {credenciais.map((credencial) => {
        const revelado = revelados.has(credencial.id);
        const copiado = copiadoId === credencial.id;
        return (
          <li key={credencial.id} className="p-4 sm:px-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-netline-dourado/10 text-[#b07a14] flex items-center justify-center shrink-0">
                <IconChave className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{credencial.label}</p>
                <p className="text-[11px] text-slate-400 truncate">{rotuloTipoCredencial(credencial.tipo)}</p>
              </div>
              <div className="flex items-center shrink-0">
                <BotaoIcone
                  rotulo={revelado ? t("sistemas.credenciais.ocultarValor") : t("sistemas.credenciais.mostrarValor")}
                  Icone={revelado ? IconOlhoFechado : IconOlhoAberto}
                  onClick={() => alternarRevelado(credencial.id)}
                />
                <BotaoIcone
                  rotulo={copiado ? t("sistemas.credenciais.copiado") : t("sistemas.credenciais.copiarValor")}
                  Icone={copiado ? IconAprovado : IconCopiar}
                  onClick={() => credencial.valor && copiarValor(credencial.id, credencial.valor)}
                />
                {podeGerir && (
                  <>
                    <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />
                    <BotaoIcone rotulo={t("sistemas.credenciais.editar")} Icone={IconCaneta} onClick={() => onEditar(credencial)} />
                    <BotaoIcone
                      rotulo={t("sistemas.credenciais.apagar")}
                      Icone={IconLixeira}
                      perigoso
                      onClick={() => onApagar(credencial)}
                    />
                  </>
                )}
              </div>
            </div>

            <pre className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {/* Máscara de comprimento fixo, para não revelar o tamanho do segredo */}
              {revelado ? credencial.valor : "•".repeat(16)}
            </pre>
          </li>
        );
      })}
    </ul>
  );
}
