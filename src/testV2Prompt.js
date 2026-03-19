/**
 * Test V2 prompt strategy: concise Chinese instruction + jimeng_t2i_v40 + scale=0.5
 * Only 1 API call.
 *
 * Usage: node src/testV2Prompt.js
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir, writeJson } from "./output.js";
import { buildImg2ImgPromptV2 } from "./promptTemplate.js";

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
    if (status === "failed") throw new Error(`Task ${taskId} failed`);
    console.log(`  poll ${i}/${config.maxPollAttempts} — ${status || "pending"}`);
    await sleep(config.pollIntervalMs);
  }
  throw new Error(`Task ${taskId} timed out`);
}

async function main() {
  const config = loadConfig();
  const client = new VolcengineJimengClient(config.volcengine);
  const outDir = path.join(config.outputDir, "v2-test");
  ensureDir(outDir);

  // Reference image
  const refImage = path.resolve("assets/products/Products_img_10_Matrixyl 3000 Serum.png");
  const b64 = [imageToBase64(refImage)];

  // V2 prompt: concise Chinese instruction
  const { prompt, meta } = buildImg2ImgPromptV2({ scene: "lab-tech", lang: "zh" });

  console.log("=== V2 Prompt Test ===");
  console.log(`Scene: ${meta.scene}`);
  console.log(`Lang: ${meta.lang}`);
  console.log(`Model: jimeng_t2i_v40`);
  console.log(`Scale: 0.5`);
  console.log(`Prompt: ${prompt}`);
  console.log("");

  // Use jimeng_t2i_v40 with image reference
  const submitResult = await client.submitImg2ImgTask({
    prompt,
    binaryDataBase64: b64,
    scale: 0.5,
    reqKey: "jimeng_t2i_v40"
  });

  if (submitResult?.code !== 10000) {
    console.error("FAILED:", JSON.stringify(submitResult, null, 2));
    writeJson(path.join(outDir, "v2-error.json"), submitResult);
    process.exit(1);
  }

  const taskId = submitResult?.data?.task_id;
  console.log(`Task ID: ${taskId}`);

  const finalResult = taskId
    ? await waitForResult(client, config, taskId, "jimeng_t2i_v40")
    : submitResult;

  // Save results
  const saved = [];
  for (const url of extractImageUrls(finalResult)) {
    const dest = path.join(outDir, "v2-lab-tech-url.png");
    const resp = await fetch(url);
    fs.writeFileSync(dest, Buffer.from(await resp.arrayBuffer()));
    saved.push(dest);
  }
  for (const b of extractBase64Images(finalResult)) {
    const dest = path.join(outDir, "v2-lab-tech-b64.png");
    const raw = b.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    saved.push(dest);
  }

  writeJson(path.join(outDir, "v2-result.json"), { prompt, meta, taskId, saved });
  console.log(`\nDone. ${saved.length} image(s) saved to ${outDir}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
