/**
 * A/B comparison: img2img vs background-only composite.
 * Only 2 API calls total.
 *
 * Usage: node src/compareTest.js
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir, writeJson, downloadFile } from "./output.js";
import { buildImg2ImgPrompt, buildBackgroundPrompt } from "./promptTemplate.js";

// ---------------------------------------------------------------------------
const OUT_DIR_NAME = "compare";

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
    console.log(`    poll ${i}/${config.maxPollAttempts} — ${status || "pending"}`);
    await sleep(config.pollIntervalMs);
  }
  throw new Error(`Task ${taskId} timed out`);
}

async function runOneTask(client, config, label, { prompt, reqKey, binaryDataBase64, scale }) {
  console.log(`\n[${ label }]`);
  console.log(`  prompt: ${prompt.slice(0, 100)}…`);
  console.log(`  scale: ${scale}  reqKey: ${reqKey}`);

  const submitResult = await client.submitImg2ImgTask({
    prompt,
    binaryDataBase64,
    scale,
    reqKey
  });

  if (submitResult?.code !== 10000) {
    console.error(`  FAILED:`, JSON.stringify(submitResult, null, 2));
    return null;
  }

  const taskId = submitResult?.data?.task_id;
  console.log(`  taskId: ${taskId}`);

  const finalResult = taskId
    ? await waitForResult(client, config, taskId, reqKey)
    : submitResult;

  return finalResult;
}

async function saveResult(outDir, name, result) {
  const files = [];

  for (const url of extractImageUrls(result)) {
    const dest = path.join(outDir, `${name}-url.png`);
    await downloadFile(url, dest);
    files.push(dest);
  }

  for (const b64 of extractBase64Images(result)) {
    const dest = path.join(outDir, `${name}-b64.png`);
    const raw = b64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    files.push(dest);
  }

  return files;
}

// ---------------------------------------------------------------------------
async function main() {
  const config = loadConfig();
  const client = new VolcengineJimengClient(config.volcengine);
  const outDir = path.join(config.outputDir, OUT_DIR_NAME);
  ensureDir(outDir);

  // Reference product image (Matrixyl PNG, small)
  const refImage = path.resolve("assets/products/Products_img_10_Matrixyl 3000 Serum.png");
  const b64 = [imageToBase64(refImage)];

  // --- A: img2img with structured prompt, scale=0.15 ---
  const promptA = buildImg2ImgPrompt({
    product: "matrixyl-3000",
    scene: "lab-tech",
    lighting: "clinical-soft"
  });

  const resultA = await runOneTask(client, config, "A: img2img scale=0.15", {
    prompt: promptA.prompt,
    reqKey: "jimeng_i2i_v30",
    binaryDataBase64: b64,
    scale: 0.15
  });

  if (resultA) {
    const filesA = await saveResult(outDir, "A-img2img-lab", resultA);
    console.log(`  saved: ${filesA.join(", ")}`);
  }

  // --- B: background-only (for composite) ---
  const promptB = buildBackgroundPrompt({
    scene: "lab-tech",
    lighting: "clinical-soft"
  });

  // Use t2i (text-to-image) for pure background, no reference image
  const resultB = await client.submitImageTask({
    prompt: promptB.prompt,
    width: config.volcengine.width,
    height: config.volcengine.height
  });

  if (resultB?.code !== 10000) {
    console.error(`  B FAILED:`, JSON.stringify(resultB, null, 2));
  } else {
    const taskIdB = resultB?.data?.task_id;
    console.log(`\n[B: background-only]`);
    console.log(`  prompt: ${promptB.prompt.slice(0, 100)}…`);
    console.log(`  taskId: ${taskIdB}`);

    const finalB = taskIdB
      ? await waitForResult(client, config, taskIdB, config.volcengine.reqKey)
      : resultB;
    const filesB = await saveResult(outDir, "B-bg-only-lab", finalB);
    console.log(`  saved: ${filesB.join(", ")}`);
  }

  // Summary
  console.log(`\nDone. Results in ${outDir}`);
  console.log("Next step: overlay product PNG on B result for composite comparison.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
