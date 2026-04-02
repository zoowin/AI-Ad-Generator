import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract, imageFileToBase64 } from "./arkClient.js";
import { ensureDir, downloadFile } from "./output.js";
import { INPUT_PATHS, OUTPUT_PATHS } from "./paths.js";

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const normalized = raw.replace(/^\uFEFF/, "").trim();
  return JSON.parse(normalized);
}

async function main() {
  console.log("🚀 Starting Ad Generation V3...");
  const config = loadConfig();
  const apiKey = config.ark.apiKey;
  const model = config.ark.model;
  
  // 1. Inputs
  const briefPath = INPUT_PATHS.microDart.brief;
  const brief = readJsonFile(briefPath);
  const productImgWithHand = INPUT_PATHS.microDart.inHand;
  
  const outDir = OUTPUT_PATHS.adGeneration;
  ensureDir(outDir);
  const ts = Date.now();
  const bgPath = path.join(outDir, `${ts}-bg.png`);
  const finalPath = path.join(outDir, `${ts}-final-ad.png`);

  // 2. Base Image Generation (Ark)
  console.log("\n[1/2] Generating background image with layout constraint...");
  const prompt = `Product photography of ${brief.product_name}. Aspect ratio 4:5 vertical ad. The product must be placed strictly on the bottom right corner. The entire left and top area MUST be completely empty, clean, smooth gradient background (negative space) for text overlay. Do not add any props, text, logos, or floating objects in the empty space. Soft, high-end commercial studio lighting. Photorealistic, sharp focus on the product.`;
  
  const b64 = imageFileToBase64(productImgWithHand);
  const dataUrl = `data:image/jpeg;base64,${b64}`;
  
  const { imageUrls } = await arkGenerateAndExtract({
    apiKey,
    model,
    prompt,
    size: "1080x1350",
    imageUrls: [dataUrl]
  });
  
  const bgUrl = imageUrls[0];
  if (bgUrl.startsWith("data:")) {
    const raw = bgUrl.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(bgPath, Buffer.from(raw, "base64"));
  } else {
    await downloadFile(bgUrl, bgPath);
  }
  console.log(`Saved background to: ${bgPath}`);

  // 3. SVG Typography Overlay
  console.log("\n[2/2] Compositing text over background...");
  
  const width = 1080;
  const height = 1350;
  
  const headline = "SMOOTH UNDER-EYES";
  const subhead1 = "WHILE YOU SLEEP";
  const hook = brief.hook;
  
  const svgText = `
  <svg width="${width}" height="${height}">
    <style>
      .headline { font-family: Arial, sans-serif; font-size: 72px; font-weight: bold; fill: #1a1a1a; letter-spacing: 2px; }
      .subhead { font-family: Arial, sans-serif; font-size: 72px; font-weight: bold; fill: #1a1a1a; letter-spacing: 2px; }
      .body { font-family: Arial, sans-serif; font-size: 32px; fill: #4a4a4a; }
      .tag { font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; fill: #ffffff; }
    </style>
    
    <!-- Tag Pill -->
    <rect x="90" y="110" width="220" height="46" rx="23" fill="#000000" />
    <text x="200" y="141" class="tag" text-anchor="middle">NEW ARRIVAL</text>

    <!-- Headline -->
    <text x="90" y="270" class="headline">${headline}</text>
    <text x="90" y="350" class="subhead">${subhead1}</text>
    
    <!-- Hook/Body -->
    <text x="90" y="460" class="body">${hook}</text>
    
    <!-- CTA Button -->
    <rect x="90" y="540" width="260" height="68" fill="#000000" />
    <text x="220" y="585" class="tag" text-anchor="middle">SHOP NOW</text>
  </svg>
  `;

  await sharp(bgPath)
    .resize(width, height)
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
    ])
    .toFile(finalPath);
    
  console.log(`\n✅ Ad successfully generated: ${finalPath}`);
}

main().catch(console.error);
