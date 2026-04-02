import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract } from "./arkClient.js";
import { ensureDir, writeJson, downloadFile } from "./output.js";

const PRODUCT_FILES = {
  cleansingBalm: path.resolve(
    process.cwd(),
    "input/products/40_Cleansing Balm/OpuntiaCleansingBalm_PNG_231107_v1_Depology.png"
  ),
  bluePatch: path.resolve(
    process.cwd(),
    "input/products/06_BluePatch/BluePatch_PNG_231107_v1_Depology.png"
  ),
  tripleLipid: path.resolve(
    process.cwd(),
    "input/products/29_Triple Lipid Cream/TripleCreamRich_PNG_231107_v1_Depology.png"
  )
};

function parseArgs(argv) {
  const opts = {
    outName: "three-jar-reference",
    size: null,
    n: 1
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out" && argv[i + 1]) {
      opts.outName = argv[++i];
    } else if (arg === "--size" && argv[i + 1]) {
      opts.size = argv[++i];
    } else if (arg === "--n" && argv[i + 1]) {
      opts.n = Number.parseInt(argv[++i], 10) || 1;
    }
  }

  return opts;
}

function fileToDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${base64}`;
}

function buildPrompt() {
  return [
    "用途：产品广告图",
    "资产类型：高端护肤品牌静物海报",
    "核心要求：基于提供的 3 张 Depology 产品参考图，生成一张写实、高级、干净的护肤品组合图。",
    "场景背景：前景是一块干净的白色大理石台面或台阶，带有轻微灰色纹理；背景是柔和的白墙，从左侧打入淡淡的冷蓝色渐变光。",
    "主体：3 个面霜/眼膜罐并排放置在大理石边缘，紧密排列。",
    "构图：正方形画幅，正面平视机位，产品位于画面中下部，上半部分留出干净留白。左边是 Opuntia-C cleansing balm 白罐，中央是深蓝色 Replenish & Repair under eye patch，右边是 Triple Lipid + Q10 白罐。",
    "光线氛围：左上方柔和日光照射，整体是冷调、洁净、轻奢、实验室级护肤广告质感。",
    "材质细节：白色抛光大理石，细腻灰纹，磨砂玻璃瓶身，金属银盖，台面前沿有几道透明精华液/水珠自然往下流淌，反射真实，边缘高光精致。",
    "质量：高",
    "硬性约束：必须保留参考图中的真实品牌、瓶型、标签排版、瓶盖材质和颜色。3 个产品都要完整清晰可见。左侧 cleansing balm 100ml 必须是三者里体量最大的，整体是宽而厚的圆柱白罐，白色盖子较高，瓶身也较高，盖子与瓶身的高度比例接近 1 比 1，不能把盖子做得过薄，也不能把瓶身压得太矮。中间蓝罐必须是三者里最矮、最扁的罐体，它的直径大、总高度低，银色盖子占整体高度的大约一半，深蓝色瓶身偏矮，整体像低矮圆盘。右侧 triple lipid 50ml 必须明显比中间蓝罐更窄，但高度高于中间蓝罐；它是一个正常的 50ml 面霜罐，不是迷你小样；它的盖子与瓶身比例要接近原始产品图，银盖偏厚，瓶身高度略高于盖子或与盖子接近，绝不能出现超高盖子配超矮瓶身，或者超矮盖子配拉长瓶身。右侧 triple lipid 50ml 的整体体量要明显小于左侧 100ml cleansing balm，但要保留真实 50ml 面霜罐的厚实感。严格参考你提供的实拍对比图、产品原图和参考广告图中的大小关系与单品结构比例。",
    "禁止出现：额外道具、手、人、花、叶子、盒子、漂浮产品、倾斜包装、错误颜色的盖子、包装变形、标签乱码、过度蓝光、插画感、卡通感、文字叠加、水印、夸张飞溅、杂乱背景。"
  ].join("\n");
}

function buildNegativePrompt() {
  return [
    "text overlay",
    "watermark",
    "logo redesign",
    "wrong package",
    "warped jar",
    "deformed lid",
    "extra products",
    "missing product",
    "hands",
    "people",
    "flowers",
    "leaves",
    "messy background",
    "warm yellow lighting",
    "cartoon",
    "illustration",
    "low detail"
  ].join(", ");
}

async function main() {
  const opts = parseArgs(process.argv);
  const config = loadConfig();

  for (const [name, filePath] of Object.entries(PRODUCT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing product file for ${name}: ${filePath}`);
    }
  }

  const outDir = path.join(config.outputDir, "reference-matches");
  ensureDir(outDir);

  const prompt = buildPrompt();
  const negativePrompt = buildNegativePrompt();
  const imageUrls = [
    fileToDataUrl(PRODUCT_FILES.cleansingBalm),
    fileToDataUrl(PRODUCT_FILES.bluePatch),
    fileToDataUrl(PRODUCT_FILES.tripleLipid)
  ];

  const { result, imageUrls: outputUrls } = await arkGenerateAndExtract({
    apiKey: config.ark.apiKey,
    model: config.ark.model,
    prompt,
    negativePrompt,
    size: opts.size || config.ark.size || "2048x2048",
    n: opts.n,
    watermark: false,
    imageUrls
  });

  if (!outputUrls.length) {
    throw new Error("No output image returned from Ark.");
  }

  const savedFiles = [];
  for (let i = 0; i < outputUrls.length; i++) {
    const suffix = String(i + 1).padStart(2, "0");
    const dest = path.join(outDir, `${opts.outName}-${suffix}.png`);
    await downloadFile(outputUrls[i], dest);
    savedFiles.push(dest);
  }

  const report = {
    createdAt: new Date().toISOString(),
    productFiles: PRODUCT_FILES,
    prompt,
    negativePrompt,
    model: config.ark.model,
    size: opts.size || config.ark.size || "2048x2048",
    n: opts.n,
    outputFiles: savedFiles,
    rawResponse: result
  };

  writeJson(path.join(outDir, `${opts.outName}-report.json`), report);

  console.log(`Saved ${savedFiles.length} image(s) to ${outDir}`);
  for (const file of savedFiles) {
    console.log(file);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
