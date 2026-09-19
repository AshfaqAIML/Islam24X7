# Islam24X7 Website — Complete Technical Guide for Coding Agents

> Read this file before touching any website code. It describes the full
> functionality, architecture, conventions, live integrations, and known
> limits as of September 2026. The Python knowledge-base pipeline and the
> standalone OCR module are summarized at the end; this document is about
> the **Next.js website at the repo root**.

---

## 1. What this is

Islam24X7 (`islam247.vercel.app`) is an Islamic knowledge platform: Quran
tafsir and translations, Hadith collections, a structured library, global
search, an AI research assistant stub, and an operator console for ingesting
books. **27 real volumes are live** (13 Tibyan-ul-Quran, Kanzul Iman with
Khazain-ul-Irfan, 13 Hadith volumes across Bukhari/Muslim/Tirmidhi/Ibn
Majah/Nasai) alongside clearly-labeled demo placeholders. One codebase also
feeds an installable Android app (Capacitor shell + APK release flow).

### Non-negotiable content rules

1. **Never generate, fake, or imitate** Quran verses, hadith text, rulings,
   or quotations. No fabricated chapters, page text, or citations — ever.
2. Demo/placeholder records live only in `src/lib/demo/*`, carry
   `isDemo: true`, and **must** render with the visible `DemoBadge`.
3. Real ingested volumes render with a **PDF badge** (never a Demo badge).
4. Missing backends → honest empty/unavailable states, never invented data.
5. AI answers must keep citations visually distinct from generated summaries.

---

## 2. Stack & commands

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling/UI | Tailwind CSS 4, shadcn/ui + Radix, Framer Motion, Lucide icons |
| Data | Prisma ORM → **hosted Postgres (Neon)**; TanStack Query; localStorage stores |
| Auth | NextAuth v4, credentials provider, JWT sessions (admin console only) |
| Storage | Cloudflare R2 (S3-compatible) for book files; local disk fallback in dev |
| Package mgr | Bun (`bun.lock` committed) |

```bash
bun install
bun run dev              # → http://localhost:3000 (website at repo ROOT)
bun run lint             # ESLint — must be clean
bun run build            # production build (also runs on Vercel)
bunx tsc --noEmit        # must be clean except pre-existing examples/websocket socket.io errors
bunx prisma db push      # create tables in Neon (once per database)
bun scripts/bulk-upload.ts --help      # folder ingestion CLI
bun scripts/make-admin-hash.ts <pw>    # ADMIN_PASSWORD_HASH generator (min 12 chars)
```

---

## 3. Pages (App Router)

| Route | File | What it does |
|---|---|---|
| `/` | `src/app/page.tsx` | Hero, daily dashboard (greeting, ayah, tasbeeh, continue-reading, search shortcut), phase progress, **NewArrivals** shelf (6 newest real books; renders nothing when none exist), module grid, architecture strip |
| `/library` | `src/app/library/page.tsx` | Header + "Recently added" shelf (server) + `LibraryBrowser` (client: search, language/sort selects, category chips, favorites filter, pagination) |
| `/library/[bookId]` | `src/app/library/[bookId]/page.tsx` | Detail: cover, badges (**PDF badge** vs Demo), series line, pages/language/file-size rows, **Download PDF** (primary for real books) + **Read online** (real PDFs) + Open reader (demo/text) + Ask-AI link + favorites; TOC (empty-state copy differs for real vs demo); honest provenance footer |
| `/library/[bookId]/read` | `src/app/library/[bookId]/read/page.tsx` | `?page=N` supported. Real PDFs → `PdfPageReader` (PDF.js canvas, prev/next, jump-to-page, zoom, ←/→ keys, progress saved); otherwise classic `ReaderView` (demo/text) |
| `/search` | `src/app/search/page.tsx` | `SearchView`: big search box, scope tabs (All/Books unlocked; **Quran/Hadith unlock when matching uploads exist**, else locked "Phase N" chips; Dua locked), history, result cards linking to books |
| `/ai` | `src/app/ai/page.tsx` | Ask-the-library foundation (scope: library/book/chapter). Live RAG wiring exists in `services/ai.ts`; without `AI_API_URL` returns honest 503 |
| `/download` | `src/app/download/page.tsx` | APK install page, step-by-step + availability check |
| `/admin` | `src/app/admin/page.tsx` | Redirects to `/admin/upload` |
| `/admin/upload` | `src/app/admin/upload/page.tsx` | Operator console (`UploadConsole`): drag-drop + metadata form (title*, author*, translator, category, language, description, publisher, edition, license, **series**, **volume label**, pages); direct-to-R2 upload with real progress when configured; stored-books table (download/delete/refresh, status + storage badges) |
| `/admin/login` | `src/app/admin/login/page.tsx` | Credentials form (`AdminLoginForm`), unconfigured-backend warning, `?callbackUrl` support |

`/quran` and `/hadith` **do not exist** (404). Quran/Hadith nav, tabs, and home cards intentionally link to `/library?category=tafsir` and `/library?category=hadith` until dedicated Phase 6/7 modules land.

---

## 4. API routes (`src/app/api/`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/books?q=&category=&language=&sort=&page=&pageSize=` | public | Filtered/paginated catalogue; **uploaded ready books merged first**, then demo/live |
| GET | `/api/books/:bookId` | public | One book (`upload-<id>` supported) |
| GET | `/api/books/:bookId/chapters` | public | TOC (empty for scanned uploads — no fabricated chapters) |
| GET | `/api/books/:bookId/pages?chapterId=` | public | Reader pages (demo only for now) |
| GET | `/api/search?q=&scope=` | public | Search; **always merges matching uploads** (all/books/quran→tafsir+qs/hadith scopes); reports `source: live` + unlocks scopes when uploads match |
| POST/GET | `/api/ai/ask` | public | RAG ask; 503 `connected:false` without `AI_API_URL` |
| GET | `/api/releases/latest` | public | APK metadata + live artifact availability |
| GET/POST | `/api/downloads/track` | public | Anonymous counters |
| GET | `/api/uploads?status=&series=&limit=` | public | Ingestion table (operator tooling) |
| GET | `/api/uploads/config` | public | Capability probe `{provider: r2\|local, maxFileSizeBytes: 1GB, accept[]}` — no secrets |
| POST | `/api/uploads` (multipart) | **admin** | Dev-disk fallback; **413 when R2 configured** |
| POST | `/api/uploads/presign` (JSON) | **admin** | Validates metadata, creates `uploading` row, returns presigned PUT URL |
| POST | `/api/uploads/:id/complete` | **admin** | HEAD-verifies object, enforces size cap, flips to `ready` + sets public `fileUrl` |
| GET/DELETE | `/api/uploads/:id` | GET public / DELETE **admin** | Detail / delete row + stored file (R2 object or disk) |
| GET/POST | `/api/auth/[...nextauth]` | — | Credentials login only |

---

## 5. Services — the only backend boundary

The browser calls **only our own `/api/*`**. `src/services/*` is the only
layer that touches databases, R2, or external backends:

- `books.ts` — `listBooks` (uploads head of page 1 + filters/sort applied to
  both sources; `source: live` when uploads present), `getBook`
  (`upload-` prefix aware), chapters/pages (empty for uploads, honestly).
- `search.ts` — demo in-memory search (books/chapters/pages, HTML-escaped
  `<mark>` highlights) + live KB proxy + **upload merge with real-first
  scoring** (title 40 / author 25 / series 20 / description 15).
- `uploads.ts` — `BookUpload` CRUD, `tableReady()` guard (every caller
  degrades gracefully when the DB is unreachable), `toBook()` projection
  (appends ` — Volume N`, series sentence, `fileUrl`/`fileSize`/ids passthrough).
- `kb.ts` — `kbDataSource()` (`live` iff `KNOWLEDGE_BASE_API_URL` set),
  timeout fetch. `ai.ts` — RAG `/ask` contract mapping.
- `src/types/knowledge-base.ts` — the shared domain contract (Book,
  citations, search, APK). Extend here first when shapes change.

---

## 6. Data & storage reality (live)

- **Neon Postgres** (`DATABASE_URL`, pooled): `BookUpload` rows
  (`ready` = fetchable; `uploading` = in-flight direct upload; `failed`;
  `processing` reserved). Statuses/series/volumeLabel/objectKey/storage
  columns exist — do not rename without migrating.
- **Cloudflare R2** (`S3_*`): keys `books/<series>/<date>-<slug>-<id>.pdf`,
  public downloads via `S3_PUBLIC_BASE_URL` (r2.dev). Browsers PUT directly
  via presigned URLs (15-min TTL) — **serverless functions never see file
  bytes** (Vercel's ~4.5 MB body limit is bypassed by design).
- **Local source PDFs** live in `Books/` (gitignored except
  `*-manifest.json` provenance files). The 27 live volumes total ~2.1 GB in
  R2 (well inside the 10 GB free tier).
- `db.ts` falls back to an unreachable placeholder URL when `DATABASE_URL`
  is missing so builds/imports never crash; all callers degrade gracefully.

---

## 7. Admin access (operator: moeedkamraan1123@gmail.com)

- Single-operator model: `src/lib/admin.ts` (`ADMIN_EMAIL`, default the
  address above; scrypt `ADMIN_PASSWORD_HASH`, timing-safe compare).
- `src/lib/auth.ts` (NextAuth options) → `[...nextauth]` route →
  `middleware.ts` gates **all of `/admin/*`** (except `/admin/login`) →
  `requireAdmin()` (`src/lib/require-admin.ts`) gates write APIs with 401.
- Public reads stay open (website/app need no login).
- Login UI: `AdminLoginForm` + unconfigured warning; `SignOutButton` on the
  console header. Password: local `.env` (gitignored, never commit, never
  print); rotate with `make-admin-hash.ts`.

---

## 8. Components & state map

- `layout/`: `site-header` (desktop nav + search + app buttons + mobile menu),
  `more-sheet`, `bottom-tab-bar`, `site-footer`, `theme-toggle`.
- `books/book-card.tsx`: dual rendering — real (`upload-*`/fileUrl: PDF
  badge, series line, size, download icon) vs demo (`DemoBadge`). Prop type
  is `Book & Partial<UploadedFileMeta>` (type-only import — no server code
  in the client bundle).
- `library/`: `library-browser` (URL-param-driven filters), `favorite-button`.
- `reader/`: `reader-view` (text/demo), `pdf-page-reader` (PDF.js canvas;
  worker pinned via unpkg CDN; progress → `reading-progress-store`, which
  powers Home → Continue reading → Resume with `?page=` deep links).
- `search/`: `search-view` (tabs unlock off `source`/`unavailableScopes`),
  `search-result-card` (book citations link to detail pages).
- `admin/`: `upload-console` (probes `/api/uploads/config`, picks
  presigned-direct vs multipart flow), `admin-login-form`, `sign-out-button`.
- `home/`: hero, greeting, daily-ayah, tasbeeh, continue-reading,
  search-shortcut, phase-progress, module-grid, **new-arrivals** (real-only
  shelf), design-preview. `apk/*`: prompt provider, banners, install flows.
- `common/states.tsx`: `DemoBadge`, `SoonChip`, Empty/Error/Loading states.

---

## 9. Config & environment

- `src/config/site.ts`: `routes`, `mainNav`, `tabNav`, `moduleShowcase`
  (quran/hadith entries are `live` linking to filtered library — update copy
  here when Phase 6/7 land), `buildProgress` (**stale: still says Phase 5**),
  `featureFlags.useMockData`.
- `src/config/uploads.ts`: 1 GB cap, accepted extensions, `formatBytes`.
- `src/config/storage.ts`: `s3Settings()` (all-or-nothing; no partial
  config), `storageProvider()`. `src/lib/s3.ts`: presign/HEAD/delete.
- `.env.example` documents everything: `DATABASE_URL`, `KNOWLEDGE_BASE_API_URL`,
  `AI_API_URL`, six `S3_*`, `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH`/`NEXTAUTH_SECRET`/
  `NEXTAUTH_URL`, `KB_*` (pipeline), `NEXT_PUBLIC_*` (site URL, mock flag, APK).
- `scripts/bulk-upload.ts`: folder ingestion CLI (presign→PUT→complete per
  file, `--series/--title/--author/--category/--language/--manifest`,
  filename volume detection `vol-NN`/trailing digits, **idempotent resume**:
  skips `ready`, deletes stuck rows). This ingested all 27 live volumes.

---

## 10. Deployment (Vercel project `islam247`)

- Domain `islam247.vercel.app`, linked to `AshfaqAIML/Islam24X7`, production
  branch `main`, **Root Directory empty** (website is at repo root).
- All env vars in the table above are set for production (+preview); builds
  run `postinstall: prisma generate` then `next build`.
- After merging to `main`, Vercel auto-deploys; env changes need a manual
  **Redeploy** to reach serverless functions.
- Health probes: `/api/uploads/config` → `provider:r2`; `/api/books?q=tibyan`
  → `total:13, source:live`; `/admin/upload` → login redirect.

## 11. Known limits (do not "fix" by faking data)

- Scanned PDFs contain **zero extractable text** — chapters/`pages` are empty
  for uploads; reader = page images (PDF.js) or download. Text/search/citations
  for insides of books require the OCR track (`ocr/` module + proofreading).
- Quran/Hadith *modules* (surah views, grading) are still Phase 6/7; the
  current Quran/Hadith entries are filtered-library views.
- Uploads cap 1 GB/file (Prisma `Int` ceiling ~2.1 GB — raise column type first
  if ever increasing). R2 10 GB free tier; single R2 token in use.
- `buildProgress` badge says Phase 5 — the plan file lags the shipped reality.

## 12. Working agreements

- Website code lives at repo **root** (`src/`, `prisma/`, `middleware.ts`);
  Python pipeline under `src/knowledge_base/`; OCR module under `ocr/`;
  Python tests under `tests/test_*.py`. Never mix the trees.
- Verify every change: `bunx tsc --noEmit`, `bunx eslint <files>`,
  `bunx next build`; Python: `pytest`, `ruff check`, `mypy` per repo gates.
- Feature work goes on branches → PR → merge to `main` (Vercel follows).
- Never commit `.env`, `Books/**/*.pdf` (only manifests), `db/*.db`,
  `public/uploads/`, `tool-results/`, or secrets of any kind.
