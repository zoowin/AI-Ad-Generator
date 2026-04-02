/**
 * genSceneWithProduct.js — img2img: product reference → immersive scene
 *
 * Uses real product photo as reference to generate scene images.
 * Only 3 scenes to conserve API quota.
 *
 * Usage:  node src/genSceneWithProduct.js
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract, imageFileToBase64 } from "./arkClient.js";
import { ensureDir, downloadFile } from "./output.js";
import { INPUT_PATHS, OUTPUT_PATHS } from "./paths.js";

const SCENES = [
  {
    id: "spa-morning-light",
    prompt: `Luxury skincare product photography. A navy blue sachet package of Depology Micro Dart Patches resting on a smooth white marble vanity surface. Morning golden sunlight streaming through a window, casting soft warm shadows. Beside the sachet: a small clear glass of water and a fresh eucalyptus sprig. Clean, minimal, spa-like atmosphere. Shallow depth of field focusing on the product. Premium editorial beauty photography. The navy sachet has a geometric triangle pattern at the top and elegant serif brand text. Soft bokeh background of a bright clean bathroom.`,
    negative: "text overlay, watermark, hands, person, cluttered, multiple products, jar, bottle, low quality, blurry product"
  },
  {
    id: "bedside-ritual",
    prompt: `Elegant nighttime skincare ritual scene. A navy blue sachet skincare product package placed on a soft linen fabric on a bedside table. Warm ambient lighting from a small table lamp creates a cozy golden glow. Next to the sachet: a small ceramic dish and a silk sleep mask. The mood is calm, luxurious, self-care ritual. The navy sachet has subtle geometric triangle patterns. Premium lifestyle product photography, shot from slightly above at a 45-degree angle. Soft, dreamy atmosphere. Clean composition with intentional negative space.`,
    negative: "text overlay, watermark, person, face, hands, bright daylight, cluttered, jar, bottle, multiple products, low quality"
  },
  {
    id: "vanity-flatlay",
    prompt: `Top-down flat lay product photography on a soft blush pink marble surface. Center: a navy blue sachet of Depology skincare patches with geometric triangle pattern at top. Around it arranged minimally: a small jade roller, a white ceramic tray with gold rim, a fresh peony flower, and a few drops of clear serum glistening on the marble. Soft diffused natural light from above. Ultra-clean, Instagram-worthy flat lay composition. Premium beauty brand aesthetic. The navy sachet is the clear hero product. Luxurious, aspirational, feminine.`,
    negative: "text overlay, watermark, person, hands, cluttered, too many products, jar, bottle, cheap looking, low quality, blurry"
  }
];

async function main() {
  const cfg = loadConfig();
  const outDir = OUTPUT_PATHS.fbAdsV2Scenes;
  ensureDir(outDir);

  // Load product image as base64 data URI
  const productPath = INPUT_PATHS.microDart.hero;
  if (!fs.existsSync(productPath)) {
    console.error(`Product image not found: ${productPath}`);
    process.exit(1);
  }

  const b64 = imageFileToBase64(productPath);
  const dataUri = `data:image/png;base64,${b64}`;
  console.log(`Loaded product reference: ${productPath}`);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const results = [];

  for (const scene of SCENES) {
    console.log(`\n--- [${scene.id}] ---`);
    try {
      const { result, imageUrls } = await arkGenerateAndExtract({
        apiKey: cfg.ark.apiKey,
        model: cfg.ark.model,
        prompt: scene.prompt,
        negativePrompt: scene.negative,
        size: "2048x2048",
        n: 1,
        seed: -1,
        watermark: false,
        imageUrls: [dataUri],
        responseFormat: "url"
      });

      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const fileName = `${dateStr}-${scene.id}-${String(i + 1).padStart(3, "0")}.png`;
        const filePath = path.join(outDir, fileName);

        if (url.startsWith("data:")) {
          fs.writeFileSync(filePath, Buffer.from(url.replace(/^data:image\/\w+;base64,/, ""), "base64"));
        } else {
          await downloadFile(url, filePath);
        }
        console.log(`  → Saved: ${fileName}`);
        results.push({ id: scene.id, fileName });
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      results.push({ id: scene.id, error: err.message });
    }
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(results, null, 2));
  console.log(`\n✓ Done. ${results.filter(r => !r.error).length}/${SCENES.length} succeeded.`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
