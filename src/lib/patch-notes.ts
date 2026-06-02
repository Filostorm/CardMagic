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
    version: "3.32.0",
    date: "2026-06-02",
    title: "Set viewer notifications",
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
