/**
 * genAd3Sets.js — Generate 3 complete ad asset sets for Micro-dart Eye Patch M1
 *
 * Each set contains:
 *   - 1 scene background (4:5 = 1080x1350, product bottom-left, top-right CLEAN for Figma B&A overlay)
 *   - 1 B&A split image (before/after eye area comparison)
 *
 * Total: 6 images → output/final/ad-sets/
 *
 * Usage:
 *   node src/genAd3Sets.js              # generate all 6
 *   node src/genAd3Sets.js --set 1      # only set 1
 *   node src/genAd3Sets.js --type scene # only scene images
 *   node src/genAd3Sets.js --type ba    # only B&A images
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract } from "./arkClient.js";
import { OUTPUT_PATHS } from "./paths.js";

// ── CLI args ─────────────────────────────────────────────────────
function parseArgs(argv) {
  const map = new Map();
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [k, v] = arg.split("=");
      const next = argv[i + 1];
      if (v != null) { map.set(k, v); continue; }
      if (next && !next.startsWith("--")) { map.set(k, next); i++; continue; }
      map.set(k, "true");
    }
  }
  return {
    set: map.get("--set") ? parseInt(map.get("--set"), 10) : null,
    type: map.get("--type") || "all", // "all" | "scene" | "ba"
    ref: map.get("--ref") || null,    // optional reference image path
  };
}

// ── Helpers ───────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (url.startsWith("data:")) {
      const base64 = url.split(",")[1];
      fs.writeFileSync(dest, Buffer.from(base64, "base64"));
      return resolve(dest);
    }
    const client = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    client.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(dest); });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function resolveOutputPath(filePath) {
  if (!fs.existsSync(filePath)) return filePath;
  const ext = path.extname(filePath);
  const base = filePath.slice(0, -ext.length);
  let v = 2;
  while (fs.existsSync(`${base}-v${v}${ext}`)) v++;
  return `${base}-v${v}${ext}`;
}

async function generate(config, id, prompt, negative, outputPath, refImagePath = null) {
  outputPath = resolveOutputPath(outputPath);
  console.log(`\n[gen] ${id}`);
  console.log(`[gen] output → ${path.relative(process.cwd(), outputPath)}`);
  if (refImagePath) console.log(`[gen] ref → ${path.basename(refImagePath)}`);

  const opts = {
    apiKey: config.ark.apiKey,
    model: config.ark.model,
    prompt,
    negativePrompt: negative,
    size: "1800x2250",
    n: 1,
    watermark: false,
  };

  if (refImagePath && fs.existsSync(refImagePath)) {
    const ext = path.extname(refImagePath).toLowerCase().replace(".", "");
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    const b64 = fs.readFileSync(refImagePath).toString("base64");
    opts.imageUrls = [`data:${mime};base64,${b64}`];
  }

  const { imageUrls } = await arkGenerateAndExtract(opts);

  if (!imageUrls.length) throw new Error(`No image URL returned for ${id}`);

  await downloadFile(imageUrls[0], outputPath);
  console.log(`[gen] ✓ saved ${path.basename(outputPath)}`);
  return outputPath;
}

// ── Ad set definitions ────────────────────────────────────────────

const AD_SETS = [
  {
    id: 1,
    name: "anti-botox-bathroom",
    scene: {
      prompt: `A single seamless lifestyle bathroom photography. One continuous photograph, not a collage, not a composite.

On a white marble bathroom counter, in the lower-left area of the frame, a brushed stainless steel medical tray (rectangular, matte silver, flat-bottomed) holds a navy blue skincare sachet (Depology Micro Dart Eye Patch) standing upright inside it. The tray sits on the marble surface. Beside the tray on the counter: a white ceramic toothbrush holder with two toothbrushes, a small white toothpaste tube, and a minimal glass cup. These lifestyle items are grouped in the lower-left and bottom-center areas.

The upper-right portion of the image is a clean white wall — completely empty, no shelves, no objects, just soft wall texture with gentle ambient light. This area must remain unoccupied.

Morning light from a window to the upper-left casts soft natural shadows across the marble. Cool, clean, fresh bathroom morning atmosphere. Shallow depth of field. Realistic lifestyle photography, not a studio product shot.`,
      negative: "text, words, letters, typography, overlay, logo, face, person, hand, grid lines, panel borders, collage, split image, warm tones, yellow, orange, busy clutter, objects in upper-right",
    },
    ba: {
      prompt: `Two side-by-side close-up photographs of the same woman's eye area, placed next to each other with a thin white line between them.

LEFT PHOTO: Extreme close-up of a Caucasian woman's right eye area, age 42-48. Natural skin tone — medium, realistic. Visible crow's feet wrinkles radiating from the outer eye corner. Fine expression lines under the eye. Skin texture is real — pores visible, slight dehydration creases. No makeup. Soft natural daylight. The wrinkles are the main focus, clearly visible. Skin color is her natural tone — no brightening, no whitening.

RIGHT PHOTO: Same woman, same eye, same angle, same natural daylight. Same skin tone — no color change at all. The wrinkles are noticeably reduced — crow's feet are softer, the under-eye creases are smoother. The improvement is specifically about wrinkle depth, not skin color or brightness. Skin still looks real with natural texture. The result is believable, not over-edited.

Clean neutral light gray background. Two equal-width panels side by side. Sharp focus on skin texture. No text anywhere in the image.`,
      negative: "text, words, letters, numbers, typography, labels, captions, watermark, logo, skin brightening, skin whitening, color change between panels, heavy retouching, plastic skin, airbrushed, product, packaging, body shot, cartoon, illustration",
    },
  },
  {
    id: 2,
    name: "microneedling-bedroom",
    scene: {
      prompt: `A single seamless lifestyle bedroom photograph. One continuous photo, not a collage.

Camera angle is from slightly above, looking down at a wooden bedside table. In the lower-left and center of the frame: a brushed silver tray with a navy blue Depology Micro Dart Eye Patch sachet standing upright inside it. A silk sleep eye mask is draped over the edge of the tray. A small amber serum bottle sits beside the tray. A bedside lamp is in the far left edge of the frame, partially cropped — only the warm glow and base visible on the left. The lamp is NOT in the upper-right.

The entire right half and upper-right of the image shows a plain warm neutral wall — completely bare, no lamp, no shelves, no objects. Just soft warm ambient light on the wall. This must remain empty.

Warm cozy bedroom atmosphere. Real person's nightstand feel. Shallow depth of field, sharp on product. Authentic lifestyle photography.`,
      negative: "text, words, letters, typography, overlay, logo, face, person, grid lines, collage, split image, cold tones, lamp in upper right, objects in right half of image, busy upper area",
    },
    ba: {
      prompt: `Two casual smartphone selfies of the same woman placed side by side with a thin white dividing line.

LEFT PHOTO: Close-up selfie of a woman aged 44-50, taken slightly above eye level looking down toward the camera. Her face fills most of the frame — forehead to chin visible. The phone is held at the top edge, barely visible, not blocking the face. Warm natural bathroom light. No makeup. The eye area is the clear focus: prominent crow's feet wrinkles radiating from the outer eye corners, visible under-eye fine lines. Skin is her natural medium warm tone. Real texture, real wrinkles. Slightly handheld feel.

RIGHT PHOTO: Same woman, same selfie angle — face filling the frame, phone barely visible at top edge. Same warm light, same skin tone, no color change. The eye area shows clear improvement: crow's feet are noticeably softer and reduced in depth, under-eye lines are smoother. The difference is obvious when you look at the eye corners. Expression is relaxed, natural. No makeup. Same phone camera quality.

Side-by-side layout, thin white dividing line between panels. Face clearly visible in both photos. Eye area must be unobstructed. No text anywhere in the image.`,
      negative: "text, words, letters, numbers, typography, labels, captions, watermark, logo, skin brightening, skin whitening, skin color change, heavy retouching, airbrushed, plastic skin, product, packaging, cartoon, illustration, studio lighting",
    },
  },
  {
    id: 3,
    name: "clinical-desk",
    scene: {
      prompt: `A single seamless lifestyle vanity or dressing table photograph. One continuous photo, not a collage.

A woman's dressing table or vanity counter. In the lower-left area of the frame: a brushed silver tray holding a navy blue Depology Micro Dart Eye Patch sachet standing upright. On the table nearby: an open round mirror (compact or standing), a small glass bottle of face serum, a cotton pad or two, a mascara tube lying on its side. The items feel naturally placed — like someone's real getting-ready setup, not a styled shoot.

The upper-right portion of the frame is a plain white or very light beige wall — completely empty, no mirror reflections, no shelves, no art. Just soft diffused natural daylight on the wall. This area must remain clear.

Cool natural daylight from a window to the left. Fresh, clean, morning getting-ready energy. Shallow depth of field. Authentic lifestyle photography, real person's vanity.`,
      negative: "text, words, letters, typography, overlay, logo, face, person, grid lines, collage, split image, warm tones, objects in upper-right area, busy right side, lamp in upper right",
    },
    ba: {
      prompt: `Two photographs of the same woman's eye area placed side by side, separated by a thin white line.

LEFT PHOTO: Close-up of an Asian woman's eye area, age 38-46, three-quarter angle. Natural light, soft and even. No makeup. The focus is on the eye corner and under-eye area — visible crow's feet wrinkles at the outer eye corner, fine horizontal creases under the eye. Skin tone is her natural medium-warm Asian complexion. Real skin texture, natural pores, honest photography. The wrinkles are the main visible feature.

RIGHT PHOTO: Same woman, same angle, same soft natural light. Identical skin tone — no brightening, no change in color whatsoever. The crow's feet wrinkles at the outer eye corner are clearly reduced in depth. The under-eye fine lines are noticeably smoother. The difference is specifically in wrinkle depth and smoothness — nothing else has changed. Still natural skin texture, same pores, same tone.

Clean very light gray background. Two equal panels. Sharp focus on the eye and skin texture. No text, no labels, no numbers anywhere in the image.`,
      negative: "text, words, letters, numbers, typography, labels, captions, watermark, logo, skin brightening, skin lightening, whitening, color change, heavy retouching, airbrushed, plastic look, product, packaging, full body, cartoon, illustration",
    },
  },
];

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();
  const outDir = OUTPUT_PATHS.finalAdSets;
  ensureDir(outDir);

  const sets = args.set
    ? AD_SETS.filter((s) => s.id === args.set)
    : AD_SETS;

  console.log(`\n=== Generating ${sets.length} ad set(s), type="${args.type}" ===`);
  console.log(`Provider: Ark Seedream  Model: ${config.ark.model}`);
  console.log(`Output: ${outDir}\n`);

  const results = [];

  for (const set of sets) {
    const prefix = `set${set.id}-${set.name}`;

    if (args.type === "all" || args.type === "scene") {
      const sceneOut = path.join(outDir, `${prefix}-scene.png`);
      try {
        await generate(config, `${prefix}-scene`, set.scene.prompt, set.scene.negative, sceneOut, args.ref);
        results.push({ id: `${prefix}-scene`, status: "ok", path: sceneOut });
      } catch (err) {
        console.error(`[error] ${prefix}-scene: ${err.message}`);
        results.push({ id: `${prefix}-scene`, status: "error", error: err.message });
      }
    }

    if (args.type === "all" || args.type === "ba") {
      const baOut = path.join(outDir, `${prefix}-ba.png`);
      try {
        await generate(config, `${prefix}-ba`, set.ba.prompt, set.ba.negative, baOut);
        results.push({ id: `${prefix}-ba`, status: "ok", path: baOut });
      } catch (err) {
        console.error(`[error] ${prefix}-ba: ${err.message}`);
        results.push({ id: `${prefix}-ba`, status: "error", error: err.message });
      }
    }
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : "✗";
    const detail = r.status === "ok" ? path.basename(r.path) : r.error;
    console.log(`  ${icon} ${r.id}: ${detail}`);
  }

  const ok = results.filter((r) => r.status === "ok").length;
  console.log(`\nDone: ${ok}/${results.length} succeeded → ${outDir}`);
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
