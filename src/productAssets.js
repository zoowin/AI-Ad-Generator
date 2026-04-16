import fs from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function humanizeName(fileName) {
  return fileName
    .replace(path.extname(fileName), "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function walkImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkImageFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }
  return files;
}

export function loadProductAssets(rootDir) {
  const preferredDir = path.join(rootDir, "input", "products");
  const legacyDir = path.join(rootDir, "assets", "products");
  const assetsDir = fs.existsSync(preferredDir) ? preferredDir : legacyDir;

  if (!fs.existsSync(assetsDir)) {
    return {
      assetsDir,
      assets: []
    };
  }

  const imageFiles = walkImageFiles(assetsDir);
  const assets = imageFiles
    .map((absolutePath, index) => {
      const relativePath = path.relative(assetsDir, absolutePath).replace(/\\/g, "/");
      const stats = fs.statSync(absolutePath);

      return {
        id: `asset-${index + 1}`,
        fileName: relativePath,
        displayName: humanizeName(path.basename(absolutePath)),
        absolutePath,
        sizeBytes: stats.size
      };
    });

  return {
    assetsDir,
    assets
  };
}
