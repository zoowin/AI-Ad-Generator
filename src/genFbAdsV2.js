/**
 * genFbAdsV2.js — Generate Facebook ad assets for Micro-dart Eye Patch
 *
 * Generates via Ark Seedream 4.5:
 *   1. Under-eye Before/After comparison images (eye-area focused)
 *   2. Product scene images (navy micro-dart patch sachet)
 *   3. Combined ad composition images (B&A + product in one frame)
 *
 * Usage:
 *   node src/genFbAdsV2.js                    # generate all
 *   node src/genFbAdsV2.js --type ba          # only B&A images
 *   node src/genFbAdsV2.js --type product     # only product scenes
 *   node src/genFbAdsV2.js --type combo       # only combined compositions
 *   node src/genFbAdsV2.js --n 2              # 2 images per prompt
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract } from "./arkClient.js";
import { ensureDir, downloadFile } from "./output.js";
import { OUTPUT_PATHS } from "./paths.js";

// ── Parse CLI args ──────────────────────────────────────────────
function parseArgs(argv) {
  const values = new Map();
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [k, v] = arg.split("=");
      if (v != null) { values.set(k, v); continue; }
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) { values.set(k, next); i++; continue; }
      values.set(k, "true");
    }
  }
  return {
    type: values.get("--type") || "all",
    n: parseInt(values.get("--n") || "1", 10) || 1,
    size: values.get("--size") || "1080x1080"
  };
}

// ── Prompt definitions ──────────────────────────────────────────

const BA_PROMPTS = [
  {
    id: "eye-ba-fine-lines",
    desc: "Under-eye fine lines B&A — close-up eye area",
    prompt: `Professional skincare before-and-after comparison photography, split screen layout, left side and right side.

LEFT (Before): Extreme close-up of a woman's under-eye area showing visible fine lines, crow's feet wrinkles, slightly crepey skin texture around the eye, natural lighting, no makeup, realistic skin with fine wrinkles radiating from the outer corner of the eye, slightly puffy under-eye area.

RIGHT (After): Same woman, same angle, same lighting. Under-eye area appears visibly smoother, fine lines are significantly reduced, skin looks plumper and more hydrated, subtle healthy glow, the crow's feet are softened, under-eye area looks firmer and more youthful.

Clean white or very light gray background. Clinical photography style. High resolution, sharp detail on skin texture. The difference should be noticeable but realistic — not overly retouched. Natural skin tone, Asian or Caucasian woman age 35-50.`,
    negative: "text, words, letters, logos, watermark, product, packaging, heavy makeup, unrealistic skin, plastic look, over-smoothed, blurry"
  },
  {
    id: "eye-ba-dark-circles",
    desc: "Under-eye dark circles & puffiness B&A",
    prompt: `Professional dermatology before-and-after photograph, side-by-side comparison, clean split view.

LEFT (Before): Close-up of a mature woman's eye area from the side, showing dark circles under the eye, visible fine lines and early wrinkles around the eye, tired-looking under-eye skin, slightly hollow tear trough, natural skin without concealer.

RIGHT (After): Same woman, same exact angle and lighting. Under-eye area looks rejuvenated, dark circles are lighter, fine lines are diminished, skin appears firmer and more lifted, healthy luminous skin tone, well-rested appearance.

Studio lighting, clean white background. Medical-grade photography. Realistic transformation, not artificially perfect. Woman age 30-45 with fair to medium skin tone. Extreme close-up focusing on the eye and under-eye region only.`,
    negative: "text, words, letters, logos, watermark, product, full face, body, heavy makeup, cartoon, illustration, painting"
  },
  {
    id: "eye-ba-wrinkle-detail",
    desc: "Detailed eye wrinkle texture B&A",
    prompt: `Clinical skincare results photography, before and after split image, horizontal two-panel layout.

LEFT panel: Macro close-up of under-eye skin showing pronounced fine lines, dehydration lines, loss of elasticity, visible texture of aged skin around eye area, slightly sagging skin below the eye. The skin looks dry with visible creases.

RIGHT panel: Same area after treatment — skin appears significantly smoother, hydrated, fine lines are filled and plumped, elastic and firm-looking skin, natural healthy sheen. The under-eye contour looks more defined and youthful.

Professional beauty photography, soft diffused studio lighting, neutral background. Skin detail is crisp and sharp. Realistic results — the improvement is clear but natural. Close-up of eye area of a woman aged 35-50.`,
    negative: "text, letters, words, logos, watermark, product, packaging, full face shot, cartoon, painting, illustration, over-processed"
  }
];

const PRODUCT_PROMPTS = [
  {
    id: "patch-sachet-elegant",
    desc: "Navy sachet product shot — elegant studio",
    prompt: `Luxury skincare product photography. A single navy blue sachet package on a clean surface. The sachet is dark navy blue with a geometric triangle pattern at the top gradually transitioning to solid navy. Premium serif typography reads "Depology" in elegant cream/gold lettering. Below in smaller text "Deepcare+ Serum-Infused Micro Dart Patches". The sachet has a matte premium finish.

The sachet is standing slightly angled on a smooth marble or light stone surface. Soft studio lighting from the left creates gentle shadows. Background is a soft gradient from light warm beige to white. The overall mood is premium, clinical yet luxurious. High-end beauty product photography.`,
    negative: "jar, bottle, tube, cream container, hands, person, blurry, low quality, text overlay, additional products"
  },
  {
    id: "patch-usage-scene",
    desc: "Eye patches applied — beauty scene",
    prompt: `Beautiful lifestyle skincare photography. A young woman (age 25-35) with clean dewy skin, wearing under-eye patches — small crescent-shaped translucent hydrogel patches placed beneath both eyes. She has a serene, relaxed expression with eyes slightly looking up. Her skin is naturally beautiful and glowing.

Soft morning light, clean minimal bathroom or bedroom setting with neutral tones. The eye patches are barely visible but catch the light slightly. Premium editorial beauty photography style. Shot from slightly below, focusing on the under-eye and mid-face area. Clean, aspirational, luxurious feeling.`,
    negative: "text, words, logos, watermark, heavy makeup, unnatural skin, plastic surgery look, cluttered background, product packaging in frame"
  }
];

const COMBO_PROMPTS = [
  {
    id: "combo-ba-product-premium",
    desc: "Combined: B&A left + product right — premium layout",
    prompt: `Premium skincare advertisement layout, clean and elegant composition on a soft light blue gradient background.

Upper portion: Two oval-shaped before-and-after comparison photos of a woman's under-eye area. LEFT oval shows visible fine lines and wrinkles around the eye. RIGHT oval shows smooth, rejuvenated under-eye skin. Both photos have soft rounded rectangular frames with thin white borders.

Lower left: A navy blue sachet package of skincare product, slightly angled, with premium look. Dark navy packaging with subtle geometric pattern.

The overall layout is clean, spacious, with plenty of white/light blue space for text to be added later. Premium, clinical, trustworthy aesthetic. High-end beauty brand advertisement feel. The composition leaves clear space at top and bottom for headline and CTA text.`,
    negative: "text, words, letters, typography, logos, watermark, cluttered, busy layout, multiple products, hands"
  },
  {
    id: "combo-editorial-split",
    desc: "Editorial split: product center, B&A corners",
    prompt: `High-end skincare advertisement composition. Clean editorial layout on a soft cream/white background.

CENTER: A navy blue sachet skincare product package displayed elegantly, slightly rotated, casting a soft shadow. Premium dark navy packaging with subtle triangle geometric pattern at top.

TOP-RIGHT corner: A rounded rectangle showing a close-up before photo of under-eye area with visible fine lines and crow's feet.

BOTTOM-RIGHT corner: A matching rounded rectangle showing the after photo — same eye area but with smoother, plumper, more youthful-looking skin.

The layout is sophisticated and minimal. Generous white space. The product is the hero, flanked by proof of results. Premium beauty brand aesthetic, clean lines, editorial photography quality. Space left at top for headline and at bottom for call-to-action.`,
    negative: "text, words, letters, typography, logos except on product, watermark, busy background, multiple products, illustration style"
  },
  {
    id: "combo-vertical-flow",
    desc: "Vertical flow: B&A top → product bottom",
    prompt: `Elegant skincare social media advertisement image, vertical 1:1 composition, soft light blue to white gradient background.

UPPER HALF: Side-by-side before and after close-up photos of under-eye skin area. Before side shows fine lines, wrinkles, slightly tired skin around the eye. After side shows visibly smoother, firmer, more radiant under-eye skin. Both photos are framed in soft rounded rectangles with subtle white borders. The contrast between before and after is clear but realistic.

LOWER HALF: A premium navy blue sachet product package placed elegantly, with five small gold star icons nearby suggesting high ratings. The navy packaging has a geometric triangle pattern gradient. Clean product photography.

Clean, uncluttered, premium aesthetic. Plenty of breathing room between elements. The feel is clinical yet luxurious — like a dermatologist-recommended brand. Professional studio lighting throughout.`,
    negative: "text, words, letters, typography, large logos, watermark, cluttered layout, cartoon, illustration, painting style, low quality"
  }
];

// ── Main ────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  const cfg = loadConfig();

  const outDir = OUTPUT_PATHS.fbAdsV2;
  const imgDir = OUTPUT_PATHS.fbAdsV2Images;
  ensureDir(imgDir);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  let prompts = [];
  if (args.type === "all" || args.type === "ba") prompts.push(...BA_PROMPTS);
  if (args.type === "all" || args.type === "product") prompts.push(...PRODUCT_PROMPTS);
  if (args.type === "all" || args.type === "combo") prompts.push(...COMBO_PROMPTS);

  console.log(`\n=== Generating ${prompts.length} concepts × ${args.n} image(s) each ===\n`);
  console.log(`Provider: Ark Seedream 4.5`);
  console.log(`Size: ${args.size}`);
  console.log(`Output: ${imgDir}\n`);

  const results = [];

  for (const concept of prompts) {
    console.log(`\n--- [${concept.id}] ${concept.desc} ---`);
    try {
      const { result, imageUrls } = await arkGenerateAndExtract({
        apiKey: cfg.ark.apiKey,
        model: cfg.ark.model,
        prompt: concept.prompt,
        negativePrompt: concept.negative,
        size: args.size,
        n: args.n,
        seed: -1,
        watermark: false,
        responseFormat: "url"
      });

      console.log(`  → Got ${imageUrls.length} image URL(s)`);

      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const fileName = `${dateStr}-${concept.id}-${String(i + 1).padStart(3, "0")}.png`;
        const filePath = path.join(imgDir, fileName);

        if (url.startsWith("data:")) {
          const b64 = url.replace(/^data:image\/\w+;base64,/, "");
          fs.writeFileSync(filePath, Buffer.from(b64, "base64"));
        } else {
          await downloadFile(url, filePath);
        }

        console.log(`  → Saved: ${fileName}`);
        results.push({
          conceptId: concept.id,
          desc: concept.desc,
          fileName,
          url: url.startsWith("data:") ? "(base64)" : url
        });
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      results.push({
        conceptId: concept.id,
        desc: concept.desc,
        error: err.message
      });
    }
  }

  // Write manifest
  const manifestPath = path.join(outDir, "generation-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Manifest: ${manifestPath}`);
  console.log(`✓ Done. ${results.filter(r => !r.error).length}/${results.length} succeeded.\n`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
