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

export function loadProductAssets(rootDir) {
  const assetsDir = path.join(rootDir, "assets", "products");

  if (!fs.existsSync(assetsDir)) {
    return {
      assetsDir,
      assets: []
    };
  }

  const entries = fs.readdirSync(assetsDir, { withFileTypes: true });
  const assets = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry, index) => {
      const absolutePath = path.join(assetsDir, entry.name);
      const stats = fs.statSync(absolutePath);

      return {
        id: `asset-${index + 1}`,
        fileName: entry.name,
        displayName: humanizeName(entry.name),
        absolutePath,
        sizeBytes: stats.size
      };
    });

  return {
    assetsDir,
    assets
  };
}
