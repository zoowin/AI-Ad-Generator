/**
 * Facebook Ad Image Generator — AI-powered
 *
 * Uses Ark (Seedream 4.5) API to generate ad-style images for Facebook.
 * Text/copy is NOT baked in — the user adds it in post-production.
 *
 * What AI generates:
 *   1. Product hero shots in ad-ready scenes (clean background, ad lighting)
 *   2. Before/After skin comparison image pairs
 *
 * Reference style: input/references/winning-ads/image 3.png
 *
 * Usage:
 *   node src/runFbAd.js
 *   node src/runFbAd.js --limit 2
 *   node src/runFbAd.js --size 1080x1350
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract, imageFileToBase64 } from "./arkClient.js";
import { INPUT_PATHS, OUTPUT_PATHS } from "./paths.js";

const OUTPUT_DIR = OUTPUT_PATHS.fbAds;

// ─── Ad scene prompts (no text — user adds copy later) ──────────────────────

const AD_SCENES = [
  {
    id: "clean-hero-blue",
    name: "Clean Hero — Light Blue",
    prompt:
      "Professional Facebook ad photo for a premium skincare brand. A dark navy blue sachet packet of Depology Micro-Dart eye patches displayed prominently in the center-right of the frame, slightly angled. The packet has a geometric triangle pattern at the top and elegant serif 'Depology' branding. Clean light blue gradient background (#D6E8F8 to #EDF4FC). Soft studio lighting from above-left creating gentle shadows. The product occupies about 35% of the frame, leaving generous empty space at top and bottom for text overlay. Premium beauty product photography, high-end e-commerce style, sharp focus on product, 4:5 aspect ratio for social media ads.",
    negativePrompt:
      "text, words, letters, typography, watermark, logo overlay, multiple products, hands, face, cluttered background, dark mood, low quality"
  },
  {
    id: "clean-hero-white",
    name: "Clean Hero — White",
    prompt:
      "Professional Facebook ad product photography. Depology Micro-Dart Patches in a dark navy blue sachet with white triangle pattern at top, placed on a clean pure white surface. Minimalist composition, product slightly right of center with soft natural shadow. Subtle light gray gradient background. One small decorative element: a few tiny water droplets near the product suggesting freshness. Premium beauty brand feel, bright and airy, shot with a macro lens showing texture detail on the packet. Product takes about 30% of frame, ample white space for ad copy overlay. 4:5 ratio.",
    negativePrompt:
      "text, words, letters, watermark, dark background, multiple items, busy composition, hands, face, low resolution"
  },
  {
    id: "lifestyle-vanity",
    name: "Lifestyle — Vanity Scene",
    prompt:
      "Lifestyle product photography for Facebook ad. Depology Micro-Dart eye patches (dark navy blue sachet with triangle pattern) placed casually on a woman's marble bathroom vanity. Soft morning light from a window on the left. Background is slightly blurred showing a round mirror and a small potted succulent. A white cotton towel is folded nearby. Warm, inviting morning skincare routine atmosphere. Product is the clear focal point taking about 25-30% of the frame. Upper portion has open space for headline text. Clean, aspirational, real-life feel. 4:5 aspect ratio.",
    negativePrompt:
      "text, words, letters, face, person, hands touching product, cluttered, dark, moody, low quality, watermark"
  },
  {
    id: "before-after-skin",
    name: "Before/After Skin Comparison",
    prompt:
      "Professional dermatological before-and-after comparison photography for a skincare ad. LEFT SIDE: close-up of a woman's cheek area showing visible skin texture issues — enlarged pores, uneven skin tone, fine lines, and slight roughness. The skin looks dull and tired. RIGHT SIDE: the same angle showing dramatically improved skin — smooth, even-toned, glowing, poreless, and radiant complexion. Both shots are taken with the same lighting (soft diffused daylight), same camera angle (3/4 profile of lower face, showing cheek to jawline area), same skin tone (medium/light Asian skin). Clean neutral background behind the face. Clinical precision photography, realistic skin texture, NOT over-retouched. 4:5 aspect ratio.",
    negativePrompt:
      "text, labels, 'before', 'after', arrows, graphics, split screen line, watermark, full face, eyes, unrealistic skin, plastic look, heavy makeup"
  },
  {
    id: "product-with-ba",
    name: "Ad Layout — Product + B&A Zone",
    prompt:
      "Facebook ad visual layout (NO TEXT). Clean light blue gradient background. Bottom-left area: a dark navy blue Depology sachet packet (micro-dart patches) displayed at a slight angle with soft shadow. Top-right area: two rounded-rectangle photo frames side by side showing close-up skin texture — left frame shows rough textured skin with visible pores and fine lines, right frame shows smooth glowing healthy skin. A small circular badge element in the bottom-left area near the product. Five small golden star icons below the badge area. Overall composition leaves the top 25% and bottom 10% empty for text overlay. Premium beauty brand advertisement visual, clean and professional. 4:5 ratio, 1080x1350 pixels.",
    negativePrompt:
      "text, words, letters, typography, watermark, dark background, cluttered, messy, low quality, cartoon, illustration"
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

async function downloadImage(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
  return filePath;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const values = new Map();
  const flags = new Set();
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const [k, v] = args[i].split("=");
      if (v != null) { values.set(k, v); }
      else if (args[i + 1] && !args[i + 1].startsWith("--")) { values.set(k, args[++i]); }
      else { flags.add(k); }
    }
  }
  return {
    limit: parseInt(values.get("--limit") || "0", 10) || 0,
    size: values.get("--size") || "",
    scenes: values.get("--scenes") || "",
    withRef: flags.has("--with-ref")
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  const args = parseArgs();

  if (!config.ark.apiKey || !config.ark.model) {
    console.error("[fb-ad] ARK_API_KEY and ARK_MODEL must be set in .env");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Filter scenes if specified
  let scenes = AD_SCENES;
  if (args.scenes) {
    const ids = args.scenes.split(",").map((s) => s.trim());
    scenes = AD_SCENES.filter((s) => ids.includes(s.id));
    if (scenes.length === 0) {
      console.error(`[fb-ad] no matching scenes. Available: ${AD_SCENES.map((s) => s.id).join(", ")}`);
      process.exit(1);
    }
  }
  if (args.limit > 0) {
    scenes = scenes.slice(0, args.limit);
  }

  // Load product image as reference (always, for accurate product appearance)
  const refPath = INPUT_PATHS.microDart.ref;
  const productPath = INPUT_PATHS.microDart.hero;
  let imageUrls;

  if (fs.existsSync(refPath)) {
    const b64 = imageFileToBase64(refPath);
    imageUrls = [`data:image/jpeg;base64,${b64}`];
    console.log("[fb-ad] using compressed product ref image for img2img");
  } else if (args.withRef && fs.existsSync(productPath)) {
    const b64 = imageFileToBase64(productPath);
    imageUrls = [`data:image/png;base64,${b64}`];
    console.log("[fb-ad] using original product image for img2img");
  }

  // Seedream 4.5 requires at least 3,686,400 pixels.
  // Use 2048x2560 (4:5 ratio) then user can downscale to 1080x1350.
  const size = args.size || "2048x2560";
  const stamp = dateStamp();
  const results = [];

  console.log(`[fb-ad] generating ${scenes.length} ad images via Ark (Seedream 4.5)...`);
  console.log(`[fb-ad] size: ${size}, model: ${config.ark.model}`);

  for (const scene of scenes) {
    console.log(`\n[fb-ad] ── ${scene.name} ──`);
    try {
      const genOpts = {
        apiKey: config.ark.apiKey,
        model: config.ark.model,
        prompt: scene.prompt,
        negativePrompt: scene.negativePrompt,
        size,
        n: 1,
        seed: -1,
        watermark: false,
        responseFormat: "url"
      };

      if (imageUrls) {
        genOpts.imageUrls = imageUrls;
      }

      const { result, imageUrls: generatedUrls } = await arkGenerateAndExtract(genOpts);

      if (generatedUrls.length === 0) {
        console.warn(`[fb-ad] no images returned for ${scene.id}`);
        results.push({ ...scene, status: "empty", raw: result });
        continue;
      }

      // Download generated images
      const downloaded = [];
      for (let i = 0; i < generatedUrls.length; i++) {
        const url = generatedUrls[i];
        if (url.startsWith("data:")) {
          // base64 response — save directly
          const b64Data = url.split(",")[1];
          const filePath = path.join(OUTPUT_DIR, `${stamp}-${scene.id}-${String(i + 1).padStart(3, "0")}.png`);
          fs.writeFileSync(filePath, Buffer.from(b64Data, "base64"));
          downloaded.push(filePath);
          console.log(`[fb-ad] saved: ${filePath}`);
        } else {
          // URL response — download
          const filePath = path.join(OUTPUT_DIR, `${stamp}-${scene.id}-${String(i + 1).padStart(3, "0")}.png`);
          await downloadImage(url, filePath);
          downloaded.push(filePath);
          console.log(`[fb-ad] saved: ${filePath}`);
        }
      }

      results.push({
        id: scene.id,
        name: scene.name,
        status: "ok",
        files: downloaded,
        prompt: scene.prompt
      });
    } catch (err) {
      console.error(`[fb-ad] error for ${scene.id}:`, err.message);
      results.push({ id: scene.id, name: scene.name, status: "error", error: err.message });
    }
  }

  // Save manifest
  const manifestPath = path.join(OUTPUT_DIR, "generation-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));

  const okCount = results.filter((r) => r.status === "ok").length;
  console.log(`\n[fb-ad] done: ${okCount}/${scenes.length} succeeded`);
  console.log(`[fb-ad] output: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("[fb-ad] fatal:", err);
  process.exit(1);
});
