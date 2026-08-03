// Scans site/gallery/images/ and (re)writes site/gallery/manifest.json.
// Runs locally and in CI (see .github/workflows/deploy.yml) - no dependencies.
const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "..", "site", "gallery", "images");
const MANIFEST_PATH = path.join(__dirname, "..", "site", "gallery", "manifest.json");
const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function captionFromFilename(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  const spaced = base.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const images = files.map((file) => ({
    file,
    caption: captionFromFilename(file),
  }));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ images }, null, 2) + "\n");
  console.log(`Wrote ${MANIFEST_PATH} with ${images.length} image(s).`);
}

main();
