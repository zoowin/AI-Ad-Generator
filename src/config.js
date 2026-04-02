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

  const hasArk = Boolean(process.env.ARK_API_KEY) && Boolean(process.env.ARK_MODEL);
  const defaultProvider = hasArk ? "ark" : "jimeng";

  return {
    siteUrl: process.env.SITE_URL || "https://www.depology.com",
    outputDir: path.resolve(process.cwd(), process.env.OUTPUT_DIR || "output"),
    downloadImages: requireBoolean(process.env.DOWNLOAD_IMAGES, true),
    maxPollAttempts: requireNumber(process.env.MAX_POLL_ATTEMPTS, 20),
    pollIntervalMs: requireNumber(process.env.POLL_INTERVAL_MS, 5000),
    testPrompt:
      process.env.TEST_PROMPT ||
      "Luxury skincare ad, premium serum bottle on a clean vanity, soft daylight, glossy product photography, elegant beauty campaign, high detail",
    ark: {
      apiKey: process.env.ARK_API_KEY || "",
      model: process.env.ARK_MODEL || "",
      guidanceScale: Number.parseFloat(process.env.ARK_GUIDANCE_SCALE || "2.5"),
      size: process.env.ARK_SIZE || "2048x2048"
    },
    batch: {
      provider: process.env.IMAGE_PROVIDER || defaultProvider,
      concurrency: requireNumber(process.env.CONCURRENCY, 1),
      retries: requireNumber(process.env.RETRIES, 2),
      retryBaseMs: requireNumber(process.env.RETRY_BASE_MS, 1200),
      retryMaxMs: requireNumber(process.env.RETRY_MAX_MS, 12000),
      resume: requireBoolean(process.env.RESUME, true)
    },
    integration: {
      edmCampaignId: process.env.EDM_CAMPAIGN_ID || "",
      edmFlowId: process.env.EDM_FLOW_ID || "",
      feishu: {
        enabled: requireBoolean(process.env.FEISHU_BITABLE_ENABLED, false),
        nativeImageEnabled: requireBoolean(process.env.FEISHU_NATIVE_IMAGE_ENABLED, true),
        appId: process.env.FEISHU_APP_ID || "",
        appSecret: process.env.FEISHU_APP_SECRET || "",
        appToken: process.env.FEISHU_BITABLE_APP_TOKEN || "",
        tableId: process.env.FEISHU_BITABLE_TABLE_ID || "",
        uploadParentType: process.env.FEISHU_MEDIA_PARENT_TYPE || "bitable_file",
        uploadParentNode: process.env.FEISHU_MEDIA_PARENT_NODE || "",
        sourceSystem: process.env.FEISHU_SOURCE_SYSTEM || "ai-image",
        workflow: process.env.FEISHU_WORKFLOW || "ads-image-runner",
        fields: {
          primary: process.env.FEISHU_FIELD_PRIMARY ?? "Record Title",
          runId: process.env.FEISHU_FIELD_RUN_ID ?? "Run ID",
          sourceSystem: process.env.FEISHU_FIELD_SOURCE ?? "Source System",
          workflow: process.env.FEISHU_FIELD_WORKFLOW ?? "Workflow",
          provider: process.env.FEISHU_FIELD_PROVIDER ?? "Provider",
          conceptId: process.env.FEISHU_FIELD_CONCEPT_ID ?? "Concept ID",
          scene: process.env.FEISHU_FIELD_SCENE ?? "Scene",
          status: process.env.FEISHU_FIELD_STATUS ?? "Status",
          prompt: process.env.FEISHU_FIELD_PROMPT ?? "Prompt",
          imageUrl: process.env.FEISHU_FIELD_IMAGE_URL ?? "Image URL",
          imageAttachment: process.env.FEISHU_FIELD_IMAGE_ATTACHMENT ?? "Image",
          localPath: process.env.FEISHU_FIELD_LOCAL_PATH ?? "Local Path",
          taskId: process.env.FEISHU_FIELD_TASK_ID ?? "Task ID",
          generatedAt: process.env.FEISHU_FIELD_GENERATED_AT ?? "Generated At",
          linkKey: process.env.FEISHU_FIELD_LINK_KEY ?? "Link Key",
          edmCampaignId: process.env.FEISHU_FIELD_EDM_CAMPAIGN_ID ?? "EDM Campaign ID",
          edmFlowId: process.env.FEISHU_FIELD_EDM_FLOW_ID ?? "EDM Flow ID",
          error: process.env.FEISHU_FIELD_ERROR ?? "Error"
        }
      }
    },
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
