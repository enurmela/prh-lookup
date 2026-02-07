# AGENTS.md

Minimal rules for contributors and coding agents in this repo.

## Scope

- Keep this extension focused on PRH company lookup MVP unless explicitly asked to expand scope.

## Hard Requirements

- Use Bun for local workflows (`bun install`, `bun run ...`).
- Use built-in `fetch`; do not add `node-fetch`.
- Keep API access in `src/api/`, mapping/selection logic in `src/lib/`.
- Preserve query-safety behavior in `src/hooks/use-prh-search.ts`:
  - no empty `/companies` query
  - support only Business ID and name modes
  - keep `page=1` for MVP
- Favorites storage key must remain `prh-favorites-v1` unless a migration is implemented.

## Validation Before Finish

- `bun run lint`
- `bun run build`

## Full Documentation

- Developer guide: `docs/DEVELOPMENT.md`
- Usage guide: `docs/USAGE.md`
