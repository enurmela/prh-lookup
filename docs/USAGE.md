# Usage Guide

## What This Extension Does

PRH Lookup lets you search Finnish companies in Raycast using PRH YTJ open data.

## Start

1. Install dependencies:

```bash
bun install
```

2. Start extension development mode:

```bash
bun run dev
```

3. Open Raycast and run `PRH Search`.

## Search Behavior

- Name search: type at least 2 characters (example: `nokia`)
- Business ID search:
  - full format: `0112038-9`
  - 8 digits: `01120389` (auto-normalized)
- Short numeric input (example: `123`) is intentionally blocked with guidance.
- Search uses a short cache for speed:
  - repeated queries within ~120 seconds return instantly from cache
  - stale cached results can appear first, then refresh in background

## Split View UX

- During active search, the command uses split view:
  - left: compact result list
  - right: minimal quick summary with dates first (last modified, registration/end date, status, essentials)
- Full details are still available via `View Details`.

## Favorites

- Add/remove companies from favorites directly from list and detail actions.
- Favorites appear when search input is empty.
- Favorites are stored locally on your machine.

## Available Actions

- View Details
- Copy Business ID
- Copy Primary Address (if available)
- Open company website (if available)
- Open YTJ search page
- Open raw PRH JSON for the selected Business ID

## Current MVP Limits

- First page of results only (`page=1`)
- No financial/map tabs
- No guaranteed direct per-company YTJ deep-link
- No phone/email fields in PRH YTJ v3 `/companies`

## Troubleshooting

- If results look stale or missing, retry with exact Business ID.
- If API/network errors occur, Raycast shows failure toasts.
- Validate extension health with:

```bash
bun run lint
bun run build
```
