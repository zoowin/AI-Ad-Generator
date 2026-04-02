import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract } from "./arkClient.js";
import { ensureDir, downloadFile, writeJson } from "./output.js";

function parseArgs(argv) {
  const values = new Map();
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.split("=");
    if (inlineValue != null) {
      values.set(key, inlineValue);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      values.set(key, next);
      i += 1;
      continue;
    }
    values.set(key, "true");
  }
  return {
    prompt: values.get("--prompt") || "",
    negative: values.get("--negative") || "",
    size: values.get("--size") || "1536x1536",
    tag: values.get("--tag") || "ba-test"
  };
}

function getNextFilePath(dir, baseName, ext) {
  let index = 1;
  while (true) {
    const candidate = path.join(dir, `${baseName}-${String(index).padStart(3, "0")}.${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    index += 1;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.prompt) {
    throw new Error("Missing --prompt");
  }

  const config = loadConfig();
  const outDir = path.join(config.outputDir, "ba-tests");
  ensureDir(outDir);

  const { imageUrls, result } = await arkGenerateAndExtract({
    apiKey: config.ark.apiKey,
    model: config.ark.model,
    prompt: args.prompt,
    negativePrompt: args.negative,
    size: args.size,
    n: 1,
    seed: -1,
    watermark: false,
    responseFormat: "url"
  });

  if (!imageUrls.length) {
    throw new Error("No image returned");
  }

  const imagePath = getNextFilePath(outDir, args.tag, "png");
  const url = imageUrls[0];
  if (url.startsWith("data:")) {
    const raw = url.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(imagePath, Buffer.from(raw, "base64"));
  } else {
    await downloadFile(url, imagePath);
  }

  const metaPath = getNextFilePath(outDir, `${args.tag}-meta`, "json");
  writeJson(metaPath, {
    prompt: args.prompt,
    negative: args.negative,
    size: args.size,
    imagePath,
    raw: result
  });

  console.log(`Saved image: ${imagePath}`);
  console.log(`Saved meta: ${metaPath}`);
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
