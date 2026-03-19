import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireNumber(value, fallback) {
  const num = Number.parseInt(value ?? "", 10);
  return Number.isFinite(num) ? num : fallback;
}

function requireBoolean(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

export function loadConfig() {
  const envPath = path.resolve(process.cwd(), ".env");
  loadEnvFile(envPath);

  return {
    siteUrl: process.env.SITE_URL || "https://www.depology.com",
    outputDir: path.resolve(process.cwd(), process.env.OUTPUT_DIR || "output"),
    downloadImages: requireBoolean(process.env.DOWNLOAD_IMAGES, true),
    maxPollAttempts: requireNumber(process.env.MAX_POLL_ATTEMPTS, 20),
    pollIntervalMs: requireNumber(process.env.POLL_INTERVAL_MS, 5000),
    testPrompt:
      process.env.TEST_PROMPT ||
      "Luxury skincare ad, premium serum bottle on a clean vanity, soft daylight, glossy product photography, elegant beauty campaign, high detail",
    volcengine: {
      accessKey: process.env.VOLCENGINE_ACCESS_KEY || "",
      secretKey: process.env.VOLCENGINE_SECRET_KEY || "",
      region: process.env.VOLCENGINE_REGION || "cn-north-1",
      service: process.env.VOLCENGINE_SERVICE || "cv",
      host: process.env.VOLCENGINE_API_HOST || "visual.volcengineapi.com",
      action: process.env.VOLCENGINE_ACTION || "CVSync2AsyncSubmitTask",
      version: process.env.VOLCENGINE_VERSION || "2022-08-31",
      getAction: process.env.VOLCENGINE_GET_ACTION || "CVSync2AsyncGetResult",
      getVersion: process.env.VOLCENGINE_GET_VERSION || "2022-08-31",
      reqKey: process.env.JIMENG_REQ_KEY || "jimeng_t2i_v40",
      i2iReqKey: process.env.JIMENG_I2I_REQ_KEY || "jimeng_i2i_v30",
      i2iScale: Number.parseFloat(process.env.JIMENG_I2I_SCALE || "0.3"),
      width: requireNumber(process.env.JIMENG_WIDTH, 1024),
      height: requireNumber(process.env.JIMENG_HEIGHT, 1024),
      returnUrl: requireBoolean(process.env.JIMENG_RETURN_URL, true)
    }
  };
}
