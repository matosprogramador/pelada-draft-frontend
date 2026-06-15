# Pelada Draft — Front end

Aplicação web para gerenciar peladas (grupos de futebol amador): cadastro de jogadores com estrelas e posição, sorteio equilibrado de times e gerenciamento de permissões.

O visual segue fielmente o protótipo de design em `design/` (tema escuro "sport tech" com azul elétrico, fontes Oswald + Manrope, shell mobile-first com tab bar inferior e bottom sheets). Tema claro disponível na aba Perfil.

## Stack

- **Next.js 16** (App Router) com TypeScript
- **Tailwind CSS v4** + componentes próprios sobre **@base-ui/react**
- **TanStack React Query** para estado assíncrono e cache
- **Axios** com interceptor de refresh token automático
- **React Hook Form** + **Zod** para formulários e validação

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o ambiente (copie o exemplo):

   ```bash
   cp .env.example .env.local
   ```

   | Variável              | Descrição       | Padrão (dev)            |
   | --------------------- | --------------- | ----------------------- |
   | `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:3000` |

   Em produção use `https://api.pelada-draft.com.br`.

3. Suba o servidor de desenvolvimento (porta **3001**, pois a API usa a 3000):

   ```bash
   npm run dev
   ```

## Autenticação

A API usa cookies HttpOnly (`access_token` / `refresh_token`). Todas as requisições são feitas com `withCredentials: true`. Um interceptor do Axios captura respostas 401, chama `POST /auth/refresh` e refaz a requisição original; se o refresh falhar, o usuário é redirecionado para `/login`.

O usuário logado vem de `GET /auth/me` (hook `useMe`), usado para a checagem visual de dono (`ownerUsername`) e para a aba Perfil. A proteção de rotas é feita em `src/proxy.ts` (convenção do Next 16 que substitui o `middleware.ts`), verificando a presença dos cookies de sessão.

O contrato completo da API está em `docs/swagger.json`. As respostas seguem o envelope `{ success, message, data }` com dados aninhados (`data.peladas`, `data.pelada`, `data.players`, `data.draw.teams`, `data.users`).

## Rotas

| Rota                              | Descrição                                  | Protegida |
| --------------------------------- | ------------------------------------------ | --------- |
| `/login`                          | Login (identifier + senha)                 | Não       |
| `/register`                       | Cadastro                                   | Não       |
| `/` → `/peladas`                  | Lista de peladas do usuário                | Sim       |
| `/sorteios`                       | Histórico de sorteios (em construção)      | Sim       |
| `/perfil`                         | Perfil, tema claro/escuro e logout         | Sim       |
| `/peladas/[peladaId]`             | Detalhes, convocados e config do sorteio   | Sim       |
| `/peladas/[peladaId]/draw`        | Resultado do sorteio (times com cores)     | Sim       |
| `/peladas/[peladaId]/permissions` | Gerenciamento de permissões (só dono)      | Sim       |

## Fluxo do sorteio

Na tela da pelada o usuário seleciona os convocados, define a quantidade de times (2 a 6) e o equilíbrio por posição; a configuração vai para `sessionStorage` e a tela de sorteio dispara `POST /peladas/:id/draw`, exibindo os times com identidade de cor (Amarelo, Azul, Branco, Verde, Vermelho, Preto) e permitindo refazer ou compartilhar (copiar/WhatsApp).

## Rodando com Docker

### Local (desenvolvimento/teste)

```bash
docker compose build
docker compose up -d
```

A aplicação ficará disponível em **http://localhost:3001** e se conectará ao backend em `http://host.docker.internal:3000` (backend rodando na máquina host).

Para ver os logs:

```bash
docker compose logs -f
```

Para parar:

```bash
docker compose down
```

### Variáveis de ambiente

| Variável | Descrição | Valor padrão (Docker local) |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://host.docker.internal:3000` |

> **Atenção:** `NEXT_PUBLIC_*` são embutidas no bundle JavaScript em **build time**, não em runtime. Para mudar a URL da API é necessário rebuildar a imagem passando o build arg:
>
> ```bash
> docker build --build-arg NEXT_PUBLIC_API_URL=https://api.pelada-draft.com.br .
> ```

### Produção

Em produção, passe a URL real da API via build arg no CI/CD:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.pelada-draft.com.br \
  -t pelada-draft-frontend:latest .

docker run -p 3001:3001 pelada-draft-frontend:latest
```

### Health check

A rota `GET /api/health` retorna `{ "status": "ok" }` e é usada pelo docker-compose para monitorar a saúde do container.

## Estrutura

```
src/
  app/                  # App Router (páginas)
    (auth)/             # login, register
    (app)/              # área logada (shell mobile)
      (tabs)/           # peladas, sorteios, perfil (com tab bar)
      peladas/[id]/     # detalhe, draw, permissions
  components/
    auth/               # telas de login/cadastro
    shared/             # AppButton, BottomSheet, TopBar, tab bar etc.
    peladas/ players/ draw/  # componentes de domínio
  lib/
    api/                # Axios + funções por domínio
    hooks/              # React Query hooks por domínio (+ useMe, useTheme)
    validations/        # Schemas Zod
    utils/              # privilégios, posições, estrelas, cores dos times
  types/                # DTOs da API
  proxy.ts              # proteção de rotas (middleware do Next 16)
design/                 # protótipo de referência visual (não compila)
docs/swagger.json       # contrato OpenAPI da API
```
