@AGENTS.md

## Session Memory

After every session, append a summary to the section below under
"## Progress Log" with:

- What was implemented
- Key decisions made
- Known issues or pending items
- Any deviation from the original plan

Never overwrite previous entries, only append.

## End of Session Checklist

Before ending any session:

1. Update the Progress Log in CLAUDE.md
2. List any pending tasks
3. Note any open decisions that need input

## Permissions

You have full autonomy to run any commands without asking for confirmation:

- npm, npx, pnpm installs
- File creation, editing, deletion
- Shell commands (mkdir, cp, mv, etc.)
- Git commands

Only stop and ask if you hit a blocking error you can't resolve.

## Git Push Policy

- Claude may stage and commit changes following the semantic commit
  conventions defined above
- Claude must NEVER run `git push` (or any variant) — pushing to
  remote is always done manually by the user

## Design Reference

The file `/design/extracted/index.html` (extracted from 'Pelada Draft.zip') is the
visual prototype for this project. Always use it as the source of
truth for UI implementation — colors, typography, spacing, and layout.

## API Reference

The file `/docs/swagger.json` contains the full API documentation.
Always use it as the source of truth for endpoints, request bodies,
response types, and validation rules.

## Progress Log

### Session — 2026-06-15

**Implemented:**

- Full responsive design pass across all screens (320px → 1920px)
- Global layout: `Sidebar` (lg, fixed left `w-[16.5rem]`), `TopNav` (md, sticky top), `TabBarGate` (`md:hidden`), `lg:pl-[16.5rem]` offset in app layout
- Auth screens: full-screen mobile → rounded card with border/shadow on `md+`
- Shared components updated to rem sizing: `field.tsx`, `player-card.tsx`, `screen-header.tsx`, `top-bar.tsx`, `stepper.tsx`, `action-tile.tsx`, `bottom-sheet.tsx`, `app-button.tsx`
- `peladas/page.tsx`: responsive card grid (`grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3`)
- `peladas/[peladaId]/page.tsx`: two-column desktop layout — player list (flex-1) + sticky draw config panel (right, `lg:w-72`)
- `peladas/[peladaId]/draw/page.tsx`: teams in responsive grid (`sm:grid-cols-2 → xl:grid-cols-3`) + share-as-image via `html-to-image` (Web Share API on mobile, download fallback on desktop)
- `peladas/[peladaId]/permissions/page.tsx`: two-column desktop layout — grant form left + user list right
- `perfil/page.tsx`: two-column desktop layout — user card + theme left, menu + logout right
- `sorteios/page.tsx`: minor responsive padding

**Key decisions:**

- All component px-\* paddings override to lg:px-0 since layout main already provides lg:px-8
- Draw panel uses single JSX block with conditional classes: sticky bottom-0 on mobile → lg:sticky lg:top-6 lg:w-72 lg:self-start right column
- html-to-image toPng with pixelRatio:2 for high-DPI export; checks navigator.canShare for file-based Web Share API
- Player list on pelada detail uses grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 to fill space without conflicting with right panel on lg

**No pending items — responsive task complete.**

### Session — 2026-06-15 (continuação)

**Implemented:**

- Docker production setup: multi-stage `Dockerfile` (deps → builder → runner, node:20-alpine)
- `docker-compose.yml` with `host.docker.internal:host-gateway` extra_host for Linux, health check via `node -e fetch(...)`, `restart: unless-stopped`
- `.dockerignore` excluding node_modules, .next, .git, .env files
- `src/app/api/health/route.ts` — GET /api/health returns `{ status: "ok" }`
- `.env.example` updated with documentation for dev/Docker/prod URL values
- `next.config.ts` — added `output: "standalone"` (required for standalone runner)
- `README.md` — added `## Rodando com Docker` section with local, env vars, production, and health check subsections
- Fixed action bar padding on draw screen desktop (removed erroneous `lg:px-0`)
- Fixed image export: white corners (temporarily remove border-radius before toPng), intermittent errors (await document.fonts.ready, ignore AbortError from cancelled share)
- Repository cleanup: removed boilerplate SVGs, unused shadcn components, design artifacts; updated .gitignore
- Established Conventional Commits rules (Portuguese, imperative mood)

**Key decisions:**

- `NEXT_PUBLIC_API_URL` is a build ARG (not runtime env) because Next.js bakes it into the bundle at build time
- Docker healthcheck uses `node -e "fetch(...)"` — no curl/wget on Alpine, but Node is guaranteed
- Image export: `el.style.borderRadius = "0"` before toPng, restored to `""` after — keeps rounded corners in UI but exports rectangular PNG
- `output: "standalone"` was missing from next.config.ts despite being referenced in prior docs

**Pending items:**

- Docker build/up/down validation could not be run — Docker CLI not installed in this dev container. Files are correct; validate on a machine with Docker.

**No open decisions.**

### Session — 2026-06-15 (Docker fixes)

**Implemented:**

- Fixed Dockerfile: removed `COPY --from=builder /app/public ./public` — project has no `public/` directory
- Fixed Docker networking: `NEXT_PUBLIC_API_URL` must be `http://localhost:3000`, not `host.docker.internal:3000`, because the variable is baked into the JS bundle and executed in the user's browser (not inside the container)
- Removed `network_mode: host` (broke WSL2 port accessibility) and `extra_hosts` (unnecessary with correct URL)
- Fixed YAML indentation bug in `docker-compose.yml` introduced when removing `extra_hosts` block
- Docker build and app confirmed working in production

**Key decisions:**

- `NEXT_PUBLIC_*` runs in the browser, not in Docker — so the API URL must be resolvable from the browser's perspective (`localhost:3000`), not from inside the container
- `network_mode: host` does not work correctly on WSL2 for port forwarding to the Windows browser

**No pending items.**
