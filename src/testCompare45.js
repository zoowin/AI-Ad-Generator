/**
 * Compare Seedream 4.0 vs 4.5: same prompt, same reference images.
 * 2 API calls total (1x legacy, 1x Ark).
 *
 * Usage: node src/testCompare45.js
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { arkGenerateAndExtract } from "./arkClient.js";
import { ensureDir, downloadFile } from "./output.js";

function imageToBase64(filePath) {
  return fs.readFileSync(filePath).toString("base64");
}

function extractImageUrls(result) {
  const urls = [];
  if (Array.isArray(result?.data?.image_urls)) urls.push(...result.data.image_urls);
  if (Array.isArray(result?.image_urls)) urls.push(...result.image_urls);
  return [...new Set(urls.filter(Boolean))];
}

function extractBase64Images(result) {
  if (Array.isArray(result?.data?.binary_data_base64)) {
    return result.data.binary_data_base64.filter(Boolean);
  }
  return [];
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForResult(client, config, taskId, reqKey) {
  for (let i = 1; i <= config.maxPollAttempts; i++) {
    const result = await client.getImageTask({ taskId, reqKey });
    const status = result?.data?.status || "";
    if (status === "done" || extractImageUrls(result).length > 0 || extractBase64Images(result).length > 0) {
      return result;
    }
    if (status === "failed") throw new Error(`Task ${taskId} failed`);
    console.log(`  poll ${i}/${config.maxPollAttempts} — ${status || "pending"}`);
    await sleep(config.pollIntervalMs);
  }
  throw new Error(`Task ${taskId} timed out`);
}

// ── Depology minimalist luxury prompt ──────────────────────────────
const PROMPT = `两瓶Depology护肤精华产品并排展示。

场景：纯净的白色微水磨石台面，产品自然地前后错位摆放，左瓶略前、右瓶略后。背景是大面积留白的浅暖灰墙面，只有一道从右侧落地窗透进来的自然斜光。光线穿过产品瓶身形成柔和的折射光斑投射在台面上。

不需要任何装饰道具。画面极简——只有产品、光影、台面。产品阴影真实自然，随光线方向统一向左偏。瓶身有微妙的环境光反射。

色调：低饱和度，冷白偏暖，类似Aesop或Glossier的品牌视觉风格。
构图：产品偏画面右侧三分之一处，左侧大面积留白。
质感：哑光台面、通透玻璃瓶身、金属质感瓶盖。

商业产品摄影，90mm微距镜头，f/4光圈，自然光，极简主义，超高清。`;

const PRODUCT_PATHS = [
  "assets/products/Products_img_10_Matrixyl 3000 Serum.png",
  "assets/products/Products_img_23 Peptide Complex Serum.png"
];

async function saveResults(outDir, prefix, urls, base64s) {
  const saved = [];
  for (let i = 0; i < urls.length; i++) {
    const dest = path.join(outDir, `${prefix}-${i + 1}.png`);
    await downloadFile(urls[i], dest);
    saved.push(dest);
  }
  for (let i = 0; i < base64s.length; i++) {
    const dest = path.join(outDir, `${prefix}-b64-${i + 1}.png`);
    const raw = base64s[i].replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    saved.push(dest);
  }
  return saved;
}

async function main() {
  const config = loadConfig();
  const outDir = path.join(config.outputDir, "compare-40-vs-45");
  ensureDir(outDir);

  const b64Images = PRODUCT_PATHS.map((p) => imageToBase64(p));

  console.log("═══════════════════════════════════════");
  console.log("  Seedream 4.0 vs 4.5 — Depology Duo");
  console.log("═══════════════════════════════════════");
  console.log(`Prompt: ${PROMPT.slice(0, 60)}…`);
  console.log(`Reference images: ${PRODUCT_PATHS.length}\n`);

  // ── 1. Seedream 4.0 (legacy API) ────────────────────────────────
  console.log("▸ [4.0] Submitting via legacy API (jimeng_t2i_v40, scale=0.5)…");
  const client40 = new VolcengineJimengClient(config.volcengine);

  const submit40 = await client40.submitImg2ImgTask({
    prompt: PROMPT,
    binaryDataBase64: b64Images,
    scale: 0.5,
    reqKey: "jimeng_t2i_v40"
  });

  if (submit40?.code !== 10000) {
    console.error("[4.0] FAILED:", JSON.stringify(submit40, null, 2));
  } else {
    const taskId = submit40?.data?.task_id;
    console.log(`[4.0] Task ID: ${taskId}`);
    const result40 = taskId ? await waitForResult(client40, config, taskId, "jimeng_t2i_v40") : submit40;
    const saved40 = await saveResults(outDir, "v40", extractImageUrls(result40), extractBase64Images(result40));
    console.log(`[4.0] Saved ${saved40.length} image(s)`);
    saved40.forEach((f) => console.log(`  → ${f}`));
  }

  // ── 2. Seedream 4.5 (Ark API) ───────────────────────────────────
  console.log("\n▸ [4.5] Submitting via Ark API (doubao-seedream-4-5)…");

  // Try without reference images first — Ark 4.5 text-to-image with same prompt
  const { result: result45, imageUrls: urls45 } = await arkGenerateAndExtract({
    apiKey: config.ark.apiKey,
    model: config.ark.model,
    prompt: PROMPT,
    size: config.ark.size
  });

  const saved45 = [];
  for (let i = 0; i < urls45.length; i++) {
    const url = urls45[i];
    const dest = path.join(outDir, `v45-${i + 1}.png`);
    if (url.startsWith("data:")) {
      const raw = url.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    } else {
      await downloadFile(url, dest);
    }
    saved45.push(dest);
    console.log(`  → ${dest}`);
  }
  console.log(`[4.5] Saved ${saved45.length} image(s)`);

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("  Done! Compare the results in:");
  console.log(`  ${outDir}`);
  console.log("  v40-*.png = Seedream 4.0");
  console.log("  v45-*.png = Seedream 4.5");
  console.log("═══════════════════════════════════════");

  // Save report
  fs.writeFileSync(path.join(outDir, "compare-report.json"), JSON.stringify({
    prompt: PROMPT,
    referenceImages: PRODUCT_PATHS,
    v40: { model: "jimeng_t2i_v40", scale: 0.5 },
    v45: { model: config.ark.model, size: config.ark.size },
    rawResponse45: result45
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
