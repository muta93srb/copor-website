# ЧОПОР (Copor) Airsoft Klub

Fully static club website, hosted for free on GitHub Pages.

## Structure

- `site/` — the deployed website (plain HTML/CSS/JS, no build step required to run it).
  - `index.html`, `pravilnik.html`, `bratski-timovi.html`, `asz-jug.html` — pages.
  - `i18n/` — translation dictionaries (`sr-Cyrl.json`, `sr-Latn.json`, `en.json`); language switcher in the header.
  - `gallery/images/` — **drop photos here.** `gallery/manifest.json` is auto-generated on every deploy (see below) — you never edit it by hand.
  - `assets/logo/` — web-sized logo files only (favicon, header logo, social preview).
  - `assets/teams/` — logos of the allied teams shown on `bratski-timovi.html`.
  - `assets/loadout/` — images opened by clicking a loadout item on the home page. Each item's `data-img` in `index.html` points at its image; the `placeholder-*.svg` files stand in until real photos are added.
  - `assets/uniform/` — `dpm-camo.svg`, the DPM camo of uniform 2's pants, traced from the Horus P-2 GEN II product photo.
- `print/` — the print-ready logo files (full color, single-color, vector, large PNG) for t-shirts and plastic/engraving — hand this folder to a print shop. **Not part of the deployed site.** See [print/README.md](print/README.md).
- `assets/logo/` (repo root) — the full logo asset pipeline output, including the `print/` files plus web-only versions. See [assets/logo/README.md](assets/logo/README.md).
- `images/` — original source mockups the logo was extracted from.
- `tools/` — one-off Node scripts used to build assets (`process-logo.mjs`, `generate-gallery-manifest.js`). Not deployed.
- `.github/workflows/deploy.yml` — regenerates the gallery manifest and deploys `site/` to GitHub Pages on every push to `main`.

## Adding gallery photos

1. Drop image files (`.jpg`, `.png`, `.webp`, `.gif`) into `site/gallery/images/` — locally via git, or directly on GitHub via **Add file → Upload files** in that folder.
2. Commit / push (or commit directly on GitHub's web UI).
3. The GitHub Actions workflow regenerates `gallery/manifest.json` and redeploys automatically — no manual editing needed.

## Credits

The replica silhouettes on the home page (the replica cards and the primary/sidearm loadout placeholders) are by [Bes-ART](https://commons.wikimedia.org/wiki/User:Bes-ART) on Wikimedia Commons, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (recoloured and resized). The license requires the credit line shown under the replicas; the adapted icons stay under CC BY-SA 4.0.

## Local preview

```bash
npx http-server site
```

Then open the printed local URL. (Plain `file://` won't work — the gallery/i18n `fetch()` calls need an actual HTTP server.)

## Hosting on GitHub Pages

1. Create a new **public** GitHub repository.
2. Push this repo to it (`git remote add origin <url>`, `git push -u origin main`).
3. In the repo, go to **Settings → Pages → Source** and select **GitHub Actions**.
4. Push again (or re-run the workflow) — the site deploys automatically to `https://<username>.github.io/<repo>/`.
