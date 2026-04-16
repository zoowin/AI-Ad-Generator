import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DEFAULT_SOURCE_DIR = "F:\\Work_Space\\Meta-Ad competitor\\fb_ad_scraper";

const ROOT_DIR = process.cwd();
const RAW_DIR = path.join(ROOT_DIR, "input", "references", "ad-library", "raw");
const NORMALIZED_DIR = path.join(ROOT_DIR, "input", "references", "ad-library", "normalized");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseArgs(argv) {
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

    values.set(key, "true");
  }

  return {
    sourceDir: values.get("--source-dir") || DEFAULT_SOURCE_DIR,
    brand: values.get("--brand") || "",
    limit: Number.parseInt(values.get("--limit") || "0", 10) || 0
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function absoluteToProjectRelative(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function detectMediaKind(ad) {
  const format = String(ad?.format || "").toLowerCase();
  if (format === "video") {
    return "video_preview";
  }
  if (format === "carousel") {
    return "carousel_preview";
  }
  return "image";
}

function getPrimaryImageUrl(ad) {
  if (typeof ad?.preview_url === "string" && ad.preview_url) {
    return ad.preview_url;
  }
  if (Array.isArray(ad?.video_previews) && ad.video_previews[0]) {
    return ad.video_previews[0];
  }
  if (Array.isArray(ad?.images) && ad.images[0]) {
    return ad.images[0];
  }
  if (Array.isArray(ad?.cards)) {
    const cardWithImage = ad.cards.find((card) => card?.image);
    if (cardWithImage?.image) {
      return cardWithImage.image;
    }
  }
  return "";
}

function getLandingUrl(ad) {
  if (typeof ad?.link === "string" && ad.link) {
    return ad.link;
  }
  if (Array.isArray(ad?.cards)) {
    const cardWithLink = ad.cards.find((card) => card?.link_url);
    if (cardWithLink?.link_url) {
      return cardWithLink.link_url;
    }
  }
  return "";
}

function inferProductNames(ad) {
  const names = new Set();
  if (typeof ad?.title === "string" && ad.title && !ad.title.includes("{{")) {
    names.add(ad.title.trim());
  }
  if (Array.isArray(ad?.cards)) {
    for (const card of ad.cards) {
      if (typeof card?.title === "string" && card.title && !card.title.includes("{{")) {
        names.add(card.title.trim());
      }
    }
  }
  return [...names];
}

function toIsoDate(value) {
  if (!value) {
    return "";
  }
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) {
    return new Date(num * 1000).toISOString();
  }
  const parsed = Date.parse(String(value));
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return "";
}

function copyIfExists(sourcePath, destinationPath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return false;
  }
  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
  return true;
}

function buildBrandCatalog(sourceDir) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const adFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith("_ads.json"));

  return adFiles.map((name) => {
    const brandSlug = name.replace(/_ads\.json$/i, "");
    return {
      brandSlug,
      adsPath: path.join(sourceDir, name),
      mediaMapPath: path.join(sourceDir, `${brandSlug}_media_map.json`)
    };
  });
}

function makeImportId(brandSlug, adId) {
  return `meta_${brandSlug}_${adId}`;
}

function buildNormalizedRecord({
  brandSlug,
  ad,
  localImagePath,
  localImageImported,
  sourceAdsPath,
  sourceMediaPath,
  sourceMediaImported
}) {
  const adId = String(ad?.id || "").trim();
  const mediaKind = detectMediaKind(ad);
  const primaryImageUrl = getPrimaryImageUrl(ad);
  const landingUrl = getLandingUrl(ad);
  const productNames = inferProductNames(ad);
  const cards = Array.isArray(ad?.cards) ? ad.cards : [];

  return {
    ad_id: makeImportId(brandSlug, adId),
    source_platform: "meta_ad_library",
    captured_at: new Date().toISOString(),
    brand_name: brandSlug,
    product_category: "unknown",
    product_names: productNames,
    image_paths: localImageImported ? [absoluteToProjectRelative(localImagePath)] : [],
    video_paths: [],
    landing_page_url: landingUrl,
    ad_copy: String(ad?.body || ""),
    cta: String(ad?.cta || ""),
    country: "ALL",
    language: "unknown",
    notes: "Imported from competitor Meta Ad Library scraper",
    source_meta: {
      original_ad_archive_id: adId,
      ad_format: String(ad?.format || ""),
      media_kind: mediaKind,
      title: String(ad?.title || ""),
      caption: String(ad?.caption || ""),
      platforms: Array.isArray(ad?.platforms) ? ad.platforms : [],
      start_date: toIsoDate(ad?.start),
      end_date: toIsoDate(ad?.end),
      primary_image_url: primaryImageUrl,
      card_count: cards.length || Number(ad?.card_count || 0),
      cards,
      original_json_path: sourceAdsPath,
      original_media_path: sourceMediaImported ? sourceMediaPath : ""
    }
  };
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getMediaExtension(sourceMediaPath, ad) {
  const sourceExt = path.extname(sourceMediaPath || "").toLowerCase();
  if (sourceExt) {
    return sourceExt;
  }
  const url = getPrimaryImageUrl(ad);
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    return ext || ".jpg";
  } catch {
    return ".jpg";
  }
}

function hashObject(value) {
  return crypto.createHash("sha1").update(JSON.stringify(value)).digest("hex").slice(0, 10);
}

function importBrand({ sourceDir, brandSlug, adsPath, mediaMapPath, limit = 0 }) {
  const ads = safeReadJson(adsPath, []);
  const mediaMap = safeReadJson(mediaMapPath, []);
  const brandRawDir = path.join(RAW_DIR, brandSlug);
  const brandNormalizedDir = path.join(NORMALIZED_DIR, brandSlug);
  ensureDir(brandRawDir);
  ensureDir(brandNormalizedDir);

  const items = Array.isArray(ads) ? ads : [];
  const selectedItems = limit > 0 ? items.slice(0, limit) : items;
  const summary = {
    brand: brandSlug,
    totalAds: selectedItems.length,
    importedImages: 0,
    missingImages: 0,
    importedRecords: 0
  };

  for (let index = 0; index < selectedItems.length; index += 1) {
    const ad = selectedItems[index];
    const adId = String(ad?.id || "").trim();
    if (!adId) {
      continue;
    }

    const sourceMediaRelative = Array.isArray(mediaMap) ? mediaMap[index] || "" : "";
    const sourceMediaAbsolute = sourceMediaRelative
      ? path.resolve(sourceDir, sourceMediaRelative)
      : "";

    const mediaExt = getMediaExtension(sourceMediaAbsolute, ad);
    const importedImagePath = path.join(brandRawDir, `${brandSlug}__${adId}${mediaExt}`);
    const importedImage = copyIfExists(sourceMediaAbsolute, importedImagePath);

    if (importedImage) {
      summary.importedImages += 1;
    } else {
      summary.missingImages += 1;
    }

    const normalized = buildNormalizedRecord({
      brandSlug,
      ad,
      localImagePath: importedImagePath,
      localImageImported: importedImage,
      sourceAdsPath: adsPath,
      sourceMediaPath: sourceMediaAbsolute,
      sourceMediaImported: importedImage
    });

    const normalizedPath = path.join(brandNormalizedDir, `${brandSlug}__${adId}.json`);
    writeJson(normalizedPath, normalized);
    summary.importedRecords += 1;
  }

  writeJson(path.join(brandNormalizedDir, "_import-summary.json"), {
    ...summary,
    source_ads_path: adsPath,
    source_media_map_path: mediaMapPath,
    import_id: hashObject(summary)
  });

  return summary;
}

function main() {
  const args = parseArgs(process.argv);
  const sourceDir = path.resolve(args.sourceDir);

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  ensureDir(RAW_DIR);
  ensureDir(NORMALIZED_DIR);

  const catalog = buildBrandCatalog(sourceDir);
  const selectedCatalog = args.brand
    ? catalog.filter((item) => item.brandSlug === slugify(args.brand) || item.brandSlug === args.brand)
    : catalog;

  if (selectedCatalog.length === 0) {
    throw new Error(`No matching brand catalogs found in: ${sourceDir}`);
  }

  const runSummary = [];
  for (const item of selectedCatalog) {
    const summary = importBrand({
      sourceDir,
      brandSlug: item.brandSlug,
      adsPath: item.adsPath,
      mediaMapPath: item.mediaMapPath,
      limit: args.limit
    });
    runSummary.push(summary);
    console.log(
      `[import] ${summary.brand}: records=${summary.importedRecords} images=${summary.importedImages} missing=${summary.missingImages}`
    );
  }

  writeJson(path.join(NORMALIZED_DIR, "_run-summary.json"), {
    imported_at: new Date().toISOString(),
    source_dir: sourceDir,
    brands: runSummary
  });

  const totalRecords = runSummary.reduce((sum, item) => sum + item.importedRecords, 0);
  const totalImages = runSummary.reduce((sum, item) => sum + item.importedImages, 0);
  const totalMissing = runSummary.reduce((sum, item) => sum + item.missingImages, 0);
  console.log(`[done] records=${totalRecords} images=${totalImages} missing=${totalMissing}`);
}

main();
