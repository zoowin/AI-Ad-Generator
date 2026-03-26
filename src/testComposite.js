/**
 * Test composite: overlay product PNG onto generated background.
 * No API calls — pure local image processing.
 *
 * Usage: node src/testComposite.js
 */

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const BG_PATH = "output/compare/B-bg-only-lab-b64.png";
const PRODUCT_PATH = "assets/products/Products_img_10_Matrixyl 3000 Serum.png";
const OUT_DIR = "output/composite";

async function createDropShadow(productBuf, width, height, { blur = 18, opacity = 0.5, offsetX = 5, offsetY = 12 } = {}) {
  // Create a black silhouette by tinting the product image to pure black, keeping alpha
  const silhouette = await sharp(productBuf)
    .ensureAlpha()
    .tint({ r: 0, g: 0, b: 0 })
    .png()
    .toBuffer();

  // Add padding for blur spread + offset
  const pad = blur * 2 + Math.max(Math.abs(offsetX), Math.abs(offsetY));
  const totalW = width + pad * 2;
  const totalH = height + pad * 2;

  const shadowCanvas = await sharp({
    create: { width: totalW, height: totalH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([{ input: silhouette, left: pad + offsetX, top: pad + offsetY }])
    .blur(blur > 0 ? blur : 1)
    .png()
    .toBuffer();

  // Reduce opacity via an SVG overlay mask
  const opacitySvg = Buffer.from(`<svg width="${totalW}" height="${totalH}">
    <rect width="${totalW}" height="${totalH}" fill="white" fill-opacity="${opacity}"/>
  </svg>`);
  const opacityMask = await sharp(opacitySvg).resize(totalW, totalH).png().toBuffer();

  const finalShadow = await sharp(shadowCanvas)
    .composite([{ input: opacityMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return { buffer: finalShadow, pad };
}

async function createReflection(productBuf, width, height, { reflFraction = 0.25, opacity = 0.15 } = {}) {
  const reflH = Math.round(height * reflFraction);

  // Flip product vertically, take bottom slice
  const flipped = await sharp(productBuf)
    .flip()
    .extract({ left: 0, top: 0, width, height: reflH })
    .png()
    .toBuffer();

  // Gradient mask: opaque at top → transparent at bottom
  const gradSvg = Buffer.from(`<svg width="${width}" height="${reflH}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient></defs>
    <rect width="${width}" height="${reflH}" fill="url(#g)"/>
  </svg>`);

  const mask = await sharp(gradSvg).resize(width, reflH).png().toBuffer();

  const reflection = await sharp(flipped)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return { buffer: reflection, width, height: reflH };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const bgMeta = await sharp(BG_PATH).metadata();
  const W = bgMeta.width;
  const H = bgMeta.height;

  // Resize product: ~28% of canvas width (realistic for small 30ml bottle in scene)
  const prodScale = 0.28;
  const prodW = Math.round(W * prodScale);
  const prodMeta = await sharp(PRODUCT_PATH).metadata();
  const aspect = prodMeta.height / prodMeta.width;
  const prodH = Math.round(prodW * aspect);

  // Resize product and soften edges to avoid hard cutout look
  const productRaw = await sharp(PRODUCT_PATH)
    .resize(prodW, prodH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Slightly erode/soften the alpha edge to blend better
  // Extract alpha, blur slightly, then use as new alpha
  const alphaChannel = await sharp(productRaw).extractChannel(3).blur(1.2).toBuffer();
  const rgb = await sharp(productRaw).removeAlpha().toBuffer();
  const productResized = await sharp(rgb)
    .joinChannel(alphaChannel)
    .png()
    .toBuffer();

  // Position: center on the table surface area
  const prodLeft = Math.round(W * 0.38);
  const prodTop = Math.round(H * 0.28);

  console.log(`Canvas: ${W}x${H}`);
  console.log(`Product: ${prodW}x${prodH} at (${prodLeft}, ${prodTop})`);

  const layers = [];

  // 1. Drop shadow
  try {
    const { buffer: shadowBuf, pad } = await createDropShadow(productResized, prodW, prodH);
    layers.push({
      input: shadowBuf,
      left: Math.max(0, prodLeft - pad),
      top: Math.max(0, prodTop - pad),
      blend: "over"
    });
    console.log("Shadow: OK");
  } catch (e) {
    console.warn("Shadow failed:", e.message);
  }

  // 2. Reflection (below product)
  try {
    const { buffer: refBuf, height: refH } = await createReflection(productResized, prodW, prodH);
    const refTop = Math.min(H - refH, prodTop + prodH);
    layers.push({
      input: refBuf,
      left: Math.max(0, prodLeft),
      top: refTop,
      blend: "over"
    });
    console.log(`Reflection: OK (${refH}px tall)`);
  } catch (e) {
    console.warn("Reflection failed:", e.message);
  }

  // 3. Product on top
  layers.push({
    input: productResized,
    left: prodLeft,
    top: prodTop,
    blend: "over"
  });

  // Compose
  const outPath = path.join(OUT_DIR, "composite-lab-v1.png");
  await sharp(BG_PATH)
    .composite(layers)
    .toFile(outPath);

  console.log(`\nSaved: ${outPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
