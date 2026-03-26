/**
 * Ark Platform client for Seedream 4.5 image generation.
 *
 * Uses OpenAI-compatible API format:
 *   POST /api/v3/images/generations
 *   Authorization: Bearer <ARK_API_KEY>
 *
 * Docs: https://www.volcengine.com/docs/82379/1824121
 *
 * Key differences from legacy Visual Creation API (AK/SK):
 *   - Auth: Bearer token (ARK_API_KEY)
 *   - Endpoint: ark.cn-beijing.volces.com/api/v3
 *   - Model: ep-xxx (endpoint ID) or model name like "seedream-4-5-251128"
 *   - Up to 14 reference images
 *   - Synchronous response (no polling)
 *   - OpenAI-compatible response format
 */

import fs from "node:fs";

const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

/**
 * @param {object} opts
 * @param {string} opts.apiKey       - ARK_API_KEY (Bearer token)
 * @param {string} opts.model        - Endpoint ID (ep-xxx) or model name
 * @param {string} opts.prompt       - Text prompt
 * @param {string} [opts.negativePrompt] - Negative prompt
 * @param {string} [opts.size]       - "2K" or "1024x1024" etc.
 * @param {number} [opts.seed]       - -1 for random
 * @param {number} [opts.n]          - Number of images (1-4)
 * @param {boolean} [opts.watermark] - Whether to add watermark (default false)
 * @param {string[]} [opts.imageUrls] - Reference image URLs for img2img
 * @param {string} [opts.responseFormat] - "url" or "b64_json"
 * @returns {Promise<object>}
 */
export async function arkGenerateImage({
  apiKey,
  model,
  prompt,
  negativePrompt,
  size = "2K",
  seed = -1,
  n = 1,
  watermark = false,
  imageUrls,
  responseFormat = "url"
}) {
  if (!apiKey) {
    throw new Error("Missing ARK_API_KEY. Set it in your .env file.");
  }
  if (!model) {
    throw new Error("Missing ARK_MODEL. Set it in your .env file (ep-xxx or model name).");
  }

  const body = {
    model,
    prompt,
    size,
    seed,
    n,
    response_format: responseFormat,
    watermark
  };

  if (negativePrompt) {
    body.negative_prompt = negativePrompt;
  }

  // Reference images for img2img (up to 14)
  // Ark API uses "image" parameter (single URL or array of URLs)
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    body.image = imageUrls.length === 1 ? imageUrls[0] : imageUrls;
  }

  const url = `${ARK_BASE_URL}/images/generations`;

  console.log(`[Ark] POST ${url}`);
  console.log(`[Ark] model=${model}, size=${size}, n=${n}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `Ark API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

/**
 * Convenience: generate image and extract URLs/base64 from response.
 *
 * Response format: { data: [{ url: "...", revised_prompt: "..." }] }
 */
export async function arkGenerateAndExtract(opts) {
  const result = await arkGenerateImage(opts);

  const urls = [];
  if (Array.isArray(result?.data)) {
    for (const item of result.data) {
      if (item.url) urls.push(item.url);
      if (item.b64_json) urls.push(`data:image/png;base64,${item.b64_json}`);
    }
  }

  return { result, imageUrls: urls };
}

/**
 * Load a local image file as a data URL for use in image_urls.
 */
export function imageFileToBase64(filePath) {
  return fs.readFileSync(filePath).toString("base64");
}
