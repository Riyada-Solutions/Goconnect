# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/` — GoConnect / CareConnect Nurse Expo app
  - `data/` — repositories + models (single source of truth for API contracts mobile-side)
  - `data/models/auth.ts`, `data/models/patient.ts`, `data/models/visit.ts`, `data/models/flowSheet.ts`
  - `data/visit_repository.ts` — flow-sheet, progress notes, refusal, SARI, inventory
  - `app/` — Expo Router screens
- `artifacts/mobile/API_CONFLICTS.md` — full mapping of v2 Postman API contract vs. mobile code, with per-section action notes.

## Architecture decisions

- Flow-sheet is a single backend form (`POST /visits/{id}/forms/flowsheet`) that the mobile UI saves one section at a time; section keys live in `FLOWSHEET_SECTION_KEY`.
- Visit detail response is the single source of truth: it embeds patient, patient alerts (summary), flow sheet, progress notes, etc. The visit-detail screen does not refetch alerts separately.
- `mapFlowSheetFromApi` accepts both v2 (nested camelCase) and legacy (flat snake_case) shapes so screens stay backwards-compatible while the backend rolls forward.

## Product

GoConnect Nurse — Expo mobile app for in-home dialysis nurses to run a visit (scheduler → check-in → flow sheet → progress notes → refusal/SARI → inventory).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
