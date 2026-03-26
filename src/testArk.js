/**
 * Test Seedream 4.5 via Ark Platform API.
 *
 * Usage:
 *   node src/testArk.js                          # text-to-image with default prompt
 *   node src/testArk.js --file <path>            # with reference image (img2img)
 *   node src/testArk.js --file <p1> --file <p2>  # with 2 reference images
 *   node src/testArk.js --files <p1,p2>          # with 2+ reference images
 *   node src/testArk.js --prompt "your prompt"   # custom prompt
 *   node src/testArk.js --size 2K                # override size (default: 2K)
 */

import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract, imageFileToBase64 } from "./arkClient.js";
import { ensureDir, downloadFile } from "./output.js";

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { files: [], prompt: null, size: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && args[i + 1]) opts.files.push(args[++i]);
    else if (args[i] === "--files" && args[i + 1]) {
      const raw = args[++i];
      for (const part of raw.split(",")) {
        const p = part.trim();
        if (p) opts.files.push(p);
      }
    }
    else if (args[i] === "--prompt" && args[i + 1]) opts.prompt = args[++i];
    else if (args[i] === "--size" && args[i + 1]) opts.size = args[++i];
  }

  return opts;
}

function findFirstProductImage(rootDir) {
  const dir = path.join(rootDir, "assets", "products");
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  return files.length > 0 ? path.join(dir, files[0]) : null;
}

function mimeFromFilePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

// Default Chinese prompt optimized for product photography
function buildDefaultPrompt() {
  return (
    "高端护肤品产品摄影。将产品放置在大理石台面上，" +
    "背景是柔和的自然光透过薄纱窗帘，旁边有几片新鲜绿叶。" +
    "佳能EOS R5，85mm f/1.4镜头，浅景深，" +
    "自然柔光从左侧45度角照射，营造高级感的光影效果。" +
    "商业产品摄影风格，画面干净简约，色调温暖自然。"
  );
}

async function main() {
  const opts = parseArgs(process.argv);
  const config = loadConfig();
  const outDir = path.join(config.outputDir, "ark-seedream45");
  ensureDir(outDir);

  const apiKey = config.ark.apiKey;
  const model = config.ark.model;
  const prompt = opts.prompt || buildDefaultPrompt();
  const size = opts.size || config.ark.size;

  console.log("=== Seedream 4.5 Test (Ark Platform) ===");
  console.log(`Model: ${model}`);
  console.log(`Size: ${size}`);
  console.log(`Prompt: ${prompt.slice(0, 100)}…\n`);

  // Reference image handling
  const imageUrls = [];
  const files = opts.files.length > 0 ? opts.files : [];
  if (files.length === 0) {
    const first = findFirstProductImage(process.cwd());
    if (first) files.push(first);
  }

  if (files.length > 0) {
    for (const filePath of files) {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const stats = fs.statSync(filePath);
      console.log(`Reference image: ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
      const b64 = imageFileToBase64(filePath);
      imageUrls.push(`data:${mimeFromFilePath(filePath)};base64,${b64}`);
    }
  }

  // Generate
  console.log("\nSubmitting to Ark API…");
  const { result, imageUrls: resultUrls } = await arkGenerateAndExtract({
    apiKey,
    model,
    prompt,
    size,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined
  });

  console.log(`\nReceived ${resultUrls.length} image(s)`);

  // Save results
  const downloaded = [];
  const timestamp = Date.now();

  for (let i = 0; i < resultUrls.length; i++) {
    const url = resultUrls[i];
    const dest = path.join(outDir, `seedream45-${timestamp}-${i + 1}.png`);

    if (url.startsWith("data:")) {
      const base64 = url.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(dest, Buffer.from(base64, "base64"));
      console.log(`Saved: ${dest}`);
    } else {
      await downloadFile(url, dest);
      console.log(`Downloaded: ${dest}`);
    }
    downloaded.push(dest);
  }

  // Save raw response for debugging
  const reportPath = path.join(outDir, `seedream45-${timestamp}-result.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    prompt,
    model,
    size,
    hasReferenceImage: imageUrls.length > 0,
    imageCount: resultUrls.length,
    downloadedFiles: downloaded,
    rawResponse: result
  }, null, 2));

  console.log(`\nDone. ${downloaded.length} image(s) saved to ${outDir}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
