# Islam24x7

> "Read. Search. Learn. Explore." — a modern Islamic knowledge platform:
> Quran, Hadith, a structured Islamic library, and an AI research assistant
> grounded in verifiable sources. Ships as a responsive web app **and** an
> Android APK from one codebase.

**Status:** Foundation + Home/Nav + Library + Reader + Search shipped (see
`docs/ARCHITECTURE.md` for the full plan and screen map).

## Highlights (already working)

- Original brand identity: emerald + gold, eight-pointed-star mark, subtle
  geometric lattice, light/dark/system themes.
- Mobile-first responsive shell with sticky footer, accessible header nav.
- **APK delivery foundation**: config-driven release system
  (`/api/releases/latest` with live availability check), dedicated
  `/download` install page (steps, security notice, graceful unavailability),
  first-visit Android prompt with persistent dismissal + re-trigger period,
  and QA overrides (`?apkPrompt=1|auto|0`).
- Reusable design system: BookCard, SourceCitation, Empty/Error/Loading
  states, DemoBadge, Islamic pattern decor.
- Typed Knowledge Base contract (`src/types/knowledge-base.ts`) and clean
  config layer (`src/config/*`) — zero content hard-coded in components.
- SEO & PWA seeding: metadata, Open Graph, manifest, robots, sitemap.

## Integrity rules

No Quran verse, hadith, ruling or quotation is ever fabricated. Demo data is
clearly labeled; production content comes exclusively from the external
Islamic Knowledge Base via APIs.

## Quick start

```bash
bun install
cp .env.example .env      # adjust if needed
bun run db:push           # (personal-data phases)
bun run dev               # http://localhost:3000
bun run lint
bun run scripts/build-icons.ts   # regenerate brand assets from masters
```

See `docs/SETUP.md` (environment), `docs/ARCHITECTURE.md` (system design),
and later: `docs/ANDROID.md`, `docs/APK_RELEASE.md`, `docs/API.md`,
`docs/DEPLOYMENT.md`.
