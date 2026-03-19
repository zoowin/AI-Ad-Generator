import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { buildBrandProfile } from "./siteProfile.js";
import { generateAdConcepts } from "./adPromptGenerator.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir, writeJson, downloadFile } from "./output.js";
import { loadProductAssets } from "./productAssets.js";

function parseArgs(argv) {
  const flags = new Set(argv.slice(2));
  return {
    dryRun: flags.has("--dry-run"),
    brandOnly: flags.has("--brand-only"),
    testImage: flags.has("--test-image")
  };
}

async function maybeDownloadImages(config, conceptId, submitResult) {
  if (!config.downloadImages) {
    return [];
  }

  const candidateUrls = [];
  if (Array.isArray(submitResult?.extractedImageUrls)) {
    candidateUrls.push(...submitResult.extractedImageUrls);
  }
  if (Array.isArray(submitResult?.data?.image_urls)) {
    candidateUrls.push(...submitResult.data.image_urls);
  }
  if (Array.isArray(submitResult?.data?.urls)) {
    candidateUrls.push(...submitResult.data.urls);
  }
  if (Array.isArray(submitResult?.image_urls)) {
    candidateUrls.push(...submitResult.image_urls);
  }

  const uniqueUrls = [...new Set(candidateUrls.filter(Boolean))];
  const downloads = [];

  for (let i = 0; i < uniqueUrls.length; i += 1) {
    const url = uniqueUrls[i];
    const ext = new URL(url).pathname.split(".").pop() || "png";
    const filePath = getNextImagePath(config.outputDir, conceptId, ext);
    await downloadFile(url, filePath);
    downloads.push(filePath);
  }

  return downloads;
}

function getNextImagePath(outputDir, conceptId, ext = "png") {
  const imagesDir = path.join(outputDir, "images");
  ensureDir(imagesDir);

  let index = 1;
  while (true) {
    const filePath = path.join(imagesDir, `${conceptId}-${index}.${ext}`);
    if (!fs.existsSync(filePath)) {
      return filePath;
    }
    index += 1;
  }
}

async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function extractImageUrls(result) {
  const urls = [];

  if (Array.isArray(result?.data?.image_urls)) {
    urls.push(...result.data.image_urls);
  }
  if (Array.isArray(result?.image_urls)) {
    urls.push(...result.image_urls);
  }

  return [...new Set(urls.filter(Boolean))];
}

function extractBase64Images(result) {
  const images = [];

  if (Array.isArray(result?.data?.binary_data_base64)) {
    images.push(...result.data.binary_data_base64.filter(Boolean));
  }

  return images;
}

async function writeBase64Images(config, conceptId, result) {
  const images = extractBase64Images(result);
  const files = [];

  for (let i = 0; i < images.length; i += 1) {
    const filePath = getNextImagePath(config.outputDir, conceptId, "png");
    const base64 = images[i].replace(/^data:image\/\w+;base64,/, "");
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
    files.push(filePath);
  }

  return files;
}

async function waitForImageResult(client, config, taskId) {
  for (let attempt = 1; attempt <= config.maxPollAttempts; attempt += 1) {
    const result = await client.getImageTask({ taskId });
    const status = result?.data?.status || "";
    const imageUrls = extractImageUrls(result);
    const base64Images = extractBase64Images(result);

    if (status === "done" || imageUrls.length > 0 || base64Images.length > 0) {
      return result;
    }

    if (status === "failed") {
      throw new Error(`Image task ${taskId} failed.`);
    }

    await sleep(config.pollIntervalMs);
  }

  throw new Error(`Image task ${taskId} did not complete within polling limit.`);
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();
  ensureDir(config.outputDir);
  const productAssets = loadProductAssets(process.cwd());
  writeJson(path.join(config.outputDir, "product-assets.json"), productAssets);

  if (args.testImage) {
    const client = new VolcengineJimengClient(config.volcengine);
    const concept = {
      id: "test-image",
      angle: "Pipeline connectivity test",
      enPrompt: config.testPrompt
    };
    const submitResult = await client.submitImageTask({
      prompt: concept.enPrompt,
      width: config.volcengine.width,
      height: config.volcengine.height,
      imageUrls: concept.referenceImageUrls || []
    });
    const taskId = submitResult?.data?.task_id;
    const finalResult = taskId ? await waitForImageResult(client, config, taskId) : submitResult;
    const normalizedResult = {
      ...finalResult,
      taskId,
      extractedImageUrls: extractImageUrls(finalResult),
      extractedBase64Count: extractBase64Images(finalResult).length
    };
    const downloadedFiles = [
      ...(await maybeDownloadImages(config, concept.id, normalizedResult)),
      ...(await writeBase64Images(config, concept.id, normalizedResult))
    ];
    const payload = {
      concept,
      submitResult,
      finalResult: normalizedResult,
      downloadedFiles
    };
    writeJson(path.join(config.outputDir, "test-image-result.json"), payload);
    console.log(`Test image flow complete. Downloaded ${downloadedFiles.length} files.`);
    return;
  }

  const brandData = await buildBrandProfile(config.siteUrl);
  writeJson(path.join(config.outputDir, "brand-profile.json"), brandData);

  if (args.brandOnly) {
    console.log(`Brand profile written to ${path.join(config.outputDir, "brand-profile.json")}`);
    return;
  }

  const concepts = generateAdConcepts(brandData.profile, productAssets.assets);
  writeJson(path.join(config.outputDir, "ad-concepts.json"), concepts);

  if (args.dryRun) {
    console.log(`Dry run complete. Generated ${concepts.length} concepts.`);
    return;
  }

  const client = new VolcengineJimengClient(config.volcengine);
  const results = [];

  for (const concept of concepts) {
    const submitResult = await client.submitImageTask({
      prompt: concept.enPrompt,
      width: config.volcengine.width,
      height: config.volcengine.height,
      imageUrls: concept.referenceImageUrls || []
    });
    const taskId = submitResult?.data?.task_id;
    const finalResult = taskId ? await waitForImageResult(client, config, taskId) : submitResult;
    const normalizedResult = {
      ...finalResult,
      taskId,
      extractedImageUrls: extractImageUrls(finalResult),
      extractedBase64Count: extractBase64Images(finalResult).length
    };
    const downloadedFiles = [
      ...(await maybeDownloadImages(config, concept.id, normalizedResult)),
      ...(await writeBase64Images(config, concept.id, normalizedResult))
    ];
    results.push({
      concept,
      submitResult,
      finalResult: normalizedResult,
      downloadedFiles
    });
  }

  writeJson(path.join(config.outputDir, "generation-results.json"), results);
  console.log(`Generated ${results.length} image task result sets.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
