# Worklog — Islamic Knowledge Platform

Shared handover document. Append new sections (never overwrite).

---

Task ID: 1
Agent: Z.ai Code (main orchestrator)
Task: Inspect repository, propose architecture, implement Phase 1 (Foundation + Design System)

Work Log:
- Inspected repo: Next.js 16.1.1 + React 19 + TS 5 + Tailwind 4 + shadcn/ui (full set) + Prisma 6/SQLite + framer-motion/next-themes/zustand/z-ai-web-dev-sdk. Clean slate (scaffold page.tsx only).
- Generated original brand assets with image-generation CLI: `public/icons/icon-master.png` (emerald+gold 8-point star), `og-master.png`; derived icon-512/192, apple-touch-icon, favicon-32, og-image.jpg via `scripts/build-icons.ts` (sharp). Removed scaffold `public/logo.svg` + `public/robots.txt` (replaced by app/robots.ts).
- Config layer: `src/config/brand.ts` (identity, benefits), `src/config/site.ts` (routes, nav, moduleShowcase, featureFlags), `src/config/apk-release.ts` (env-driven release + availability check fs/HEAD), `src/types/knowledge-base.ts` (full KB API contract types), `.env.example`.
- Design system: rewrote `globals.css` — emerald/gold oklch tokens (light+dark), gold token, font mappings (Inter body / Lora display / Amiri arabic), scrollbar-elegant, focus-ring, reduced-motion support. `StarLattice` Islamic geometric pattern component (aria-hidden, currentColor). Logo/BrandMark SVG (two overlapping squares = khatam star).
- Core components: states.tsx (EmptyState/ErrorState/LoadingState/DemoBadge/SoonChip), BookCard (hue-driven placeholder cover + Demo badge), SourceCitation (quran/hadith/book union, open-source action), SiteHeader (sticky, blur, tooltips, compact Soon chips, nowrap), SiteFooter (sticky bottom via mt-auto, safe-area padding), ThemeToggle (CSS dark: variants, zero hydration risk).
- APK foundation: `lib/device.ts` (platform detect incl. iPadOS-as-Mac), `lib/storage.ts` (safe JSON storage), `lib/apk-prompt-store.ts` (external store: firstVisitAt/visits/dismissedAt/downloadedAt), `hooks/use-apk-prompt.ts` + `hooks/use-client-store.ts` (useSyncExternalStore-based, passes new React-Compiler lint rules — NO setState-in-effect), ApkDownloadPrompt modal (benefits, version chips, honest unavailable state, never traps user), InstallAppBanner (own dismissal persistence, hides after download), ApkPromptProvider (fetches /api/releases/latest lazily), DownloadApkButton, InstallHint (device-specific: android/ios/desktop — never misleading iOS instructions), `/download` page (live availability, steps, security notice, web alternative), `/api/releases/latest` (GET), `/api/downloads/track` (POST+GET in-memory, no PII).
- QA overrides: `?apkPrompt=1` (force show), `?apkPrompt=auto` (simulate Android, respects dismissal), `?apkPrompt=0` (hide).
- Pages: layout.tsx (fonts, ThemeProvider, skip-link, metadata/OG/viewport, ApkPromptProvider), page.tsx Phase-1 home (Hero w/ framer-motion + reduced-motion, InstallAppBanner, honest module roadmap, KB pipeline strip, design-system preview with labeled demo data), manifest.ts, robots.ts, sitemap.ts.
- Refactored 4 components to satisfy Next 16 react-hooks/set-state-in-effect + refs rules (useSyncExternalStore pattern everywhere browser APIs are read).
- Fixed desktop header wrapping (compact "Soon" chips, whitespace-nowrap, logo nowrap).
- Verified via agent-browser E2E: desktop visit (no prompt ✓), ?apkPrompt=auto (prompt ✓ → dismiss → persisted ✓ → reload hidden ✓, banner shows ✓), ?apkPrompt=1 (force ✓), /download honest unavailable state ✓, APIs ✓, manifest/robots/sitemap ✓, footer sticky flush ✓, mobile 390px + dark mode + desktop screenshots ✓, zero page errors ✓. Lint clean ✓.

Stage Summary:
- Phase 1 COMPLETE: foundation + design system + APK delivery foundation are live and verified.
- Key decisions: emerald/gold identity; services layer will be the only KB consumer; mock data strictly in src/lib/demo/* with DemoBadge; APK release fully env-driven via /api/releases/latest; QA overrides documented in docs/SETUP.md.
- Docs: README.md, docs/ARCHITECTURE.md (full proposal: API contract, screen map, phases, strategies), docs/SETUP.md, .env.example, public/downloads/README.md.
- Next phases (in order): P2 Home+nav shell (bottom tab bar, hamburger sheet), P3 Library+book detail, P4 Reader, P5 Search, P6 Quran, P7 Hadith (per docs/ARCHITECTURE.md §6). Prisma schema for personal data lands at Phase 8.
- Note: APK artifact intentionally absent → UI shows honest "unavailable" state everywhere; place file at public/downloads/islamic-knowledge.apk or set APK_DOWNLOAD_URL to light it up.
