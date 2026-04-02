/**
 * Standalone test: image-to-image with a local product photo.
 *
 * Usage:
 *   node src/testImg2Img.js                        # uses first PNG in assets/products/
 *   node src/testImg2Img.js --file <path>          # use a specific image
 *   node src/testImg2Img.js --url <public-url>     # use a public image URL
 *   node src/testImg2Img.js --scale 0.4            # override scale (0-1)
 *   node src/testImg2Img.js --v4                   # use jimeng_t2i_v40 instead of i2i_v30
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir, writeJson, downloadFile } from "./output.js";

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { file: null, url: null, scale: null, useV4: false, prompt: null, width: null, height: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) {
      opts.file = args[++i];
    } else if (args[i] === "--url" && args[i + 1]) {
      opts.url = args[++i];
    } else if (args[i] === "--scale" && args[i + 1]) {
      opts.scale = Number.parseFloat(args[++i]);
    } else if (args[i] === "--v4") {
      opts.useV4 = true;
    } else if (args[i] === "--prompt" && args[i + 1]) {
      opts.prompt = args[++i];
    } else if (args[i] === "--width" && args[i + 1]) {
      opts.width = Number.parseInt(args[++i], 10);
    } else if (args[i] === "--height" && args[i + 1]) {
      opts.height = Number.parseInt(args[++i], 10);
    }
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function imageToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return buf.toString("base64");
}

function findFirstProductImage(rootDir) {
  const dir = path.join(rootDir, "assets", "products");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) =>
    /\.(png|jpg|jpeg|webp)$/i.test(f)
  );
  return files.length > 0 ? path.join(dir, files[0]) : null;
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

function getNextFilePath(dir, baseName, ext = "png") {
  let index = 1;
  while (true) {
    const suffix = String(index).padStart(3, "0");
    const candidate = path.join(dir, `${baseName}-${suffix}.${ext}`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
    index += 1;
  }
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
    console.log(`  poll ${i}/${config.maxPollAttempts} — status: ${status || "pending"}`);
    await sleep(config.pollIntervalMs);
  }
  throw new Error(`Task ${taskId} timed out after ${config.maxPollAttempts} polls.`);
}

// ---------------------------------------------------------------------------
// Default prompt template for product-in-scene
// ---------------------------------------------------------------------------
function buildDefaultPrompt() {
  return (
    "Premium skincare product photography. " +
    "The product bottle is placed on a clean marble surface with soft natural daylight, " +
    "surrounded by fresh green leaves and water droplets. " +
    "Luxury spa atmosphere, shallow depth of field, " +
    "photorealistic commercial beauty shot, high detail. " +
    "Keep the product label, shape, and proportions exactly as the reference image."
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv);
  const config = loadConfig();
  const client = new VolcengineJimengClient(config.volcengine);
  const outDir = path.join(config.outputDir, "img2img");
  ensureDir(outDir);

  // Resolve reference image
  let imageUrls = null;
  let binaryDataBase64 = null;

  if (opts.url) {
    imageUrls = [opts.url];
    console.log(`Reference image (URL): ${opts.url}`);
  } else {
    const filePath = opts.file || findFirstProductImage(process.cwd());
    if (!filePath || !fs.existsSync(filePath)) {
      console.error("No reference image found. Use --file or --url, or place a PNG in assets/products/.");
      process.exit(1);
    }
    const stats = fs.statSync(filePath);
    console.log(`Reference image (local): ${filePath}  (${(stats.size / 1024).toFixed(1)} KB)`);
    binaryDataBase64 = [imageToBase64(filePath)];
  }

  const prompt = opts.prompt || buildDefaultPrompt();
  const reqKey = opts.useV4 ? "jimeng_t2i_v40" : undefined; // undefined → uses config default i2i_v30

  console.log(`\nModel: ${reqKey || config.volcengine.i2iReqKey}`);
  console.log(`Scale: ${opts.scale ?? config.volcengine.i2iScale}`);
  console.log(`Size: ${opts.width ?? config.volcengine.width}x${opts.height ?? config.volcengine.height}`);
  console.log(`Prompt: ${prompt.slice(0, 120)}…\n`);

  // Submit
  console.log("Submitting img2img task…");
  const submitResult = await client.submitImg2ImgTask({
    prompt,
    imageUrls,
    binaryDataBase64,
    scale: opts.scale,
    width: opts.width,
    height: opts.height,
    reqKey
  });

  console.log("Submit response code:", submitResult?.code);
  if (submitResult?.code !== 10000) {
    console.error("Submit failed:", JSON.stringify(submitResult, null, 2));
    writeJson(path.join(outDir, "img2img-error.json"), submitResult);
    process.exit(1);
  }

  const taskId = submitResult?.data?.task_id;
  console.log("Task ID:", taskId);

  // Poll or use direct result
  let finalResult = submitResult;
  if (taskId) {
    const effectiveReqKey = reqKey || config.volcengine.i2iReqKey;
    finalResult = await waitForResult(client, config, taskId, effectiveReqKey);
  }

  // Save results
  const imageUrlResults = extractImageUrls(finalResult);
  const base64Results = extractBase64Images(finalResult);
  const downloaded = [];

  for (let i = 0; i < imageUrlResults.length; i++) {
    const dest = getNextFilePath(outDir, "img2img-result-url");
    await downloadFile(imageUrlResults[i], dest);
    downloaded.push(dest);
    console.log(`Downloaded: ${dest}`);
  }

  for (let i = 0; i < base64Results.length; i++) {
    const dest = getNextFilePath(outDir, "img2img-result-b64");
    const raw = base64Results[i].replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(dest, Buffer.from(raw, "base64"));
    downloaded.push(dest);
    console.log(`Saved base64: ${dest}`);
  }

  const report = {
    prompt,
    reqKey: reqKey || config.volcengine.i2iReqKey,
    scale: opts.scale ?? config.volcengine.i2iScale,
    width: opts.width ?? config.volcengine.width,
    height: opts.height ?? config.volcengine.height,
    taskId,
    imageUrls: imageUrlResults,
    base64Count: base64Results.length,
    downloadedFiles: downloaded,
    rawResponse: finalResult
  };

  writeJson(path.join(outDir, "img2img-result.json"), report);
  console.log(`\nDone. ${downloaded.length} image(s) saved to ${outDir}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
