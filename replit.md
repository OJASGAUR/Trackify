# Workspace

## Overview

Trackify — Copy Checker: A scheduling and tracking app for an English teacher to manage homework and classwork copy checking across 6 classes (~40 students each). Frontend-only app using localStorage for persistence.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: wouter
- **State**: localStorage via custom hooks
- **API framework**: Express 5 (api-server, not used by copy-checker)
- **Database**: PostgreSQL + Drizzle ORM (not used by copy-checker)

## App Structure

- `artifacts/copy-checker/` — Main web app (React + Vite)
  - `src/pages/calendar.tsx` — Monthly calendar with task assignments
  - `src/pages/progress.tsx` — Progress dashboard with percentage bars
  - `src/pages/settings.tsx` — Class configuration and scheduling rules
  - `src/lib/schedule.ts` — Scheduling algorithm
  - `src/hooks/use-store.tsx` — App state context (localStorage)
  - `src/components/layout.tsx` — Sidebar navigation layout

## Classes

6A, 6B, 7D, 8B, 9D, 10C — each with ~40 students, 2 copy types (homework + classwork) = 480 total copies/month

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/copy-checker run dev` — run copy checker locally
