import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "/flying-kitchen";
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") {
    res.writeHead(302, { Location: `${base}/` });
    res.end();
    return;
  }
  if (pathname !== base && !pathname.startsWith(`${base}/`)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  let rel = pathname.slice(base.length);
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(file, (error, body) => {
    if (error) {
      const missing = path.join(root, "404.html");
      fs.readFile(missing, (err404, page) => {
        res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        res.end(err404 ? "Not found" : page);
      });
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { "content-type": types[ext] || "application/octet-stream" });
    res.end(body);
  });
});

server.listen(port, host, () => {
  console.log(`Flying Kitchen preview at http://${host}:${port}${base}/`);
});
