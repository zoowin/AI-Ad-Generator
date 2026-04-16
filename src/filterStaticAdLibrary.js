import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const NORMALIZED_ROOT = path.join(ROOT_DIR, "input", "references", "ad-library", "normalized");
const STATIC_ROOT = path.join(ROOT_DIR, "input", "references", "ad-library-static");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function walkJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsonFiles(fullPath));
    } else if (entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

function projectRelative(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
}

function classifyRecord(record) {
  const kind = String(record?.source_meta?.media_kind || "").toLowerCase();
  if (kind === "image") {
    return "static-images";
  }
  if (kind === "carousel_preview") {
    return "carousel-previews";
  }
  if (kind === "video_preview") {
    return "excluded-video-previews";
  }
  return "needs-review";
}

function copyRecordToBucket(sourcePath, record, bucket) {
  const brand = String(record?.brand_name || "unknown");
  const fileName = path.basename(sourcePath);
  const destination = path.join(STATIC_ROOT, bucket, brand, fileName);
  writeJson(destination, record);
}

function main() {
  ensureDir(STATIC_ROOT);

  const allJsonFiles = walkJsonFiles(NORMALIZED_ROOT)
    .filter((filePath) => !path.basename(filePath).startsWith("_"));

  const summary = {
    generated_at: new Date().toISOString(),
    source_root: projectRelative(NORMALIZED_ROOT),
    output_root: projectRelative(STATIC_ROOT),
    total_records: 0,
    static_images: 0,
    carousel_previews: 0,
    excluded_video_previews: 0,
    needs_review: 0
  };

  for (const filePath of allJsonFiles) {
    const record = readJson(filePath);
    const bucket = classifyRecord(record);
    copyRecordToBucket(filePath, record, bucket);
    summary.total_records += 1;
    if (bucket === "static-images") summary.static_images += 1;
    if (bucket === "carousel-previews") summary.carousel_previews += 1;
    if (bucket === "excluded-video-previews") summary.excluded_video_previews += 1;
    if (bucket === "needs-review") summary.needs_review += 1;
  }

  writeJson(path.join(STATIC_ROOT, "_summary.json"), summary);
  console.log(
    `[filter] total=${summary.total_records} static=${summary.static_images} carousel=${summary.carousel_previews} excluded_video=${summary.excluded_video_previews} review=${summary.needs_review}`
  );
}

main();
