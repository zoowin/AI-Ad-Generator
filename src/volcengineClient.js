import crypto from "node:crypto";

function hmac(key, data, encoding) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest(encoding);
}

function sha256Hex(data) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function getAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function getDateStamp(date) {
  return getAmzDate(date).slice(0, 8);
}

function createAuthorization({
  method,
  path,
  queryString,
  headers,
  payload,
  accessKey,
  secretKey,
  region,
  service,
  now
}) {
  const signedHeaderKeys = Object.keys(headers)
    .map((key) => key.toLowerCase())
    .sort();

  const canonicalHeaders = signedHeaderKeys
    .map((key) => `${key}:${String(headers[key]).trim()}\n`)
    .join("");

  const signedHeaders = signedHeaderKeys.join(";");
  const hashedPayload = sha256Hex(payload);

  const canonicalRequest = [
    method,
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join("\n");

  const dateStamp = getDateStamp(now);
  const amzDate = getAmzDate(now);
  const credentialScope = `${dateStamp}/${region}/${service}/request`;
  const stringToSign = [
    "HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");

  const kDate = hmac(secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "request");
  const signature = hmac(kSigning, stringToSign, "hex");

  return {
    authorization:
      `HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate,
    hashedPayload
  };
}

async function volcengineRequest({
  host,
  region,
  accessKey,
  secretKey,
  service,
  action,
  version,
  body
}) {
  const method = "POST";
  const path = "/";
  const now = new Date();
  const queryString = `Action=${encodeURIComponent(action)}&Version=${encodeURIComponent(version)}`;
  const payload = JSON.stringify(body);
  const baseHeaders = {
    "content-type": "application/json",
    host,
    "x-content-sha256": sha256Hex(payload),
    "x-date": getAmzDate(now)
  };

  const signed = createAuthorization({
    method,
    path,
    queryString,
    headers: baseHeaders,
    payload,
    accessKey,
    secretKey,
    region,
    service,
    now
  });

  const response = await fetch(`https://${host}/?${queryString}`, {
    method,
    headers: {
      "content-type": "application/json",
      host,
      "x-content-sha256": signed.hashedPayload,
      "x-date": signed.amzDate,
      authorization: signed.authorization
    },
    body: payload
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Volcengine request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export class VolcengineJimengClient {
  constructor(config) {
    this.config = config;
  }

  assertConfigured() {
    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error("Missing Volcengine credentials. Set VOLCENGINE_ACCESS_KEY and VOLCENGINE_SECRET_KEY.");
    }
  }

  async submitImageTask({ prompt, width, height, imageUrls = [] }) {
    this.assertConfigured();

    const body = {
      req_key: this.config.reqKey,
      prompt,
      seed: -1,
      scale: 3.5,
      ddim_steps: 25,
      width,
      height,
      use_pre_llm: true,
      use_sr: true,
      return_url: this.config.returnUrl
    };

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      body.image_urls = imageUrls;
    }

    return volcengineRequest({
      host: this.config.host,
      region: this.config.region,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
      service: this.config.service,
      action: this.config.action,
      version: this.config.version,
      body
    });
  }

  /**
   * Image-to-image task using jimeng_i2i_v30 or jimeng_t2i_v40 with reference.
   *
   * @param {object} opts
   * @param {string}   opts.prompt   - Describes desired scene / edits
   * @param {string[]} [opts.imageUrls]        - Public URL(s) of reference image
   * @param {string[]} [opts.binaryDataBase64] - Base64 image(s), alternative to imageUrls
   * @param {number}   [opts.scale]  - 0‑1, lower = preserve image more (default from config)
   * @param {number}   [opts.width]
   * @param {number}   [opts.height]
   * @param {number}   [opts.seed]
   * @param {string}   [opts.reqKey] - Override req_key (e.g. jimeng_t2i_v40 for v4 editing)
   */
  async submitImg2ImgTask({
    prompt,
    imageUrls,
    binaryDataBase64,
    scale,
    width,
    height,
    seed = -1,
    reqKey
  }) {
    this.assertConfigured();

    const effectiveReqKey = reqKey || this.config.i2iReqKey || "jimeng_i2i_v30";
    const effectiveScale = scale ?? this.config.i2iScale ?? 0.3;

    const body = {
      req_key: effectiveReqKey,
      prompt,
      seed,
      scale: effectiveScale,
      width: width || this.config.width,
      height: height || this.config.height,
      return_url: this.config.returnUrl
    };

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      body.image_urls = imageUrls;
    } else if (Array.isArray(binaryDataBase64) && binaryDataBase64.length > 0) {
      body.binary_data_base64 = binaryDataBase64;
    }

    return volcengineRequest({
      host: this.config.host,
      region: this.config.region,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
      service: this.config.service,
      action: this.config.action,
      version: this.config.version,
      body
    });
  }

  async getImageTask({ taskId, reqKey }) {
    this.assertConfigured();

    const body = {
      req_key: reqKey || this.config.reqKey,
      task_id: taskId,
      return_url: this.config.returnUrl
    };

    return volcengineRequest({
      host: this.config.host,
      region: this.config.region,
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
      service: this.config.service,
      action: this.config.getAction,
      version: this.config.getVersion,
      body
    });
  }
}
