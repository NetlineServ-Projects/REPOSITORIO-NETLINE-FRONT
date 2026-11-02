# Repositório Digital da Netline — Frontend

Aplicação web do repositório interno da Netline Serv, Lda. Reúne a documentação da empresa, os sistemas que a equipa desenvolve e a infraestrutura onde esses sistemas correm (plataformas, servidores, imagens de containers e domínios).

A API está noutro repositório: [repositorio-backend](https://github.com/NetlineServ-Projects/repositorio-backend).

## Funcionalidades

- **Documentos:** envio, pesquisa, filtros e pré-visualização de PDF e imagens. Os documentos dos funcionários passam por aprovação antes de ficarem visíveis.
- **Aprovações:** os administradores aprovam ou rejeitam documentos, com o motivo da rejeição.
- **Sistemas desenvolvidos:** ficha técnica, documentos do sistema, e infraestrutura e credenciais por ambiente (Produção e Testes).
- **Plataformas:** clouds, servidores, registos de imagens e domínios, com a topologia em diagrama e exportação em PDF ou Excel.
- **Notificações:** documentos aprovados, rejeitados ou à espera de revisão, e domínios prestes a expirar.
- **Administração:** utilizadores, lixeira e registo de atividade.
- Português (PT-PT) e inglês, tema claro e escuro, e interface adaptada a telemóvel.

## Tecnologias

React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, i18next, React Flow (topologia), react-pdf, exceljs e jspdf (exportações).

## Começar

Requisitos: Node.js 22 e Yarn 1. A API tem de estar a correr (ver o README do backend).

```bash
yarn install
cp .env.example .env   # e ajuste o VITE_API_BASE_URL, se for preciso
yarn dev               # http://localhost:5173
```

### Variáveis de ambiente

| Variável | Para que serve | Exemplo |
|---|---|---|
| `VITE_API_BASE_URL` | Endereço da API, sem barra no fim e sem `/api/v1` | `http://localhost:3000` |

O `.env` não vai para o Git: cada ambiente tem o seu. Use o `.env.example` como base.

## Comandos

| Comando | O que faz |
|---|---|
| `yarn dev` | Servidor de desenvolvimento com recarregamento automático |
| `yarn build` | Gera a versão de produção em `dist/` |
| `yarn preview` | Serve localmente o que está em `dist/` |
| `yarn lint` | Verifica o código com o ESLint |
| `npx tsc -b` | Verifica os tipos do TypeScript |

O projeto usa **Yarn**: não use `npm install`, para não criar um `package-lock.json` ao lado do `yarn.lock`.

## Organização do código

```
src/
├── pages/          Uma pasta por área (documentos, sistemas, Plataformas, admin, perfil...)
├── components/     Componentes partilhados (janelas de confirmação, dropdowns, estados...)
├── hooks/          Carregamento de dados de cada área (useDocumentosData, usePlataformasData...)
├── utils/          api.ts (pedidos à API), exportações, formatações
├── lang/           Traduções: resources/pt.json e en.json, mais um ficheiro por área
│                   em resources/<idioma>/<area>.json (usado como t("<area>.chave"))
├── types/          Tipos partilhados
└── index.css       Tailwind, cores da marca e tema escuro
```

## Convenções

- **Pedidos à API:** use sempre o `fetchComToken` de `src/utils/api.ts`. Ele envia o cookie da sessão, aplica tempos limite, repete leituras que falham por rede e termina a sessão quando a API responde 401.
- **Sessão:** o token fica num cookie `HttpOnly` definido pela API; o JavaScript não o lê nem o guarda. No `localStorage` fica só `usuario_logado` (id, nome e perfil), para o ecrã.
- **Cores da marca:** use `bg-netline-azul`, `text-netline-dourado`, `bg-netline-amarelo`, etc., definidas em `src/index.css`. Não escreva os códigos hexadecimais à mão.
- **Textos:** todo o texto visível passa pelo i18next (`t("...")`), em português de Portugal e em inglês.
- **Estados de página:** use `EstadoCarregando`, `EstadoErro` e `EstadoVazio` de `src/components/estados.tsx`, e o `useCarregamento` nos hooks de dados.
- **Confirmações:** use `useConfirmacao()` (`src/components/confirmacao.tsx`), nunca `window.confirm`.

## Produção

- O frontend e a API têm de estar no **mesmo site** (por exemplo `repositorio.netline.co.mz` e `api.repositorio.netline.co.mz`) e em **HTTPS**, porque o cookie da sessão é `SameSite=Strict` e `Secure`.
- Defina o `VITE_API_BASE_URL` com o endereço público da API **antes** de `yarn build`: o Vite escreve o valor no código gerado.
- O CI (`.github/workflows/ci.yml`) verifica os tipos e a compilação em cada push e pull request.
