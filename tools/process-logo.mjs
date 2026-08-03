// One-off logo asset pipeline for the Copor airsoft club emblem.
// Not shipped to the site - run locally with `node process-logo.mjs`.
import sharp from "sharp";
import potrace from "potrace";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "..", "images", "12000.jpg");
const OUT = path.join(__dirname, "..", "assets", "logo");
fs.mkdirSync(OUT, { recursive: true });

const PALETTE = {
  bg: "#0c0c0c",
  panel: "#1a1c16",
  khaki: "#a89f86",
  khakiDark: "#8d8579",
  red: "#bf4946",
  text: "#e8e4da",
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function loadRaw(input) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

// Background removal: BFS flood fill from the border, testing each pixel
// against a FIXED anchor color (the measured background) rather than
// diffusing neighbor-to-neighbor. The badge has a hard edge (a couple of
// px of anti-aliasing) against a uniformly dark background, so an anchor
// test stops cleanly at that edge - a neighbor-chained diff instead funnels
// through gradual jpeg-compression gradients and leaks into the badge.
function floodFillBackground(data, width, height, channels, tolerance = 32) {
  function idxOf(x, y) {
    return y * width + x;
  }
  function px(i) {
    const o = i * channels;
    return [data[o], data[o + 1], data[o + 2]];
  }

  const marginXs = [0, 1, 2, 3, 4, 5, width - 6, width - 5, width - 4, width - 3, width - 2, width - 1];
  const marginYs = [0, 1, 2, 3, 4, 5, height - 6, height - 5, height - 4, height - 3, height - 2, height - 1];
  let sr = 0,
    sg = 0,
    sb = 0,
    n = 0;
  for (let x = 0; x < width; x++)
    for (const y of marginYs) {
      const [r, g, b] = px(idxOf(x, y));
      sr += r;
      sg += g;
      sb += b;
      n++;
    }
  for (let y = 0; y < height; y++)
    for (const x of marginXs) {
      const [r, g, b] = px(idxOf(x, y));
      sr += r;
      sg += g;
      sb += b;
      n++;
    }
  const anchor = [sr / n, sg / n, sb / n];

  function diffAnchor(p) {
    return Math.max(Math.abs(p[0] - anchor[0]), Math.abs(p[1] - anchor[1]), Math.abs(p[2] - anchor[2]));
  }

  const bg = new Uint8Array(width * height); // 1 = background
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let qHead = 0,
    qTail = 0;

  function tryAdd(i) {
    if (visited[i]) return;
    visited[i] = 1;
    if (diffAnchor(px(i)) <= tolerance) {
      bg[i] = 1;
      queue[qTail++] = i;
    }
  }

  for (let x = 0; x < width; x++) {
    tryAdd(idxOf(x, 0));
    tryAdd(idxOf(x, height - 1));
  }
  for (let y = 0; y < height; y++) {
    tryAdd(idxOf(0, y));
    tryAdd(idxOf(width - 1, y));
  }

  while (qHead < qTail) {
    const i = queue[qHead++];
    const x = i % width;
    const y = (i / width) | 0;
    if (x > 0) tryAdd(i - 1);
    if (x < width - 1) tryAdd(i + 1);
    if (y > 0) tryAdd(i - width);
    if (y < height - 1) tryAdd(i + width);
  }
  return bg;
}

function bboxOf(mask, width, height, isForeground) {
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (isForeground(mask[i])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

async function main() {
  console.log("Loading source:", SRC);
  const { data, width, height, channels } = await loadRaw(SRC);

  console.log("Flood-filling background...");
  const bg = floodFillBackground(data, width, height, channels, 32);

  // Alpha mask: 255 = foreground (the badge), 0 = background.
  const alpha = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) alpha[i] = bg[i] ? 0 : 255;

  // Feather the mask edge for anti-aliasing. NOTE: sharp's .blur() silently
  // upconverts a 1-channel raw buffer to 3 channels on output, so we have to
  // pull channel 0 back out or every downstream raw-buffer read misaligns.
  const alphaImg = sharp(alpha, { raw: { width, height, channels: 1 } }).blur(1.2).extractChannel(0);
  const featheredAlpha = await alphaImg.raw().toBuffer();

  // RGB source as its own buffer for compositing.
  const rgbOnly = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const o3 = i * 3;
    rgbOnly[o3] = data[o];
    rgbOnly[o3 + 1] = data[o + 1];
    rgbOnly[o3 + 2] = data[o + 2];
  }

  const cutout = sharp(rgbOnly, { raw: { width, height, channels: 3 } }).joinChannel(
    featheredAlpha,
    { raw: { width, height, channels: 1 } }
  );
  const cutoutBuf = await cutout.png().toBuffer();

  // Crop to bounding box of the foreground with a small padding.
  const bbox = bboxOf(featheredAlpha, width, height, (v) => v > 20);
  const pad = 10;
  const left = Math.max(0, bbox.minX - pad);
  const top = Math.max(0, bbox.minY - pad);
  const cropW = Math.min(width, bbox.maxX + pad) - left;
  const cropH = Math.min(height, bbox.maxY + pad) - top;
  console.log("Bounding box:", { left, top, cropW, cropH });

  const cropped = sharp(cutoutBuf).extract({ left, top, width: cropW, height: cropH });
  const croppedBuf = await cropped.png().toBuffer();

  await sharp(croppedBuf).toFile(path.join(OUT, "copor-logo-full-color.png"));
  await sharp(croppedBuf)
    .resize({ height: 1200 })
    .png({ quality: 90 })
    .toFile(path.join(OUT, "copor-logo-web.png"));
  await sharp(croppedBuf)
    .resize({ height: 1200 })
    .webp({ quality: 88 })
    .toFile(path.join(OUT, "copor-logo-web.webp"));
  await sharp(croppedBuf)
    .resize({ height: 2400 })
    .png()
    .toFile(path.join(OUT, "copor-logo-print.png"));

  console.log("Full-color cutout exported.");

  // --- Single-color "ink" version -------------------------------------
  // Within the foreground, treat the lighter (metallic text, border, wolf
  // highlights) pixels as "ink"; the dark shield fill / shadows drop out.
  const { data: croppedRaw, info: croppedInfo } = await sharp(croppedBuf)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cw = croppedInfo.width,
    ch = croppedInfo.height,
    cc = croppedInfo.channels; // 4 (RGBA)

  // Adaptive (local-contrast) threshold: the mockup has baked-in lighting
  // (a soft highlight sweeps across the shield), so a single global
  // luminance cutoff misclassifies whole lit regions as "ink". Instead
  // compare each pixel's fine-detail luminance to a heavily-blurred
  // estimate of its local surroundings, so only locally-brighter detail
  // (text, wolf highlights) counts, regardless of the ambient lighting.
  const fineLum = await sharp(croppedBuf).greyscale().blur(2.2).extractChannel(0).raw().toBuffer();
  const localBase = await sharp(croppedBuf).greyscale().blur(35).extractChannel(0).raw().toBuffer();

  const diffs = [];
  for (let i = 0; i < cw * ch; i++) {
    const a = croppedRaw[i * cc + 3];
    if (a < 40) continue;
    diffs.push(fineLum[i] - localBase[i]);
  }
  diffs.sort((a, b) => a - b);
  const threshold = diffs[Math.floor(diffs.length * 0.62)]; // favors legible detail over background fill
  console.log("Ink threshold (local contrast):", threshold);

  const inkAlphaRaw = Buffer.alloc(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    const a = croppedRaw[i * cc + 3];
    if (a < 40) {
      inkAlphaRaw[i] = 0;
      continue;
    }
    inkAlphaRaw[i] = fineLum[i] - localBase[i] >= threshold ? 255 : 0;
  }

  // Morphological clean-up: median filter knocks out any remaining
  // isolated speckle pixels along the binary edge, then re-binarize.
  const medianed = await sharp(inkAlphaRaw, { raw: { width: cw, height: ch, channels: 1 } })
    .median(5)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const inkAlpha = Buffer.alloc(cw * ch);
  for (let i = 0; i < cw * ch; i++) inkAlpha[i] = medianed[i] >= 128 ? 255 : 0;

  async function soloColor(hex, filename) {
    const [r, g, b] = hexToRgb(hex);
    const rgb = Buffer.alloc(cw * ch * 3);
    for (let i = 0; i < cw * ch; i++) {
      rgb[i * 3] = r;
      rgb[i * 3 + 1] = g;
      rgb[i * 3 + 2] = b;
    }
    const featheredInk = await sharp(inkAlpha, { raw: { width: cw, height: ch, channels: 1 } })
      .blur(0.6)
      .extractChannel(0)
      .raw()
      .toBuffer();
    const img = sharp(rgb, { raw: { width: cw, height: ch, channels: 3 } }).joinChannel(featheredInk, {
      raw: { width: cw, height: ch, channels: 1 },
    });
    await img.png().toFile(path.join(OUT, filename));
  }

  await soloColor("#000000", "copor-logo-single-color-black.png");
  await soloColor(PALETTE.khaki, "copor-logo-single-color-khaki.png");
  console.log("Single-color versions exported.");

  // --- Vector trace of the single-color silhouette ---------------------
  const bwForTrace = Buffer.alloc(cw * ch);
  for (let i = 0; i < cw * ch; i++) bwForTrace[i] = inkAlpha[i]; // 255 = ink
  const bwPng = await sharp(bwForTrace, { raw: { width: cw, height: ch, channels: 1 } })
    .negate() // potrace traces dark-on-light by default
    .png()
    .toBuffer();

  await new Promise((resolve, reject) => {
    potrace.trace(bwPng, { threshold: 128, color: "#000000", background: "transparent" }, (err, svg) => {
      if (err) return reject(err);
      fs.writeFileSync(path.join(OUT, "copor-logo-single-color.svg"), svg);
      resolve();
    });
  });
  console.log("Vector trace exported.");

  // --- Favicon / touch icon / social preview ---------------------------
  await sharp(croppedBuf)
    .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, "favicon-48.png"));
  await sharp(croppedBuf)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUT, "favicon-32.png"));
  await sharp(croppedBuf)
    .resize(180, 180, { fit: "contain", background: hexToRgb(PALETTE.bg).concat(255) })
    .png()
    .toFile(path.join(OUT, "apple-touch-icon.png"));

  const socialLogo = await sharp(croppedBuf).resize({ height: 520 }).png().toBuffer();
  const socialLogoMeta = await sharp(socialLogo).metadata();
  const socialBg = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: hexToRgb(PALETTE.bg),
    },
  })
    .png()
    .toBuffer();
  await sharp(socialBg)
    .composite([
      {
        input: socialLogo,
        left: Math.round((1200 - socialLogoMeta.width) / 2),
        top: Math.round((630 - socialLogoMeta.height) / 2),
      },
    ])
    .png()
    .toFile(path.join(OUT, "social-preview.png"));

  console.log("Favicon / touch icon / social preview exported.");

  fs.writeFileSync(
    path.join(OUT, "palette.md"),
    `# Copor emblem palette (sampled from images/12000.jpg)\n\n` +
      Object.entries(PALETTE)
        .map(([k, v]) => `- \`--color-${k}\`: ${v}`)
        .join("\n") +
      "\n"
  );

  console.log("Done. Output in", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
