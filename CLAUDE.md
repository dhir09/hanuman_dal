# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server on port 5173
npm run build      # Type-check (tsc -b) then Vite build
npm run lint       # Oxlint (react + typescript plugins)
npm run preview    # Serve production build locally
```

No test framework is configured.

## Architecture

Hanuman Dal is a **bilingual (English + Gujarati) donation & finance manager** for a religious organization. It runs as a mobile-first SPA backed by Supabase (auth + Postgres with RLS).

### Data layer

- **Supabase auth** with email/password (`src/auth/AuthContext.tsx`). `AuthGate` in `App.tsx` gates all routes behind login and runs `ensureSeed()` on first load.
- **Single data-access file** `src/db/db.ts` — all CRUD for every entity, TypeScript interfaces, receipt-number generators. Every mutation calls `invalidate(key)` to trigger re-fetches in the custom `useQuery` hook (`src/hooks/useQuery.ts`).
- **Row Level Security** — every table has a `user_id` column; RLS policies restrict access to `auth.uid()`. The schema lives in `supabase-schema.sql`.
- **Tables:** settings, purposes, donors, donations, events, expenses, advertisement_incomes.

### Bilingual pattern

Every user-facing text field is stored as `field_en` / `field_gu` pairs. The `BilingualInput` component auto-transliterates English → Gujarati with a 450ms debounce (via `src/lib/transliterate.ts`). Display uses `pick(obj, 'field')` from the i18n context to select the active language's value. Receipts are always rendered in Gujarati regardless of app language.

### i18n

`src/i18n/strings.ts` exports a flat `strings` object of `{ en, gu }` pairs. Add new keys there; they become immediately available via `t(key)` and are type-checked via `StringKey`.

### Routing pattern

Each entity module follows: `/path` (list), `/path/new` (form), `/path/:id` (receipt/detail), `/path/:id/edit` (form in edit mode). Routes are defined in `App.tsx`, nested under `<Layout>` (header + bottom nav). The "More" page (`src/pages/More.tsx`) is the secondary navigation hub for less-used modules.

### Receipt / PDF capture

`src/lib/pdf.ts` uses `html2canvas-pro` + `jsPDF`. `renderCanvas` never captures the on-screen node: it clones the element into an off-screen holder laid out at a fixed width (`layoutWidth`, 420px for receipts) so the output is identical on phone and desktop — capturing the live node let the phone's viewport/scroll state shift the captured region and blow the receipt's header band up across a whole page. It also snapshots computed styles via `onclone` to work around html2canvas not resolving Tailwind v4's `@property` / CSS-variable chains. Receipts are fitted to a single A4 page; only reports (`renderPagesToPdf`) are multi-page. Sharing uses the Web Share API for mobile, falling back to PDF download + WhatsApp text link on desktop (`src/lib/whatsapp.ts`).

### Styling

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin.
- Custom saffron (orange) color palette defined via `@theme` in `src/index.css`.
- Reusable component classes in `@layer components`: `btn-primary`, `btn-ghost`, `btn-danger`, `card`, `field`, `label`, `chip`.
- Font: Noto Sans Gujarati. Icons: lucide-react.

### Key conventions

- `PaymentMode` type: `'cash' | 'upi' | 'bank' | 'cheque'` — used across donations, expenses, and ad income.
- Receipt numbers: `{prefix}-{year}-{seq}` for donations, `{prefix}-AD-{year}-{seq}` for ad income. Generated in `db.ts` by counting existing records in the same year.
- Donor name and purpose text are **denormalized** into each donation record alongside optional foreign-key IDs.
- Expenses use an inline `<Modal>` for add/edit rather than a separate form page.
- The `useQuery` hook is a lightweight custom hook with manual cache invalidation — not React Query.
