# CardMagic

CardMagic is an Expo/React Native Magic-style card creator for web and native builds. It combines a structured card editor, MSE-derived frame rendering, image generation/upload workflows, set management, account sync, and export tools for making custom proxy cards.

Production app: https://cardmagic.expo.app

## Features

- Full card authoring for names, mana costs, type lines, rules text, flavor text, power/toughness, loyalty, defense, rarity, collector data, artist credit, language, copyright text, set symbols, and watermarks.
- MSE M15-style frame rendering using checked-in source-pack and renderer-ready raster assets instead of generated frame textures.
- Frame identity and color handling for white, blue, black, red, green, gold, artifact, land, colorless, multicolor, and hybrid cards.
- Frame treatments including standard, full art, extended art, borderless, transparent borderless, promo, showcase, textless, retro, and etched foil.
- Type-frame support for standard cards, tokens, sagas, planeswalkers, battles, double-faced cards, adventures, split cards, fuse cards, and aftermath cards.
- Showcase frame presets including Eternal Night, Scrolls, Futureshifted, Japanese Mystical Archive, Stained Glass, Mystical Archive, D&D Rulebook, First Place, Stellar Sights, Poster Stellar Sights, and Custom Showcase Lab.
- Card-art workflows for uploaded art, art transforms, front/back art, subject masks, over-border effects, and generated artwork through Supabase Edge Functions.
- AI-assisted tools for image generation, image editing, subject matte generation, set icon generation, and rules-text templating.
- Local card database search backed by a compact Scryfall oracle dataset, including helpers for importing known cards into editable drafts.
- Keyword library with reminder text, icon metadata, custom keyword definitions, and rules-text insertion helpers.
- Card backs with built-in CardMagic proxy backs plus custom card-back import support.
- Set management for saving cards into sets, card ordering, collector numbering, set-level defaults, and JSON import/export.
- PNG export and sharing/downloading on web and native via `react-native-view-shot`, Expo Sharing, and Media Library integration.
- Account, progression, credits, achievements, and Stripe checkout plumbing backed by Supabase tables and Edge Functions.
- Local persistence for drafts, sets, frame templates, custom backs, art library entries, generated symbols, and progression state.
