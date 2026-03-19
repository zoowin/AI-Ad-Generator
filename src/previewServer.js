/**
 * Minimal image preview server for browsing generated output.
 * Usage: node src/previewServer.js
 * Opens at http://localhost:3456
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PREVIEW_PORT || 3456);
const OUTPUT_DIR = process.env.PREVIEW_OUTPUT_DIR
  || path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, "$1")), "..", process.env.OUTPUT_DIR || "output");

const MIME = {
  ".html": "text/html",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".css": "text/css",
  ".svg": "image/svg+xml"
};

function collectImages(dir, base = "") {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImages(path.join(dir, entry.name), rel));
    } else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      const stats = fs.statSync(path.join(dir, entry.name));
      results.push({ path: rel.replace(/\\/g, "/"), size: stats.size, mtime: stats.mtime });
    }
  }
  return results;
}

function buildGalleryHtml() {
  const images = collectImages(OUTPUT_DIR).sort((a, b) => b.mtime - a.mtime);
  const cards = images.map((img) => {
    const kb = (img.size / 1024).toFixed(1);
    const date = new Date(img.mtime).toLocaleString();
    return `<div class="card">
      <a href="/file/${img.path}" target="_blank"><img src="/file/${img.path}" loading="lazy"/></a>
      <p>${img.path}<br><small>${kb} KB &middot; ${date}</small></p>
    </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Depology Ad Output</title>
<style>
  body{font-family:system-ui;background:#111;color:#eee;margin:0;padding:20px}
  h1{text-align:center;font-weight:300;margin-bottom:4px}
  .sub{text-align:center;color:#888;margin-bottom:24px}
  .grid{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
  .card{background:#1a1a1a;border-radius:8px;overflow:hidden;width:300px}
  .card img{width:100%;display:block;cursor:zoom-in}
  .card p{padding:8px 12px;font-size:13px;margin:0;color:#aaa}
  small{color:#666}
</style></head><body>
  <h1>Depology Ad Image Gallery</h1>
  <p class="sub">${images.length} image(s) in <code>${OUTPUT_DIR}</code> &mdash; <a href="/" style="color:#6af">refresh</a></p>
  <div class="grid">${cards}</div>
</body></html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(buildGalleryHtml());
    return;
  }

  if (req.url.startsWith("/file/")) {
    const rel = decodeURIComponent(req.url.slice(6));
    const abs = path.join(OUTPUT_DIR, rel);
    if (!abs.startsWith(OUTPUT_DIR) || !fs.existsSync(abs)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(abs).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
});
