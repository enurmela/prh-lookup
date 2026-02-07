# Development Guide

This guide covers how to develop and maintain this Raycast extension.

## Tech and Runtime

- TypeScript + React (TSX)
- `@raycast/api` and `@raycast/utils`
- Bun package manager in this repository
- Raycast-managed Node runtime when command executes

## Project Layout

- `src/prh-search.tsx`: root command (`prh-search`)
- `src/components/company-detail.tsx`: detail screen
- `src/api/prh.ts`: API client (`GET /companies`)
- `src/hooks/use-prh-search.ts`: input classification + search orchestration
- `src/hooks/use-favorites.ts`: local favorites persistence
- `src/lib/language.ts`: language preference + fallback order
- `src/lib/selectors.ts`: PRH -> UI selection logic
- `src/lib/format.ts`: formatting helpers
- `src/types/prh.ts`: raw API types
- `src/types/ui.ts`: UI-level types
- `src/constants.ts`: app constants and mappings

## Local Workflow

Run from repository root:

```bash
bun install
bun run dev
bun run lint
bun run build
```

Useful CLI commands:

```bash
bunx ray help
bunx ray migrate
```

## Coding Rules

- Keep logic modular and testable.
- Keep data fetching inside `src/api/`.
- Keep transformation and selection logic inside `src/lib/`.
- Keep command components focused on UI orchestration.
- Prefer Raycast-native patterns for navigation and actions.

## Raycast UI Guidelines (Applied Here)

- Action titles in Title Case.
- Always provide a meaningful search placeholder.
- Use `Action.Push` for nested views.
- Show loading state during async work.
- Avoid empty-state flicker by gating render on loading state.

## Query and API Safety

Current enforced behavior:

- Never call `/companies` with empty input.
- Input classification:
  - `^\d{7}-\d$` -> business ID
  - `^\d{8}$` -> normalize to `NNNNNNN-N`, then business ID
  - text length >= 2 -> name search
  - other numeric values -> show hint, skip API call
- Pagination is fixed at `page=1` in MVP.

## Data and Security Notes

- No external analytics.
- No opaque binary dependencies.
- Keep stored local data minimal.
- Favorites are local only and keyed by `prh-favorites-v1`.

## Store Publishing (Later)

This repo is currently local/private-first. For a future Store pass:

1. finalize metadata (author/license/categories/description)
2. ensure icon/screenshot/changelog readiness
3. run distribution validation (`ray build`)
4. follow Raycast publish workflow

Note: Raycast docs often assume npm lockfiles for Store CI. If needed for submission, generate the required npm lock artifacts in a dedicated publishing branch.

## Suggested Improvements

- Add `CHANGELOG.md`
- Add `bun run check` script (`lint && build`)
- Add optional language override preference
- Add pagination controls beyond page 1
