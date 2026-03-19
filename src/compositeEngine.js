/**
 * Composite engine: overlay a product PNG onto a generated background.
 *
 * Features:
 *   - Resize product to fit within a target region
 *   - Add soft drop shadow beneath the product
 *   - Add subtle reflection below the product
 *   - Output final composited image
 */

import sharp from "sharp";

/**
 * Create a soft drop shadow from the product silhouette.
 *
 * @param {Buffer} productBuf  - Product PNG buffer (with alpha)
 * @param {number} width       - Product width after resize
 * @param {number} height      - Product height after resize
 * @param {object} opts
 * @param {number} [opts.blur=12]      - Shadow blur radius
 * @param {number} [opts.opacity=0.35] - Shadow opacity 0-1
 * @param {number} [opts.offsetY=8]    - Vertical offset in px
 * @returns {Promise<{buffer: Buffer, width: number, height: number}>}
 */
async function createShadow(productBuf, width, height, { blur = 12, opacity = 0.35, offsetY = 8 } = {}) {
  // Extract alpha channel as shadow shape
  const alpha = await sharp(productBuf)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel(3) // alpha channel
    .toBuffer();

  // Create black image masked by alpha, then blur
  const shadowHeight = height + offsetY + blur * 2;
  const shadowWidth = width + blur * 2;

  const shadow = await sharp({
    create: {
      width: shadowWidth,
      height: shadowHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: await sharp(alpha)
        .toColourspace("b-w")
        .joinChannel(alpha) // use alpha as both gray and alpha
        .pipe(sharp())
        .ensureAlpha()
        .tint({ r: 0, g: 0, b: 0 })
        .toBuffer(),
      left: blur,
      top: offsetY + blur,
      blend: "over"
    }])
    .blur(blur)
    .ensureAlpha()
    .modulate({ brightness: 1 })
    .toBuffer();

  // Reduce opacity
  const finalShadow = await sharp(shadow)
    .composite([{
      input: {
        create: {
          width: shadowWidth,
          height: shadowHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: Math.round(opacity * 255) }
        }
      },
      blend: "dest-in"
    }])
    .toBuffer();

  return { buffer: finalShadow, width: shadowWidth, height: shadowHeight };
}

/**
 * Create a faded vertical reflection of the product.
 *
 * @param {Buffer} productBuf - Resized product PNG buffer
 * @param {number} width
 * @param {number} height
 * @param {object} opts
 * @param {number} [opts.reflectionHeight=0.3] - Fraction of product height
 * @param {number} [opts.opacity=0.2]
 * @returns {Promise<{buffer: Buffer, width: number, height: number}>}
 */
async function createReflection(productBuf, width, height, { reflectionHeight = 0.3, opacity = 0.18 } = {}) {
  const refH = Math.round(height * reflectionHeight);

  // Flip vertically, crop to bottom portion, fade with gradient
  const flipped = await sharp(productBuf)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flip() // vertical flip
    .extract({ left: 0, top: 0, width, height: refH })
    .ensureAlpha()
    .toBuffer();

  // Create a vertical gradient mask (opaque at top, transparent at bottom)
  const gradientSvg = `<svg width="${width}" height="${refH}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="white" stop-opacity="${opacity}"/>
        <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${refH}" fill="url(#g)"/>
  </svg>`;

  const mask = await sharp(Buffer.from(gradientSvg)).resize(width, refH).toBuffer();

  // Apply gradient mask
  const reflection = await sharp(flipped)
    .composite([{ input: mask, blend: "dest-in" }])
    .toBuffer();

  return { buffer: reflection, width, height: refH };
}

/**
 * Composite a product PNG onto a background image.
 *
 * @param {object} opts
 * @param {string} opts.backgroundPath - Path to background image
 * @param {string} opts.productPath    - Path to product PNG (transparent bg)
 * @param {string} opts.outputPath     - Where to save result
 * @param {object} [opts.position]     - { x, y } center point for product (default: center)
 * @param {number} [opts.productScale=0.45] - Product size relative to canvas width
 * @param {boolean} [opts.addShadow=true]
 * @param {boolean} [opts.addReflection=true]
 * @param {object} [opts.shadow]       - Shadow options { blur, opacity, offsetY }
 * @param {object} [opts.reflection]   - Reflection options { reflectionHeight, opacity }
 */
export async function compositeProduct({
  backgroundPath,
  productPath,
  outputPath,
  position,
  productScale = 0.45,
  addShadow = true,
  addReflection = true,
  shadow = {},
  reflection = {}
}) {
  // Load background and get its dimensions
  const bgMeta = await sharp(backgroundPath).metadata();
  const canvasW = bgMeta.width;
  const canvasH = bgMeta.height;

  // Load and resize product
  const productMeta = await sharp(productPath).metadata();
  const targetW = Math.round(canvasW * productScale);
  const aspectRatio = productMeta.height / productMeta.width;
  const targetH = Math.round(targetW * aspectRatio);

  const productResized = await sharp(productPath)
    .resize(targetW, targetH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Calculate position (default: center-bottom area)
  const cx = position?.x ?? Math.round(canvasW / 2);
  const cy = position?.y ?? Math.round(canvasH * 0.55);
  const productLeft = Math.round(cx - targetW / 2);
  const productTop = Math.round(cy - targetH / 2);

  // Build composite layers
  const layers = [];

  // Shadow layer (under the product)
  if (addShadow) {
    try {
      const { buffer: shadowBuf, width: sw, height: sh } = await createShadow(
        productResized, targetW, targetH, shadow
      );
      const shadowLeft = productLeft - Math.round((sw - targetW) / 2);
      const shadowTop = productTop - Math.round((sh - targetH) / 2);
      layers.push({
        input: shadowBuf,
        left: Math.max(0, shadowLeft),
        top: Math.max(0, shadowTop),
        blend: "over"
      });
    } catch (e) {
      console.warn("Shadow generation failed, skipping:", e.message);
    }
  }

  // Reflection layer (below the product)
  if (addReflection) {
    try {
      const { buffer: refBuf, height: refH } = await createReflection(
        productResized, targetW, targetH, reflection
      );
      layers.push({
        input: refBuf,
        left: Math.max(0, productLeft),
        top: Math.min(canvasH - refH, productTop + targetH),
        blend: "over"
      });
    } catch (e) {
      console.warn("Reflection generation failed, skipping:", e.message);
    }
  }

  // Product layer (on top)
  layers.push({
    input: productResized,
    left: Math.max(0, productLeft),
    top: Math.max(0, productTop),
    blend: "over"
  });

  // Compose everything onto background
  await sharp(backgroundPath)
    .composite(layers)
    .toFile(outputPath);

  return {
    outputPath,
    canvasSize: { width: canvasW, height: canvasH },
    productSize: { width: targetW, height: targetH },
    productPosition: { left: productLeft, top: productTop }
  };
}
