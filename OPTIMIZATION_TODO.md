# CardMagic Optimization Todo

Deployment note: beta Cloudflare deployment is intentionally paused during this optimization run. Do not run `npm run deploy:cloudflare` until the pause is lifted.

## Active Queue

- [x] P0: Make batch export use bounded-memory output streaming where the platform supports file streams.
- [x] P0: Move account set replacement toward atomic, diff-oriented persistence instead of client-side replace-all sync.
- [x] P1: Redesign the web media store around owner references and indexed pruning.
- [x] P1: Bound remote media upload/materialization caches so large data URIs are not retained indefinitely.
- [x] P1: Continue `App.tsx` decomposition into domain hooks and infrastructure modules.
- [x] P1: Reduce Oracle autocomplete payload and parse cost.
- [x] P1: Split broad frame asset manifests into lazy treatment/typeframe families.
- [x] P2: Decompose `CardPreview` into model generation plus variant renderers.
- [x] P2: Virtualize unbounded dynamic lists.
- [x] P2: Remove duplicate/dead source and enable unused-symbol hygiene.
- [x] P2: Add consistent provider timeouts/idempotency around AI edge flows.
- [x] P3: Remove string-built checkout popup DOM.

## Completed In This Run

- Added a deployment-pause note so beta Cloudflare deploy is intentionally skipped while optimization work is active.
- Deleted the unimported duplicate `src/components/card-preview 2.tsx` source file.
- Bounded remote media materialization cache memory and removed full-data-URI upload cache keys.
- Added web save-handle ZIP streaming for batch exports.
- Added IndexedDB media owner-reference indexing and cursor-based pruning.
- Extracted the web media/store persistence subsystem from `App.tsx` into `src/lib/web-media-store.ts`.
- Added client-side AI edge timeouts, request IDs, and AI credit-spend idempotency references.
- Replaced string-built Stripe checkout placeholder DOM with explicit element construction.
- Changed account set membership sync from delete-all-then-upsert to upsert-current-then-delete-stale diffing.
- Split Oracle autocomplete onto a generated 3.7 MB tuple search index and deferred the 16 MB full card database until selection.
- Reconnected card JSON, set JSON, set batch export, and randomize actions through the header share menu.
- Removed low-risk unused imports, dead aliases, orphan helpers, and a duplicate MSE borderless treatment map.
- Removed dormant frame-template storage/import/export code and disconnected manual mask-paint brush code.
- Added strict unused-symbol verification (`noUnusedLocals`/`noUnusedParameters`) and cleared the remaining strict-unused clusters.
- Replaced the community card feed's unbounded progressive render with a measured scroll-window virtualizer.
- Split MSE M15 treatment and typeframe source maps into lazy initialized family modules.
- Extracted `CardPreview` frame/treatment/color derivation into `src/components/card-preview/card-preview-model.ts`.
- Optimized community feed hydration so rows with hosted rendered images keep compact card JSON and skip remote media materialization.
- Changed community seen-state writes from page-load eager RPCs to once-per-visible-row marking through the virtualized feed window.
- Verified with `npm exec tsc -- --noEmit`, Deno Edge Function checks, and `npm run export:web`.
