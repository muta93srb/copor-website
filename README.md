# ЧОПОР (Copor) Airsoft Klub

Fully static club website, hosted for free on GitHub Pages.

## Structure

- `site/` — the deployed website (plain HTML/CSS/JS, no build step required to run it).
  - `index.html`, `pravilnik.html`, `bratski-timovi.html`, `asz-jug.html` — pages.
  - `i18n/` — translation dictionaries (`sr-Cyrl.json`, `sr-Latn.json`, `en.json`); language switcher in the header.

    The pages themselves are written in Serbian Cyrillic. On a first visit the language is taken from the browser (Serbian Cyrillic, Serbian Latin, or English), falling back to **Serbian Latin**; the theme is taken from the OS, falling back to **dark**. Either is overridden the moment the reader uses the switcher or the theme toggle, and that choice is then remembered.

    Getting a language other than the one in the markup on screen without a visible flicker takes three pieces, so be careful when editing them together: the inline resolver in each page's `<head>`, `js/i18n.js` (loaded from `<head>`, not the end of `<body>` — it has to translate nodes as the parser emits them), and the `html[data-i18n-pending]` rule in `css/styles.css`. Dictionaries are cached in `localStorage` so moving between pages needs no request at all; a changed dictionary is picked up on the next page load.

    Two spelling rules for the Cyrillic text: foreign words are written as they are pronounced (ерсофт, Хајкс), but **unit symbols — J, fps, m, cm, g, s — stay in Latin letters in every language**, as international symbols do. Where a unit stands on its own in the markup (replica cards, the rulebook table) it is plain text rather than a translation key, so no translation can change it.
  - `gallery/images/` — **drop photos here.** `gallery/manifest.json` is auto-generated on every deploy (see below) — you never edit it by hand.
  - `assets/logo/` — web-sized logo files only (favicon, header logo, social preview).
  - `assets/teams/` — logos of the allied teams on `bratski-timovi.html` and of the ASZ JUG founding teams on `asz-jug.html`. `placeholder-team.svg` stands in for a team whose logo we do not have yet.
  - `assets/asz-jug/crest.svg` — the ASZ JUG crest, vectorised from the community's own artwork. The file itself is flat; the glow around it on the page is CSS (`.asz-crest`).
  - `assets/asz-jug/patch.svg` — the same crest as the woven patch worn on the uniform: the same traced artwork on the patch's colours, with the tricolour band, red/blue corner flashes and a stitched merrow edge. Colours and proportions were measured from a photo of the patch, registered onto the traced artwork. The two corner flashes are drawn as mirror images — on the photographed patch the blue one reads ~15% larger, most likely because that corner is bent in the photo and the merrow covers the two corners unevenly; if the real design is asymmetric, the two triangle `<path>`s just under the banner `<rect>` in `patch.svg` are what to change.
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
