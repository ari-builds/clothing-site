"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DATA = path.join(ROOT, "data");
const PUBLIC = path.join(ROOT, "public");
const UPLOADS = path.join(ROOT, "uploads");
const PORT = process.env.PORT || 4173;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function writeJson(file, obj) {
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

const config = readJson(path.join(DATA, "config.json"), {
  brand: "My Brand",
  whatsapp: "639000000000",
  accent: "#111111",
  adminToken: "change-me",
  currency: "₱",
});

let store = readJson(path.join(DATA, "products.json"), { products: [] });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 15 * 1024 * 1024) { reject(new Error("payload too large")); req.destroy(); } });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function parseJsonBody(req) {
  return readBody(req).then((raw) => (raw ? JSON.parse(raw) : {}));
}

function authOk(req, body) {
  const token =
    body && body.token ||
    (req.headers["x-admin-token"] && decodeURIComponent(req.headers["x-admin-token"])) ||
    (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, ""));
  return token === config.adminToken;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;

  if (req.method === "GET" && p === "/api/products") {
    return send(res, 200, JSON.stringify({ config: { brand: config.brand, whatsapp: config.whatsapp, accent: config.accent, currency: config.currency }, products: store.products }), "application/json");
  }

  if (req.method === "POST" && p === "/api/auth") {
    const body = await parseJsonBody(req);
    return send(res, 200, JSON.stringify({ ok: authOk(req, body) }), "application/json");
  }

  if (req.method === "POST" && p === "/api/products") {
    const body = await parseJsonBody(req);
    if (!authOk(req, body)) return send(res, 401, JSON.stringify({ error: "unauthorized" }), "application/json");
    const product = body.product || body;
    if (!product.name) return send(res, 400, JSON.stringify({ error: "name required" }), "application/json");

    if (product.imgData && /^data:image\/(png|jpe?g|webp);base64,/.test(product.imgData)) {
      const ext = product.imgData.match(/^data:image\/(png|jpe?g|webp);/)[1].replace("jpeg", "jpg");
      const id = crypto.randomBytes(8).toString("hex");
      const filename = id + "." + ext;
      fs.writeFileSync(path.join(UPLOADS, filename), Buffer.from(product.imgData.split(",")[1], "base64"));
      product.img = "/uploads/" + filename;
      delete product.imgData;
    }

    const now = new Date().toISOString();
    if (product.id) {
      const idx = store.products.findIndex((x) => x.id === product.id);
      if (idx >= 0) {
        store.products[idx] = { ...store.products[idx], ...product, updatedAt: now };
        product = store.products[idx];
      }
    }
    if (!product.id) {
      product.id = crypto.randomBytes(6).toString("hex");
      product.dateAdded = now;
      store.products.unshift(product);
    }
    writeJson(path.join(DATA, "products.json"), store);
    return send(res, 200, JSON.stringify({ ok: true, product }), "application/json");
  }

  if (req.method === "DELETE" && p.startsWith("/api/products/")) {
    const id = p.replace("/api/products/", "");
    const body = await readBody(req).then((raw) => (raw ? JSON.parse(raw) : {})).catch(() => ({}));
    if (!authOk(req, body)) return send(res, 401, JSON.stringify({ error: "unauthorized" }), "application/json");
    const before = store.products.length;
    store.products = store.products.filter((x) => x.id !== id);
    if (store.products.length === before) return send(res, 404, JSON.stringify({ error: "not found" }), "application/json");
    writeJson(path.join(DATA, "products.json"), store);
    return send(res, 200, JSON.stringify({ ok: true }), "application/json");
  }

  let filePath = p === "/" ? path.join(PUBLIC, "index.html") : path.join(PUBLIC, p);
  if (!filePath.startsWith(PUBLIC) && !filePath.startsWith(UPLOADS)) return send(res, 403, "forbidden");
  if (p.startsWith("/uploads/")) filePath = path.join(UPLOADS, p.replace("/uploads/", ""));
  if (filePath === PUBLIC) filePath = path.join(PUBLIC, "index.html");

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`[clothing-site] ${config.brand} running at http://localhost:${PORT}`);
});
