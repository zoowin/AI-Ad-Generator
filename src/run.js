import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { loadConfig } from "./config.js";
import { buildBrandProfile } from "./siteProfile.js";
import { generateAdConcepts } from "./adPromptGenerator.js";
import { VolcengineJimengClient } from "./volcengineClient.js";
import { ensureDir, writeJson, downloadFile } from "./output.js";
import { loadProductAssets } from "./productAssets.js";
import { buildImg2ImgPromptV2, getPresets } from "./promptTemplate.js";
import { arkGenerateAndExtract, imageFileToBase64 } from "./arkClient.js";
import { OUTPUT_PATHS } from "./paths.js";

function parseArgs(argv) {
  const flags = new Set();
  const values = new Map();

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      continue;
    }

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

    flags.add(key);
  }

  return {
    dryRun: flags.has("--dry-run"),
    brandOnly: flags.has("--brand-only"),
    testImage: flags.has("--test-image"),
    mode: values.get("--mode") || "direct",
    provider: values.get("--provider") || "",
    concurrency: Number.parseInt(values.get("--concurrency") || "0", 10) || 0,
    limit: Number.parseInt(values.get("--limit") || "0", 10) || 0,
    resume: flags.has("--no-resume") ? false : true,
    force: flags.has("--force"),
    scenes: values.get("--scenes") || "",
    scale: Number.parseFloat(values.get("--scale") || ""),
    n: Number.parseInt(values.get("--n") || "0", 10) || 0,
    size: values.get("--size") || "",
    labelFix: flags.has("--label-fix")
  };
}

function safeFileName(value) {
  return String(value)
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function dateStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getCoreOutputDir() {
  return OUTPUT_PATHS.runsCore;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferThemeFromConceptId(conceptId) {
  const raw = String(conceptId || "").trim();
  if (!raw) {
    return "general";
  }
  if (raw.includes("__")) {
    const scene = raw.split("__").pop();
    if (scene) return scene;
  }
  return raw;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getLabelFixLayout(scene) {
  const defaultLayout = { x: 0.498, y: 0.469, w: 0.209, h: 0.259 };
  const byScene = {
    "lab-closeup": { x: 0.498, y: 0.469, w: 0.209, h: 0.259 },
    "lab-editorial": { x: 0.374, y: 0.438, w: 0.18, h: 0.238 },
    "stone-daylight": { x: 0.458, y: 0.463, w: 0.196, h: 0.25 }
  };
  return byScene[scene] || defaultLayout;
}

function buildLabelFixSvg({ width, height, scene }) {
  const layout = getLabelFixLayout(scene);
  const x = Math.round(width * layout.x);
  const y = Math.round(height * layout.y);
  const w = Math.round(width * layout.w);
  const h = Math.round(height * layout.h);
  const brandSize = Math.max(38, Math.round(w * 0.19));
  const textSize = Math.max(24, Math.round(w * 0.105));
  const smallSize = Math.max(19, Math.round(w * 0.08));
  const lineGap = Math.max(10, Math.round(h * 0.02));
  const baseX = x + Math.round(w * 0.07);
  const lineY = y + Math.round(h * 0.12);
  const separatorY = y + Math.round(h * 0.44);
  const l1 = lineY;
  const l2 = separatorY + Math.round(h * 0.13);
  const l3 = l2 + textSize + lineGap;
  const dashY = l3 + smallSize + lineGap;
  const l5 = dashY + smallSize + lineGap;
  const l6 = l5 + smallSize + lineGap;
  const l7 = y + Math.round(h * 0.9);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(8,17,35,0.55)" rx="${Math.round(w * 0.03)}" />
    <rect x="${x + Math.round(w * 0.02)}" y="${y + Math.round(h * 0.02)}" width="${Math.round(w * 0.96)}" height="${Math.round(h * 0.96)}" fill="rgba(4,12,24,0.2)" rx="${Math.round(w * 0.03)}" />
    <text x="${baseX}" y="${l1}" fill="#f3f5fa" font-family="Times New Roman, Georgia, serif" font-size="${brandSize}" letter-spacing="0.3">${escapeXml("Dēpology")}</text>
    <rect x="${x + Math.round(w * 0.05)}" y="${separatorY}" width="${Math.round(w * 0.9)}" height="${Math.max(2, Math.round(h * 0.008))}" fill="#d8dbe5" opacity="0.95" />
    <text x="${baseX}" y="${l2}" fill="#f4f6fb" font-family="Arial, Helvetica, sans-serif" font-size="${textSize}" font-weight="700">${escapeXml("Matrixyl®3000")}</text>
    <text x="${baseX}" y="${l3}" fill="#f4f6fb" font-family="Arial, Helvetica, sans-serif" font-size="${textSize}" font-weight="700">${escapeXml("Collagen Serum")}</text>
    <rect x="${baseX}" y="${dashY - Math.round(smallSize * 0.5)}" width="${Math.round(w * 0.1)}" height="${Math.max(2, Math.round(h * 0.006))}" fill="#f0f3f8" />
    <text x="${baseX}" y="${l5}" fill="#f0f2f8" font-family="Arial, Helvetica, sans-serif" font-size="${smallSize}" font-weight="500">${escapeXml("Advanced Serum Solution")}</text>
    <text x="${baseX}" y="${l6}" fill="#f0f2f8" font-family="Arial, Helvetica, sans-serif" font-size="${smallSize}" font-weight="500">${escapeXml("Developed to Smooth Skin")}</text>
    <text x="${baseX}" y="${l7}" fill="#edf0f7" font-family="Arial, Helvetica, sans-serif" font-size="${smallSize}" font-weight="500">${escapeXml("30ml / 1.01 fl. oz.")}</text>
  </g>
</svg>`.trim();
}

async function applyLabelFixOverlay({ filePath, scene }) {
  const sourceBuffer = fs.readFileSync(filePath);
  const image = sharp(sourceBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (!width || !height) {
    return filePath;
  }
  const svg = buildLabelFixSvg({ width, height, scene });
  const outputBuffer = await image
    .composite([{ input: Buffer.from(svg), blend: "over" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  const tmpPath = `${filePath}.label-fix.tmp`;
  fs.writeFileSync(tmpPath, outputBuffer);
  fs.renameSync(tmpPath, filePath);
  return filePath;
}

async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withRetry(fn, { retries = 2, baseMs = 1200, maxMs = 12000, label = "task" } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt > retries) {
        break;
      }
      const jitter = Math.floor(Math.random() * 250);
      const waitMs = Math.min(maxMs, baseMs * 2 ** (attempt - 1) + jitter);
      console.warn(`[retry] ${label} failed (attempt ${attempt}/${retries + 1}): ${error.message || error}`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

async function runPool(items, concurrency, worker) {
  const effectiveConcurrency = Math.max(1, concurrency || 1);
  const results = new Array(items.length);
  let cursor = 0;

  async function runOne() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(effectiveConcurrency, items.length) }, () => runOne());
  await Promise.all(runners);
  return results;
}

async function maybeDownloadImages(config, conceptId, submitResult) {
  const runOutputDir = getCoreOutputDir();
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
    const filePath = getNextImagePath(runOutputDir, {
      theme: inferThemeFromConceptId(conceptId),
      provider: "url",
      ext
    });
    await downloadFile(url, filePath);
    downloads.push(filePath);
  }

  return downloads;
}

function getNextImagePath(outputDir, { theme, provider = "img", ext = "png" }) {
  const imagesDir = path.join(outputDir, "images");
  ensureDir(imagesDir);

  const stamp = dateStamp(new Date());
  const themeSlug = slugify(theme) || "general";
  const providerSlug = slugify(provider) || "img";
  let index = 1;
  while (true) {
    const suffix = String(index).padStart(3, "0");
    const filePath = path.join(imagesDir, `${stamp}-${themeSlug}-${providerSlug}-${suffix}.${ext}`);
    if (!fs.existsSync(filePath)) {
      return filePath;
    }
    index += 1;
  }
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
  const runOutputDir = getCoreOutputDir();
  const images = extractBase64Images(result);
  const files = [];

  for (let i = 0; i < images.length; i += 1) {
    const filePath = getNextImagePath(runOutputDir, {
      theme: inferThemeFromConceptId(conceptId),
      provider: "b64",
      ext: "png"
    });
    const base64 = images[i].replace(/^data:image\/\w+;base64,/, "");
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
    files.push(filePath);
  }

  return files;
}

async function waitForImageResult(client, config, taskId, reqKey) {
  for (let attempt = 1; attempt <= config.maxPollAttempts; attempt += 1) {
    const result = await client.getImageTask({ taskId, reqKey });
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

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function writeJsonAtomic(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}

async function feishuRequest({ url, method = "GET", token, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    ...(body == null ? {} : { body: JSON.stringify(body) })
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { msg: text };
  }

  if (!response.ok) {
    throw new Error(`Feishu API failed: ${response.status} ${JSON.stringify(data)}`);
  }
  if (Number(data?.code || 0) !== 0) {
    throw new Error(`Feishu API code error: ${JSON.stringify(data)}`);
  }

  return data;
}

async function getFeishuTenantAccessToken(feishuConfig) {
  if (!feishuConfig.appId || !feishuConfig.appSecret) {
    throw new Error("Missing FEISHU_APP_ID or FEISHU_APP_SECRET.");
  }

  const tokenResp = await feishuRequest({
    url: "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    method: "POST",
    body: {
      app_id: feishuConfig.appId,
      app_secret: feishuConfig.appSecret
    }
  });
  const token = tokenResp?.tenant_access_token || tokenResp?.data?.tenant_access_token;
  if (!token) {
    throw new Error("No tenant_access_token in Feishu response.");
  }
  return token;
}

async function feishuUploadMedia({ feishuConfig, token, fileName, contentType, buffer }) {
  const parentNode = feishuConfig.uploadParentNode || feishuConfig.appToken;
  if (!parentNode) {
    throw new Error("Missing FEISHU_MEDIA_PARENT_NODE or FEISHU_BITABLE_APP_TOKEN for media upload.");
  }

  const form = new FormData();
  form.set("file_name", fileName);
  form.set("parent_type", feishuConfig.uploadParentType || "bitable_file");
  form.set("parent_node", parentNode);
  form.set("size", String(buffer.length));
  form.set("file", new Blob([buffer], { type: contentType || "application/octet-stream" }), fileName);

  const response = await fetch("https://open.feishu.cn/open-apis/drive/v1/medias/upload_all", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`
    },
    body: form
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { msg: text };
  }

  if (!response.ok) {
    throw new Error(`Feishu media upload failed: ${response.status} ${JSON.stringify(data)}`);
  }
  if (Number(data?.code || 0) !== 0) {
    throw new Error(`Feishu media upload code error: ${JSON.stringify(data)}`);
  }

  const fileToken = data?.data?.file_token || data?.file_token;
  if (!fileToken) {
    throw new Error(`No file_token from Feishu media upload: ${JSON.stringify(data)}`);
  }
  return fileToken;
}

function mimeFromFileName(fileName) {
  const ext = path.extname(String(fileName || "")).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "application/octet-stream";
}

async function loadImageForFeishuUpload(row) {
  if (row?.localPath && fs.existsSync(row.localPath)) {
    return {
      fileName: path.basename(row.localPath),
      contentType: mimeFromFileName(row.localPath),
      buffer: fs.readFileSync(row.localPath)
    };
  }

  const imageUrl = row?.imageUrl || "";
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return undefined;
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch source image URL: ${response.status} ${imageUrl}`);
  }
  const urlPath = (() => {
    try {
      return new URL(imageUrl).pathname;
    } catch {
      return "";
    }
  })();
  const fallbackName = `image-${Date.now()}.png`;
  const guessedName = path.basename(urlPath || "") || fallbackName;
  const contentType = response.headers.get("content-type") || mimeFromFileName(guessedName);
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    fileName: guessedName,
    contentType,
    buffer
  };
}

function normalizeFeishuText(value, maxLen = 5000) {
  if (value == null) {
    return "";
  }
  const text = String(value);
  if (text.length <= maxLen) {
    return text;
  }
  return text.slice(0, maxLen);
}

function buildPrimaryTitle(row) {
  const status = row?.status || "unknown";
  const conceptId = row?.conceptId || "no-concept";
  const scene = row?.scene || "no-scene";
  const runId = row?.runId || "no-run";
  return normalizeFeishuText(`${status} | ${conceptId} | ${scene} | ${runId}`, 300);
}

function setFieldIfConfigured(payload, fieldName, value) {
  if (!fieldName) {
    return;
  }
  payload[fieldName] = value;
}

function toFeishuDateValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  const parsed = Date.parse(String(value || ""));
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return Date.now();
}

function buildFeishuRecordFields({ feishuConfig, row }) {
  const fields = feishuConfig.fields;
  const payload = {};

  setFieldIfConfigured(payload, fields.primary, row.primary || buildPrimaryTitle(row));
  setFieldIfConfigured(payload, fields.runId, row.runId);
  setFieldIfConfigured(payload, fields.sourceSystem, row.sourceSystem);
  setFieldIfConfigured(payload, fields.workflow, row.workflow);
  setFieldIfConfigured(payload, fields.provider, row.provider || "");
  setFieldIfConfigured(payload, fields.conceptId, row.conceptId || "");
  setFieldIfConfigured(payload, fields.scene, row.scene || "");
  setFieldIfConfigured(payload, fields.status, row.status || "");
  setFieldIfConfigured(payload, fields.prompt, normalizeFeishuText(row.prompt || "", 12000));
  setFieldIfConfigured(payload, fields.imageUrl, row.imageUrl || "");
  setFieldIfConfigured(payload, fields.localPath, row.localPath || "");
  setFieldIfConfigured(payload, fields.taskId, row.taskId || "");
  setFieldIfConfigured(payload, fields.generatedAt, toFeishuDateValue(row.generatedAt || Date.now()));
  setFieldIfConfigured(payload, fields.linkKey, row.linkKey || "");
  setFieldIfConfigured(payload, fields.edmCampaignId, row.edmCampaignId || "");
  setFieldIfConfigured(payload, fields.edmFlowId, row.edmFlowId || "");
  setFieldIfConfigured(payload, fields.error, normalizeFeishuText(row.error || "", 4000));

  if (fields.imageAttachment && row.imageAttachmentFileToken) {
    payload[fields.imageAttachment] = [{ file_token: row.imageAttachmentFileToken }];
  }

  return payload;
}

async function createFeishuBitableRecord({ feishuConfig, token, fields }) {
  if (!feishuConfig.appToken || !feishuConfig.tableId) {
    throw new Error("Missing FEISHU_BITABLE_APP_TOKEN or FEISHU_BITABLE_TABLE_ID.");
  }
  const encodedAppToken = encodeURIComponent(feishuConfig.appToken);
  const encodedTableId = encodeURIComponent(feishuConfig.tableId);
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodedAppToken}/tables/${encodedTableId}/records`;
  return feishuRequest({
    url,
    method: "POST",
    token,
    body: { fields }
  });
}

function buildLinkKey({ sourceSystem, edmCampaignId, edmFlowId, conceptId, scene }) {
  return [sourceSystem, edmCampaignId || "-", edmFlowId || "-", conceptId || "-", scene || "-"].join("|");
}

function buildRowsFromGenerationResults({ results, runId, config }) {
  const feishuConfig = config.integration.feishu;
  const sourceSystem = feishuConfig.sourceSystem;
  const workflow = feishuConfig.workflow;
  const edmCampaignId = config.integration.edmCampaignId;
  const edmFlowId = config.integration.edmFlowId;
  const rows = [];

  for (const item of results) {
    const conceptId = item?.concept?.id || "";
    const scene = item?.concept?.angle || "";
    const provider = "jimeng";
    const prompt = item?.concept?.enPrompt || "";
    const generatedAt = new Date().toISOString();
    const taskId = item?.finalResult?.taskId || item?.submitResult?.data?.task_id || "";
    const imageUrls = Array.isArray(item?.finalResult?.extractedImageUrls) ? item.finalResult.extractedImageUrls : [];
    const downloadedFiles = Array.isArray(item?.downloadedFiles) ? item.downloadedFiles : [];
    const linkKey = buildLinkKey({ sourceSystem, edmCampaignId, edmFlowId, conceptId, scene });

    if (downloadedFiles.length > 0) {
      for (let i = 0; i < downloadedFiles.length; i += 1) {
        rows.push({
          primary: buildPrimaryTitle({ runId, conceptId, scene, status: "ok" }),
          runId,
          sourceSystem,
          workflow,
          provider,
          conceptId,
          scene,
          status: "ok",
          prompt,
          imageUrl: imageUrls[i] || imageUrls[0] || "",
          localPath: downloadedFiles[i],
          taskId,
          generatedAt,
          edmCampaignId,
          edmFlowId,
          linkKey,
          error: ""
        });
      }
      continue;
    }

    rows.push({
      primary: buildPrimaryTitle({ runId, conceptId, scene, status: item?.error ? "error" : "ok" }),
      runId,
      sourceSystem,
      workflow,
      provider,
      conceptId,
      scene,
      status: item?.error ? "error" : "ok",
      prompt,
      imageUrl: imageUrls[0] || "",
      localPath: "",
      taskId,
      generatedAt,
      edmCampaignId,
      edmFlowId,
      linkKey,
      error: item?.error || ""
    });
  }

  return rows;
}

function buildRowsFromImg2ImgResults({ results, runId, config }) {
  const feishuConfig = config.integration.feishu;
  const sourceSystem = feishuConfig.sourceSystem;
  const workflow = feishuConfig.workflow;
  const edmCampaignId = config.integration.edmCampaignId;
  const edmFlowId = config.integration.edmFlowId;
  const rows = [];

  for (const item of results) {
    const status = item?.status || "";
    if (status === "planned") {
      continue;
    }
    const conceptId = item?.id || "";
    const scene = item?.scene || "";
    const provider = item?.provider || config.batch.provider || "";
    const linkKey = buildLinkKey({ sourceSystem, edmCampaignId, edmFlowId, conceptId, scene });
    const imageUrlCandidates = [
      ...extractImageUrls(item?.jimeng?.raw),
      ...extractImageUrls(item?.ark?.raw)
    ];
    rows.push({
      primary: buildPrimaryTitle({ runId, conceptId, scene, status: item?.status || "" }),
      runId,
      sourceSystem,
      workflow,
      provider,
      conceptId,
      scene,
      status,
      prompt: item?.prompt || "",
      imageUrl: imageUrlCandidates[0] || "",
      localPath: item?.outputPath || "",
      taskId: item?.jimeng?.taskId || "",
      generatedAt: item?.updatedAt || new Date().toISOString(),
      edmCampaignId,
      edmFlowId,
      linkKey,
      error: item?.error || ""
    });
  }

  return rows;
}

async function syncRowsToFeishuBitable({ rows, config, runId, workflow }) {
  const feishuConfig = config.integration.feishu;
  if (!feishuConfig.enabled) {
    return { enabled: false, total: 0, success: 0, failed: 0 };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { enabled: true, total: 0, success: 0, failed: 0 };
  }

  const token = await getFeishuTenantAccessToken(feishuConfig);
  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const rowData = {
      ...row,
      runId: row.runId || runId,
      workflow: row.workflow || workflow || feishuConfig.workflow
    };
    if (feishuConfig.nativeImageEnabled && !rowData.imageAttachmentFileToken) {
      try {
        const imageAsset = await loadImageForFeishuUpload(rowData);
        if (imageAsset?.buffer?.length > 0) {
          rowData.imageAttachmentFileToken = await feishuUploadMedia({
            feishuConfig,
            token,
            fileName: imageAsset.fileName,
            contentType: imageAsset.contentType,
            buffer: imageAsset.buffer
          });
        }
      } catch (error) {
        console.error(`[feishu] image upload skipped: ${error.message || error}`);
      }
    }
    const fields = buildFeishuRecordFields({ feishuConfig, row: rowData });
    try {
      await createFeishuBitableRecord({ feishuConfig, token, fields });
      success += 1;
    } catch (error) {
      failed += 1;
      console.error(`[feishu] record sync failed: ${error.message || error}`);
    }
  }

  return { enabled: true, total: rows.length, success, failed };
}

async function saveFirstImageFromResult({ outputPath, result }) {
  const imageUrls = extractImageUrls(result);
  const base64Images = extractBase64Images(result);

  if (base64Images.length > 0) {
    const base64 = base64Images[0].replace(/^data:image\/\w+;base64,/, "");
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
    return outputPath;
  }

  if (imageUrls.length > 0) {
    await downloadFile(imageUrls[0], outputPath);
    return outputPath;
  }

  throw new Error("No image payload found in result.");
}

async function saveFirstImageFromUrls({ outputPath, urls }) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("No image URLs returned.");
  }

  const url = urls[0];
  ensureDir(path.dirname(outputPath));
  if (url.startsWith("data:")) {
    const base64 = url.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
    return outputPath;
  }

  await downloadFile(url, outputPath);
  return outputPath;
}

function parseCommaList(raw) {
  if (!raw) {
    return [];
  }
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function buildImg2ImgPlan(productAssets, sceneKeys) {
  const candidates = productAssets.assets
    .filter((asset) => [".png", ".jpg", ".jpeg", ".webp"].includes(path.extname(asset.fileName).toLowerCase()))
    .map((asset) => ({
      ...asset,
      safeName: safeFileName(asset.displayName || asset.fileName)
    }));

  const items = [];
  for (const asset of candidates) {
    for (const scene of sceneKeys) {
      const id = `${asset.safeName}__${scene}`;
      items.push({ id, asset, scene });
    }
  }
  return items;
}

async function runImg2ImgBatch({ args, config, productAssets }) {
  const provider = (args.provider || config.batch.provider || "jimeng").toLowerCase();
  const concurrency = args.concurrency || config.batch.concurrency || 1;
  const retries = config.batch.retries ?? 2;
  const retryBaseMs = config.batch.retryBaseMs ?? 1200;
  const retryMaxMs = config.batch.retryMaxMs ?? 12000;
  const resume = args.resume && (config.batch.resume ?? true);
  const labelFixEnabled = args.labelFix;

  const availableScenes = new Set(getPresets().sceneInstructions);
  const requestedScenes = parseCommaList(args.scenes);
  const sceneKeys = requestedScenes.length > 0
    ? requestedScenes
    : ["lab-closeup", "lab-editorial", "stone-daylight", "dark-elegant", "vanity-warm"];

  for (const scene of sceneKeys) {
    if (!availableScenes.has(scene)) {
      throw new Error(`Unknown scene: ${scene}. Available: ${[...availableScenes].join(", ")}`);
    }
  }

  const runOutputDir = getCoreOutputDir();
  const imagesDir = path.join(runOutputDir, "images");
  ensureDir(imagesDir);

  const resultsPath = path.join(runOutputDir, "img2img-results.json");
  const previous = resume ? readJsonIfExists(resultsPath) : undefined;
  const previousArray = Array.isArray(previous) ? previous : [];
  const previousById = new Map(previousArray.map((item) => [item.id, item]));

  const plan = buildImg2ImgPlan(productAssets, sceneKeys);
  const limitedPlan = args.limit > 0 ? plan.slice(0, args.limit) : plan;

  const client = provider === "jimeng" ? new VolcengineJimengClient(config.volcengine) : null;

  const arkNegative =
    "lowres, blurry, soft focus, motion blur, watermark, logo, extra bottles, duplicate product, deformed bottle, warped label, illegible text, smeared typography, glare on label, reflections covering text, 3d render, cartoon, CGI";

  const worker = async (item) => {
    const outputPath = getNextImagePath(runOutputDir, {
      theme: item.scene,
      provider,
      ext: "png"
    });

    if (!args.force) {
      const prev = previousById.get(item.id);
      if (prev?.status === "ok" && prev?.outputPath && fs.existsSync(prev.outputPath)) {
        return prev;
      }
    }

    const { prompt, meta } = buildImg2ImgPromptV2({ scene: item.scene, lang: "zh" });
    const finalPrompt =
      `${prompt} ` +
      "严格使用参考图片里的产品作为唯一产品主体：不得改动瓶型、颜色、标签排版、logo位置、文字内容。不要生成额外的瓶子或包装。背景与产品光影融合自然，真实商业摄影。";

    if (args.dryRun) {
      return {
        id: item.id,
        provider,
        scene: item.scene,
        productFile: item.asset.fileName,
        productPath: item.asset.absolutePath,
        prompt: finalPrompt,
        meta,
        status: "planned",
        updatedAt: new Date().toISOString()
      };
    }

    try {
      if (provider === "ark") {
        const b64 = imageFileToBase64(item.asset.absolutePath);
        const mime = mimeFromPath(item.asset.absolutePath);
        const dataUrl = `data:${mime};base64,${b64}`;
        const n = args.n > 0 ? args.n : 1;
        const size = args.size || config.ark.size;

        const { imageUrls, result } = await withRetry(
          () =>
            arkGenerateAndExtract({
              apiKey: config.ark.apiKey,
              model: config.ark.model,
              prompt: finalPrompt,
              negativePrompt: arkNegative,
              size,
              n,
              imageUrls: [dataUrl],
              responseFormat: "url"
            }),
          { retries, baseMs: retryBaseMs, maxMs: retryMaxMs, label: `ark:${item.id}` }
        );

        await saveFirstImageFromUrls({ outputPath, urls: imageUrls });
        if (labelFixEnabled) {
          await applyLabelFixOverlay({ filePath: outputPath, scene: item.scene });
        }
        return {
          id: item.id,
          provider,
          scene: item.scene,
          productFile: item.asset.fileName,
          productPath: item.asset.absolutePath,
          prompt: finalPrompt,
          outputPath,
          ark: { size, n, raw: result, imageCount: imageUrls.length },
          status: "ok",
          updatedAt: new Date().toISOString()
        };
      }

      if (provider === "jimeng") {
        const b64 = fs.readFileSync(item.asset.absolutePath).toString("base64");
        const scale =
          Number.isFinite(args.scale) && args.scale >= 0
            ? args.scale
            : config.volcengine.i2iScale;
        const reqKey = config.volcengine.reqKey || "jimeng_t2i_v40";

        const submitResult = await withRetry(
          () =>
            client.submitImg2ImgTask({
              prompt: finalPrompt,
              binaryDataBase64: [b64],
              scale,
              reqKey
            }),
          { retries, baseMs: retryBaseMs, maxMs: retryMaxMs, label: `jimeng:submit:${item.id}` }
        );

        const taskId = submitResult?.data?.task_id;
        const finalResult = taskId
          ? await withRetry(
              () => waitForImageResult(client, config, taskId, reqKey),
              { retries, baseMs: retryBaseMs, maxMs: retryMaxMs, label: `jimeng:poll:${item.id}` }
            )
          : submitResult;

        await saveFirstImageFromResult({ outputPath, result: finalResult });
        if (labelFixEnabled) {
          await applyLabelFixOverlay({ filePath: outputPath, scene: item.scene });
        }
        return {
          id: item.id,
          provider,
          scene: item.scene,
          productFile: item.asset.fileName,
          productPath: item.asset.absolutePath,
          prompt: finalPrompt,
          outputPath,
          jimeng: { reqKey, scale, taskId, raw: finalResult },
          status: "ok",
          updatedAt: new Date().toISOString()
        };
      }

      throw new Error(`Unknown provider: ${provider}. Use --provider jimeng|ark`);
    } catch (error) {
      return {
        id: item.id,
        provider,
        scene: item.scene,
        productFile: item.asset.fileName,
        productPath: item.asset.absolutePath,
        prompt: finalPrompt,
        outputPath: fs.existsSync(outputPath) ? outputPath : undefined,
        status: "error",
        error: error.message || String(error),
        updatedAt: new Date().toISOString()
      };
    }
  };

  const results = [];
  await runPool(limitedPlan, concurrency, async (item) => {
    const result = await worker(item);
    results.push(result);
    const merged = [...previousArray.filter((r) => r?.id !== result.id), ...results];
    writeJsonAtomic(resultsPath, merged);
    return result;
  });

  const finalResults = readJsonIfExists(resultsPath) || results;
  const okCount = finalResults.filter((r) => r.status === "ok").length;
  const errCount = finalResults.filter((r) => r.status === "error").length;
  const plannedCount = finalResults.filter((r) => r.status === "planned").length;
  console.log(`Img2img batch complete. provider=${provider} ok=${okCount} error=${errCount} planned=${plannedCount} imagesDir=${imagesDir}`);
  return finalResults;
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadConfig();
  const runOutputDir = getCoreOutputDir();
  ensureDir(runOutputDir);
  const productAssets = loadProductAssets(process.cwd());
  writeJson(path.join(runOutputDir, "product-assets.json"), productAssets);

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
    const finalResult = taskId
      ? await waitForImageResult(client, config, taskId, config.volcengine.reqKey)
      : submitResult;
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
    writeJson(path.join(runOutputDir, "test-image-result.json"), payload);
    const runId = `run-${Date.now()}`;
    const rows = buildRowsFromGenerationResults({ results: [payload], runId, config });
    const sync = await syncRowsToFeishuBitable({ rows, config, runId, workflow: "test-image" });
    if (sync.enabled) {
      console.log(`Feishu sync complete. total=${sync.total} success=${sync.success} failed=${sync.failed}`);
    }
    console.log(`Test image flow complete. Downloaded ${downloadedFiles.length} files.`);
    return;
  }

  if (args.mode === "img2img") {
    const batchResults = await runImg2ImgBatch({ args, config, productAssets });
    const runId = `run-${Date.now()}`;
    const rows = buildRowsFromImg2ImgResults({ results: batchResults, runId, config });
    const sync = await syncRowsToFeishuBitable({ rows, config, runId, workflow: "img2img-batch" });
    if (sync.enabled) {
      console.log(`Feishu sync complete. total=${sync.total} success=${sync.success} failed=${sync.failed}`);
    }
    return;
  }

  const brandData = await buildBrandProfile(config.siteUrl);
  writeJson(path.join(runOutputDir, "brand-profile.json"), brandData);

  if (args.brandOnly) {
    console.log(`Brand profile written to ${path.join(runOutputDir, "brand-profile.json")}`);
    return;
  }

  const concepts = generateAdConcepts(brandData.profile, productAssets.assets);
  writeJson(path.join(runOutputDir, "ad-concepts.json"), concepts);

  if (args.dryRun) {
    console.log(`Dry run complete. Generated ${concepts.length} concepts.`);
    return;
  }

  const client = new VolcengineJimengClient(config.volcengine);
  const resultsPath = path.join(runOutputDir, "generation-results.json");
  const existing = readJsonIfExists(resultsPath);
  const results = Array.isArray(existing) ? existing : [];

  for (const concept of concepts) {
    if (!args.force && results.some((r) => r?.concept?.id === concept.id)) {
      continue;
    }

    try {
      const submitResult = await withRetry(
        () =>
          client.submitImageTask({
            prompt: concept.enPrompt,
            width: config.volcengine.width,
            height: config.volcengine.height,
            imageUrls: concept.referenceImageUrls || []
          }),
        {
          retries: config.batch.retries,
          baseMs: config.batch.retryBaseMs,
          maxMs: config.batch.retryMaxMs,
          label: `jimeng:submit:${concept.id}`
        }
      );
      const taskId = submitResult?.data?.task_id;
      const finalResult = taskId
        ? await withRetry(() => waitForImageResult(client, config, taskId, config.volcengine.reqKey), {
            retries: config.batch.retries,
            baseMs: config.batch.retryBaseMs,
            maxMs: config.batch.retryMaxMs,
            label: `jimeng:poll:${concept.id}`
          })
        : submitResult;
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
      writeJsonAtomic(resultsPath, results);
    } catch (error) {
      results.push({
        concept,
        error: error.message || String(error)
      });
      writeJsonAtomic(resultsPath, results);
    }
  }

  writeJsonAtomic(resultsPath, results);
  const runId = `run-${Date.now()}`;
  const rows = buildRowsFromGenerationResults({ results, runId, config });
  const sync = await syncRowsToFeishuBitable({ rows, config, runId, workflow: "direct-generation" });
  if (sync.enabled) {
    console.log(`Feishu sync complete. total=${sync.total} success=${sync.success} failed=${sync.failed}`);
  }
  console.log(`Generated ${results.length} image task result sets.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
