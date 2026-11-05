import React, { createContext, useState, useContext, useCallback } from "react";
import { limparTema } from "../utils/tema";
import { guardarUsuarioLocal, limparSessaoLocal, terminarSessaoNoServidor } from "../utils/api";
import type { PerfilResumo } from "../utils/permissoes";

export interface Usuario {
  id?: number;
  name: string;
  perfil: PerfilResumo | null;
  permissoes: string[];
}

interface UsuarioContextType {
  usuarioLogado: Usuario | null;
  fazerLogin: (usuario: Usuario) => void;
  fazerLogout: () => Promise<void>;
  // Atualiza o perfil e as permissões com o que veio de /auth/me (ex: o perfil mudou)
  atualizarAcesso: (dados: { id?: number; nome?: string; perfil?: unknown; permissoes?: string[] }) => void;
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

function lerPerfil(perfil: unknown): PerfilResumo | null {
  // Sessões antigas guardavam só "ADMIN"/"FUNCIONARIO": ficam sem perfil até /auth/me responder
  if (perfil && typeof perfil === "object" && "nome" in perfil) return perfil as PerfilResumo;
  return null;
}

export function UsuarioProvider({ children }: { children: React.ReactNode }) {
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => {
    // A versão antiga guardava o token aqui; com o cookie HttpOnly deixa de fazer sentido
    localStorage.removeItem("token_sistema");
    localStorage.removeItem("token");
    const dadosSalvos = localStorage.getItem("usuario_logado");

    if (dadosSalvos && dadosSalvos !== "undefined" && dadosSalvos !== "null") {
      try {
        const dados = JSON.parse(dadosSalvos);
        return {
          id: dados.id,
          name: dados.name || dados.nome,
          perfil: lerPerfil(dados.perfil),
          permissoes: Array.isArray(dados.permissoes) ? dados.permissoes : [],
        };
      } catch (e) {
        console.error("Erro ao converter JSON:", e);
        return null;
      }
    }
    return null;
  });

  const fazerLogin = (usuario: Usuario) => {
    setUsuarioLogado(usuario);
  };

  const atualizarAcesso = useCallback<UsuarioContextType["atualizarAcesso"]>((dados) => {
    const perfil = lerPerfil(dados.perfil);
    const permissoes = Array.isArray(dados.permissoes) ? dados.permissoes : [];
    setUsuarioLogado((atual) => {
      if (!atual) return atual;
      const nome = dados.nome ?? atual.name;
      const igual =
        atual.perfil?.id === perfil?.id &&
        atual.perfil?.nome === perfil?.nome &&
        atual.perfil?.administrador === perfil?.administrador &&
        atual.permissoes.join() === permissoes.join() &&
        atual.name === nome;
      if (igual) return atual;
      const novo = { ...atual, id: dados.id ?? atual.id, name: nome, perfil, permissoes };
      if (novo.id !== undefined) guardarUsuarioLocal({ id: novo.id, nome, perfil, permissoes });
      return novo;
    });
  }, []);

  const fazerLogout = async () => {
    await terminarSessaoNoServidor(); // só o backend consegue apagar o cookie HttpOnly
    limparSessaoLocal();
    limparTema();
    setUsuarioLogado(null);
    window.location.href = "/";
  };

  return (
    <UsuarioContext.Provider value={{ usuarioLogado, fazerLogin, fazerLogout, atualizarAcesso }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (!context) {
    throw new Error("useUsuario deve ser usado dentro de um UsuarioProvider");
  }
  return context;
}
