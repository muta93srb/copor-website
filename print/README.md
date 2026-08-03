# Copor print-ready logo files

Copied from [`assets/logo/`](../assets/logo/README.md) — see that folder for the full asset
pipeline and the web-only files. This folder holds just what you need to hand to a print shop
or use yourself for t-shirts and plastic (engraving/vinyl).

| File | Use |
| --- | --- |
| `copor-logo-print.png` | Full color, upscaled to ~2400px tall — for large-format printing (DTF/sublimation transfers on t-shirts). |
| `copor-logo-full-color.png` | Full color master, transparent background, ~1031px tall (source resolution). |
| `copor-logo-single-color-black.png` | One-color (black) version — screen printing on light/khaki garments, laser engraving on plastic, vinyl cutting. |
| `copor-logo-single-color-khaki.png` | Same shape in brand khaki (`#a89f86`) — for printing on dark garments (black/olive shirts). |
| `copor-logo-single-color.svg` | Vector trace of the single-color silhouette — for cutting/engraving machines that need paths. |
| `palette.md` | Exact brand hex colors sampled from the source badge. |

**Before a commercial print run:** the source photo was only ~935×1082px, so `copor-logo-print.png`
is upscaled via interpolation, not re-rendered detail, and the single-color versions have some
fur-texture grain from an automated background threshold. Worth a quick manual clean-up pass in
Illustrator/Inkscape first — see [`assets/logo/README.md`](../assets/logo/README.md) for details.
