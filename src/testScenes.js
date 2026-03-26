/**
 * Test multiple V2 scenes. Runs one API call per scene.
 *
 * Usage: node src/testScenes.js [scene1] [scene2] ...
 * Default: lab-editorial, stone-daylight, dark-elegant
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir, writeJson } from "./output.js";
import { buildImg2ImgPromptV2, getPresets } from "./promptTemplate.js";

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
    console.log(`    poll ${i}/${config.maxPollAttempts} — ${status || "pending"}`);
    await sleep(config.pollIntervalMs);
  }
  throw new Error(`Task ${taskId} timed out`);
}

async function main() {
  const args = process.argv.slice(2);
  const defaultScenes = ["lab-editorial", "stone-daylight", "dark-elegant"];
  const scenes = args.length > 0 ? args : defaultScenes;

  const available = getPresets().sceneInstructions;
  for (const s of scenes) {
    if (!available.includes(s)) {
      console.error(`Unknown scene: ${s}. Available: ${available.join(", ")}`);
      process.exit(1);
    }
  }

  const config = loadConfig();
  const client = new VolcengineJimengClient(config.volcengine);
  const outDir = path.join(config.outputDir, "scenes");
  ensureDir(outDir);

  const refImage = path.resolve("assets/products/Products_img_10_Matrixyl 3000 Serum.png");
  const b64 = [imageToBase64(refImage)];

  console.log(`Running ${scenes.length} scene(s): ${scenes.join(", ")}\n`);

  for (const scene of scenes) {
    const { prompt, meta } = buildImg2ImgPromptV2({ scene, lang: "zh" });

    console.log(`[${scene}]`);
    console.log(`  ${prompt.slice(0, 80)}…`);

    const submitResult = await client.submitImg2ImgTask({
      prompt,
      binaryDataBase64: b64,
      scale: 0.5,
      reqKey: "jimeng_t2i_v40"
    });

    if (submitResult?.code !== 10000) {
      console.error(`  FAILED:`, submitResult?.message || submitResult?.code);
      continue;
    }

    const taskId = submitResult?.data?.task_id;
    console.log(`  taskId: ${taskId}`);

    const finalResult = taskId
      ? await waitForResult(client, config, taskId, "jimeng_t2i_v40")
      : submitResult;

    // Save
    let saved = 0;
    for (const url of extractImageUrls(finalResult)) {
      const dest = path.join(outDir, `${scene}-url.png`);
      const resp = await fetch(url);
      fs.writeFileSync(dest, Buffer.from(await resp.arrayBuffer()));
      saved++;
    }
    for (const b of extractBase64Images(finalResult)) {
      const dest = path.join(outDir, `${scene}-b64.png`);
      const raw = b.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(dest, Buffer.from(raw, "base64"));
      saved++;
    }
    console.log(`  saved ${saved} image(s)\n`);
  }

  console.log(`Done. Results in ${outDir}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
