/**
 * Test: two products in one scene, 2048x2048.
 * 1 API call.
 *
 * Usage: node src/testDuo.js
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir } from "./output.js";

function imageToBase64(filePath) {
  return fs.readFileSync(filePath).toString("base64");
}

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
    if (status === "failed") throw new Error(`Task ${taskId} failed: ${JSON.stringify(result)}`);
    console.log(`  poll ${i}/${config.maxPollAttempts} — ${status || "pending"}`);
    await sleep(config.pollIntervalMs);
  }
  throw new Error(`Task ${taskId} timed out`);
}

const DUO_PROMPT = `画面中有两瓶Depology精华液并排放在一起：左边是蓝色瓶身的Matrixyl 3000精华，右边是深色瓶身的Peptide Complex精华。两瓶大小相同，都是30ml滴管瓶。

场景：两瓶精华放在深色哑光石板台面上，构图略偏左留出右侧呼吸空间。一束精准的侧光从左上方打来，两个瓶子都有清晰的高光和自然的阴影过渡。台面上有两瓶产品各自的投影，投影方向一致。背景是虚化的暖灰色调，干净但不空洞。

两瓶之间有微妙的前后错位，不是死板的并排，右边那瓶稍微靠后一点。瓶身上可以看到对方的微弱环境反射。

产品标签文字必须清晰可读。真实的商业产品摄影，85mm镜头f/2.8，自然色彩不过度饱和，高端护肤品牌双品组合广告。超高清画质。`;

async function main() {
  const config = loadConfig();
  const client = new VolcengineJimengClient(config.volcengine);
  const outDir = path.join(config.outputDir, "duo");
  ensureDir(outDir);

  // Both product PNGs as base64 reference
  const b64Matrixyl = imageToBase64("assets/products/Products_img_10_Matrixyl 3000 Serum.png");
  const b64Peptide = imageToBase64("assets/products/Products_img_23 Peptide Complex Serum.png");

  console.log("=== Duo Product Test ===");
  console.log(`Resolution: ${config.volcengine.width}x${config.volcengine.height}`);
  console.log(`Model: jimeng_t2i_v40`);
  console.log(`Scale: 0.5`);
  console.log(`Reference images: 2 (Matrixyl + Peptide)`);
  console.log(`Prompt: ${DUO_PROMPT.slice(0, 80)}…\n`);

  const submitResult = await client.submitImg2ImgTask({
    prompt: DUO_PROMPT,
    binaryDataBase64: [b64Matrixyl, b64Peptide],
    scale: 0.5,
    reqKey: "jimeng_t2i_v40"
  });

  if (submitResult?.code !== 10000) {
    console.error("FAILED:", JSON.stringify(submitResult, null, 2));
    fs.writeFileSync(path.join(outDir, "duo-error.json"), JSON.stringify(submitResult, null, 2));
    process.exit(1);
  }

  const taskId = submitResult?.data?.task_id;
  console.log(`Task ID: ${taskId}`);

  const finalResult = taskId
    ? await waitForResult(client, config, taskId, "jimeng_t2i_v40")
    : submitResult;

  // Save
  let saved = 0;
  for (const url of extractImageUrls(finalResult)) {
    const dest = path.join(outDir, "duo-scene-url.png");
    const resp = await fetch(url);
    fs.writeFileSync(dest, Buffer.from(await resp.arrayBuffer()));
    saved++;
    console.log(`Saved: ${dest}`);
  }
  for (const b of extractBase64Images(finalResult)) {
    const dest = path.join(outDir, "duo-scene-b64.png");
    const raw = b.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    saved++;
    console.log(`Saved: ${dest}`);
  }

  console.log(`\nDone. ${saved} image(s) at ${config.volcengine.width}x${config.volcengine.height}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
