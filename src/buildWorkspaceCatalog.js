import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const PRODUCT_INDEX_PATH = path.join(ROOT_DIR, "input", "product-docs", "_product-index.json");
const CATALOG_MD_PATH = path.join(ROOT_DIR, "docs", "workspace-catalog.md");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const DOC_EXTENSIONS = new Set([".md", ".json", ".txt"]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function rel(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function listImages(dirPath) {
  return walkFiles(dirPath)
    .filter((filePath) => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({
      path: rel(filePath),
      file_name: path.basename(filePath)
    }));
}

function listDocs(dirPath) {
  return walkFiles(dirPath)
    .filter((filePath) => DOC_EXTENSIONS.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({
      path: rel(filePath),
      file_name: path.basename(filePath)
    }));
}

function inferProductSlug(folderName) {
  return String(folderName)
    .replace(/^\d+[_\s-]*/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildProductRecords() {
  const packshotDir = path.join(ROOT_DIR, "input", "products");
  const referenceRoot = path.join(ROOT_DIR, "input", "products");
  const productDocsRoot = path.join(ROOT_DIR, "input", "product-docs");

  const referenceFolders = fs.existsSync(referenceRoot)
    ? fs.readdirSync(referenceRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    : [];

  const packshots = listImages(packshotDir);
  const docs = listDocs(productDocsRoot);

  const records = referenceFolders.map((entry) => {
    const folderPath = path.join(referenceRoot, entry.name);
    const slug = inferProductSlug(entry.name);
    const references = listImages(folderPath);

    const matchingDocs = docs.filter((doc) => {
      const name = doc.file_name.toLowerCase();
      return slug.split("-").some((part) => part && name.includes(part));
    });

    const matchingPackshots = packshots.filter((image) => {
      const name = image.file_name.toLowerCase();
      return slug.split("-").some((part) => part && name.includes(part));
    });

    return {
      slug,
      label: entry.name,
      main_packshots: matchingPackshots,
      reference_images: references,
      product_docs: matchingDocs
    };
  });

  return {
    generated_at: new Date().toISOString(),
    paths: {
      main_packshots: "input/products",
      product_references: "input/products",
      product_docs: "input/product-docs"
    },
    products: records
  };
}

function formatList(items) {
  if (!items.length) {
    return "- none";
  }
  return items.map((item) => `- \`${item.path}\``).join("\n");
}

function buildCatalogMarkdown(productIndex) {
  const inputIndexPath = "input/_input-index.json";
  const sections = productIndex.products
    .map((product) => {
      return [
        `### ${product.label}`,
        ``,
        `Suggested slug: \`${product.slug}\``,
        ``,
        `Main packshots:`,
        `${formatList(product.main_packshots)}`,
        ``,
        `Reference images:`,
        `${formatList(product.reference_images)}`,
        ``,
        `Product docs:`,
        `${formatList(product.product_docs)}`,
        ``
      ].join("\n");
    })
    .join("\n");

  return [
    "# Workspace Catalog",
    "",
    "This file is the human-readable navigation layer for the repository.",
    "",
    "## Core Entrypoints",
    "",
    "- Ad inputs: `input/references/ad-library/raw/`",
    "- Ad records: `input/references/ad-library/normalized/`",
    "- Product images: `input/products/`",
    "- Product reference images: `input/products/`",
    "- Product knowledge docs: `input/product-docs/`",
    "- Briefs: `input/briefs/`",
    "- Machine-readable input index: `input/_input-index.json`",
    `- Machine-readable product index: \`${rel(PRODUCT_INDEX_PATH)}\``,
    "",
    "## Working Rule",
    "",
    "- Use `input/references/ad-library/` for competitor ad inspiration inputs.",
    "- Use `input/products/` for product images, product hero assets, and additional references.",
    "- Use `input/product-docs/` for product positioning, claims, and SKU knowledge.",
    "- Keep new work centered on the unified `input/` structure.",
    "",
    "## Product Index",
    "",
    sections,
    "",
    "## Notes",
    "",
    `This catalog is generated from \`${inputIndexPath}\` and the current workspace structure.`
  ].join("\n");
}

function main() {
  const productIndex = buildProductRecords();
  ensureDir(path.dirname(PRODUCT_INDEX_PATH));
  fs.writeFileSync(PRODUCT_INDEX_PATH, `${JSON.stringify(productIndex, null, 2)}\n`, "utf8");

  const catalogMd = buildCatalogMarkdown(productIndex);
  ensureDir(path.dirname(CATALOG_MD_PATH));
  fs.writeFileSync(CATALOG_MD_PATH, `${catalogMd}\n`, "utf8");

  console.log(`Workspace catalog written to ${CATALOG_MD_PATH}`);
  console.log(`Product index written to ${PRODUCT_INDEX_PATH}`);
}

main();
