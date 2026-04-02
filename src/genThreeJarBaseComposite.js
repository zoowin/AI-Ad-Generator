import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ensureDir, writeJson } from "./output.js";

const CANVAS = { width: 1600, height: 1600 };

const PRODUCT_FILES = {
  cleansingBalm: "input/products/40_Cleansing Balm/OpuntiaCleansingBalm_PNG_231107_v1_Depology.png",
  bluePatch: "input/products/06_BluePatch/BluePatch_PNG_231107_v1_Depology.png",
  tripleLipid: "input/products/29_Triple Lipid Cream/TripleCreamRich_PNG_231107_v1_Depology.png"
};

const PRODUCT_LAYOUT = [
  {
    key: "cleansingBalm",
    visibleWidth: 470,
    centerX: 332,
    baselineY: 1048,
    shadow: { blur: 18, opacity: 0.24, scaleX: 0.9, scaleY: 0.12 }
  },
  {
    key: "bluePatch",
    visibleWidth: 430,
    centerX: 805,
    baselineY: 1056,
    shadow: { blur: 16, opacity: 0.27, scaleX: 0.93, scaleY: 0.11 }
  },
  {
    key: "tripleLipid",
    visibleWidth: 352,
    centerX: 1202,
    baselineY: 1049,
    shadow: { blur: 18, opacity: 0.24, scaleX: 0.88, scaleY: 0.12 }
  }
];

function parseArgs(argv) {
  const opts = { outName: "three-jar-base-composite" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      opts.outName = argv[++i];
    }
  }
  return opts;
}

function backgroundSvg() {
  const { width, height } = CANVAS;
  return Buffer.from(`
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#d6ebff"/>
        <stop offset="23%" stop-color="#f5f8fc"/>
        <stop offset="62%" stop-color="#f9f9f8"/>
        <stop offset="100%" stop-color="#efefed"/>
      </linearGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.96)"/>
        <stop offset="35%" stop-color="rgba(255,255,255,0.58)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
      <linearGradient id="pedestalTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fbfbfb"/>
        <stop offset="100%" stop-color="#f1efec"/>
      </linearGradient>
      <linearGradient id="pedestalFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f7f6f3"/>
        <stop offset="100%" stop-color="#ece9e5"/>
      </linearGradient>
      <filter id="softBlur">
        <feGaussianBlur stdDeviation="16"/>
      </filter>
      <filter id="shadowBlur">
        <feGaussianBlur stdDeviation="10"/>
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect x="-50" y="0" width="320" height="${height}" fill="rgba(110,180,255,0.16)"/>
    <polygon points="0,0 620,0 325,760 0,1140" fill="url(#beam)" opacity="0.88"/>
    <polygon points="0,110 290,0 430,0 70,880" fill="rgba(155,210,255,0.12)" filter="url(#softBlur)"/>

    <rect x="86" y="1015" width="1428" height="32" fill="rgba(0,0,0,0.06)" filter="url(#shadowBlur)" opacity="0.45"/>
    <rect x="92" y="980" width="1416" height="70" rx="4" fill="url(#pedestalTop)"/>
    <rect x="92" y="1048" width="1416" height="552" rx="0" fill="url(#pedestalFront)"/>

    <path d="M160 1012 C 330 998, 575 1008, 790 1016 S 1230 1006, 1450 1015" stroke="rgba(165,165,165,0.26)" stroke-width="3" fill="none"/>
    <path d="M130 1270 C 360 1230, 610 1270, 900 1228 S 1270 1218, 1460 1248" stroke="rgba(165,165,165,0.14)" stroke-width="4" fill="none"/>
    <path d="M1050 1055 C 1120 1140, 1186 1225, 1290 1322" stroke="rgba(160,160,160,0.10)" stroke-width="4" fill="none"/>
    <path d="M250 1038 C 220 1140, 185 1260, 145 1450" stroke="rgba(165,165,165,0.09)" stroke-width="4" fill="none"/>
    <path d="M722 1020 C 760 1130, 782 1270, 810 1485" stroke="rgba(170,170,170,0.08)" stroke-width="3" fill="none"/>

    <g fill="rgba(247,248,249,0.72)" stroke="rgba(228,230,232,0.78)" stroke-width="2">
      <path d="M310 1050 C 318 1102, 314 1185, 320 1295 C 322 1355, 334 1418, 348 1420 C 362 1420, 372 1360, 372 1312 C 372 1206, 356 1122, 360 1050 Z"/>
      <path d="M760 1050 C 770 1115, 764 1208, 768 1345 C 770 1430, 782 1512, 796 1514 C 810 1514, 820 1435, 822 1370 C 826 1235, 810 1136, 812 1050 Z"/>
      <path d="M1240 1050 C 1248 1100, 1242 1178, 1248 1280 C 1250 1346, 1262 1390, 1276 1392 C 1288 1392, 1298 1348, 1300 1296 C 1302 1192, 1288 1112, 1290 1050 Z"/>
    </g>
  </svg>`);
}

function ellipseShadowSvg(width, height, opacity) {
  return Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="blur">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <ellipse cx="${width / 2}" cy="${height / 2}" rx="${Math.round(width * 0.38)}" ry="${Math.round(height * 0.22)}" fill="rgba(0,0,0,${opacity})" filter="url(#blur)"/>
  </svg>`);
}

async function trimProduct(filePath) {
  const { data, info } = await sharp(filePath)
    .trim()
    .png()
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, info };
}

async function softenAlphaEdges(input) {
  const meta = await sharp(input).metadata();
  const alpha = await sharp(input).extractChannel(3).blur(0.7).toBuffer();
  const rgb = await sharp(input).removeAlpha().toBuffer();
  return sharp(rgb)
    .joinChannel(alpha)
    .png()
    .resize(meta.width, meta.height)
    .toBuffer();
}

async function makeProductLayer(filePath, visibleWidth) {
  const trimmed = await trimProduct(filePath);
  const resized = await sharp(trimmed.buffer)
    .resize({ width: visibleWidth })
    .png()
    .toBuffer();
  const softened = await softenAlphaEdges(resized);
  const meta = await sharp(softened).metadata();
  return { buffer: softened, width: meta.width, height: meta.height };
}

async function buildComposite(outName) {
  const outDir = path.join(process.cwd(), "output", "reference-matches");
  ensureDir(outDir);

  const layers = [{ input: backgroundSvg(), left: 0, top: 0 }];
  const placements = [];

  for (const item of PRODUCT_LAYOUT) {
    const productPath = PRODUCT_FILES[item.key];
    const product = await makeProductLayer(productPath, item.visibleWidth);
    const left = Math.round(item.centerX - product.width / 2);
    const top = Math.round(item.baselineY - product.height);

    const shadowW = Math.round(product.width * item.shadow.scaleX);
    const shadowH = Math.round(Math.max(60, product.height * item.shadow.scaleY));
    const shadowLeft = Math.round(item.centerX - shadowW / 2);
    const shadowTop = Math.round(item.baselineY - shadowH / 2 + 8);
    const shadow = ellipseShadowSvg(shadowW, shadowH, item.shadow.opacity);

    layers.push({ input: shadow, left: shadowLeft, top: shadowTop, blend: "multiply" });
    layers.push({ input: product.buffer, left, top, blend: "over" });

    placements.push({
      key: item.key,
      source: productPath,
      width: product.width,
      height: product.height,
      left,
      top,
      baselineY: item.baselineY,
      visibleWidth: item.visibleWidth
    });
  }

  const pngPath = path.join(outDir, `${outName}.png`);
  await sharp({
    create: {
      width: CANVAS.width,
      height: CANVAS.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(layers)
    .png()
    .toFile(pngPath);

  writeJson(path.join(outDir, `${outName}.json`), {
    canvas: CANVAS,
    placements
  });

  return pngPath;
}

async function main() {
  const opts = parseArgs(process.argv);
  for (const filePath of Object.values(PRODUCT_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing product file: ${filePath}`);
    }
  }
  const out = await buildComposite(opts.outName);
  console.log(out);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
