/**
 * Compare Seedream 4.0 vs 4.5 — duo product scene + skin editorial.
 *
 * Runs 3 calls total:
 *   1) 4.0 img2img — duo product scene (legacy Volcengine API)
 *   2) 4.5 text2img — duo product scene (Ark API)
 *   3) 4.5 text2img — skin editorial (Ark API, 3:2)
 *
 * Usage: node src/testCompare40vs45.js
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { arkGenerateAndExtract, imageFileToBase64 } from "./arkClient.js";
import { ensureDir, downloadFile } from "./output.js";

function extractBase64Images(result) {
  if (Array.isArray(result?.data?.binary_data_base64)) {
    return result.data.binary_data_base64.filter(Boolean);
  }
  return [];
}

function extractImageUrls(result) {
  const urls = [];
  if (Array.isArray(result?.data?.image_urls)) urls.push(...result.data.image_urls);
  if (Array.isArray(result?.image_urls)) urls.push(...result.image_urls);
  return [...new Set(urls.filter(Boolean))];
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

async function saveImages(images, outDir, prefix) {
  let saved = 0;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const dest = path.join(outDir, `${prefix}-${i + 1}.png`);
    if (img.startsWith("data:")) {
      fs.writeFileSync(dest, Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64"));
    } else if (img.startsWith("http")) {
      await downloadFile(img, dest);
    } else {
      // raw base64
      fs.writeFileSync(dest, Buffer.from(img, "base64"));
    }
    console.log(`  Saved: ${dest}`);
    saved++;
  }
  return saved;
}

// ─── Prompts ────────────────────────────────────────────────

const DUO_PROMPT = `两瓶Depology护肤精华产品并排展示。

场景：纯净的白色微水磨石台面，产品自然地前后错位摆放，左瓶略前、右瓶略后。背景是大面积留白的浅暖灰墙面，只有一道从右侧落地窗透进来的自然斜光。光线穿过产品瓶身形成柔和的折射光斑投射在台面上。

不需要任何装饰道具。画面极简——只有产品、光影、台面。产品阴影真实自然，随光线方向统一向左偏。瓶身有微妙的环境光反射。

色调：低饱和度，冷白偏暖，类似Aesop或Glossier的品牌视觉风格。
构图：产品偏画面右侧三分之一处，左侧大面积留白。
质感：哑光台面、通透玻璃瓶身、金属质感瓶盖。

商业产品摄影，90mm微距镜头，f/4光圈，自然光，极简主义，超高清。`;

const SKIN_PROMPT = `极近距离特写：一张充满光泽感的水润肌肤，皮肤表面如玻璃般通透反光。光线从侧上方掠过皮肤表面，形成柔和的高光带和细腻的光影过渡。

韩式美妆杂志编辑风格。背景纯净干净，带有极淡的蓝绿色调暗示清新与水润。皮肤看起来深层水润、半透明、健康饱满，毛孔细腻但真实可见。

尼康Z9，105mm微距镜头，f/2.8，柔焦效果。色调冷白偏透亮，不过度磨皮，保留真实皮肤纹理。高端护肤品广告大片质感，8K超高清。`;

async function main() {
  const config = loadConfig();
  const outDir = path.join(config.outputDir, "compare-40-45");
  ensureDir(outDir);

  const ts = Date.now();

  // Load product reference images
  const b64Matrixyl = imageFileToBase64("assets/products/Products_img_10_Matrixyl 3000 Serum.png");
  const b64Peptide = imageFileToBase64("assets/products/Products_img_23 Peptide Complex Serum.png");

  // ── 1. Seedream 4.0 (legacy API) — duo product img2img ──
  console.log("═══ [1/3] Seedream 4.0 — Duo Product (img2img) ═══");
  const client40 = new VolcengineJimengClient(config.volcengine);
  let task40;
  try {
    const submitResult = await client40.submitImg2ImgTask({
      prompt: DUO_PROMPT,
      binaryDataBase64: [b64Matrixyl, b64Peptide],
      scale: 0.5,
      reqKey: "jimeng_t2i_v40"
    });

    if (submitResult?.code !== 10000) {
      console.error("4.0 submit failed:", JSON.stringify(submitResult).slice(0, 300));
    } else {
      const taskId = submitResult?.data?.task_id;
      console.log(`  Task ID: ${taskId}`);
      task40 = taskId
        ? waitForResult(client40, config, taskId, "jimeng_t2i_v40")
        : Promise.resolve(submitResult);
    }
  } catch (err) {
    console.error("4.0 error:", err.message);
  }

  // ── 2. Seedream 4.5 (Ark API) — duo product ──
  console.log("\n═══ [2/3] Seedream 4.5 — Duo Product (text2img + ref) ═══");
  let task45duo;
  try {
    task45duo = arkGenerateAndExtract({
      apiKey: config.ark.apiKey,
      model: config.ark.model,
      prompt: DUO_PROMPT,
      size: config.ark.size,
      imageUrls: [
        "data:image/png;base64," + b64Matrixyl,
        "data:image/png;base64," + b64Peptide
      ]
    });
  } catch (err) {
    console.error("4.5 duo error:", err.message);
  }

  // ── 3. Seedream 4.5 (Ark API) — skin editorial ──
  console.log("\n═══ [3/3] Seedream 4.5 — Skin Editorial (text2img) ═══");
  let task45skin;
  try {
    // 3:2 ratio needs at least 3686400 px → 2400x1600
    task45skin = arkGenerateAndExtract({
      apiKey: config.ark.apiKey,
      model: config.ark.model,
      prompt: SKIN_PROMPT,
      size: "2400x1600"
    });
  } catch (err) {
    console.error("4.5 skin error:", err.message);
  }

  // ── Wait for all results ──
  console.log("\nWaiting for all results...\n");

  // 4.0 result
  if (task40) {
    try {
      const result40 = await task40;
      const images = [...extractImageUrls(result40), ...extractBase64Images(result40)];
      console.log(`[4.0 Duo] Got ${images.length} image(s)`);
      await saveImages(images, outDir, `40-duo-${ts}`);
    } catch (err) {
      console.error("[4.0 Duo] Failed:", err.message);
    }
  }

  // 4.5 duo result
  if (task45duo) {
    try {
      const { imageUrls } = await task45duo;
      console.log(`[4.5 Duo] Got ${imageUrls.length} image(s)`);
      await saveImages(imageUrls, outDir, `45-duo-${ts}`);
    } catch (err) {
      console.error("[4.5 Duo] Failed:", err.message);
    }
  }

  // 4.5 skin result
  if (task45skin) {
    try {
      const { imageUrls } = await task45skin;
      console.log(`[4.5 Skin] Got ${imageUrls.length} image(s)`);
      await saveImages(imageUrls, outDir, `45-skin-${ts}`);
    } catch (err) {
      console.error("[4.5 Skin] Failed:", err.message);
    }
  }

  console.log(`\nAll done! Check: ${outDir}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
