# CardMagic Asset Packs

This directory is reserved for local, bundled card-rendering assets.

The active local bundle is `full-magic-pack`, copied from the user-supplied
Magic Set Editor asset pack at:

```text
/Users/josiahmann/Library/CloudStorage/Dropbox/Custom Cards/Full-Magic-Pack-main
```

The app currently consumes:

- `frames/*.jpg` for card frame rasters
- `symbols/*.png` for W/U/B/R/G/C/T mana glyph images
- `pt/*.png` for power/toughness overlays
- `fonts/*.ttf` for Beleren and MPlantin typography

Suggested future structure for a licensed asset pack:

```text
assets/card-assets/<pack-id>/
  manifest.json
  frames/
  borders/
  symbols/
  fonts/
  print-treatments/
```

Only place assets here when you own the rights, are keeping them local, or have
a license to distribute them inside the app.

The in-app "Download template" action exports a starter `manifest.json` with
the expected frame, symbol, font, and print-treatment keys.
