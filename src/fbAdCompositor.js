/**
 * Facebook Ad Compositor — Template-based ad image generator.
 *
 * Generates 1080×1350 Facebook feed ads by compositing:
 *   background + text (SVG) + Before/After images + product image + badge + CTA
 *
 * Reference: input/references/winning-ads/image 3.png
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

// ─── Canvas constants ────────────────────────────────────────────────────────
const W = 1080;
const H = 1350;

// ─── Background presets ──────────────────────────────────────────────────────
const BACKGROUNDS = {
  "light-blue": { r: 214, g: 232, b: 248 },
  "light-gray": { r: 240, g: 240, b: 240 },
  white: { r: 255, g: 255, b: 255 }
};

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function escapeXml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Wrap long text into multiple lines that fit within maxWidth (in characters).
 */
function wrapText(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Build the full-page SVG overlay with all text elements.
 */
function buildTextOverlaySvg({
  hookLines,
  subtitle,
  beforeLabel = "Before",
  afterLabel = "After",
  badgeNumber = "712,000",
  badgeText = "Micro-delivery\nchannels",
  rating = "4.7/5",
  reviewCount = "based on 1,882 reviews",
  ctaText = "Get deeper. Stay clearer. Powered by Spicules.",
  bgKey = "light-blue"
}) {
  // ── Gradient background ──
  const bg = BACKGROUNDS[bgKey] || BACKGROUNDS["light-blue"];
  const bgTop = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  // Slightly lighter at bottom
  const bgBot = `rgb(${Math.min(255, bg.r + 20)}, ${Math.min(255, bg.g + 12)}, ${Math.min(255, bg.b + 8)})`;

  // ── Hook title positioning ──
  const hookFontSize = 52;
  const hookLineHeight = 64;
  const hookStartY = 80;

  const hookSvgLines = hookLines
    .map(
      (line, i) =>
        `<text x="540" y="${hookStartY + i * hookLineHeight}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${hookFontSize}" font-weight="700" fill="#1a1a1a">${escapeXml(line)}</text>`
    )
    .join("\n    ");

  // ── Subtitle ──
  const subtitleY = hookStartY + hookLines.length * hookLineHeight + 20;
  const subtitleSvg = `<text x="540" y="${subtitleY}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="26" fill="#3a3a3a">${escapeXml(subtitle)}</text>`;

  // ── Before / After labels ──
  const baLabelY = 680;
  const beforeLabelSvg = `<text x="345" y="${baLabelY}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" fill="#555">${escapeXml(beforeLabel)}</text>`;
  const afterLabelSvg = `<text x="735" y="${baLabelY}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" fill="#555">${escapeXml(afterLabel)}</text>`;

  // ── Badge (circle with number) ──
  const badgeCx = 200;
  const badgeCy = 830;
  const badgeR = 75;
  const badgeSvg = `
    <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="#fff" stroke="#ddd" stroke-width="2"/>
    <text x="${badgeCx}" y="${badgeCy - 12}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="26" font-weight="700" fill="#1a1a1a">${escapeXml(badgeNumber)}</text>
    <text x="${badgeCx}" y="${badgeCy + 14}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" fill="#666">Micro-delivery</text>
    <text x="${badgeCx}" y="${badgeCy + 32}" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" fill="#666">channels</text>
  `;

  // ── Connecting line from badge to product area ──
  const lineSvg = `<line x1="${badgeCx + badgeR}" y1="${badgeCy}" x2="520" y2="${badgeCy + 20}" stroke="#888" stroke-width="1.5" stroke-dasharray="4,3"/>`;

  // ── Star rating ──
  const starY = 1010;
  const starSize = 22;
  const starSpacing = 26;
  const starStartX = 100;
  const stars = Array.from({ length: 5 })
    .map((_, i) => {
      const x = starStartX + i * starSpacing;
      return `<text x="${x}" y="${starY}" font-size="${starSize}" fill="#f5a623">★</text>`;
    })
    .join("\n    ");
  const ratingSvg = `
    ${stars}
    <text x="${starStartX + 5 * starSpacing + 8}" y="${starY}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" font-weight="700" fill="#1a1a1a">${escapeXml(rating)}</text>
  `;
  const reviewSvg = `<text x="${starStartX}" y="${starY + 28}" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" fill="#888">${escapeXml(reviewCount)}</text>`;

  // ── CTA bottom bar ──
  const ctaBarY = 1250;
  const ctaBarH = 60;
  const ctaBarR = 30;
  const ctaSvg = `
    <rect x="60" y="${ctaBarY}" width="960" height="${ctaBarH}" rx="${ctaBarR}" fill="#2c2c2c"/>
    <text x="540" y="${ctaBarY + 38}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-style="italic" fill="#fff">${escapeXml(ctaText)}</text>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}"/>
      <stop offset="100%" stop-color="${bgBot}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Hook title -->
  ${hookSvgLines}

  <!-- Subtitle -->
  ${subtitleSvg}

  <!-- Before / After labels -->
  ${beforeLabelSvg}
  ${afterLabelSvg}

  <!-- Badge circle -->
  ${badgeSvg}

  <!-- Connecting line -->
  ${lineSvg}

  <!-- Star rating -->
  ${ratingSvg}
  ${reviewSvg}

  <!-- CTA bar -->
  ${ctaSvg}
</svg>`;
}

/**
 * Create a rounded-rectangle mask for an image.
 */
function roundedRectMask(w, h, r = 20) {
  return Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="white"/></svg>`
  );
}

/**
 * Load an image, resize, and apply rounded corners.
 */
async function loadRoundedImage(filePath, width, height, radius = 20) {
  const resized = await sharp(filePath)
    .resize(width, height, { fit: "cover" })
    .toBuffer();

  const mask = await sharp(roundedRectMask(width, height, radius))
    .resize(width, height)
    .toBuffer();

  return sharp(resized)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

/**
 * Main entry: compose a Facebook ad image.
 *
 * @param {object} opts
 * @param {string} opts.hookText      - Main headline text
 * @param {string} opts.subtitle      - Subtitle text
 * @param {string} opts.beforePath    - Path to Before image
 * @param {string} opts.afterPath     - Path to After image
 * @param {string} opts.productPath   - Path to product image (PNG, ideally with transparency)
 * @param {string} opts.outputPath    - Where to save the result
 * @param {string} [opts.bgKey]       - Background preset: "light-blue" | "light-gray" | "white"
 * @param {string} [opts.ctaText]     - CTA bar text
 * @param {string} [opts.rating]      - e.g. "4.7/5"
 * @param {string} [opts.reviewCount] - e.g. "based on 1,882 reviews"
 */
export async function composeFbAd({
  hookText,
  subtitle,
  beforePath,
  afterPath,
  productPath,
  outputPath,
  bgKey = "light-blue",
  ctaText = "Get deeper. Stay clearer. Powered by Spicules.",
  rating = "4.7/5",
  reviewCount = "based on 1,882 reviews"
}) {
  // ── 1. Wrap hook text into lines ──
  const hookLines = wrapText(hookText, 26);

  // ── 2. Build SVG text overlay (includes background gradient) ──
  const svgText = buildTextOverlaySvg({
    hookLines,
    subtitle,
    bgKey,
    ctaText,
    rating,
    reviewCount
  });
  const bgBuffer = await sharp(Buffer.from(svgText)).png().toBuffer();

  // ── 3. Prepare Before/After images with rounded corners ──
  const baWidth = 330;
  const baHeight = 260;
  const baRadius = 20;
  const baY = 400;
  const beforeX = 150;
  const afterX = 600;

  const [beforeBuf, afterBuf] = await Promise.all([
    loadRoundedImage(beforePath, baWidth, baHeight, baRadius),
    loadRoundedImage(afterPath, baWidth, baHeight, baRadius)
  ]);

  // ── 4. Load and resize product image ──
  const productTargetW = 350;
  const productTargetH = 350;
  const productBuf = await sharp(productPath)
    .resize(productTargetW, productTargetH, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  const productX = 520;
  const productY = 720;

  // ── 5. Composite all layers ──
  const layers = [
    // Before image
    { input: beforeBuf, left: beforeX, top: baY },
    // After image
    { input: afterBuf, left: afterX, top: baY },
    // Product image
    { input: productBuf, left: productX, top: productY }
  ];

  await sharp(bgBuffer)
    .composite(layers)
    .png({ compressionLevel: 6 })
    .toFile(outputPath);

  console.log(`[fb-ad] saved: ${outputPath}`);
  return { outputPath, width: W, height: H };
}
