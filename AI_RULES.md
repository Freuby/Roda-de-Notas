# Roda de Notas 🪘 — AI & Architectural Rules

## Tech Stack Overview
- **Framework & Runtime**: React 18 with TypeScript (SPA built with Vite).
- **Styling**: Tailwind CSS with custom CSS variables matching the Capoeira design palette (Terracotta, Vert Capoeira, Ochre, Sand).
- **Icons**: `lucide-react` for UI and navigation icons, alongside custom SVG capoeira instrument glyphs.
- **Backend & Auth**: Supabase (`@supabase/supabase-js`) for authentication (email/password), real-time database, and Row Level Security (RLS).
- **Components & UI Patterns**: shadcn/ui inspired primitives, Radix UI primitives for dialogs/popovers/tooltips, and Lucide icons.
- **State Management**: Reactive React state hooks with persistent local caching where appropriate (`localStorage`).
- **Media Support**: Embedded media rendering for YouTube, Instagram, and Facebook video links.

---

## Library & Tool Usage Guidelines

1. **Styling & CSS**:
   - Use Tailwind utility classes for layout, flexbox/grid, spacing, typography, and responsive breakpoints.
   - Use custom theme tokens (`--terracotta`, `--green`, `--ochre`, `--bg`, `--surface`, `--border`) for brand consistency.
   - Use `clsx` and `tailwind-merge` (or `cn` helper) for dynamic class merging.

2. **Icons**:
   - Always prefer `lucide-react` for standard UI elements (search, arrows, lock, trash, copy, comments, smileys).
   - Use dedicated inline SVGs for domain-specific Capoeira symbols (Berimbau, Atabaque, Ginga, Estrela, Pandeiro).

3. **Supabase & Data Fetching**:
   - Centralize client instantiation in `src/lib/supabase.ts`.
   - Never expose secret service keys in the frontend; always use the public anonymous key protected by Supabase RLS.
   - Handle auth lifecycle using `supabase.auth.onAuthStateChange` and persist sessions.

4. **Component Architecture**:
   - Keep components modular, self-contained, and focused (e.g. `Sidebar`, `PageEditor`, `BlockRenderer`, `SongPicker`, `PrerequisitesPanel`, `GlobalSearch`).
   - Place shared types in `src/types/index.ts`.
   - Place helper utilities in `src/lib/utils.ts`.