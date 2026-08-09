"use strict";

let state = { config: null, products: [], filter: "all" };
const grid = document.getElementById("grid");
const filtersEl = document.getElementById("filters");
const emptyEl = document.getElementById("empty");
const root = document.documentElement;

const WA_ICON =
  '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.3-.4 0-.5.2-.7l.4-.5c.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.2-.5-.3Z"/></svg>';

function waLink(text) {
  const num = String(state.config.whatsapp).replace(/[^0-9]/g, "");
  return "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
}

function cssColor(hex) {
  const h = hex.replace("#", "");
  return "#" + h;
}

function productCard(p) {
  const colors = Array.isArray(p.colors) ? p.colors : [];
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  const isNew = isNewItem(p);

  const card = document.createElement("article");
  card.className = "card";

  const media = document.createElement("div");
  media.className = "card-media";
  const img = document.createElement("img");
  img.src = p.img || "/svg-placeholder.svg";
  img.alt = p.name;
  img.loading = "lazy";
  media.appendChild(img);
  if (isNew) {
    const b = document.createElement("span");
    b.className = "badge-new";
    b.textContent = "New";
    media.appendChild(b);
  }
  card.appendChild(media);

  const body = document.createElement("div");
  body.className = "card-body";

  const name = document.createElement("div");
  name.className = "card-name";
  name.textContent = p.name;
  body.appendChild(name);

  const price = document.createElement("div");
  price.className = "card-price";
  price.textContent = (state.config.currency || "") + p.price;
  body.appendChild(price);

  if (colors.length) {
    const sw = document.createElement("div");
    sw.className = "swatches";
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.className = "swatch";
      b.type = "button";
      b.style.background = cssColor(c.value || c);
      b.title = c.name || c;
      b.dataset.color = c.name || c;
      b.dataset.value = c.value || c;
      sw.appendChild(b);
    });
    body.appendChild(sw);
  }

  if (sizes.length) {
    const sz = document.createElement("div");
    sz.className = "sizes";
    sizes.forEach((s) => {
      const b = document.createElement("button");
      b.className = "size";
      b.type = "button";
      b.textContent = s;
      b.dataset.size = s;
      sz.appendChild(b);
    });
    body.appendChild(sz);
  }

  if (p.desc) {
    const d = document.createElement("div");
    d.className = "card-desc";
    d.textContent = p.desc;
    body.appendChild(d);
  }

  const order = document.createElement("a");
  order.className = "order";
  order.textContent = "Order on WhatsApp";
  order.target = "_blank";
  order.rel = "noopener";
  order.addEventListener("click", (e) => {
    const selectedColor = body.querySelector(".swatch.sel");
    const selectedSize = body.querySelector(".size.sel");
    let msg = "Hi! I'd like to order:\n";
    msg += "• " + p.name + " — " + (state.config.currency || "") + p.price;
    if (selectedColor) msg += "\nColor: " + selectedColor.dataset.color;
    if (selectedSize) msg += "\nSize: " + selectedSize.dataset.size;
    msg += "\n\nIs this available?";
    order.href = waLink(msg);
  });
  body.appendChild(order);

  body.addEventListener("click", (e) => {
    if (e.target.classList.contains("swatch")) {
      body.querySelectorAll(".swatch").forEach((x) => x.classList.remove("sel"));
      e.target.classList.add("sel");
    } else if (e.target.classList.contains("size")) {
      body.querySelectorAll(".size").forEach((x) => x.classList.remove("sel"));
      e.target.classList.add("sel");
    }
  });

  card.appendChild(body);
  return card;
}

function isNewItem(p) {
  if (p.badge === "new") return true;
  if (!p.dateAdded) return false;
  const days = (Date.now() - new Date(p.dateAdded).getTime()) / 86400000;
  return days <= 7;
}

function categories() {
  const set = new Set(["all"]);
  state.products.forEach((p) => {
    if (p.category) set.add(p.category);
  });
  return [...set];
}

function renderFilters() {
  const cats = categories();
  filtersEl.innerHTML = "";
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "chip" + (state.filter === c ? " active" : "");
    b.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    b.addEventListener("click", () => {
      state.filter = c;
      renderFilters();
      renderGrid();
    });
    filtersEl.appendChild(b);
  });
}

function renderGrid() {
  grid.innerHTML = "";
  const list =
    state.filter === "all"
      ? state.products
      : state.products.filter((p) => p.category === state.filter);
  if (!list.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  list.forEach((p) => grid.appendChild(productCard(p)));
}

async function init() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    state.config = data.config;
    state.products = data.products;

    root.style.setProperty("--accent", data.config.accent || "#111111");
    document.title = data.config.brand + " — New Arrivals";
    document.getElementById("brandBtn").textContent = data.config.brand;
    document.getElementById("footerBrand").textContent = data.config.brand;
    const ctaText = waLink("Hi! I'd like to ask about your products.");
    document.getElementById("headerWa").href = ctaText;
    document.getElementById("footerWa").href = ctaText;

    renderFilters();
    renderGrid();
  } catch (err) {
    document.getElementById("empty").textContent = "Could not load the store. Please refresh.";
    document.getElementById("empty").hidden = false;
  }
}

document.getElementById("brandBtn").addEventListener("click", () => {
  state.filter = "all";
  renderFilters();
  renderGrid();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

init();
