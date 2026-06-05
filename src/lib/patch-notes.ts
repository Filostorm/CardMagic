export type CardMagicReleaseBranch = "beta" | "main";
export const CARDMAGIC_RELEASE_BRANCH: CardMagicReleaseBranch =
  process.env.EXPO_PUBLIC_CARDMAGIC_RELEASE_BRANCH === "main" ? "main" : "beta";

export type PatchNoteEntry = {
  version: string;
  date: string;
  title: string;
  branches?: readonly CardMagicReleaseBranch[];
  bullets: PatchNoteBullet[];
};

export type PatchNoteBullet =
  | string
  | {
      text: string;
      linkLabel: string;
      linkUrl: string;
    };

export const CARDMAGIC_PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: "3.36.29",
    date: "2026-06-05",
    title: "Shared editor production fix",
    branches: ["main"],
    bullets: [
      "Opening a shared-set card on production now preserves the full persisted card payload even when one private media field cannot be signed immediately.",
      "The editor no longer falls back to the lightweight set-grid placeholder when shared art hydration is incomplete, preventing missing text, frame, and card fields.",
      "The Cloudflare production deploy path now uses the fast Expo resolver and avoids local Git metadata scans that can stall Pages uploads.",
    ],
  },
  {
    version: "3.36.28",
    date: "2026-06-04",
    title: "Shared editor payload fallback fix",
    bullets: [
      "Opening a shared-set card now preserves the full persisted card payload even when one private media field cannot be signed immediately.",
      "The editor no longer falls back to the lightweight set-grid placeholder when shared art hydration is incomplete, preventing missing text, frame, and card fields.",
      "Shared-set card opens avoid export-only data URI materialization on mobile so editor hydration stays lighter while Supabase signed image URLs load.",
    ],
  },
  {
    version: "3.36.27",
    date: "2026-06-04",
    title: "Shared editor art URL fix",
    bullets: [
      "Shared-set editor hydration now prefers short-lived Supabase signed URLs for private owner media instead of unresolved remote-media references.",
      "The editor no longer treats a card payload as fully hydrated when art or mask fields still contain non-renderable cardmagic-remote-media references.",
      "Saving a hydrated shared-set card re-persists signed Supabase media URLs into stable remote-media references instead of storing expiring links.",
    ],
  },
  {
    version: "3.36.26",
    date: "2026-06-04",
    title: "Shared-set editor art hydration",
    bullets: [
      "Opening cards from shared collaboration sets now falls back through the collaboration set RPC when direct card access is blocked by row-level security.",
      "Shared-set editor hydration now materializes the full editable card payload and its remote art media instead of leaving the editor on a lightweight grid placeholder.",
    ],
  },
  {
    version: "3.36.25",
    date: "2026-06-04",
    title: "Set save destination fix",
    bullets: [
      "Opening a saved set card now tracks its source set separately from the currently selected set, so refreshes and set navigation no longer change the overwrite target.",
      "The header save action now opens a destination-set picker before saving, making it explicit which set receives the card.",
      "Autosave and recovery snapshots now preserve the active set-card source context for safer edits after refreshes or tab changes.",
    ],
  },
  {
    version: "3.36.24",
    date: "2026-06-04",
    title: "Mobile set loading stability",
    bullets: [
      "Two-column mobile set grids now mount fewer cards at once and use a smaller virtualization overscan window to reduce simultaneous image decodes.",
      "Set tiles on compact mobile layouts no longer auto-start missing-preview backfill renders just from scrolling into view.",
      "Shared-set cards with Supabase preview URLs now keep lightweight grid metadata in memory and fetch the full editable payload only when opened.",
    ],
  },
  {
    version: "3.36.23",
    date: "2026-06-04",
    title: "Set save art render fix",
    bullets: [
      "Saved set-card renders now materialize local browser media and Supabase media before hidden image capture.",
      "Collaboration-set saves hydrate local art references before creating the shared card row, preventing missing-art renders after saving to a set.",
      "Community and set export captures now share the same media materialization path so generated art, masks, and picked images are loadable before rasterization.",
    ],
  },
  {
    version: "3.36.22",
    date: "2026-06-03",
    title: "GPT Image 2 upgrade",
    bullets: [
      "OpenAI card-art generation now tries GPT Image 2 before older GPT Image fallbacks.",
      "OpenAI image editing now tries GPT Image 2 first for generated art edits.",
      "Existing GPT Image 1.5 and GPT Image 1 fallbacks remain available if GPT Image 2 access is unavailable for the configured API key.",
    ],
  },
  {
    version: "3.36.21",
    date: "2026-06-03",
    title: "Smarter painted mask filtering",
    bullets: [
      "Painted brush strokes now clear from the artwork preview as soon as mask generation starts.",
      "The mask normalizer now uses the full painted brush geometry instead of only sparse foreground sample points.",
      "Painted selections use a tighter inclusion mask plus negative-prompt scoring so adjacent unpainted objects are less likely to be included.",
    ],
  },
  {
    version: "3.36.20",
    date: "2026-06-03",
    title: "Wider brush mask envelope",
    bullets: [
      "Painted mask generation now uses the full brush envelope as the selection bounds instead of only the sampled foreground points.",
      "The local matte filter has a wider expansion radius so thin objects can keep their full silhouette after snapping.",
      "Foreground points still act as seeds, so the brush directs the selected subject without reducing the mask to the stroke centerline.",
    ],
  },
  {
    version: "3.36.19",
    date: "2026-06-03",
    title: "Brush mask expansion tuning",
    bullets: [
      "Painted mask selections now use the brush stroke as a seed, then expand to nearby connected matte pixels inside a controlled subject envelope.",
      "Thin selections like swords can recover their full silhouette instead of only keeping pixels directly under the brush stroke.",
      "The selection envelope still limits expansion so connected hands, cloaks, or background regions are less likely to be included.",
    ],
  },
  {
    version: "3.36.18",
    date: "2026-06-03",
    title: "Narrower brush mask selection",
    bullets: [
      "Painted mask filtering now intersects the provider matte with a stroke corridor built from the brush path.",
      "Connected foreground regions outside the painted corridor are no longer kept just because they touch the selected subject.",
      "Thin-object selections like swords now stay closer to the painted path instead of expanding into nearby hands, cloaks, or background shapes.",
    ],
  },
  {
    version: "3.36.17",
    date: "2026-06-03",
    title: "Brush mask timeout fix",
    bullets: [
      "Blank painted mask selections no longer send slow SAM geometry prompts that could timeout on mobile.",
      "Painted selections now use the provider for a candidate matte and then constrain the result locally to the brush seed.",
      "The local matte filter now clips around the foreground brush samples instead of the looser bounding box, improving thin-object selections.",
    ],
  },
  {
    version: "3.36.16",
    date: "2026-06-03",
    title: "Stricter painted mask snapping",
    bullets: [
      "Painted mask selections now use a tighter rectangular crop instead of expanding to the whole artwork.",
      "The painted brush box and foreground/background samples are scaled into the crop and sent as SAM visual prompts.",
      "Returned mattes are filtered against the original brush seed so unrelated foreground regions are rejected.",
    ],
  },
  {
    version: "3.36.15",
    date: "2026-06-03",
    title: "Painted mask memory reduction",
    bullets: [
      "Crop-first painted mask expansion now uses the recorded source dimensions instead of decoding the full original artwork a second time.",
      "This reduces mobile Safari memory pressure while expanding cropped provider results back onto the full artwork canvas.",
    ],
  },
  {
    version: "3.36.14",
    date: "2026-06-03",
    title: "Crop-first painted masking",
    bullets: [
      "Painted mask selections now crop around the brush region before calling the subject-mask provider, avoiding the full-image point/box prompt path that was timing out.",
      "Cropped mask results are expanded back onto the original artwork canvas so the generated matte still aligns with the full card art.",
      "The mask debug trace now reports the crop-first segmentation steps so stalled requests show where they stopped.",
    ],
  },
  {
    version: "3.36.13",
    date: "2026-06-03",
    title: "Visible mask diagnostics",
    bullets: [
      "Subject-mask generation now shows a visible debug trace with request mode, prompt geometry, provider steps, and failure diagnostics.",
      "The mask editor keeps the debug trace visible after failures so the stopped step can be inspected instead of only showing the final friendly error.",
    ],
  },
  {
    version: "3.36.12",
    date: "2026-06-03",
    title: "Mask editor completion control",
    bullets: [
      "The Mask tab no longer shows the duplicate bottom Done button.",
      "The Mask action row now keeps Cancel before a mask exists and changes that control to Done once a mask preview is available.",
    ],
  },
  {
    version: "3.36.11",
    date: "2026-06-03",
    title: "Longer painted mask snapping",
    bullets: [
      "Painted subject snapping now gives SAM up to two minutes before the browser aborts the request.",
      "The subject-mask Edge Function now gives fal SAM one longer inference attempt instead of short retries that could timeout before larger painted selections finish.",
      "Painted selections use a smaller prompt raster and clearer progress text to reduce mobile memory pressure while the mask is being snapped.",
    ],
  },
  {
    version: "3.36.10",
    date: "2026-06-03",
    title: "Painted mask stability",
    bullets: [
      "Painted mask generation now uses a smaller geometry request raster to reduce mobile Safari memory pressure when Generate is tapped.",
      "The mask editor now has an Undo control that removes the most recent painted brush stroke without clearing the whole selection.",
    ],
  },
  {
    version: "3.36.9",
    date: "2026-06-03",
    title: "Painted mask prompt correction",
    bullets: [
      "Painted mask selections now group foreground points, background exclusion points, and the bounding box under the same SAM object id.",
      "Paint selection now starts inactive when the mask editor opens.",
      "The redundant Snap selection action was removed because Generate now runs the painted-selection snap path directly.",
    ],
  },
  {
    version: "3.36.8",
    date: "2026-06-03",
    title: "Mask action button styling",
    bullets: [
      "The Mask panel Generate and Cancel actions now use the same compact rounded pill treatment as the other mask controls.",
      "Generate keeps the blue active styling while matching the menu's border, spacing, and typography conventions.",
    ],
  },
  {
    version: "3.36.7",
    date: "2026-06-03",
    title: "Mask generation controls",
    bullets: [
      "Painted mask selections now submit both foreground samples and a padded selection bounding box for tighter snapping on small targets like shields.",
      "The Mask panel replaces the subject compositing switch with primary Generate and Cancel actions.",
      "The duplicate bottom Generate target mask button and explanatory reminder text were removed from the mask editor.",
    ],
  },
  {
    version: "3.36.6",
    date: "2026-06-03",
    title: "Brush scroll lock",
    bullets: [
      "Mask brush mode now disables modal scrolling while the painted selection layer is active.",
      "Brush strokes keep ownership of the touch gesture so mobile Safari does not convert a selection drag into page movement.",
      "Turning off Paint selection restores normal scrolling in the mask editor.",
    ],
  },
  {
    version: "3.36.5",
    date: "2026-06-03",
    title: "Brush-based mask selection",
    bullets: [
      "Mask mode now paints a continuous translucent selection stroke over the art instead of showing separate prompt markers.",
      "Dragging in Mask mode covers the intended subject area while keeping the artwork fixed underneath the selection layer.",
      "Snap selection keeps using the painted stroke coverage as segmentation guidance, but the prompt-sampling implementation detail is no longer exposed in the editor UI.",
    ],
  },
  {
    version: "3.36.4",
    date: "2026-06-03",
    title: "Rough-select mask snapping",
    bullets: [
      "Mask mode now rough-selects subjects without dragging the artwork underneath the selection layer.",
      "Rough selections are sampled into SAM foreground point prompts instead of collapsed into a single bounding box.",
      "The mask editor now exposes a Snap selection action so one or more rough subject strokes can be sent for a cleaner cut mask.",
    ],
  },
  {
    version: "3.36.3",
    date: "2026-06-03",
    title: "Mask editor brush restore",
    bullets: [
      "The mask editor now uses direct alpha-matte editing again instead of converting painted strokes into a coarse SAM box prompt.",
      "Mask mode restores Add, Erase, Smart add, and Smart erase controls for local brush and connected-region editing.",
      "Editing an existing matte re-enables subject-mask compositing and clears stale per-subject component toggles.",
    ],
  },
  {
    version: "3.36.2",
    date: "2026-06-03",
    title: "Magic-style set ordering",
    bullets: [
      "Cards inside saved sets now sort by Magic-style collector order: W/U/B/R/G monocolor, multicolor, colorless and artifacts, nonbasic lands, then basic lands.",
      "Set collector numbers are reassigned after sorting so set grids and exports use the same deterministic order.",
      "Cards in the same collector bucket continue to break ties alphabetically, then by saved time and snapshot id.",
    ],
  },
  {
    version: "3.36.1",
    date: "2026-06-03",
    title: "Set card memory reduction",
    bullets: [
      "Set thumbnails loaded from local IndexedDB now use revocable Blob object URLs instead of base64 data URIs, reducing JavaScript heap pressure while scrolling.",
      "Compact mobile set grids now mount fewer overscan rows and expose fewer cards per batch to reduce simultaneous image decode pressure in Safari.",
      "Set-card image resources are released when virtualized cards scroll out of the mounted window.",
    ],
  },
  {
    version: "3.36.0",
    date: "2026-06-03",
    title: "Painted subject mask snapping",
    bullets: [
      "The mask editor now includes a Paint subject tool for brushing a rough object selection directly over the art preview.",
      "Painted selections are converted into SAM box prompts so CardMagic can snap the rough brush region to a cleaner subject edge.",
      "The existing targeted mask prompt can be combined with a painted selection for more constrained segmentation.",
    ],
  },
  {
    version: "3.35.7",
    date: "2026-06-03",
    title: "Version refresh prompt",
    bullets: [
      "CardMagic now checks the active release branch for a newer deployed version while the app is open.",
      "Users running an older bundle are prompted to refresh to the current beta or production URL.",
      "Dismissing the prompt suppresses only that specific newer version, so future releases can prompt again.",
    ],
  },
  {
    version: "3.35.6",
    date: "2026-06-03",
    title: "Set preview loading states",
    bullets: [
      "Set-card preview tiles now show a simple spinner while thumbnail lookup, render, cache, upload, or URL persistence is progressing.",
      "Set-card preview diagnostics now appear only after a failure, showing the pipeline step that stopped and the error detail.",
      "Cards with local previews that are still uploading now keep the rendered card visible with a compact spinner overlay instead of status text.",
    ],
  },
  {
    version: "3.35.5",
    date: "2026-06-03",
    title: "Full-quality JPEG previews",
    bullets: [
      "Persistent set and feed preview renders now use 100% JPEG quality for every upload attempt.",
      "The preview encoder may still reduce render width when a full-quality image exceeds the Supabase object-size limit.",
    ],
  },
  {
    version: "3.35.4",
    date: "2026-06-03",
    title: "JPEG preview default",
    bullets: [
      "Persistent set and feed preview uploads now default to the bounded JPEG encoder instead of the lossless PNG upload path.",
      "Native preview rendering no longer falls back to raw PNG uploads when compression cannot produce a Storage-safe image.",
      "Lossless PNG rendering remains reserved for explicit card download/export actions.",
    ],
  },
  {
    version: "3.35.3",
    date: "2026-06-03",
    title: "Set preview compression",
    bullets: [
      "Web set and feed preview uploads now encode high-detail full-art cards as bounded high-quality JPEG blobs instead of oversized lossless PNG payloads.",
      "Set preview caching now writes the compressed Blob directly to IndexedDB, reducing base64 memory pressure during mobile Safari renders.",
      "Manual PNG export still uses the full CardMagic PNG exporter, so downloaded card images are unchanged.",
    ],
  },
  {
    version: "3.35.2",
    date: "2026-06-03",
    title: "Production collaboration release",
    branches: ["beta", "main"],
    bullets: [
      "Production now includes creator-only set deletion, so collaborators can edit and add cards but cannot delete shared sets or remove set cards they do not own.",
      "Set invite links now open a confirmation prompt, support sign-in before acceptance, and notify the set owner when a collaborator joins.",
      "Shared sets now expose a read-only collaborator roster to editors while keeping invite creation and pending-invite controls owner-only.",
      "Invite-link creation, manual copying, and Supabase invite SQL handling have been hardened for mobile Safari and Supabase RPC ambiguity.",
    ],
  },
  {
    version: "3.35.1",
    date: "2026-06-03",
    title: "Invite link SQL fix",
    bullets: [
      "Fixed the Supabase invite preview and redemption RPCs so their set_id output column no longer conflicts with table columns.",
      "Invite links should now open the collaboration prompt without the ambiguous-column database error.",
    ],
  },
  {
    version: "3.35.0",
    date: "2026-06-03",
    title: "Set invite acceptance flow",
    bullets: [
      "Opening a set invite link now shows an explicit collaboration invite prompt instead of auto-joining silently.",
      "Signed-out invitees can open sign-in or account creation from the invite prompt, then accept the stored invite after authentication.",
      "When someone accepts an invite link, the set owner now receives a collaboration-joined notification in the account Notifications section.",
    ],
  },
  {
    version: "3.34.9",
    date: "2026-06-03",
    title: "Invite link copying",
    bullets: [
      "The set invite link button now creates the URL first, then changes into a separate Copy link action so browser clipboard access happens on its own tap.",
      "Generated invite URLs now render in a read-only text field instead of a truncated label, making the full link manually selectable when clipboard access is blocked.",
    ],
  },
  {
    version: "3.34.8",
    date: "2026-06-03",
    title: "Collaborator roster access",
    bullets: [
      "Invite-link creation no longer fails visually when Safari blocks clipboard access after the Supabase invite token is created.",
      "Shared sets now show a read-only collaborator roster button instead of an invite button.",
      "Pending invites and invite-link controls remain restricted to the set creator.",
    ],
  },
  {
    version: "3.34.7",
    date: "2026-06-03",
    title: "Shared set invite controls",
    bullets: [
      "Collaborator-owned shared sets no longer show the invite button in the Saved Sets header.",
      "The collaborator invite panel is now creator-gated, so shared set editors cannot open direct invites or copy invite links for sets they do not own.",
    ],
  },
  {
    version: "3.34.6",
    date: "2026-06-03",
    title: "Creator-only set deletion",
    bullets: [
      "Collaborators no longer see set deletion controls for shared sets they did not create.",
      "Per-card remove controls are hidden from collaborator edit mode unless the current user is the set creator.",
      "Supabase deletion policies now require the set creator for set membership deletion and protect shared-set card rows from non-creator deletion.",
    ],
  },
  {
    version: "3.34.5",
    date: "2026-06-03",
    title: "Production set preview release",
    branches: ["beta", "main"],
    bullets: [
      "Set and feed preview uploads now use the CardMagic PNG exporter path again for web renders.",
      "Shared set cards preserve collaborator-owned art, reuse stored Supabase previews, and avoid automatic rerenders while scrolling.",
      "Set collaboration invite links, cached collaborator sets, and Supabase-backed preview URL repair are included in the production release.",
    ],
  },
  {
    version: "3.34.4",
    date: "2026-06-03",
    title: "PNG preview exporter restored",
    bullets: [
      "Web set and feed preview uploads now use the CardMagic PNG exporter again instead of the JPEG Blob encoder.",
      "The upload status now reports PNG capture explicitly so failed previews identify the exporter path being used.",
      "PNG previews still run through the Supabase object-size guard before upload.",
    ],
  },
  {
    version: "3.34.3",
    date: "2026-06-03",
    title: "Mobile preview render rollback",
    bullets: [
      "Set and feed preview uploads now use the lower-memory 750px compression profile again.",
      "The larger 1000px preview capture from the previous beta was rolled back because mobile Safari could fail during canvas encoding.",
      "Supabase uploads still use bounded JPEG blobs and client-side size checks to avoid oversized Storage objects.",
    ],
  },
  {
    version: "3.34.2",
    date: "2026-06-03",
    title: "Sharper set previews",
    bullets: [
      "Set and feed card previews now render at a larger 1000px capture width before upload.",
      "The Supabase preview compressor now starts at higher JPEG quality and only steps down gradually when a card would exceed the Storage object-size limit.",
      "Stored set images should preserve readable card text while still avoiding oversized uploads on mobile browsers.",
    ],
  },
  {
    version: "3.34.1",
    date: "2026-06-03",
    title: "Set image upload stability",
    bullets: [
      "Set and feed preview uploads now use bounded JPEG blobs instead of oversized lossless PNG data URIs.",
      "Rendered set images are compressed before upload and rejected locally if they would exceed the Supabase Storage object-size limit.",
      "The shared card image bucket now accepts JPEG uploads while preserving existing PNG support.",
    ],
  },
  {
    version: "3.34.0",
    date: "2026-06-03",
    title: "Set invite links",
    bullets: [
      "Set owners can now copy a collaboration invite link from the set collaborator panel.",
      "Invite links store their set invite token in the browser so a new user can sign up and automatically join the shared set afterward.",
      "Invite redemption now runs through authenticated Supabase RPCs with token validation, RLS-protected invite storage, and automatic shared-set refresh after joining.",
    ],
  },
  {
    version: "3.33.46",
    date: "2026-06-03",
    title: "Shared set edit renders",
    bullets: [
      "Opening or refreshing a shared-set card now fetches the full editable Supabase card payload instead of using the compact thumbnail grid snapshot.",
      "Shared-set preview refreshes no longer capture black renders just because the grid payload stripped large inline art data.",
      "Cards saved into collaborator-owned sets now create or update the shared card row before rendering so the uploaded preview attaches to the canonical set card.",
      "Shared sets with only a small number of missing preview URLs can backfill those previews automatically without re-rendering an entire older set.",
    ],
  },
  {
    version: "3.33.45",
    date: "2026-06-03",
    title: "Shared set hydration guard",
    bullets: [
      "Shared collaboration sets now preserve cached cards when a transient card-detail hydration failure occurs during refresh.",
      "Initial account sync loads the collaborator-set cache before requesting shared card details so fallback rows are available immediately.",
      "Shared-set refresh no longer replaces a previously hydrated collaborator set with an empty grid when the dashboard still reports cards.",
    ],
  },
  {
    version: "3.33.44",
    date: "2026-06-03",
    title: "Card image URL retention",
    bullets: [
      "Remote set sync now preserves an existing cards.image_url when the local saved-card snapshot does not currently carry a renderedImageUrl.",
      "Previously uploaded set renders are backfilled into null card image_url fields from their canonical Supabase Storage objects.",
      "Set-card render uploads are less likely to become orphaned Storage objects after a later account-set synchronization.",
    ],
  },
  {
    version: "3.33.43",
    date: "2026-06-03",
    title: "Stored set preview reuse",
    bullets: [
      "Shared-set tiles now trust existing canonical Supabase Storage renders even when the card row timestamp was advanced by a later sync.",
      "Stored set-card images use the object's own last-modified timestamp for cache busting instead of treating the row updated_at value as render freshness.",
      "Collaboration sets no longer fall back to Preview missing just because cards.image_url is null while the set-scoped PNG already exists.",
    ],
  },
  {
    version: "3.33.42",
    date: "2026-06-03",
    title: "Collaborator media access",
    bullets: [
      "Fixed the Supabase Storage policy that authorized collaborator reads for another user's private card art and mask media.",
      "Shared-set editors can now hydrate owner-backed card art from cardmagic-user-media instead of failing when the media path belongs to another account.",
      "The policy fix is recorded in a migration so collaborator media access remains reproducible outside the live beta database.",
    ],
  },
  {
    version: "3.33.41",
    date: "2026-06-03",
    title: "Shared set Supabase previews",
    bullets: [
      "Collaboration-set cards with existing Supabase image_url values now stay on the compact thumbnail path instead of hydrating full editable media for the set grid.",
      "Shared-set thumbnail auto-loading now stops after Supabase URL lookup and no longer falls through to hidden PNG rendering during normal scrolling.",
      "Manual per-card Refresh still forces a preview rerender when a collaborator intentionally repairs or replaces a missing saved image.",
    ],
  },
  {
    version: "3.33.40",
    date: "2026-06-02",
    title: "Mobile set card loading",
    bullets: [
      "Expanded set grids now virtualize card thumbnail mounting so offscreen cards reserve their slots without decoding images.",
      "Set thumbnails no longer resolve stored media references or enqueue preview renders until their row is near the viewport.",
      "Web set-card thumbnails now prefer disk caching over memory-plus-disk caching to reduce iOS Safari tab-process memory pressure.",
    ],
  },
  {
    version: "3.33.39",
    date: "2026-06-02",
    title: "Shared set card attribution",
    bullets: [
      "Shared-set card snapshots now retain the original card author's display name during hydration and cache repair.",
      "Set-card thumbnail renders now use the card author's name for the printed footer instead of the current viewer's account name.",
      "Viewer-triggered preview backfills no longer rebrand collaborator cards in shared sets.",
    ],
  },
  {
    version: "3.33.38",
    date: "2026-06-02",
    title: "Set preview art capture readiness",
    bullets: [
      "Set-card preview rendering now preloads editable art and mask images before hidden PNG capture.",
      "The capture path waits an additional paint frame after image readiness so large embedded art does not export as a blank art aperture.",
      "Uploaded set-preview URLs now use the actual upload timestamp as their cache-buster instead of the older card saved timestamp.",
    ],
  },
  {
    version: "3.33.37",
    date: "2026-06-02",
    title: "Existing set preview reuse",
    bullets: [
      "Set cards with an existing Supabase cards.image_url now attach that stored preview without comparing it against row updated_at.",
      "Normal set scrolling no longer recaptures and reuploads previews just because the card row was rehydrated after the image was created.",
      "The set-card render status now distinguishes an attached existing card image_url from a newly uploaded preview.",
    ],
  },
  {
    version: "3.33.36",
    date: "2026-06-02",
    title: "Shared set missing preview backfill",
    bullets: [
      "Shared editor sets now auto-render cards only when the card has no preview image at all.",
      "Cards that already have a Supabase preview URL still skip automatic rerendering during normal set scrolling.",
      "The fallback state no longer traps missing shared previews behind a manual Refresh action.",
    ],
  },
  {
    version: "3.33.35",
    date: "2026-06-02",
    title: "Shared set render throttling",
    bullets: [
      "Editor-accessible collaboration sets no longer auto-rerender every missing preview during normal set scrolling.",
      "Shared set tiles can still attach existing Supabase preview URLs, but background PNG capture is deferred for collaborator-owned sets.",
      "Saving a card and pressing a card's Refresh preview action still perform the explicit full-quality render path.",
    ],
  },
  {
    version: "3.33.34",
    date: "2026-06-02",
    title: "Editor set art hydration target",
    bullets: [
      "Collaboration-set card loading now applies editable art hydration to the editor-accessible set RPC.",
      "Public community set browsing stays on the compact preview-card path so viewers do not hydrate full edit media unnecessarily.",
      "The beta version was advanced again so the corrected collaboration hydration target is cache-distinct from the prior beta build.",
    ],
  },
  {
    version: "3.33.33",
    date: "2026-06-02",
    title: "Collaboration edit art hydration",
    bullets: [
      "Opening cards from collaboration sets now hydrates editable Supabase media references instead of using preview-only card payloads.",
      "Community feed cards remain compact, while editor-accessible shared set cards keep the art data needed for editing.",
      "Shared set card previews still use the cached rendered image URL, but tapping a card now preserves its editable art.",
    ],
  },
  {
    version: "3.33.32",
    date: "2026-06-02",
    title: "Frame sheet grid width",
    bullets: [
      "The frame preview sheet now has enough horizontal content width for three frame tiles per row.",
      "Frame menu sizing now derives from explicit grid column math instead of an undersized base width.",
      "The frame sheet keeps the same preview tile size while avoiding the unintended two-column layout on desktop.",
    ],
  },
  {
    version: "3.33.31",
    date: "2026-06-02",
    title: "Frame sheet edit menu",
    bullets: [
      "Restored Frame to the card edit menu so the frame sheet can be opened from the pencil menu again.",
      "The standalone palette frame shortcut remains available on the floating preview toolbar.",
      "Frame editing continues to use the existing frame sheet controls for treatment, showcase, type frame, and frame color selection.",
    ],
  },
  {
    version: "3.33.30",
    date: "2026-06-02",
    title: "Set identity row cleanup",
    bullets: [
      "Removed the trailing Save button from the set name and set-code row.",
      "Set identity edits still save through the existing header edit/save toggle or the keyboard done action.",
      "The set name and set-code fields now have more horizontal room in edit mode.",
    ],
  },
  {
    version: "3.33.29",
    date: "2026-06-02",
    title: "Preview refresh upload fix",
    bullets: [
      "Forced set-card preview refreshes no longer report Upload skipped after a successful local capture.",
      "The refresh pipeline now updates its in-memory set snapshot immediately when a newly rendered local image is attached.",
      "Upload guard logic now tolerates the old saved image URL during the forced-refresh handoff from capture to Supabase upload.",
    ],
  },
  {
    version: "3.33.28",
    date: "2026-06-02",
    title: "Art style descriptions",
    bullets: [
      "The art generator now shows a short description for the currently selected art style.",
      "Style descriptions are stored with the art-style presets so the selector and prompt metadata stay synchronized.",
      "The style pills keep their compact layout while the selected style explains the expected visual treatment below.",
    ],
  },
  {
    version: "3.33.27",
    date: "2026-06-02",
    title: "Native delete confirmation",
    bullets: [
      "Set-card removal now uses a red destructive X treatment in edit mode.",
      "Web delete confirmations now include the confirmation title in the native browser dialog.",
      "The per-card refresh button remains immediate and confirmation-free.",
    ],
  },
  {
    version: "3.33.26",
    date: "2026-06-02",
    title: "Direct preview refresh",
    bullets: [
      "Per-card Refresh preview in set edit mode now starts immediately without a confirmation dialog.",
      "Forced preview refreshes now bypass existing Supabase image URL hydration so they actually re-render the selected card.",
      "Refresh status now advances into capture and upload instead of re-attaching the stale saved preview URL.",
    ],
  },
  {
    version: "3.33.25",
    date: "2026-06-02",
    title: "AI prompt CORS repair",
    bullets: [
      "AI prompt requests no longer send the extra request-id HTTP header that older deployed Edge Function CORS policies rejected.",
      "The client still includes its request id in the JSON body for server-side idempotency and diagnostics.",
      "Rules-text fixing and image generation requests can now pass browser preflight against the current Supabase function deployment.",
    ],
  },
  {
    version: "3.33.24",
    date: "2026-06-02",
    title: "Deployment output hardening",
    bullets: [
      "Beta and production Cloudflare exports now build into fresh temporary directories instead of repeatedly mutating the repo-local dist folder.",
      "The deploy pipeline now removes temporary export output after publishing so stale duplicate build artifacts are less likely to accumulate.",
      "Cloudflare output cleanup now accepts the controlled temporary export path while still rejecting unexpected directories.",
    ],
  },
  {
    version: "3.33.23",
    date: "2026-06-02",
    title: "Per-card preview refresh",
    bullets: [
      "Set edit mode now exposes Refresh preview on each saved-card tile instead of only offering a full-set refresh.",
      "Per-card refreshes force a full-quality re-render for the selected card and overwrite only that card's Supabase preview image.",
      "The refresh action continues to use the bounded set-preview render and upload queue to avoid parallel upload memory spikes.",
    ],
  },
  {
    version: "3.33.22",
    date: "2026-06-02",
    title: "Art loading repair",
    bullets: [
      "Set-card editing now lazily hydrates compact Supabase media references so art appears when opening saved or shared cards.",
      "The hidden set-card renderer now materializes remote art before capture, restoring preview refreshes for cards backed by Supabase media.",
      "Saved preview uploads now rewrite the editable card payload with persisted media references instead of updating only the rendered image URL.",
    ],
  },
  {
    version: "3.33.21",
    date: "2026-06-02",
    title: "Set preview refresh",
    bullets: [
      "Set edit mode now includes a Refresh previews action for replacing old low-quality saved card renders.",
      "Forced set-preview refreshes bypass existing Supabase image URLs, re-render with the current full-quality renderer, and overwrite the canonical Storage image.",
      "Refreshed preview URLs now get a new cache-busting version stamp so browsers load the replacement image immediately.",
    ],
  },
  {
    version: "3.33.20",
    date: "2026-06-02",
    title: "Expanding rules sheet editor",
    bullets: [
      "The rules-text editor in the sheet now grows for soft-wrapped lines instead of only expanding for explicit line breaks.",
      "Shared sheet text editors now use the rendered input width to reserve enough vertical space for long rules and flavor text.",
    ],
  },
  {
    version: "3.33.19",
    date: "2026-06-02",
    title: "Shared set memory hardening",
    bullets: [
      "Collaboration-set cache hydration now keeps shared card payloads compact instead of expanding local media references into inline image data.",
      "Oversized legacy collaboration caches are skipped and rewritten so iOS Safari does not repeatedly deserialize bloated set payloads.",
      "Set-card thumbnail prefetching is disabled on web and capped on native to reduce duplicate image-cache pressure during long set scrolling.",
    ],
  },
  {
    version: "3.33.18",
    date: "2026-06-02",
    title: "Set collaboration and render cache release",
    branches: ["beta", "main"],
    bullets: [
      "Collaborative sets now load from a per-account local cache before Supabase revalidates them, so the Sets tab can show shared workspaces immediately after sign-in.",
      "Set-card saves now render full-quality card images, upload them to canonical set/card Storage paths, and re-render when saved card data changes.",
      "Public shared-set viewers can backfill missing card renders through set-scoped Storage and RPC authorization without creating duplicate per-viewer images.",
    ],
  },
  {
    version: "3.33.17",
    date: "2026-06-02",
    title: "Public set image backfill",
    bullets: [
      "Public shared-set viewers can now persist backfilled card renders to the canonical set/card Storage path.",
      "Set-card image uploads now validate the Storage path against an actual card in that set before allowing the write.",
      "The set-card image URL attach path now accepts authorized public backfills while still rejecting unrelated cards.",
    ],
  },
  {
    version: "3.33.16",
    date: "2026-06-02",
    title: "Canonical set renders",
    bullets: [
      "Set-card saves now render full-quality card images before uploading them for future set and feed viewing.",
      "Shared-set backfills now upload to a canonical set/card Storage path instead of creating duplicate per-viewer images.",
      "Editing and overwriting a saved set card clears the prior rendered image so the updated card is re-rendered and reattached.",
    ],
  },
  {
    version: "3.33.15",
    date: "2026-06-02",
    title: "Shared preview backfill",
    bullets: [
      "Shared set viewers can now backfill missing card preview thumbnails to Supabase through a set-scoped authorization path.",
      "Set cards now probe saved thumbnail URLs concurrently before entering the expensive render queue.",
      "Existing Storage thumbnail checks now inspect all legacy candidate IDs for a card in one bounded batch.",
    ],
  },
  {
    version: "3.33.14",
    date: "2026-06-02",
    title: "Shared set thumbnail reliability",
    bullets: [
      "Shared collaboration set card loads are now isolated per set so one failed card query does not block the rest of the shared set list.",
      "Shared set thumbnails now resolve against the actual remote card row and card owner instead of the signed-in viewer account.",
      "Cards from other collaborators now render local thumbnails without attempting unauthorized Supabase image_url writes.",
    ],
  },
  {
    version: "3.33.13",
    date: "2026-06-02",
    title: "Faster thumbnail URL checks",
    bullets: [
      "Set-card thumbnails now query the individual Supabase card image_url before waiting for full account-set hydration.",
      "Thumbnail backfill now continues to the canonical Storage check and render fallback instead of stalling on a global sync gate.",
      "Remote thumbnail check failures now fall through to local rendering instead of leaving set tiles stuck in a failed preflight state.",
    ],
  },
  {
    version: "3.33.12",
    date: "2026-06-02",
    title: "Storage thumbnail preflight",
    bullets: [
      "Set thumbnail backfill now checks the canonical Supabase Storage object before rendering a replacement image.",
      "Existing Storage thumbnails are attached locally and used to repair the saved card image_url instead of being re-uploaded.",
      "Set-card thumbnail tiles now retry after account-set hydration completes so Supabase image checks do not stall.",
    ],
  },
  {
    version: "3.33.11",
    date: "2026-06-02",
    title: "Post-save thumbnail readiness",
    bullets: [
      "Newly saved set cards now use the same Supabase thumbnail hydration gate as refreshed set cards before starting image backfill.",
      "Signed-in thumbnail backfill now avoids getting stuck in the remote-checking state after saving a card when account sets are already hydrated.",
    ],
  },
  {
    version: "3.33.10",
    date: "2026-06-02",
    title: "Canonical set thumbnails",
    bullets: [
      "Saved set thumbnails now wait for Supabase image_url hydration before starting any fallback render.",
      "Existing local thumbnail PNGs are now promoted directly to Supabase instead of being re-rendered after sign-in or refresh.",
      "Set thumbnail uploads now use one canonical saved-card storage key, reducing duplicate Supabase image objects across set views.",
    ],
  },
  {
    version: "3.33.9",
    date: "2026-06-02",
    title: "Thumbnail refresh retention",
    bullets: [
      "Set thumbnail hydration now uses the Supabase card row update time so saved image URLs survive account-set merges after refresh.",
      "Set-card merging now preserves a publishable rendered thumbnail URL separately from the freshest editable card JSON.",
      "Queued thumbnail renders now stop before rasterizing when a saved thumbnail URL arrives while the card is waiting in the render queue.",
    ],
  },
  {
    version: "3.33.8",
    date: "2026-06-02",
    title: "Thumbnail upload memory cap",
    bullets: [
      "Set thumbnail backfill now caps active plus queued upload payloads at three to avoid retaining too many PNG blobs in mobile browsers.",
      "The thumbnail renderer now waits for an upload payload slot before capturing another PNG when the upload pipeline is saturated.",
      "Set thumbnail status now shows when a card is waiting for an upload slot instead of continuing to allocate more upload bodies.",
    ],
  },
  {
    version: "3.33.7",
    date: "2026-06-02",
    title: "Parallel thumbnail uploads",
    bullets: [
      "Set thumbnail rendering now continues after the local PNG is cached instead of waiting for Supabase upload and URL persistence.",
      "Saved set thumbnails now upload and persist to Supabase through a bounded background worker pool with up to three concurrent network writes.",
      "Background thumbnail uploads now skip stale saved-card snapshots so an older render cannot overwrite a newer card version.",
    ],
  },
  {
    version: "3.33.6",
    date: "2026-06-02",
    title: "Set thumbnail URL retention",
    bullets: [
      "Saved-card normalization now preserves rendered thumbnail URLs instead of erasing them after Supabase upload.",
      "Set thumbnail tiles can now display the image URL carried by the render status while the saved-card snapshot state catches up.",
      "Set thumbnail image load failures now show an explicit loader error instead of silently leaving the fallback card visible.",
    ],
  },
  {
    version: "3.33.5",
    date: "2026-06-02",
    title: "Set thumbnail render diagnostics",
    bullets: [
      "Set card placeholders now show live thumbnail render phases such as queued, loading assets, capturing PNG, uploading, persisting, or failed.",
      "Thumbnail failures now surface a short diagnostic message in the tile instead of looking identical to a pending render.",
      "Rendered thumbnail URLs now attach by stable saved-card identity instead of comparing the entire card JSON payload.",
    ],
  },
  {
    version: "3.33.4",
    date: "2026-06-02",
    title: "Shared set thumbnail backfill",
    bullets: [
      "First-load set thumbnail generation now writes the uploaded public image URL directly to the Supabase card row.",
      "Local-only set thumbnails can now be promoted to shared public image URLs after sign-in instead of blocking future backfill.",
      "Pending set-card tiles now issue a stable render request even when the set grid rerenders while the thumbnail is waiting.",
    ],
  },
  {
    version: "3.33.3",
    date: "2026-06-02",
    title: "Local set thumbnail persistence",
    bullets: [
      "Set thumbnail backfill now stores the rendered PNG locally first, so saved cards can display images without waiting for Supabase upload.",
      "Local thumbnail references now resolve from IndexedDB before rendering through the image component.",
      "Failed thumbnail renders are retryable instead of permanently blocking that card's backfill key.",
    ],
  },
  {
    version: "3.33.2",
    date: "2026-06-02",
    title: "Set thumbnail render backfill",
    bullets: [
      "Pending set cards now request a one-at-a-time thumbnail backfill when their tile becomes visible.",
      "Saved set thumbnails now use a lightweight 320px render path instead of the export-quality 750px capture that could exhaust mobile browser memory.",
      "Set thumbnail rendering now skips web export mask flattening so saving a card does not trigger the heaviest PNG export workflow.",
    ],
  },
  {
    version: "3.33.1",
    date: "2026-06-02",
    title: "Set thumbnail memory fix",
    bullets: [
      "Set grids now render saved-card thumbnails from cached PNG assets only, instead of falling back to live card previews while scrolling.",
      "Saved set thumbnail URLs are prefetched once per URL and reused through the image cache to reduce repeated network decodes.",
      "Cards without a generated thumbnail now show a lightweight Render pending placeholder until the saved-card render completes.",
    ],
  },
  {
    version: "3.33.0",
    date: "2026-06-02",
    title: "Rendered set card thumbnails",
    bullets: [
      "Cards saved to account sets now render and upload a cached PNG thumbnail while retaining the card JSON payload for editing.",
      "Set grids now prefer the cached rendered card image and fall back to live card rendering only when no image has been generated yet.",
      "Remote set persistence now preserves card image URLs instead of overwriting them with null during account synchronization.",
    ],
  },
  {
    version: "3.32.7",
    date: "2026-06-02",
    title: "Legacy artist fallback normalization",
    bullets: [
      "Cards that still carry the old Local Artist placeholder now render and export as Unknown Artist.",
      "Random card generation now treats the old placeholder as a legacy default instead of preserving it.",
    ],
  },
  {
    version: "3.32.6",
    date: "2026-06-02",
    title: "Default artist attribution",
    bullets: [
      "New cards now default to Unknown Artist instead of Local Artist when no artist attribution has been provided.",
      "Printed footer fallbacks also use Unknown Artist for cards with blank artist metadata.",
    ],
  },
  {
    version: "3.32.5",
    date: "2026-06-02",
    title: "Shared set loading crash fix",
    bullets: [
      "Shared sets now progressively render expanded cards in small batches instead of mounting every card preview at once.",
      "Large public sets are less likely to exhaust mobile browser memory when opened from the Community Sets directory.",
    ],
  },
  {
    version: "3.32.4",
    date: "2026-06-02",
    title: "Community card loading stability",
    bullets: [
      "Community feed card rows now reserve the full card preview height before hosted card images finish decoding.",
      "Expanded set card previews keep a full-size loading placeholder so card slots no longer collapse into a partial strip before the render appears.",
    ],
  },
  {
    version: "3.32.3",
    date: "2026-06-02",
    title: "Beta cache header correction",
    bullets: [
      "Static beta web assets keep immutable cache headers while the app HTML shell remains uncached.",
      "Beta deploy verification now confirms stale entry bundles are removed from the Cloudflare payload before upload.",
    ],
  },
  {
    version: "3.32.2",
    date: "2026-06-02",
    title: "Beta crash hardening",
    bullets: [
      "Beta exports now clear the Cloudflare output directory before building so stale hashed web bundles are not redeployed.",
      "The web app shell now uses no-store cache headers so mobile browsers fetch the latest beta HTML instead of reusing an older shell.",
    ],
  },
  {
    version: "3.32.1",
    date: "2026-06-02",
    title: "Token title spacing",
    bullets: [
      "Card titles no longer reserve mana-symbol space when the current face has no mana cost symbols.",
      "Empty mana-cost hit areas now collapse with the title layout so token names can use the full title plate.",
    ],
  },
  {
    version: "3.32.0",
    date: "2026-06-02",
    title: "Set viewer notifications",
    branches: ["beta", "main"],
    bullets: [
      "Community follows now subscribe viewers to individual sets instead of creator accounts.",
      "The community set directory now shows viewer counts and lets signed-in users follow or stop viewing each set.",
      "The account tab now includes notifications for followed-set card additions and for viewers following your sets.",
    ],
  },
  {
    version: "3.31.3",
    date: "2026-06-02",
    title: "Release process guardrails",
    branches: ["beta", "main"],
    bullets: [
      "Release verification now blocks Cloudflare deploys when the current app version has no branch-visible patch-note entry.",
      "Production deploys now publish to the canonical Pages production slot and refresh the main release metadata row after deployment.",
      "Beta deploys now refresh the beta release metadata row after deployment so in-app branch links stay current.",
    ],
  },
  {
    version: "3.31.2",
    date: "2026-06-02",
    title: "Feed rendering optimization",
    branches: ["beta", "main"],
    bullets: [
      "Community feed rows with hosted rendered images now keep compact card JSON instead of hydrating unused remote media payloads.",
      "Cards are now marked as seen when they enter the virtualized visible feed window instead of when a page of results is fetched.",
      "Feed seen-state writes are deduplicated per card to reduce redundant account-sync traffic during scrolling.",
    ],
  },
  {
    version: "3.31.1",
    date: "2026-06-02",
    title: "App architecture decomposition",
    bullets: [
      "Moved the patch-note registry and patch-notes modal out of the root App component into dedicated release-note modules.",
      "Moved browser DOM guard hooks and the live generation-button timer label into reusable infrastructure modules.",
      "Moved the early-access code modal into its own component while preserving the existing clipboard fallback behavior.",
    ],
  },
  {
    version: "3.31.0",
    date: "2026-06-02",
    title: "Remote media sync",
    bullets: [
      "Account sync now uploads inline card art, masks, watermarks, and custom set symbols into a private Supabase Storage media bucket before saving card JSON.",
      "Synced card and symbol rows now store compact remote media references and hydrate them back into renderable image URIs when account or collaboration data loads.",
      "Collaborative sets can read set-scoped media and owner account media through Storage RLS policies instead of relying on oversized database payloads.",
    ],
  },
  {
    version: "3.30.53",
    date: "2026-06-02",
    title: "Media persistence and batch export",
    bullets: [
      "Web saves now persist user media in a dedicated IndexedDB Blob store and keep compact media references in saved JSON payloads.",
      "The media store deduplicates repeated autosaves by content hash and prunes old unreferenced records after the store grows.",
      "Batch set export now captures web PNGs as Blobs, clears the hidden render surface between cards, and streams zip output to a picked file when the browser supports it.",
    ],
  },
  {
    version: "3.30.52",
    date: "2026-06-02",
    title: "AI credit debiting",
    bullets: [
      "Paid AI image, edit, and subject-mask requests now debit credits inside Supabase before provider calls run.",
      "Failed paid AI provider calls now refund the server ledger entry instead of leaving a spent-credit mismatch.",
      "The app now reconciles AI credit and XP changes from the server response before recording local achievement events.",
    ],
  },
  {
    version: "3.30.51",
    date: "2026-06-02",
    title: "AI endpoint hardening",
    bullets: [
      "AI image, edit, rules-text, and subject-mask requests now require a signed-in account before reaching the paid Edge functions.",
      "AI Edge functions now reject oversized request bodies and unsupported image options before calling provider APIs.",
      "Stripe checkout now verifies Supabase access tokens with Supabase Auth instead of trusting decoded token payloads.",
      "Oracle card autocomplete now avoids full-result sorting on every search keystroke.",
    ],
  },
  {
    version: "3.30.50",
    date: "2026-06-02",
    title: "Main deployment refresh",
    branches: ["main"],
    bullets: [
      "Promoted the latest beta fixes to main, including token footer alignment, token title/type positioning, Stained Glass art aperture fixes, shared-set hydration, and manual set refresh.",
      "Main now includes the compact-web saved-set thumbnail lazy mounting that reduces iOS Safari decoded-image memory pressure on large set lists.",
      "Production release metadata now points the main patch-notes link at this deployment.",
    ],
  },
  {
    version: "3.30.49",
    date: "2026-06-01",
    title: "Mobile Safari stability",
    bullets: [
      "Saved-set thumbnails now lazy-mount their full card previews on compact web viewports to reduce decoded image memory pressure in iOS Safari.",
      "Deferred thumbnails keep stable card-shaped placeholders until they are near the viewport, reducing the chance of WebKit tab-process crashes on large set lists.",
    ],
  },
  {
    version: "3.30.48",
    date: "2026-06-01",
    title: "Manual set refresh",
    bullets: [
      "The Sets tab now has a Refresh sets button that rehydrates owned and shared sets from Supabase.",
      "The refresh control shows sync progress and is disabled until a user is signed in.",
    ],
  },
  {
    version: "3.30.47",
    date: "2026-06-01",
    title: "Shared sets in saved sets",
    bullets: [
      "Accepted shared set memberships now hydrate into the Saved Sets list alongside owned sets.",
      "Shared sets are labeled with their owner and collaborator role, while Supabase account persistence remains owner-scoped so shared sets are not cloned under the viewer account.",
    ],
  },
  {
    version: "3.30.46",
    date: "2026-06-01",
    title: "Stained Glass art mask",
    bullets: [
      "Stained Glass showcase art masks now use a full user-space viewport so the lower aperture fills with art instead of clipping to the black card background.",
    ],
  },
  {
    version: "3.30.45",
    date: "2026-06-01",
    title: "Stained Glass art aperture",
    bullets: [
      "Stained Glass showcase frames now repaint the selected art through the lower art pane so the opening no longer falls to a black band above the type line.",
    ],
  },
  {
    version: "3.30.44",
    date: "2026-06-01",
    title: "Token title and type alignment",
    bullets: [
      "Token card names now render centered in the title bar.",
      "Token type-line text now sits lower in the M20 token type bar.",
    ],
  },
  {
    version: "3.30.43",
    date: "2026-06-01",
    title: "Token footer contrast",
    bullets: [
      "Token footer text now uses the same light ink as normal card footers so collector, artist, and copyright text remain legible on the black bottom border.",
    ],
  },
  {
    version: "3.30.42",
    date: "2026-06-01",
    title: "Token footer alignment",
    bullets: [
      "Token frame footer text now uses the same collector, artist, and copyright layout as normal card frames.",
      "Token footer separators now use the shared normal-frame footer composition.",
    ],
  },
  {
    version: "3.30.41",
    date: "2026-06-01",
    title: "Production promotion prep",
    bullets: [
      "Prepared the current beta patch set for main-branch deployment.",
      "Updated release metadata so beta and main can both point at the promoted build.",
    ],
  },
  {
    version: "3.30.41",
    date: "2026-06-01",
    title: "Frame, set, and collaboration polish",
    branches: ["main"],
    bullets: [
      "Token previews now use the modern MSE M20 token overlays, keep art behind frame bars, and select the textless token layout when rules and flavor text are empty.",
      "Rules-text keyword reminder chips now ignore nested keywords inside parenthetical reminder text.",
      "Saved-set renaming now uses stable set ids so renames do not duplicate or merge sets by display name.",
      "Default set symbols render slightly taller while preserving their aspect ratio.",
      "Collaborator invites by username or email-prefix now use deterministic UUID selection, removing the min(uuid) database error.",
    ],
  },
  {
    version: "3.30.40",
    date: "2026-06-01",
    title: "Top-level keyword reminder chips",
    bullets: [
      "Rules text reminder chips now ignore keyword names found inside parenthetical reminder text.",
      "A top-level keyword still detects whether its own reminder parenthetical is shown or hidden.",
    ],
  },
  {
    version: "3.30.39",
    date: "2026-06-01",
    title: "Modern token frame layering",
    bullets: [
      "Token previews now use the MSE M20 token frame overlay assets instead of the older opaque JPEG token frames.",
      "Token art now renders behind the token frame layer so the title, type, and rules bars stay above the art.",
      "Cards with no rules or flavor text continue to select the textless token frame variant.",
    ],
  },
  {
    version: "3.30.38",
    date: "2026-06-01",
    title: "Collaborator invite UUID lookup",
    bullets: [
      "Reapplied the username/email-prefix invite RPC with deterministic UUID text ordering instead of unsupported UUID aggregation.",
      "The collaborator panel should no longer show the Postgres function min(uuid) does not exist error.",
    ],
  },
  {
    version: "3.30.37",
    date: "2026-06-01",
    title: "Full token frame assets",
    bullets: [
      "Token previews now use the full MSE source-pack token frame rasters instead of transparent bar-only overlays.",
      "Token frame image caching now includes color identity and text-box variant so previews do not reuse a stale token frame.",
      "Token cards no longer draw the normal-card security stamp layer over the token frame.",
    ],
  },
  {
    version: "3.30.36",
    date: "2026-06-01",
    title: "Stable set rename identity",
    bullets: [
      "Saved-set normalization now merges sets by immutable set id instead of mutable display name, so renaming a set no longer creates or merges a duplicate Main Set.",
      "The initial Main Set now uses a stable default id across app sessions.",
      "Renaming a set now immediately persists the updated set identity to local storage and Supabase account sync.",
    ],
  },
  {
    version: "3.30.35",
    date: "2026-06-01",
    title: "Taller default set symbols",
    bullets: [
      "Default preset set-symbol masks now render with a slightly larger in-slot visual scale while preserving their aspect ratio.",
      "Uploaded and custom generated set symbols keep their existing sizing.",
    ],
  },
  {
    version: "3.30.34",
    date: "2026-06-01",
    title: "Community, collaboration, and save-flow release",
    branches: ["main"],
    bullets: [
      "Community feed pagination now auto-loads additional Supabase pages at the bottom of the scroll view, appends new cards without replaying prior pages, and reserves stable space while the weekly featured card loads.",
      "Manual save now uses the same styled choice modal as the new-card save flow, with overwrite versus save-as-new options based on the current card name.",
      "Switching app tabs with dirty card state now autosaves the draft and records bounded recovery snapshots.",
      "Saved-set collaboration now supports username and email invites, shows collaborator usernames when profile data is available, and merges pending invitees into the collaborator roster.",
      "The Printing sheet double-faced-card action is back in the card-back scroller as the first inline Add DFC option.",
      "Rules text now preserves literal keyword entry while exposing detected keywords as reminder-text toggle chips.",
      "Watermark controls are collapsed behind a summary row, and AI Prompts has been removed from the edit menu.",
    ],
  },
  {
    version: "3.30.33",
    date: "2026-06-01",
    title: "Featured card loading space",
    bullets: [
      "The weekly featured-card panel now reserves a full card-sized preview area while the featured card is loading.",
      "Added title and metadata skeleton rows so the Community feed below does not jump when the featured card resolves.",
    ],
  },
  {
    version: "3.30.32",
    date: "2026-06-01",
    title: "Stable feed reactions",
    bullets: [
      "Community feed reaction updates now preserve the current rendered card window instead of treating like-count changes as a feed reset.",
      "The feed render window now resets only when the feed identity changes, such as search text, sort order, or hide-seen filtering.",
    ],
  },
  {
    version: "3.30.31",
    date: "2026-06-01",
    title: "Stable feed append rendering",
    bullets: [
      "Community feed pagination now preserves the currently rendered card window when new pages append.",
      "Loading more cards no longer visually restarts from the first page before the newly fetched cards appear.",
    ],
  },
  {
    version: "3.30.30",
    date: "2026-06-01",
    title: "Automatic community feed paging",
    bullets: [
      "Community Card Feed now automatically requests the next Supabase page when the main scroll view reaches the bottom.",
      "Removed the manual Load more cards button and replaced it with a passive loading indicator while the next page is being fetched.",
    ],
  },
  {
    version: "3.30.29",
    date: "2026-06-01",
    title: "Inline DFC back action",
    bullets: [
      "The Printing sheet card-back scroller now labels the double-faced-card action as Add DFC.",
      "The Add DFC tile now uses the same inline sizing, preview-frame spacing, and label treatment as the neighboring card-back choices.",
    ],
  },
  {
    version: "3.30.28",
    date: "2026-06-01",
    title: "Unified collaborator roster",
    bullets: [
      "Saved-set invite panels now show accepted collaborators and pending invitees in one Collaborators list.",
      "Collaborator rows prefer CardMagic usernames over generated creator labels when profile data is available.",
      "Removed the separate Pending invites panel and the username-suggestion instruction line.",
    ],
  },
  {
    version: "3.30.27",
    date: "2026-06-01",
    title: "Save choice and tab autosave",
    bullets: [
      "Manual save now opens a custom choice modal for overwriting the current/name-matched card or saving the draft as a new card.",
      "Switching tabs with unsaved edits now silently autosaves the current card and records a bounded recovery snapshot history.",
    ],
  },
  {
    version: "3.30.26",
    date: "2026-06-01",
    title: "Borderless mask textbox clipping",
    bullets: [
      "Borderless subject-mask foreground compositing now clips at the rules text area so the matte cannot cover rules text or flavor text.",
    ],
  },
  {
    version: "3.30.25",
    date: "2026-06-01",
    title: "Username invite UUID lookup",
    bullets: [
      "Updated the username invite database function to choose matching UUIDs with deterministic ordering instead of unsupported UUID min aggregation.",
    ],
  },
  {
    version: "3.30.24",
    date: "2026-06-01",
    title: "Reliable beta branch link",
    bullets: [
      "Patch notes now render a beta-branch link immediately, then replace it with the Supabase-backed deployment row when that metadata loads.",
    ],
  },
  {
    version: "3.30.23",
    date: "2026-06-01",
    title: "Visible beta release link",
    bullets: [
      "The Supabase-backed beta deployment link is visible from the patch-notes modal on beta builds as well as main release builds.",
    ],
  },
  {
    version: "3.30.22",
    date: "2026-06-01",
    title: "Beta release metadata",
    bullets: [
      "Logged the current beta deployment in Supabase release metadata.",
      "Main release notes can now link directly to the latest beta branch from the patch-notes modal.",
      "Saved-set invite panels now show the accepted collaborator roster above pending invitations.",
    ],
  },
  {
    version: "3.30.21",
    date: "2026-06-01",
    title: "Simplified edit menu",
    bullets: [
      "Removed AI Prompts from the card edit menu while keeping the underlying prompt-generation helpers available to existing workflows.",
    ],
  },
  {
    version: "3.30.20",
    date: "2026-06-01",
    title: "Collapsed watermark controls",
    bullets: [
      "The watermark editor now shows a compact expandable summary row by default.",
      "Watermark upload, preset-bank, opacity, and scale controls are hidden until the watermark row is expanded.",
    ],
  },
  {
    version: "3.30.19",
    date: "2026-06-01",
    title: "Rules text keyword reminder chips",
    bullets: [
      "The rules text editor now detects literal keyword abilities typed in the text box and shows them as reminder-toggle chips.",
      "Toggling a detected keyword chip now inserts or removes that keyword's reminder parenthetical directly in the rules text instead of auto-promoting the keyword into hidden metadata.",
    ],
  },
  {
    version: "3.30.18",
    date: "2026-06-01",
    title: "Printing sheet back-face action",
    bullets: [
      "Moved Add card back into the Printing sheet card-back scroller as the first option before the set-default and preset card backs.",
      "The physical card-back popover now only routes to the card-back controls, keeping back-face creation in the Printing sheet.",
    ],
  },
  {
    version: "3.30.17",
    date: "2026-06-01",
    title: "Frame editor copy",
    bullets: [
      "Renamed the frame-selection section label from Default frames to Color override to better describe the manual frame-color override controls.",
    ],
  },
  {
    version: "3.30.16",
    date: "2026-06-01",
    title: "Cropped generated set symbols",
    bullets: [
      "Generated default set-symbol PNGs now have their transparent alpha padding cropped out of the asset files.",
      "Removed the runtime scale multiplier so default set symbols render from tighter masks instead of magnified raster edges.",
    ],
  },
  {
    version: "3.30.15",
    date: "2026-06-01",
    title: "Literal rules keyword entry",
    bullets: [
      "Removed the rules-section keyword picker added in 3.30.14.",
      "Typing keyword names into the rules text box now leaves them as literal rules text instead of auto-promoting them into keyword chips and removing the typed line.",
    ],
  },
  {
    version: "3.30.14",
    date: "2026-06-01",
    title: "Rules-section keyword picker",
    bullets: [
      "The normal rules editor now includes the keyword selector so keyword chips can be added without switching to the separate keyword tab.",
      "Rules text autocomplete and line-promotion still remain available for typing keyword names directly.",
    ],
  },
  {
    version: "3.30.13",
    date: "2026-06-01",
    title: "Keyword rules editor spacing",
    bullets: [
      "Generated keyword rules text now renders as a protected static prefix while the rules text box is active.",
      "The editable manual-rules input is offset below that keyword prefix so keyword lines are not visually consumed by the editor.",
    ],
  },
  {
    version: "3.30.12",
    date: "2026-06-01",
    title: "Larger generated set symbols",
    bullets: [
      "Generated default set-symbol PNG masks now render with a preset scale multiplier so their visible glyphs fill the type-line symbol slot more like the original SVG presets.",
      "Set-symbol export flattening now applies the same scale multiplier as the live preview.",
    ],
  },
  {
    version: "3.30.11",
    date: "2026-06-01",
    title: "Generated set symbol assets",
    bullets: [
      "Default preset set symbols now resolve generated PNG assets through Expo's asset manifest on web.",
      "The original SVG preset geometry remains a fallback only when a generated asset URI cannot be resolved.",
    ],
  },
  {
    version: "3.30.10",
    date: "2026-06-01",
    title: "Set symbol preview fallback",
    bullets: [
      "Generated default set-symbol presets now resolve their asset URI defensively before entering the rarity-mask renderer.",
      "If a runtime cannot resolve the generated PNG asset, the preset falls back to its original SVG geometry instead of crashing the preview tab.",
    ],
  },
  {
    version: "3.30.9",
    date: "2026-06-01",
    title: "Generated default set symbols",
    bullets: [
      "Default set-symbol presets now use freshly generated transparent PNG alpha masks while preserving their existing names and IDs.",
      "The generated masks are normalized to black glyph pixels with transparent backgrounds so rarity recoloring still works.",
    ],
  },
  {
    version: "3.30.8",
    date: "2026-06-01",
    title: "Expanded masked art bounds",
    bullets: [
      "Subject-mask compositing now fits art against the expanded approved frame aperture instead of only the original art box.",
      "Standard-frame aperture redraws use the same expanded fit bounds so masked foreground and base art stay aligned.",
    ],
  },
  {
    version: "3.30.7",
    date: "2026-06-01",
    title: "Constrained standard mask overlap",
    bullets: [
      "Standard-frame subject masks no longer approve foreground art inside the type-line bar.",
      "Borderless subject masks keep their type-line overlap allowance for full-art compositing.",
    ],
  },
  {
    version: "3.30.6",
    date: "2026-06-01",
    title: "Matched flavor typography",
    bullets: [
      "Rules and flavor text now share the same final font scale when both sections render on the same card face.",
      "Split-card rules and flavor metrics now use the same shared scale as well.",
    ],
  },
  {
    version: "3.30.4",
    date: "2026-06-01",
    title: "Mask edge reach",
    bullets: [
      "Standard subject-mask art can now reach the outer black frame rail along the top and sides of the art region.",
      "Disabling subject-mask compositing in the mask tab also hides the cyan mask preview overlay.",
      "Masked standard art now redraws the art aperture above the frame texture so the old black art-slot border is covered.",
    ],
  },
  {
    version: "3.30.3",
    date: "2026-06-01",
    title: "Mask toggle and title aperture",
    bullets: [
      "The subject-mask title approval aperture is wider horizontally so the title-bar pinline ends are covered by foreground art.",
      "The art mask tab now has a subject-mask enable toggle that preserves the generated mask while disabling over-frame compositing.",
    ],
  },
  {
    version: "3.30.2",
    date: "2026-06-01",
    title: "Title pinline subject overlap",
    bullets: [
      "Foreground subject masks now get a wider title-line approval aperture so the subject art can cover the title pinline.",
      "Type-line masking keeps the tighter approval geometry from the previous beta patch.",
    ],
  },
  {
    version: "3.30.1",
    date: "2026-06-01",
    title: "Subject mask text-box exclusion",
    bullets: [
      "Foreground subject masks no longer paint over the rules text box.",
      "The subject overlay now uses layout-derived title/type-line approval rectangles instead of the old bitmap approval mask, removing stray box-edge artifacts.",
    ],
  },
  {
    version: "3.30.0",
    date: "2026-06-01",
    title: "Invite email-prefix lookup",
    bullets: [
      "Saved set invite lookup now matches existing users by username or the first half of their email address.",
      "Inviting by an email-prefix match adds the existing account directly when the match is unique.",
    ],
  },
  {
    version: "3.29.0",
    date: "2026-06-01",
    title: "Pending set invites",
    bullets: [
      "Saved set invite panels now show pending email invitations for each set.",
      "Pending invite lists refresh when the invite panel opens and after a collaborator invite is sent.",
    ],
  },
  {
    version: "3.28.1",
    date: "2026-06-01",
    title: "Invite lookup latency",
    bullets: [
      "Username invite suggestions now wait for at least two typed characters before querying Supabase.",
      "Invite lookup loading indicators now appear only while the network request is active, not during the debounce delay.",
      "Sending an invite now shows a delayed progress message if Supabase takes longer than expected.",
    ],
  },
  {
    version: "3.28.0",
    date: "2026-06-01",
    title: "Invite username autocomplete",
    bullets: [
      "Saved set collaborator invites now suggest matching CardMagic usernames while typing.",
      "Selecting a username suggestion fills the invite field so collaborators can be added without manually entering the full handle.",
    ],
  },
  {
    version: "3.28.0",
    date: "2026-06-01",
    title: "Branch-specific release notes",
    bullets: [
      "Beta builds now keep the granular patch log for every beta deployment.",
      "Main-branch builds now show curated release-summary notes for changes since the last production deployment.",
    ],
  },
  {
    version: "3.30.2",
    date: "2026-06-01",
    title: "Collaboration and mask compositing release",
    branches: ["main"],
    bullets: [
      "Saved sets now support collaborator invites by email or existing CardMagic username.",
      "Collaborator invite fields now suggest matching usernames while typing.",
      "Pending set invite lists now refresh from the invite panel.",
      "Subject-mask art can expand beyond the normal art aperture across frame treatments and composite over approved title/type frame regions.",
      "Subject-mask art no longer paints over the rules text box, can cover the full title pinline, can be disabled per art face, and no longer leaks old approval-mask box edges.",
      "Uploaded art and subject masks now stabilize browser image URLs before preview rendering.",
      "Production patch notes now summarize the changes promoted since the previous main-branch deployment.",
    ],
  },
  {
    version: "3.25.11",
    date: "2026-06-01",
    title: "Subject mask frame overlap",
    bullets: [
      "Foreground subject masks now read the cutout alpha channel so borderless subject masking renders again.",
      "Standard-frame subject cutouts can paint over the approved title and type-line frame regions when the masked subject reaches them.",
    ],
  },
  {
    version: "3.25.10",
    date: "2026-06-01",
    title: "Username set invites",
    bullets: [
      "Saved set collaborator invites now accept either an email address or an existing CardMagic username.",
      "Username invites add the existing account directly, while email invites remain pending until that email signs in.",
    ],
  },
  {
    version: "3.25.9",
    date: "2026-06-01",
    title: "Uploaded art preview loading",
    bullets: [
      "Uploaded browser images now stabilize blob URLs before preview rendering so added art can load in masked and over-frame compositing paths.",
    ],
  },
  {
    version: "3.25.8",
    date: "2026-06-01",
    title: "Crisp over-frame subject art",
    bullets: [
      "On non-borderless frames, subject art drawn over the frame now shows the masked subject at full opacity with a hard edge, instead of the soft borderless window letting it fade and spill past the frame.",
    ],
  },
  {
    version: "3.25.7",
    date: "2026-06-01",
    title: "Mask approval polarity",
    bullets: [
      "Foreground subject masks now read the frame approval asset by alpha instead of luminance.",
      "Opaque approved frame regions can now receive the subject cutout above the frame bitmap.",
    ],
  },
  {
    version: "3.25.6",
    date: "2026-06-01",
    title: "Foreground subject masks",
    bullets: [
      "Subject-mask cutouts now composite above the frame bitmap in approved frame openings.",
      "The foreground cutout is clipped by the MSE frame approval mask so it does not cover protected title, type, or rules furniture.",
    ],
  },
  {
    version: "3.25.5",
    date: "2026-06-01",
    title: "Mask art overlay",
    bullets: [
      "Subject masks now overlay the cutout above the original art instead of replacing the full art layer.",
      "The base art remains clipped to its normal aperture while the masked subject can extend beyond it.",
    ],
  },
  {
    version: "3.25.4",
    date: "2026-06-01",
    title: "Mask art visibility",
    bullets: [
      "Subject-mask replacement art now renders above the art background fill while staying below frame furniture.",
    ],
  },
  {
    version: "3.25.3",
    date: "2026-06-01",
    title: "Set invite placement",
    bullets: [
      "Community no longer shows a separate Collab tab.",
      "Saved sets now have a per-set invite button that opens an email collaborator invitation form.",
    ],
  },
  {
    version: "3.25.2",
    date: "2026-06-01",
    title: "Mask art replacement",
    bullets: [
      "Subject masks now replace the source art layer instead of drawing over an unmasked copy.",
      "Masked art keeps the original art aperture aspect and transform while the cutout can render outside the aperture.",
    ],
  },
  {
    version: "3.25.1",
    date: "2026-06-01",
    title: "Subject mask frame support",
    bullets: [
      "Subject masks now use full-card art bounds across standard-layout frame treatments instead of being limited to borderless frames.",
      "Transparent borderless has been removed from the frame treatment picker; older saved cards using it now resolve to borderless.",
    ],
  },
  {
    version: "3.25.0",
    date: "2026-06-01",
    title: "Collaborative set workspaces",
    bullets: [
      "Community now has a Collab workspace where signed-in users can invite editors to saved sets by email.",
      "Collaborative set members can add local cards, post set comments, vote in set polls, and maintain shared checklists.",
      "Supabase collaboration data uses membership-scoped RPCs and row-level security instead of broad owner-table access.",
    ],
  },
  {
    version: "3.24.14",
    date: "May 31, 2026",
    title: "Community set preview polish",
    bullets: [
      "Flavor text now uses the same computed font size and line height as rules text across normal, split, and battle card previews.",
      "Community set card previews no longer add the extra wrapper bands above and below rendered cards.",
    ],
  },
  {
    version: "3.24.13",
    date: "May 31, 2026",
    title: "Community set browsing",
    bullets: [
      "Community set rows now expand on tap so users can inspect the public cards inside each set.",
      "Set detail loading uses a dedicated public Supabase RPC with card previews and rendered-image export actions.",
    ],
  },
  {
    version: "3.24.12",
    date: "May 31, 2026",
    title: "Beta link",
    bullets: [
      {
        text: "Current beta build:",
        linkLabel: "beta.cardmagic-5dy.pages.dev",
        linkUrl: "https://beta.cardmagic-5dy.pages.dev",
      },
    ],
  },
  {
    version: "3.24.11",
    date: "May 31, 2026",
    title: "Rules keyword chips",
    bullets: [
      "Rules-sheet keyword ability lines now save as persisted keyword chips below the rules editor.",
      "Toggling a keyword chip now controls whether that keyword's reminder text appears on card previews and exports.",
    ],
  },
  {
    version: "3.24.10",
    date: "May 31, 2026",
    title: "Community, showcase, and editor fixes",
    bullets: [
      "Community feed loading is faster and more resilient, with card art fallbacks and clearer Supabase/RPC diagnostics.",
      "Eternal Night, Stained Glass, Stellar Sights, and Vehicle rendering were tightened across preview and exported PNG output.",
      "The floating toolbar palette now positions from the toolbar viewport and uses a three-style base grid width.",
      "Subtype editing in the sheet now uses the same type-line autocomplete as manual type lines.",
      "Rules reminder text in parentheses now renders in italics on card previews and exports.",
    ],
  },
  {
    version: "3.24.9",
    date: "May 31, 2026",
    title: "Stellar Sights text fit",
    bullets: [
      "Stellar Sights rules text now uses a tighter text measure and bottom alignment so rules copy wraps more naturally near the flavor divider.",
      "Community feed errors now display normalized diagnostic text instead of raw object strings.",
    ],
  },
  {
    version: "3.24.8",
    date: "May 31, 2026",
    title: "Vehicle PT boxes",
    bullets: [
      "Vehicle cards now render a power/toughness box when the type line uses Vehicle as an artifact subtype.",
    ],
  },
  {
    version: "3.24.7",
    date: "May 31, 2026",
    title: "Adaptive toolbar palette",
    bullets: [
      "The floating toolbar palette menu now repositions and resizes from the toolbar's current viewport position, with a three-style base grid width.",
    ],
  },
  {
    version: "3.24.6",
    date: "May 31, 2026",
    title: "Stained Glass export art",
    bullets: [
      "Stained Glass exports now flatten the MSE art mask before capture so the illustration appears in the saved PNG.",
    ],
  },
  {
    version: "3.24.5",
    date: "May 31, 2026",
    title: "Eternal Night PT alignment",
    bullets: [
      "Eternal Night creature power/toughness text now uses the frame's MSE-aligned text box so exported stats sit centered in the badge.",
    ],
  },
  {
    version: "3.24.4",
    date: "May 31, 2026",
    title: "Community art fallback",
    bullets: [
      "Community feed cards without a hosted render now fall back to their original saved art instead of showing empty artwork.",
    ],
  },
  {
    version: "3.24.3",
    date: "May 31, 2026",
    title: "Community and export fixes",
    bullets: [
      "Community feed now includes existing public cards that were published before rendered feed images were stored separately.",
      "Eternal Night and Stained Glass showcase frames now preserve their masked frame layers in exported PNGs.",
    ],
  },
  {
    version: "3.24.1",
    date: "May 30, 2026",
    title: "Leaner community publishing",
    bullets: [
      "Published cards no longer store heavy embedded art data, keeping the community feed fast.",
      "Saving a community card image now downloads the finished render directly instead of rebuilding it.",
    ],
  },
  {
    version: "3.24.0",
    date: "May 30, 2026",
    title: "Faster community feed",
    bullets: [
      "Community card feed loads noticeably faster and more consistently.",
      "Feed cards now use right-sized, cached images in modern formats (WebP/AVIF) instead of full-resolution renders.",
      "Images fade in within a fixed frame, so the feed no longer jumps around while loading.",
    ],
  },
  {
    version: "3.23.1",
    date: "May 29, 2026",
    title: "Mask responsiveness",
    bullets: [
      "Targeted mask segmentation now has explicit timeout behavior instead of waiting indefinitely on slow SAM inference.",
      "Prompted mask requests use a smaller transport image while preserving source-resolution mask normalization.",
      "Mask status messages now explain when a targeted mask is taking too long and suggest a simpler visible object.",
    ],
  },
  {
    version: "3.23.0",
    date: "May 29, 2026",
    title: "Production release notes",
    bullets: [
      "Version label now opens in-app patch notes so users can inspect the current production release.",
      "Targeted mask prompts split compound subjects like “bow and arrow” into separate SAM segmentation concepts.",
      "Targeted mask failures now show user-friendly guidance while keeping technical diagnostics in logs.",
      "Subject mask components are saved with card data and restored when cards are loaded.",
    ],
  },
];

export const CARDMAGIC_VISIBLE_PATCH_NOTES = CARDMAGIC_PATCH_NOTES.filter((entry) => {
  const branches = entry.branches ?? (["beta"] as const);

  return branches.includes(CARDMAGIC_RELEASE_BRANCH);
});
