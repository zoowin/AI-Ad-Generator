import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.js";
import { arkGenerateAndExtract } from "./arkClient.js";
import { ensureDir, writeJson, downloadFile } from "./output.js";

const DEFAULT_BASE_IMAGE = path.resolve(
  process.cwd(),
  "output/reference-matches/depology-three-jar-base-v1.png"
);

function parseArgs(argv) {
  const opts = {
    base: DEFAULT_BASE_IMAGE,
    outName: "three-jar-from-base",
    size: null,
    n: 1
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base" && argv[i + 1]) {
      opts.base = path.resolve(process.cwd(), argv[++i]);
    } else if (arg === "--out" && argv[i + 1]) {
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
    "基于提供的参考底图进行高保真重绘，但这张参考底图只用于锁定 3 个产品的相对大小、横向顺序、间距、透视角度、摆放位置，以及每个产品自身的盖子与瓶身比例。",
    "不要把参考底图里的台面造型、液滴形状、边缘细节、背景质感原样照搬。比例图只看比例和站位，不看材质表现。",
    "不要改变产品结构，不要改大改小，不要改变任何一个罐子的宽高比例。",
    "只对画面进行高级广告化增强：",
    "1. 做成写实的高端护肤广告图。",
    "2. 背景是干净白墙，左侧有柔和冷蓝色渐变光，上方有一道从左上到右下的冷白色自然斜向光束，整体光线参考原始广告图，而不是参考底图。",
    "3. 台面参考原始广告图：是一个简洁、平整、抛光的白色大理石长方体台面，线条干净，边缘笔直利落，纹理自然高级。",
    "4. 台面前沿只有少量真实透明精华液缓慢下垂的液滴，液滴要像真实精华自然流下，数量少、形状克制、边缘真实，不要像胶水，不要像画上去的装饰。",
    "5. 光线为左上方柔和自然光，带冷调高级感，产品边缘高光更真实，阴影接触关系自然。",
    "6. 保持产品标签、品牌、瓶盖材质、瓶身材质准确清晰。",
    "7. 整体效果参考高端商业产品摄影，不要像拼贴，不要像插画。",
    "8. 三个产品之间允许有自然的小间隙，不要紧贴在一起，但仍然保持一个完整的产品组合关系。",
    "硬性要求：左侧 100ml cleansing balm 最大；中间蓝罐最矮最扁；右侧 50ml triple lipid 明显比中间蓝罐更窄但更高。严格锁定参考底图里的比例关系。"
  ].join("\n");
}

function buildNegativePrompt() {
  return [
    "改变产品比例",
    "改变产品位置",
    "改变产品顺序",
    "改变盖子和瓶身比例",
    "错误包装",
    "变形",
    "标签乱码",
    "复制参考底图的台面细节",
    "复制参考底图的液滴形状",
    "额外产品",
    "人物",
    "手",
    "花叶",
    "夸张水花",
    "粗糙石材边缘",
    "破损台面",
    "雕花台座",
    "不自然液滴",
    "卡通",
    "插画",
    "低清晰度",
    "过强蓝光",
    "水印",
    "文字叠加"
  ].join(", ");
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!fs.existsSync(opts.base)) {
    throw new Error(`Missing base reference image: ${opts.base}`);
  }

  const config = loadConfig();
  const outDir = path.join(config.outputDir, "reference-matches");
  ensureDir(outDir);

  const prompt = buildPrompt();
  const negativePrompt = buildNegativePrompt();

  const { result, imageUrls } = await arkGenerateAndExtract({
    apiKey: config.ark.apiKey,
    model: config.ark.model,
    prompt,
    negativePrompt,
    size: opts.size || config.ark.size || "2048x2048",
    n: opts.n,
    watermark: false,
    imageUrls: [fileToDataUrl(opts.base)]
  });

  if (!imageUrls.length) {
    throw new Error("No output image returned from Ark.");
  }

  const savedFiles = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const suffix = String(i + 1).padStart(2, "0");
    const dest = path.join(outDir, `${opts.outName}-${suffix}.png`);
    await downloadFile(imageUrls[i], dest);
    savedFiles.push(dest);
  }

  writeJson(path.join(outDir, `${opts.outName}-report.json`), {
    createdAt: new Date().toISOString(),
    baseImage: opts.base,
    prompt,
    negativePrompt,
    model: config.ark.model,
    size: opts.size || config.ark.size || "2048x2048",
    outputFiles: savedFiles,
    rawResponse: result
  });

  console.log(`Saved ${savedFiles.length} image(s) to ${outDir}`);
  for (const file of savedFiles) {
    console.log(file);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
