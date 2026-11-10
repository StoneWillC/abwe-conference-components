# ABWE Conference Components

React/TypeScript components extracted from the ABWE Conference Engagement System WordPress theme (`wp-content/themes/abwe-conference-engagement`).

## What's included

- `src/components/` — all UI components (widgets, dashboard, survey, modals, layout)
- `src/assets/`, `src/constants/`, `src/hooks/`, `src/interfaces/`, `src/services/`, `src/types/`, `src/utils/` — direct dependencies of those components
- `src/pages/Survey.tsx` — the one page-level component imported by the survey widgets

This is the full dependency closure of `src/components` from the source project, copied as-is. It is not a standalone app: there's no `main.tsx`/entry point or router wiring, so it isn't set up to build or run on its own.

## Backend dependency

`src/services/api.ts` calls a WordPress REST API at `/wp-json/wc/abwe-step/v1/*` and relies on session cookies/tokens set by that backend (see `src/utils/sessionUtils.ts`). These components won't function against live data without that WordPress backend running.

## Type-checking

```
npm install
npm run typecheck
```
