"use strict";

let token = localStorage.getItem("site-admin-token") || "";
const login = document.getElementById("login");
const app = document.getElementById("app");

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

async function api(url, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ "x-admin-token": encodeURIComponent(token) }, opts.headers || {});
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(data.error || "request failed");
  return data;
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  token = document.getElementById("token").value.trim();
  localStorage.setItem("site-admin-token", token);
  try {
    const r = await api("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (r.ok) { login.hidden = true; app.hidden = false; toast("Logged in"); loadList(); }
    else document.getElementById("loginErr").textContent = "Wrong token.";
  } catch {
    document.getElementById("loginErr").textContent = "Wrong token.";
  }
});

function parseColors(str) {
  return (str || "").split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const [name, value] = s.split(":");
    return { name: name.trim(), value: (value || name).trim() };
  });
}

document.getElementById("f-img").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("img-preview").src = reader.result;
    document.getElementById("img-preview").hidden = false;
    document.getElementById("img-hint").textContent = file.name;
  };
  reader.readAsDataURL(file);
});

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const img = document.getElementById("img-preview");
  const product = {
    id: document.getElementById("f-id").value || null,
    name: document.getElementById("f-name").value.trim(),
    price: document.getElementById("f-price").value.trim(),
    category: document.getElementById("f-category").value.trim(),
    colors: parseColors(document.getElementById("f-colors").value),
    sizes: document.getElementById("f-sizes").value.split(",").map((s) => s.trim()).filter(Boolean),
    desc: document.getElementById("f-desc").value.trim(),
    badge: document.getElementById("f-badge").checked ? "new" : "",
    imgData: img.src && img.src.startsWith("data:") ? img.src : null,
  };
  try {
    await api("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product }) });
    toast("Saved!");
    resetForm();
    loadList();
  } catch (err) {
    toast("Error: " + err.message);
  }
});

function resetForm() {
  document.getElementById("form").reset();
  document.getElementById("f-id").value = "";
  document.getElementById("img-preview").hidden = true;
  document.getElementById("img-preview").src = "";
  document.getElementById("img-hint").textContent = "";
}

document.getElementById("resetBtn").addEventListener("click", resetForm);

async function loadList() {
  const data = await api("/api/products");
  const list = document.getElementById("list");
  list.innerHTML = "";
  data.products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = p.img || "/svg-placeholder.svg";
    img.alt = p.name;

    const info = document.createElement("div");
    info.className = "info";
    const name = document.createElement("strong");
    name.textContent = p.name;
    const meta = document.createElement("span");
    meta.textContent = (data.config.currency || "") + p.price + (p.category ? " · " + p.category : "");
    info.appendChild(name);
    info.appendChild(meta);

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn ghost";
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => fillForm(p));

    const btnDel = document.createElement("button");
    btnDel.className = "btn ghost";
    btnDel.textContent = "Delete";
    btnDel.addEventListener("click", async () => {
      if (!confirm("Delete " + p.name + "?")) return;
      await api("/api/products/" + p.id, { method: "DELETE" });
      loadList();
      toast("Deleted");
    });

    card.appendChild(img);
    card.appendChild(info);
    card.appendChild(btnEdit);
    card.appendChild(btnDel);
    list.appendChild(card);
  });
}

function fillForm(p) {
  document.getElementById("f-id").value = p.id;
  document.getElementById("f-name").value = p.name;
  document.getElementById("f-price").value = p.price;
  document.getElementById("f-category").value = p.category || "";
  document.getElementById("f-colors").value = (p.colors || []).map((c) => c.name + ":" + c.value).join(", ");
  document.getElementById("f-sizes").value = (p.sizes || []).join(", ");
  document.getElementById("f-desc").value = p.desc || "";
  document.getElementById("f-badge").checked = p.badge === "new" || p.dateAdded && (Date.now() - new Date(p.dateAdded).getTime()) / 86400000 <= 7;
  const preview = document.getElementById("img-preview");
  preview.src = p.img || "";
  preview.hidden = !p.img;
  document.getElementById("img-hint").textContent = p.img ? p.img : "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

(async () => {
  if (!token) return;
  try {
    const r = await api("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (r.ok) { login.hidden = true; app.hidden = false; loadList(); }
  } catch {}
})();
