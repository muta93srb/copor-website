# Copor logo assets

Generated from `images/12000.jpg` by [`tools/process-logo.mjs`](../../tools/process-logo.mjs). Re-run that
script any time (`cd tools && node process-logo.mjs`) to regenerate everything below from the source mockup.

## Files and intended use

| File | Use |
| --- | --- |
| `copor-logo-full-color.png` | Master full-color cutout, transparent background, ~1031px tall. Source for all other crops/resizes. |
| `copor-logo-print.png` | Full-color, upscaled to ~2400px tall, for large-format printing (e.g. DTF/sublimation transfers on t-shirts). **This is interpolated upscaling, not added detail** — the source photo is only ~935×1082px, so at large print sizes (e.g. a full chest print) some softness will show. For screen-printed film separations or embroidery digitizing, hand this + the single-color files to a print shop for a proper vector redraw. |
| `copor-logo-web.png` / `.webp` | Full-color, 1200px tall, optimized for the website header/hero. |
| `copor-logo-single-color-black.png` | One-color (black) version — the lit/detail areas (text, wolf highlights, border) as solid black on transparent. For screen printing in a single ink on a **light or khaki** garment, laser engraving, or vinyl cutting. |
| `copor-logo-single-color-khaki.png` | Same shape, in the brand khaki (`#a89f86`), for a single ink on a **dark** garment (e.g. black or olive shirt). |
| `copor-logo-single-color.svg` | Vector trace (via `potrace`) of the single-color silhouette, for cutting/engraving machines that need paths rather than pixels. |
| `favicon-32.png` / `favicon-48.png` | Site favicon. |
| `apple-touch-icon.png` | 180×180 icon for iOS home-screen bookmarks, on brand-black background. |
| `social-preview.png` | 1200×630 share-preview image (logo centered on brand-black), for Open Graph / Twitter cards. |
| `palette.md` | Hex colors sampled directly from the source badge, used as the website's CSS theme. |

## Known limitations (automated extraction, not a hand redraw)

- The background cutout uses a flood-fill keyed to the mockup's near-black background, which works cleanly
  since the badge has a hard edge — but the single-color versions are produced by an **adaptive local-contrast
  threshold**, which is a best-effort way to flatten a photoreal/lit patch mockup into two-tone art. Fine fur
  texture on the wolf produces some speckle/grain rather than perfectly clean linework.
- Recommended before commercial printing (screen-print film separations, embroidery digitizing, large vinyl
  cuts): open `copor-logo-single-color-black.png` or the `.svg` in a vector editor (Illustrator/Inkscape) and
  do a quick manual clean-up pass on the fur speckle and outer border.
- Source resolution (935×1082px) caps how large the full-color version can print before softness shows;
  `copor-logo-print.png` is upscaled via interpolation, not re-rendered detail.
