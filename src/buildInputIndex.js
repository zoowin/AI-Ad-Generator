import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const OUTPUT_PATH = path.join(ROOT_DIR, "input", "_input-index.json");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const DOC_EXTENSIONS = new Set([".md", ".json", ".txt"]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toProjectPath(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }
    results.push(fullPath);
  }
  return results;
}

function listImages(dirPath) {
  return walkFiles(dirPath)
    .filter((filePath) => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({
      path: toProjectPath(filePath),
      file_name: path.basename(filePath)
    }));
}

function listDocs(dirPath) {
  return walkFiles(dirPath)
    .filter((filePath) => DOC_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({
      path: toProjectPath(filePath),
      file_name: path.basename(filePath)
    }));
}

function listImmediateSubdirs(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function buildProductInputSection() {
  const assetsProductsDir = path.join(ROOT_DIR, "input", "products");
  const legacyProductRefsDir = path.join(ROOT_DIR, "input", "products");
  const productDocsDir = path.join(ROOT_DIR, "input", "product-docs");

  const legacyProductFolders = listImmediateSubdirs(legacyProductRefsDir).map((folder) => {
    if (folder === "catalog-packshots") {
      return null;
    }
    const folderPath = path.join(legacyProductRefsDir, folder);
    return {
      folder,
      images: listImages(folderPath)
    };
  }).filter(Boolean);

  return {
    summary: {
      main_packshots_count: listImages(assetsProductsDir).length,
      product_reference_folders_count: legacyProductFolders.length,
      product_docs_count: listDocs(productDocsDir).length
    },
    main_packshots: listImages(assetsProductsDir),
    product_reference_folders: legacyProductFolders,
    product_docs: listDocs(productDocsDir)
  };
}

function buildAdInputSection() {
  const importedRawDir = path.join(ROOT_DIR, "input", "references", "ad-library", "raw");
  const importedNormalizedDir = path.join(ROOT_DIR, "input", "references", "ad-library", "normalized");
  const legacyWinningAdsDir = path.join(ROOT_DIR, "input", "references", "winning-ads");

  return {
    summary: {
      imported_ad_images_count: listImages(importedRawDir).length,
      imported_ad_records_count: walkFiles(importedNormalizedDir)
        .filter((filePath) => filePath.endsWith(".json"))
        .length,
      legacy_winning_ad_images_count: listImages(legacyWinningAdsDir).length
    },
    imported_ad_images: {
      root: toProjectPath(importedRawDir),
      brand_folders: listImmediateSubdirs(importedRawDir)
    },
    imported_ad_records: {
      root: toProjectPath(importedNormalizedDir),
      brand_folders: listImmediateSubdirs(importedNormalizedDir).filter((name) => !name.startsWith("_"))
    },
    legacy_winning_ads: {
      root: toProjectPath(legacyWinningAdsDir),
      brand_folders: listImmediateSubdirs(legacyWinningAdsDir)
    }
  };
}

function buildBriefSection() {
  const briefsDir = path.join(ROOT_DIR, "input", "briefs");
  return {
    summary: {
      brief_count: listDocs(briefsDir).length
    },
    briefs: listDocs(briefsDir)
  };
}

function main() {
  const index = {
    generated_at: new Date().toISOString(),
    recommended_paths: {
      ad_images: "input/references/ad-library/raw",
      ad_records: "input/references/ad-library/normalized",
      main_product_images: "input/products",
      product_reference_images: "input/products",
      product_docs: "input/product-docs",
      briefs: "input/briefs"
    },
    ad_input: buildAdInputSection(),
    product_input: buildProductInputSection(),
    briefs: buildBriefSection()
  };

  ensureDir(path.dirname(OUTPUT_PATH));
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  console.log(`Input index written to ${OUTPUT_PATH}`);
}

main();
