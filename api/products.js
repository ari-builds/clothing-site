"use strict";
const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  const dataDir = path.join(__dirname, "..", "data");
  const config = JSON.parse(fs.readFileSync(path.join(dataDir, "config.json"), "utf8"));
  const store = JSON.parse(fs.readFileSync(path.join(dataDir, "products.json"), "utf8"));
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    JSON.stringify({
      config: {
        brand: config.brand,
        whatsapp: config.whatsapp,
        accent: config.accent,
        currency: config.currency,
      },
      products: store.products,
    })
  );
};
