# Magic Frame and Style Reference

Reference location: `/Users/josiahmann/Desktop/CardMagic/assets/card-assets/FRAME_STYLE_REFERENCE.md`  
Reference date: 2026-05-10, America/New_York

This document is for choosing which Magic-style frames to add to CardMagic later.
It separates frame taxonomy, current MSE implementation status, and visual
showcase references. The images are hotlinked reference thumbnails from MTG Wiki
or Scryfall-linked searches; do not vendor card images into the app unless you
have the rights or a clear local-use-only asset policy.

## Source Stamp

| Source | Location | Date observed | Notes |
|---|---|---:|---|
| Cajun Style Templates forum thread | https://magicseteditor.boards.net/thread/77/cajun-style-templates-update-creature | 2026-05-10 | The thread URL requested by the user. Direct thread fetches were blocked, but the forum index reports `Cajun Style Templates (UPDATE 3.0.7, Print, This creature+)`, last post by `monyarm`, 2025-08-18 18:38:03 GMT. |
| Full-Magic-Pack repository | https://github.com/MagicSetEditorPacks/Full-Magic-Pack | 2026-05-10 | Canonical current pack referenced by the archived Cajun repo. Local sampled commit: `0da65a16668ac6442fffd4488cc91100a623d37d`, committed 2026-04-28 20:45:41 -05:00. |
| Full-Magic-Pack changelog | https://raw.githubusercontent.com/MagicSetEditorPacks/Full-Magic-Pack/main/changelog.txt | 2026-05-10 | Current top changelog is `MSE Template Packs 3.1.0 Mainframe Battles (PRERELEASE)`. |
| MTG Wiki showcase catalog | https://mtg.wiki/page/Showcase/Showcase_by_variant | 2026-05-10 | Page metadata showed last modified 2026-04-29. Used for the all-showcase visual catalog and Scryfall query links. |
| Scryfall searches | https://scryfall.com/search | 2026-05-10 | Used as live card-print query targets for each treatment. Scryfall groups many different subtype treatments under `frame:showcase`, so per-style queries often need set/code/collector-number predicates. |

## Frame Taxonomy

Use these terms consistently in prompts and implementation tickets:

- **Card frame**: the structural visual shell around the card: border, title bar,
  art box, type line, text box, power/toughness or loyalty box, pinlines, and
  set/collector metadata.
- **Frame era**: broad historical family, such as old/retro, modern, M15/current,
  future, or colorshifted.
- **Layout template**: geometry and field model for a card type or mechanic:
  normal, token, split, flip, DFC, modal DFC, battle, planeswalker, saga,
  class, leveler, station leveler, adventure, aftermath, prototype, meld,
  planechase, scheme, dungeon, attraction, contraption, vanguard, and emblem.
- **Frame treatment**: alternate art/frame presentation layered on top of a
  layout, such as showcase, borderless, extended art, full art, textless,
  retro, masterpiece, inverted, serialized, or special foil treatment.
- **Material/color frame**: base visual material keyed by color identity or card
  supertype, such as white, blue, black, red, green, multicolor/gold, hybrid,
  artifact, colorless, land, snow, Nyx/enchantment, vehicle, devoid, and custom.
- **Print treatment**: production-facing finish or versioning metadata, such as
  foil, etched foil, serialized, Universes Beyond stamp, acorn stamp, promo
  stamp, or language-specific treatment.

## Current Full-Magic-Pack Status

The current Full-Magic-Pack sample contains 376 `*.mse-style` packages. The
important current-frame families for CardMagic planning are:

- **M15 Mainframe**: `magic-m15.mse-style`, `magic-m15-mainframe-dfc.mse-style`,
  `magic-m15-mainframe-planeswalker.mse-style`, `magic-m15-mainframe-tokens.mse-style`.
- **New 3.1.0 prerelease work**: `magic-m15-mainframe-battles.mse-style`,
  Station leveler support, Prototype support, and expanded Omen/Page support.
- **Layout families**: Adventure, Aftermath, Battle, Class, DFC, Duplex, Flip,
  Leveler, Meld, Planechase, Planeswalker, Saga, Split/Fuse, Token, Vanguard,
  Attractions, Contraptions, Dungeons, and Schemes.
- **Showcase style packages**: 58 observed `magic-m15-showcase-*` directories,
  including Aetherdrift First Place, Avatar Elemental, Bloomburrow Woodland,
  Duskmourn Paranormal, Edge of Eternities Stellar Sights, Lorwyn Fable,
  Spider-Man Web-slinger/Panel, Tarkir Draconic/Ghostfire, TMNT Pixel/Sewer,
  and Secret Lair/Unfinity treatments.

Changelog highlights that matter for CardMagic:

- Mainframe Battles currently supports single-face battle cards, March of the
  Machine-style geometry, boxed/spillover/borderless battle variants, defense
  symbol swapping, transform node/arrow options, Universes Beyond texture/stamps,
  and Nyx/Snow/Vehicle/Custom borders on boxed and spillover styles.
- Station levelers are now part of M15 Mainframe and can trigger from Spacecraft
  or Planet on the type line.
- Prototype is now available on M15 Mainframe and Mainframe Planeswalkers and can
  stack with most frames, except it overrides Mutate, Levelers, and Adventures.
- New template coverage includes Aetherdrift First Place, Tarkir Draconic and
  Ghostfire, Edge of Eternities Stellar Sights, Spider-Man Webslinger and Comic
  Panel, Avatar Elemental, Lorwyn Fabled, TMNT Pixel and Sewer, Secret Lair
  Arcade, MKM Magnified, recent full-art land frames, and more.

## CardMagic Priority Map

| Priority | Frame/style group | Why it matters |
|---:|---|---|
| 1 | M15/current normal frames plus color/material variants | Baseline renderer correctness for most custom cards. |
| 1 | Type/layout templates: planeswalker, saga, battle, DFC, adventure, split/fuse, token | These change the field model and geometry, not just art treatment. |
| 2 | Borderless, extended art, full art, retro, textless | High visual impact, reused across many sets, and relatively generic. |
| 2 | Showcase families already implemented in Full-Magic-Pack | Good candidates to port later because MSE package names and assets already exist as reference material. |
| 3 | Highly specific Universes Beyond and Secret Lair treatments | Useful visually, but licensing and brand specificity make them better as optional/local asset packs. |

## Showcase Catalog

This catalog follows MTG Wiki's current "Showcase by variant" taxonomy. "Other
recurring themes" are not always official showcase frames, but they recur in
the same collector-treatment design space and should be tracked for future
asset-pack decisions.

### Showcases

| Example | Style | Primary releases | Search |
|---|---|---|---|
| <img src="https://files.mtg.wiki/thumb/MH2_Retro_Border_showcase_-_Galvanic_Relay.png/150px-MH2_Retro_Border_showcase_-_Galvanic_Relay.png" width="90" alt="Retro frame"> | Retro frame | Unhinged; Time Spiral Timeshifted bonus sheet; Judge Gift 2012; Judge Gift 2013; ... | [Scryfall](https://scryfall.com/search?q=frame%3Aold+year%3E2005+%28-set%3AME1%2CME2%2CME3%2CME4%2CTD0%2CVMA%2C30A%2CPLIST%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Damnation.jpg/150px-Damnation.jpg" width="90" alt="Planeshifted / Colorshifted"> | Planeshifted / Colorshifted | Planar Chaos | [Scryfall](https://scryfall.com/search?q=frame%3Acolorshifted+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Fleshwrither.jpg/150px-Fleshwrither.jpg" width="90" alt="Futureshifted"> | Futureshifted | Future Sight; Mystery Booster 2 | [Scryfall](https://scryfall.com/search?q=frame%3Afuture+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Expeditions_showcase_EXP_-_Steam_Vents.png/150px-Expeditions_showcase_EXP_-_Steam_Vents.png" width="90" alt="Expeditions (Eldrazi)"> | Expeditions (Eldrazi) | Zendikar Expeditions | [Scryfall](https://scryfall.com/search?q=set%3AEXP) |
| <img src="https://files.mtg.wiki/thumb/MPS_Inventions_showcase_-_Mana_Crypt.png/150px-MPS_Inventions_showcase_-_Mana_Crypt.png" width="90" alt="Inventions"> | Inventions | Kaladesh Inventions; Kaladesh Remastered; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=%28set%3AMPS+OR+%28set%3ASLD+CN%3A1265%29+OR+%28set%3AMOM+CN%3A302%29+OR+%28set%3AMAT+CN%3A92%29+OR+%28set%3AKLR+frame%3Ashowcase%29+OR+set%3AMUL+%28CN%3A6+OR+CN%3A8+OR+CN%3A21+OR+CN%3A57%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MOM_Invocation_showcase_-_Djeru_and_Hazoret.png/150px-MOM_Invocation_showcase_-_Djeru_and_Hazoret.png" width="90" alt="Invocations"> | Invocations | Amonkhet Invocations; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath | [Scryfall](https://scryfall.com/search?q=%28set%3AMP2+OR+%28set%3AMOM%2CMUL%2CMAT+atag%3AAmonkhet+frame%3Ashowcase%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/M21_Signature_showcase_-_Teferi_Master_of_Time.png/150px-M21_Signature_showcase_-_Teferi_Master_of_Time.png" width="90" alt="Signature Spellbook"> | Signature Spellbook | Signature Spellbook: Jace; Signature Spellbook: Gideon; Signature Spellbook: Chandra; Core Set 2021; ... | [Scryfall](https://scryfall.com/search?q=%28set%3ASS1%2CSS2%2CSS3+OR+%28set%3AM21+frame%3Ashowcase%29+OR+%28set%3ATDM+CN%3E398+CN%3C419%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Expeditions_showcase_ZNE_-_Prismatic_Vista.png/150px-Expeditions_showcase_ZNE_-_Prismatic_Vista.png" width="90" alt="Expeditions (Hedron)"> | Expeditions (Hedron) | Zendikar Rising Expeditions | [Scryfall](https://scryfall.com/search?q=set%3AZNE) |
| <img src="https://files.mtg.wiki/thumb/Adventurer_card_%28showcase%29.jpg/150px-Adventurer_card_%28showcase%29.jpg" width="90" alt="Adventure"> | Adventure | Throne of Eldraine; Wilds of Eldraine; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=%28%28atag%3AEldraine+frame%3Ashowcase+-set%3AWOT%2CMH2%29+OR+%28set%3ASPG+CN%3A77%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/THB_Constellation_showcase_-_Thassa_Deep-Dwelling.png/150px-THB_Constellation_showcase_-_Thassa_Deep-Dwelling.png" width="90" alt="Constellation"> | Constellation | Theros Beyond Death; Secret Lair Drop Series: Theros Stargazing Volume 1-5; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=atag%3Aconstellation+frame%3Ashowcase+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/IKO_Comic_Book_showcase_-_Illuna_Apex_of_Wishes.png/150px-IKO_Comic_Book_showcase_-_Illuna_Apex_of_Wishes.png" width="90" alt="Comic-book art / Comic-book (crystal)"> | Comic-book art / Comic-book (crystal) | Ikoria: Lair of Behemoths; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; Showcase: March of the Machine, Vol. 3; ... | [Scryfall](https://scryfall.com/search?q=%28%28atag%3AIkoria+frame%3Ashowcase%29+OR+%28set%3ASPG+CN%3A83%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/ZNR_Hedron_showcase_-_Lotus_Cobra.png/150px-ZNR_Hedron_showcase_-_Lotus_Cobra.png" width="90" alt="Landfall"> | Landfall | Zendikar Rising; Secret Lair Drop Series: Showcase: Zendikar Revisited; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=%28%28atag%3AZendikar+frame%3Ashowcase%29+OR+%28set%3ASPG+CN%3A78%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/PHY_showcase_-_Vorinclex_Monstrous_Raider.png/150px-PHY_showcase_-_Vorinclex_Monstrous_Raider.png" width="90" alt="Phyrexian language"> | Phyrexian language | Judge Gift 2014; Kaldheim; Showcase: Kaldheim Part 1 & 2; Historic Anthology 5; ... | [Scryfall](https://scryfall.com/search?q=language%3APhyrexian+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/KHM_Viking_showcase_-_Magda_Brazen_Outlaw.png/150px-KHM_Viking_showcase_-_Magda_Brazen_Outlaw.png" width="90" alt="Viking"> | Viking | Kaldheim; Showcase: Kaldheim - Part 1; Showcase: Kaldheim - Part 2; March of the Machine Multiverse Legends bonus sheet; ... | [Scryfall](https://scryfall.com/search?q=%28%28atag%3AKaldheim+frame%3Ashowcase%29+OR+%28set%3ASPG+CN%3A76%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/STA_Time_Warp_-_Mystical_Archive.png/150px-STA_Time_Warp_-_Mystical_Archive.png" width="90" alt="Mystical Archive"> | Mystical Archive | Strixhaven: School of Mages Mystical Archive bonus sheet; Showcase: Strixhaven; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3ASTA+CN%3C64%29+OR+%28set%3ASOA+CN%3C64%29+OR+%28set%3AMOM%2CMUL%2CMAT+atag%3Aarcavios+frame%3Ashowcase%29+OR+%28set%3ASPG+CN%3A74%29+OR+%28set%3ASLD+%28CN%3A1272+or+CN%3E267+CN%3C274%29%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/STA_Swords_to_Plowshares_-_Mystical_Archive_-_Japan.png/150px-STA_Swords_to_Plowshares_-_Mystical_Archive_-_Japan.png" width="90" alt="Japanese Mystical Archive"> | Japanese Mystical Archive | Japanese Strixhaven: School of Mages Mystical Archive bonus sheet; Pictures of the Floating World; Japanese Secrets of Strixhaven Mystical Archive bonus sheet; Return to the Mystical Archive | [Scryfall](https://scryfall.com/search?q=%28%28set%3ASTA+CN%3E63%29+OR+%28set%3ASOA+CN%3E65%29+OR+%28set%3ASLD+CN%3E435+CN%3C441%29+OR+%28set%3ASLD+CN%3E2386+CN%3C2392%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MH2_Sketch_showcase_-_Dakkon_Shadow_Slayer.png/150px-MH2_Sketch_showcase_-_Dakkon_Shadow_Slayer.png" width="90" alt="Sketch"> | Sketch | Modern Horizons 2 | [Scryfall](https://scryfall.com/search?q=set%3AMH2+CN%3E326+CN%3C381+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/AFR_Rulebook_showcase_-_Bruenor_Battlehammer.png/150px-AFR_Rulebook_showcase_-_Bruenor_Battlehammer.png" width="90" alt="D&D Rulebook"> | D&D Rulebook | Dungeons & Dragons: Adventures in the Forgotten Realms; Commander Legends: Battle for Baldur's Gate; Secret Lair Drop Series: Here Be Dragons | [Scryfall](https://scryfall.com/search?q=%28%28s%3AAFR+CN%3E298+CN%3C350%29+OR+%28s%3ACLB+CN%3E374+CN%3C451%29+OR+%28s%3ASLD+CN%3E1011+CN%3C1019+-CN%3A1012a%29+OR+%28s%3ASLD+CN%3A709%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/AFR_Dungeon_Module_showcase-_Evolving_Wilds.png/150px-AFR_Dungeon_Module_showcase-_Evolving_Wilds.png" width="90" alt="D&D Dungeon Module"> | D&D Dungeon Module | Dungeons & Dragons: Adventures in the Forgotten Realms | [Scryfall](https://scryfall.com/search?q=set%3AAFR+CN%3E349+CN%3C359+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MID_Eternal_Night_Showcase_-_Lier_Disciple_of_the_Drowned.png/150px-MID_Eternal_Night_Showcase_-_Lier_Disciple_of_the_Drowned.png" width="90" alt="Eternal Night"> | Eternal Night | Innistrad: Midnight Hunt; Showcase: Midnight Hunt; Innistrad: Crimson Vow; Innistrad: Double Feature | [Scryfall](https://scryfall.com/search?q=%28%28set%3AMID+CN%3E267+CN%3C278%29+OR+%28set%3AMID+CN%3E311+CN%3C326%29+OR+%28set%3AVOW+CN%3E267+CN%3C278%29+OR+%28set%3AVOW+CN%3E316+CN%3C329%29+OR+%28set%3AVOW+CN%3E407+CN%3C413%29+OR+set%3ADBL%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MID_Equinox_showcase_-_Arlinn_the_Packs_Hope.png/150px-MID_Equinox_showcase_-_Arlinn_the_Packs_Hope.png" width="90" alt="Equinox"> | Equinox | Innistrad: Midnight Hunt; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; Innistrad Remastered | [Scryfall](https://scryfall.com/search?q=%28%28set%3AMID+CN%3E285+CN%3C312%29+OR+%28set%3AMOM+CN%3A316%29+OR+%28set%3AMUL+CN%3A7%29+OR+%28set%3AMUL+CN%3A41%29+OR+%28set%3AMAT+CN%3A97%29+OR+%28set%3AINR+CN%3A325%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/VOW_Fang_showcase_-_Sorin_the_Mirthless.png/150px-VOW_Fang_showcase_-_Sorin_the_Mirthless.png" width="90" alt="Fang"> | Fang | Innistrad: Crimson Vow; March of the Machine: The Aftermath; Showcase: March of the Machine, Vol. 1; Innistrad Remastered | [Scryfall](https://scryfall.com/search?q=%28%28set%3AVOW+CN%3E285+CN%3C317%29+OR+%28set%3AMAT+CN%3A64%29+OR+%28set%3ASLD+CN%3A1264%29+OR+%28set%3AINR+CN%3E325+CN%3C329%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/NEO_Ninja_showcase_-_Satoru_Umezawa.png/150px-NEO_Ninja_showcase_-_Satoru_Umezawa.png" width="90" alt="Ninja"> | Ninja | Kamigawa: Neon Dynasty; Showcase: March of the Machine, Vol. 2 | [Scryfall](https://scryfall.com/search?q=%28%28set%3ANEO+CN%3E330+CN%3C354%29+OR+%28set%3ASLD+CN%3A1267%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/NEO_Samurai_showcase_-_The_Wandering_Emperor.png/150px-NEO_Samurai_showcase_-_The_Wandering_Emperor.png" width="90" alt="Samurai"> | Samurai | Kamigawa: Neon Dynasty | [Scryfall](https://scryfall.com/search?q=set%3ANEO+CN%3E308+CN%3C331+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/NEO_Neon_Soft_Glow_showcase_-_Surgehacker_Mech.png/150px-NEO_Neon_Soft_Glow_showcase_-_Surgehacker_Mech.png" width="90" alt="Soft Glow / Neon Ink"> | Soft Glow / Neon Ink | Kamigawa: Neon Dynasty; Showcase: Neon Dynasty; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3ANEO+CN%3E362+CN%3C406%29+OR+%28set%3ANEO+CN%3E428+CN%3C433%29+OR+%28set%3AMOM%2CMUL%2CMAT+atag%3AKamigawa+frame%3Ashowcase%29+OR+%28set%3ASPG+CN%3A82%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/SNC_Golden_Age_showcase_-_Brokers_Ascendancy.png/150px-SNC_Golden_Age_showcase_-_Brokers_Ascendancy.png" width="90" alt="Golden Age"> | Golden Age | Streets of New Capenna; Showcase: Streets of New Capenna Gilded Foil Edition; March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3AALA+frame%3Ashowcase%29+OR+%28set%3ASNC+CN%3E295+CN%3C341%29+OR+%28set%3ASLD+CN%3E452+CN%3C456+OR+CN%3A1262%29+OR+%28Atraxa+set%3AMUL+frame%3Ashowcase%29+OR+%28Errant+and+Giada+set%3AMOM+frame%3Ashowcase%29+OR+%28set%3AMAT+atag%3Anew-capenna+frame%3Ashowcase%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/SNC_Art_Deco_showcase_-_Elspeth_Resplendent.png/150px-SNC_Art_Deco_showcase_-_Elspeth_Resplendent.png" width="90" alt="Art Deco"> | Art Deco | Streets of New Capenna; Special Guests (Foundations) | [Scryfall](https://scryfall.com/search?q=%28%28set%3ASNC+CN%3E340+CN%3C350%29+OR+%28set%3ASPG+CN%3A79%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/SNC_Skyscraper_showcase_-_Jetmirs_Garden.png/150px-SNC_Skyscraper_showcase_-_Jetmirs_Garden.png" width="90" alt="Skyscraper"> | Skyscraper | Streets of New Capenna | [Scryfall](https://scryfall.com/search?q=set%3ASNC+CN%3E349+CN%3C360+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/DMU_Stained_Glass_showcase_-_Braids_Arisen_Nightmare.png/150px-DMU_Stained_Glass_showcase_-_Braids_Arisen_Nightmare.png" width="90" alt="Stained Glass"> | Stained Glass | Secret Lair bonus cards; Dominaria United; Showcase: Dominaria United; March of the Machine Multiverse Legends bonus sheet; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3ASLD+CN%3E500+CN%3C537%29+OR+%28atag%3Astained-glass+frame%3Ashowcase+-set%3ASTA%2CMH2%2CSNC%2CLTR%2CSOA%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/ONE_Ichor_showcase_-_Phyrexian_Obliterator.png/150px-ONE_Ichor_showcase_-_Phyrexian_Obliterator.png" width="90" alt="Borderless Ichor"> | Borderless Ichor | Phyrexia: All Will Be One; Showcase: All Will Be One; March of the Machine Multiverse Legends bonus sheet | [Scryfall](https://scryfall.com/search?q=%28%28set%3AONE+CN%3E284+CN%3C325%29+OR+%28set%3AMOM%2CMUL+atag%3Ablack-and-white-ink%29+OR+%28set%3ASLD+CN%3E1212+CN%3C1218%29+OR+%28set%3ASLD+CN%3A1271%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MUL_Tarkir_showcase_-_Taigam_Ojutai_Master.png/150px-MUL_Tarkir_showcase_-_Taigam_Ojutai_Master.png" width="90" alt="Dragon wing"> | Dragon wing | March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; Showcase: March of the Machine, Vol. 2 | [Scryfall](https://scryfall.com/search?q=%28%28set%3AMOM%2CMUL%2CMAT+atag%3Atarkir+frame%3Ashowcase%29+OR+%28set%3ASLD+CN%3A1269%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MUL_Ravnica_showcase_Niv-Mizzet_Reborn.png/150px-MUL_Ravnica_showcase_Niv-Mizzet_Reborn.png" width="90" alt="Ravnica City"> | Ravnica City | March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; Showcase: March of the Machine, Vol. 3; Murders at Karlov Manor; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3AMOM%2CMUL%2CMAT+atag%3Aravnica+frame%3Ashowcase%29+OR+%28set%3AMKM+CN%3E316+CN%3C324%29+OR+%28set%3ASPG+CN%3A80%29+OR+%28set%3ASLD+CN%3A1273%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MOM_Treasure_showcase_-_Ghalta_and_Mavren.png/150px-MOM_Treasure_showcase_-_Ghalta_and_Mavren.png" width="90" alt="Treasure / Gods of Ixalan"> | Treasure / Gods of Ixalan | March of the Machine Multiverse Legends bonus sheet; March of the Machine: The Aftermath; Showcase: March of the Machine, Vol. 3; The Lost Caverns of Ixalan | [Scryfall](https://scryfall.com/search?q=%28%28set%3AMOM%2CMUL%2CMAT+atag%3AIxalan-plane+frame%3Ashowcase%29+OR+%28set%3ALCI+CN%3E313+CN%3C320%29+OR+%28set%3ASLD+CN%3A1268%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Ulalek%2C_Fused_Atrocity_-_Borderless_Profile.png/150px-Ulalek%2C_Fused_Atrocity_-_Borderless_Profile.png" width="90" alt="Borderless Profile"> | Borderless Profile | Commander Masters; Modern Horizons 3; Modern Horizons 3 Commander | [Scryfall](https://scryfall.com/search?q=set%3ACMM%2CMH3%2CM3C+atag%3Aside-profile+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/LCI_Legends_of_Ixalan_showcase_-_The_Mycotyrant.png/150px-LCI_Legends_of_Ixalan_showcase_-_The_Mycotyrant.png" width="90" alt="Legends of Ixalan"> | Legends of Ixalan | The Lost Caverns of Ixalan; The Lost Caverns of Ixalan Commander; Showcase: The Lost Caverns of Ixalan | [Scryfall](https://scryfall.com/search?q=%28%28set%3ALCI+CN%3E291+CN%3C314+-CN%3A307%29+OR+%28set%3ALCC+CN%3E16+CN%3C20%29+OR+%28set%3ASLD+CN%3E1408+CN%3C1414%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/LCI_Oltec_showcase_-_Tishana-s_Tidebinder.png/150px-LCI_Oltec_showcase_-_Tishana-s_Tidebinder.png" width="90" alt="Borderless Oltec"> | Borderless Oltec | The Lost Caverns of Ixalan | [Scryfall](https://scryfall.com/search?q=set%3ALCI+CN%3E332+CN%3C353+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/LCI_Dinosaur_showcase_-_Ghalta_Stampede_Tyrant.png/150px-LCI_Dinosaur_showcase_-_Ghalta_Stampede_Tyrant.png" width="90" alt="Borderless Dinosaurs"> | Borderless Dinosaurs | The Lost Caverns of Ixalan; The Lost Caverns of Ixalan Commander | [Scryfall](https://scryfall.com/search?q=atag%3Apaleoart+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MKM_Dossier_showcase_-_Rakdos_Patron_of_Chaos.png/150px-MKM_Dossier_showcase_-_Rakdos_Patron_of_Chaos.png" width="90" alt="Dossier"> | Dossier | Murders at Karlov Manor; Showcase: Murders at Karlov Manor | [Scryfall](https://scryfall.com/search?q=%28%28set%3AMKM+CN%3E335+CN%3C377%29+OR+%28set%3ASLD+CN%3E1565+CN%3C1570%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/MKM_Magnified_showcase_-_Not_on_my_Watch.png/150px-MKM_Magnified_showcase_-_Not_on_my_Watch.png" width="90" alt="Magnified"> | Magnified | Murders at Karlov Manor | [Scryfall](https://scryfall.com/search?q=set%3AMKM+CN%3E286+CN%3C317+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/OTJ_Wanted_poster_showcase_-_Annie_Flash_The_Veteran.png/150px-OTJ_Wanted_poster_showcase_-_Annie_Flash_The_Veteran.png" width="90" alt="Wanted poster"> | Wanted poster | Outlaws of Thunder Junction; Showcase: Outlaws of Thunder Junction | [Scryfall](https://scryfall.com/search?q=%28%28set%3AOTJ+CN%3E286+CN%3C300%29+OR+%28set%3ASLD+CN%3E1686+CN%3C1691%29+OR+%28set%3ASLD+CN%3A827%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/BIG_Vault_frame_showcase_-_Sword_of_Wealth_and_Power.png/150px-BIG_Vault_frame_showcase_-_Sword_of_Wealth_and_Power.png" width="90" alt="Vault"> | Vault | The Big Score | [Scryfall](https://scryfall.com/search?q=set%3ABIG+CN%3E30+CN%3C66+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/BLB_showcase_-_Hugs_Grisly_Guardian.png/150px-BLB_showcase_-_Hugs_Grisly_Guardian.png" width="90" alt="Woodland"> | Woodland | Bloomburrow | [Scryfall](https://scryfall.com/search?q=set%3ABLB+CN%3E294+CN%3C337+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/DSK_Double_Exposure_showcase_-_Valgavoth_Terror_Eater.png/150px-DSK_Double_Exposure_showcase_-_Valgavoth_Terror_Eater.png" width="90" alt="Double Exposure"> | Double Exposure | Duskmourn: House of Horror | [Scryfall](https://scryfall.com/search?q=%28%28s%3ADSK+CN%3E350+CN%3C368%29+OR+%28s%3ADSK+CN%3E405+CN%3C411%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/DSK_Paranormal_showcase_-_Chainsaw.png/150px-DSK_Paranormal_showcase_-_Chainsaw.png" width="90" alt="Paranormal"> | Paranormal | Duskmourn: House of Horror; Showcase: Duskmourn | [Scryfall](https://scryfall.com/search?q=%28%28set%3ADSK+CN%3E301+CN%3C328%29+OR+%28set%3ASLD+CN%3E1757+CN%3C1763%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/DFT_First_Place_foil_-_Chandra_Spark_Hunter.png/150px-DFT_First_Place_foil_-_Chandra_Spark_Hunter.png" width="90" alt="First Place foil"> | First Place foil | Aetherdrift | [Scryfall](https://scryfall.com/search?q=set%3ADFT+CN%3E426+CN%3C554+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/TDM_Draconic_Neriv_Heart_of_the_Storm.png/150px-TDM_Draconic_Neriv_Heart_of_the_Storm.png" width="90" alt="Draconic"> | Draconic | Tarkir: Dragonstorm | [Scryfall](https://scryfall.com/search?q=set%3ATDM+CN%3E291+CN%3C327+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/TDM_Borderless_Clan_Perennation.png/150px-TDM_Borderless_Clan_Perennation.png" width="90" alt="Clan"> | Clan | Tarkir: Dragonstorm | [Scryfall](https://scryfall.com/search?q=set%3ATDM+CN%3E326+CN%3C377+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/EOE_Viewpoer_Adagia%2C_Windswept_Bastion.png/150px-EOE_Viewpoer_Adagia%2C_Windswept_Bastion.png" width="90" alt="Viewport"> | Viewport | Edge of Eternities | [Scryfall](https://scryfall.com/search?q=set%3AEOE+%28CN%3E276+CN%3C287+OR+CN%3E371+CN%3C382%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/EOS_Gemstone_Caverns.png/150px-EOS_Gemstone_Caverns.png" width="90" alt="Stellar Sights"> | Stellar Sights | Stellar Sights | [Scryfall](https://scryfall.com/search?q=set%3AEOS+%28CN%3E90+CN%3C136+OR+CN%3C46%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/EOS_Poster_Strip_Mine.png/150px-EOS_Poster_Strip_Mine.png" width="90" alt="Poster Stellar Sights"> | Poster Stellar Sights | Stellar Sights | [Scryfall](https://scryfall.com/search?q=set%3AEOS+%28CN%3E135+CN%3C181+OR+CN%3E45+CN%3C91%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/ECL_Fable_frame_showcase_-_Mutable_Explorer.png/150px-ECL_Fable_frame_showcase_-_Mutable_Explorer.png" width="90" alt="Fable"> | Fable | Lorwyn Eclipsed | [Scryfall](https://scryfall.com/search?q=set%3AECL+CN%3E296+CN%3C347+unique%3Aprints) |

### Universes Beyond

| Example | Style | Primary releases | Search |
|---|---|---|---|
| <img src="https://files.mtg.wiki/thumb/LTR_Ring_showcase_-_Gandalf_the_Grey.png/150px-LTR_Ring_showcase_-_Gandalf_the_Grey.png" width="90" alt="Ring"> | Ring | The Lord of the Rings: Tales of Middle-earth | [Scryfall](https://scryfall.com/search?q=set%3ALTR+CN%3E301+CN%3C332+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Gollum_Obsessed_Stalker_Scroll_frame.jpg/150px-Gollum_Obsessed_Stalker_Scroll_frame.jpg" width="90" alt="Scrolls of Middle-earth"> | Scrolls of Middle-earth | The Lord of the Rings Holiday Release | [Scryfall](https://scryfall.com/search?q=%28%28set%3ALTR+CN%3E451+CN%3C731%29+OR+%28set%3ALTC+CN%3E411+CN%3C491%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/WHO_TARDIS_showcase_-_The_Fourth_Doctor.png/150px-WHO_TARDIS_showcase_-_The_Fourth_Doctor.png" width="90" alt="TARDIS"> | TARDIS | Doctor Who | [Scryfall](https://scryfall.com/search?q=set%3AWHO+CN%3E534+CN%3C565+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/PIP_Pip-Boy_showcase_-_Alpha_Deathclaw.png/150px-PIP_Pip-Boy_showcase_-_Alpha_Deathclaw.png" width="90" alt="Pip-Boy"> | Pip-Boy | Fallout | [Scryfall](https://scryfall.com/search?q=set%3APIP+CN%3E326+CN%3C353+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/ACR_Memory_Corridor_showcase_-_Altair_Ibn-LaAhad.png/150px-ACR_Memory_Corridor_showcase_-_Altair_Ibn-LaAhad.png" width="90" alt="Memory Corridor"> | Memory Corridor | Assassin's Creed | [Scryfall](https://scryfall.com/search?q=%28%28set%3AACR+CN%3E126+CN%3C155%29+OR+%28set%3AACR+CN%3E266+CN%3C272%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/SPM_Web-slinger_Radioactive_Spider.png/150px-SPM_Web-slinger_Radioactive_Spider.png" width="90" alt="Web-slinger"> | Web-slinger | Marvel's Spider-Man | [Scryfall](https://scryfall.com/search?q=set%3ASPM+CN%3E207+CN%3C218+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/SPM_Panel_Spider-Woman%2C_Stunning_Savior.png/150px-SPM_Panel_Spider-Woman%2C_Stunning_Savior.png" width="90" alt="Panel"> | Panel | Marvel's Spider-Man; Marvel Super Heroes | [Scryfall](https://scryfall.com/search?q=%28%28set%3ASPM+CN%3E217+CN%3C232%29+OR+%28set%3AMSH+CN%3E303+CN%3C308%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/TLA_Elemental_frame_Bumi%2C_Unleashed.png/150px-TLA_Elemental_frame_Bumi%2C_Unleashed.png" width="90" alt="Elemental"> | Elemental | Avatar: The Last Airbender; Avatar: The Last Airbender Eternal; Avatar: The Last Airbender - One with the Elements | [Scryfall](https://scryfall.com/search?q=%28set%3ATLA+CN%3E335+CN%3C354+OR+set%3ATLE+CN%3E304+CN%3C318+OR+set%3ASLD+CN%3E2299+CN%3C2306%29+unique%3Aprints) |

### Other Recurring Themes

| Example | Style | Primary releases | Search |
|---|---|---|---|
| <img src="https://files.mtg.wiki/thumb/J25_Anime_showcase_-_Rionya_Fire_Dancer.png/150px-J25_Anime_showcase_-_Rionya_Fire_Dancer.png" width="90" alt="Anime / Manga"> | Anime / Manga | Duel Decks: Jace vs. Chandra (2010 Japan re-release); War of the Spark; Planeswalker Championship promos; Mystical Archive (Japan); ... | [Scryfall](https://scryfall.com/search?q=atag%3Aanime+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/BRR_card_numbered.jpg/150px-BRR_card_numbered.jpg" width="90" alt="Blueprint / Schematic / Field Notes"> | Blueprint / Schematic / Field Notes | Secret Lair bonus cards (Blueprints); Monster Anatomy 101; The Brothers' War Retro Artifacts bonus sheet; Assassin's Creed: Da Vinci's Designs; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3ABRO+CN%3E292+CN%3C297%29+OR+%28set%3ABRR+CN%3E63+CN%3C127%29+OR+%28set%3ABLB+CN%3E286+CN%3C295%29+OR+%28set%3ASLD+CN%3E315+CN%3C321%29+OR+%28set%3ASLD+CN%3E602+CN%3C608%29+OR+%28set%3ASLD+CN%3E690+CN%3C696%29+OR+%28set%3ASLD+CN%3A802+OR+CN%3E1569+CN%3C1575%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Chibi_Karn_Scion_of_Urza.png/150px-Chibi_Karn_Scion_of_Urza.png" width="90" alt="Chibi"> | Chibi | Li'l Walkers; Li'l'ler Walkers; Li'l'est Walkers; Li'l Legends | [Scryfall](https://scryfall.com/search?q=atag%3Achibi+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/Overlord_of_the_Hauntwoods_Fracture_foil.png/150px-Overlord_of_the_Hauntwoods_Fracture_foil.png" width="90" alt="Japan Showcase / Fracture foils"> | Japan Showcase / Fracture foils | Duskmourn: House of Horror; Magic: The Gathering Foundations; Aetherdrift; Edge of Eternities | [Scryfall](https://scryfall.com/search?q=%28%28set%3ADSK+CN%3E385+CN%3C406%29+OR+%28set%3AFDN+CN%3E421+CN%3C442%29+OR+%28set%3ADFT+CN%3E396+CN%3C417%29+OR+%28set%3AEOE+%28CN%3E356+CN%3C367+OR+CN%3E382+CN%3C393%29%29%29+unique%3Aprints) |
| <img src="https://files.mtg.wiki/thumb/INR_movie_poster_showcase_-_Griselbrand.png/150px-INR_movie_poster_showcase_-_Griselbrand.png" width="90" alt="Posters"> | Posters | Party Hard, Shred Harder; Our Show Is On Friday, Can You Make It?; Monster Movie Marathon; Thrilling Tales of the Undead; ... | [Scryfall](https://scryfall.com/search?q=%28%28set%3ASLD+CN%3E137+CN%3C143%29+OR+%28set%3ASLD+CN%3E1198+CN%3C1203%29%29+unique%3Aprints) |

## Full-Magic-Pack Showcase Package Names

Observed package slugs on 2026-05-10:

```text
aetherdrift-first-place
aetherdrift-first-place-walker
assassins-creed-memory-corridor
avatar-elemental
bloomburrow-borderless-anime
bloomburrow-woodland
capenna-art-deco
capenna-art-deco-walker
capenna-golden-age
capenna-skyscraper
doctor-who-tardis
dominaria-stained-glass
dungeon-module
duskmourn-paranormal
eldraine-tales
etched-foil
eternities-stellar-sights
eternities-stellar-sights-poster
fallout-pipboy
ikoria-crystal
innistrad-double-feature
innistrad-double-feature-walker
innistrad-mid
innistrad-vow
ixalan-caverns
ixalan-legends
ixalan-treasure
kaldheim
kaldheim-dfc
kamigawa-neon
kamigawa-ninja
kamigawa-samurai
lorwyn-fable
lotr
lotr-scroll
lotr-scroll-saga
monster-manual
praetor
ravnica-city-mural
ravnica-dossier
ravnica-magnified
spiderman-panel
spiderman-web-slinger
strixhaven
strixhaven-jp
tarkir-draconic
tarkir-draconic-adventure
tarkir-dragon-wing
tarkir-ghostfire
tarkir-ghostfire-walker
theros-constellation
thunder-junction-breaking-news
thunder-junction-vault
thunder-junction-wanted-poster
tmnt-pixel
tmnt-sewer
unfinity
zendikar
```

## Maintenance Notes

- Re-run the Full-Magic-Pack directory sample before implementing any frame
  port. Treat the commit hash in this file as a snapshot, not a dependency pin.
- Re-check MTG Wiki and Scryfall when new Standard or Universes Beyond sets
  release. Showcase naming changes faster than base frame taxonomy.
- Prefer implementing generic renderer primitives first: border shell,
  art-window geometry, pinline color model, typeline/title/textbox masks,
  special stat boxes, stamp slots, and optional overlay layers.
- Keep licensed or brand-specific art assets in a local-only pack until there is
  a distribution policy.
