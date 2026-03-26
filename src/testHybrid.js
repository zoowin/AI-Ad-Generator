/**
 * Hybrid approach: take img2img result (good integration) and
 * overlay the original product's label area (sharp text).
 *
 * No API calls — pure local image processing.
 *
 * Usage: node src/testHybrid.js
 */

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

// The V2 img2img result (good scene integration)
const AI_RESULT = "output/v2-test/v2-lab-tech-b64.png";
// Original product PNG (perfect label text)
const PRODUCT_PNG = "assets/products/Products_img_10_Matrixyl 3000 Serum.png";
const OUT_DIR = "output/hybrid";

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const aiMeta = await sharp(AI_RESULT).metadata();
  const W = aiMeta.width;
  const H = aiMeta.height;
  console.log(`AI result: ${W}x${H}`);

  // Step 1: Find where the product is in the AI image.
  // From the V2 result, the bottle is roughly centered.
  // We need to match the original PNG to the same position/size in the AI output.
  //
  // The AI-generated bottle occupies roughly:
  //   - center of image, about 35% of width, 70% of height
  //   - label area is the lower 50% of the bottle body

  // Resize original product to match the AI-generated bottle size
  const prodMeta = await sharp(PRODUCT_PNG).metadata();
  const prodAspect = prodMeta.height / prodMeta.width;

  // Estimated bottle size in AI result (adjust these to match)
  const bottleW = Math.round(W * 0.32);
  const bottleH = Math.round(bottleW * prodAspect);
  const bottleLeft = Math.round(W * 0.34);
  const bottleTop = Math.round(H * 0.10);

  console.log(`Estimated bottle region: ${bottleW}x${bottleH} at (${bottleLeft}, ${bottleTop})`);

  // Resize product PNG to match
  const productResized = await sharp(PRODUCT_PNG)
    .resize(bottleW, bottleH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Step 2: Create a mask that only shows the label area (bottom ~55% of the bottle).
  // This way we keep the AI's lighting/reflections on the cap and upper bottle,
  // but replace the label text area with the sharp original.
  const labelStartY = Math.round(bottleH * 0.35); // label starts at ~35% from top
  const labelH = bottleH - labelStartY;

  // Gradient mask: fade in at top of label area, full opacity in the middle/bottom
  const maskSvg = Buffer.from(`<svg width="${bottleW}" height="${bottleH}">
    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black" stop-opacity="1"/>
        <stop offset="${Math.round((labelStartY / bottleH) * 100 - 5)}%" stop-color="black" stop-opacity="1"/>
        <stop offset="${Math.round((labelStartY / bottleH) * 100)}%" stop-color="white" stop-opacity="1"/>
        <stop offset="100%" stop-color="white" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="${bottleW}" height="${bottleH}" fill="url(#fade)"/>
  </svg>`);

  const gradientMask = await sharp(maskSvg).resize(bottleW, bottleH).png().toBuffer();

  // Apply mask to product: only label area visible, cap/top fades out
  const maskedProduct = await sharp(productResized)
    .composite([{ input: gradientMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // Step 3: Also create a full overlay version for comparison
  // Full product overlay with soft alpha edges
  const alphaChannel = await sharp(productResized).extractChannel(3).blur(0.8).toBuffer();
  const rgb = await sharp(productResized).removeAlpha().toBuffer();
  const softProduct = await sharp(rgb)
    .joinChannel(alphaChannel)
    .png()
    .toBuffer();

  // Output 1: Label-only hybrid (AI top + original label)
  const hybridLabelPath = path.join(OUT_DIR, "hybrid-label-only.png");
  await sharp(AI_RESULT)
    .composite([{
      input: maskedProduct,
      left: bottleLeft,
      top: bottleTop,
      blend: "over"
    }])
    .toFile(hybridLabelPath);
  console.log(`Saved: ${hybridLabelPath}`);

  // Output 2: Full product overlay on AI background
  const hybridFullPath = path.join(OUT_DIR, "hybrid-full-overlay.png");
  await sharp(AI_RESULT)
    .composite([{
      input: softProduct,
      left: bottleLeft,
      top: bottleTop,
      blend: "over"
    }])
    .toFile(hybridFullPath);
  console.log(`Saved: ${hybridFullPath}`);

  console.log("\nDone. Compare the two outputs:");
  console.log("  hybrid-label-only.png  — AI lighting on top, original label text below");
  console.log("  hybrid-full-overlay.png — Full original product over AI background");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
