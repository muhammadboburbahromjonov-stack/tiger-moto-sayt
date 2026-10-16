/* =====================================================================
   TIGER Automotocentre — admin panel
   Ma'lumotlar ../js/data.js dan o'qiladi va admin.py orqali saqlanadi.
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = n => String(n ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "moto";
// Saytdagi yo'l (img/...) admin papkasidan "../img/..." bo'ladi
const src = p => (p && !/^(https?:|data:|blob:)/.test(p) ? "../" + p : p);

/* Tahrirlanadigan nusxa: "Saqlash" bosilmaguncha sayt o'zgarmaydi */
const db = {
  SITE: clone(SITE), BRANDS: clone(BRANDS), TYPES: clone(TYPES),
  BIKES: clone(BIKES), SOLD: clone(SOLD), VIDEOS: clone(VIDEOS)
};

const STATUS = { sale: "Sotuvda", reserved: "Bron", sold: "Sotilgan" };
const ORIGIN = { KR: "Janubiy Koreya", JP: "Yaponiya", AE: "BAA" };
const NUM_FIELDS = ["year", "cc", "hp", "mileage", "price"];

const typeOpts = () => Object.fromEntries(db.TYPES.map(t => [t.id, (t.title && t.title.uz) || t.id]));
const typeTitle = id => typeOpts()[id] || id || "—";
const opts = (o, v) => Object.entries(o).map(([k, t]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(t)}</option>`).join("");

/* ---------- O'zgarishlar holati ---------- */
let dirty = false;
function setDirty(v = true) {
  dirty = v;
  $("#saveBtn").disabled = !v;
  $("#dirtyNote").hidden = !v;
}
window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

/* ---------- Xabar ---------- */
let toastTimer;
function toast(msg, kind = "ok", ms = 2600) {
  const el = $("#toast");
  el.textContent = msg;
  el.className = `toast show toast--${kind}`;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

/* ---------- Obyekt yo'llari: "title.uz" kabi ---------- */
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
function setPath(o, p, v) {
  const ks = p.split("."), last = ks.pop();
  const target = ks.reduce((a, k) => (a[k] = a[k] && typeof a[k] === "object" ? a[k] : {}), o);
  target[last] = v;
}
// Element qaysi yozuvga tegishli: data-list="BIKES" data-i="3"
function objOf(el) {
  const it = el.closest("[data-list]");
  if (!it) return null;
  return it.dataset.list === "SITE" ? db.SITE : db[it.dataset.list][+it.dataset.i];
}

/* ---------- Kiritiladigan qiymatlarni tozalash ---------- */
const parsers = {
  // YouTube havolasidan ID ni ajratadi
  yt: v => {
    const m = String(v).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : String(v).trim();
  },
  // @username yoki t.me/username → username
  user: v => String(v).trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me|instagram\.com)\//i, "").replace(/^@/, "").replace(/\/.*$/, "")
};

/* =====================================================================
   MAYDON YASOVCHILAR
   ===================================================================== */
function inp(label, k, val, { type = "text", ph = "", attrs = "", hint = "" } = {}) {
  return `<label class="f"><span>${label}</span>
    <input type="${type}" data-k="${k}" value="${esc(val)}" placeholder="${esc(ph)}" ${attrs}>
    ${hint ? `<small>${hint}</small>` : ""}</label>`;
}
const area = (label, k, val, rows = 3) =>
  `<label class="f"><span>${label}</span><textarea data-k="${k}" rows="${rows}">${esc(val)}</textarea></label>`;
const sel = (label, k, val, o) =>
  `<label class="f"><span>${label}</span><select data-k="${k}">${opts(o, val)}</select></label>`;
const chk = (label, k, val) =>
  `<label class="f f--chk"><input type="checkbox" data-k="${k}"${val ? " checked" : ""}><span>${label}</span></label>`;
const color = (label, k, val) => inp(label, k, val || "#E10600", { type: "color" });
function pair(label, k, v, isArea) {
  v = v || {};
  const f = isArea ? area : (l, kk, vv) => inp(l, kk, vv);
  return `<div class="pair"><span class="pair__label">${label}</span>${f("O'zbekcha", k + ".uz", v.uz)}${f("Ruscha", k + ".ru", v.ru)}</div>`;
}

/* Bitta rasm/video maydoni (banner, egasi rasmi, hero video ...) */
function imgField(label, k, val, dir, accept = "image/*") {
  const isVid = /\.(mp4|webm)$/i.test(val || "");
  const prev = !val ? `<em>Fayl yo'q</em>`
    : isVid ? `<video src="${esc(src(val))}" muted loop autoplay playsinline></video>`
    : `<img src="${esc(src(val))}" alt="">`;
  return `<div class="f imgf" data-img-k="${k}" data-dir="${dir}" data-label="${esc(label)}" data-accept="${accept}">
    <span>${label}</span>
    <div class="imgf__box">${prev}</div>
    <div class="imgf__btns">
      <label class="btn btn--ghost btn--sm">Yuklash<input type="file" accept="${accept}" hidden></label>
      ${val ? `<button type="button" class="btn btn--ghost btn--sm" data-act="img-clear">Olib tashlash</button>` : ""}
    </div></div>`;
}
function refreshImg(el) {
  const obj = objOf(el), k = el.dataset.imgK;
  el.outerHTML = imgField(el.dataset.label, k, getPath(obj, k), el.dataset.dir, el.dataset.accept);
}

/* Mototsikl rasmlari: tartiblash, o'chirish, qo'shish */
function photosField(b) {
  const list = b.photos || [];
  return `<div class="f photos" data-photos>
    <span>Rasmlar — birinchisi asosiy rasm (${list.length} ta)</span>
    <div class="photos__grid">
      ${list.map((p, i) => `<figure class="ph">
        <img src="${esc(src(p))}" alt="" loading="lazy">
        ${i === 0 ? `<b class="ph__main">Asosiy</b>` : ""}
        <figcaption>
          <button type="button" data-act="ph-move" data-n="${i}" data-d="-1" title="Chapga">←</button>
          <button type="button" data-act="ph-del" data-n="${i}" title="O'chirish">✕</button>
          <button type="button" data-act="ph-move" data-n="${i}" data-d="1" title="O'ngga">→</button>
        </figcaption></figure>`).join("")}
      <label class="ph ph--add"><input type="file" accept="image/*" multiple hidden><span>+ Rasm qo'shish<br><small>yoki shu yerga tashlang</small></span></label>
    </div></div>`;
}
function refreshPhotos(item) {
  const box = $("[data-photos]", item);
  if (box) box.outerHTML = photosField(objOf(item));
}

const cardActions = () => `<div class="card__act">
  <button type="button" data-act="up" title="Yuqoriga">↑</button>
  <button type="button" data-act="down" title="Pastga">↓</button>
  <button type="button" data-act="del" class="danger" title="O'chirish">🗑</button></div>`;

/* =====================================================================
   BO'LIMLAR
   ===================================================================== */
let bikeQuery = "", bikeStatus = "all";

function renderBikes() {
  const rows = db.BIKES.map((b, i) => ({ b, i })).filter(({ b }) =>
    (bikeStatus === "all" || b.status === bikeStatus) &&
    `${b.brand} ${b.model} ${b.year}`.toLowerCase().includes(bikeQuery));
  $("#bikeCount").textContent = db.BIKES.length;
  $("#bikeTable").innerHTML = rows.length ? rows.map(({ b, i }) => `
    <div class="row" data-list="BIKES" data-i="${i}">
      <div class="row__img">${b.photos && b.photos[0]
        ? `<img src="${esc(src(b.photos[0]))}" alt="" loading="lazy">`
        : `<span style="background:${esc(b.color)}"></span>`}</div>
      <div class="row__name">
        <b>${esc(b.brand) || "—"} ${esc(b.model)}</b>
        <small>${b.year || "—"} · ${esc(typeTitle(b.type))} · ${num(b.mileage)} km · ${(b.photos || []).length} rasm</small>
      </div>
      <div class="row__edit">
        <label class="row__price" title="Narx"><input type="number" data-k="price" value="${esc(b.price)}" min="0" step="100"><span>$</span></label>
        <select class="row__status st--${b.status}" data-k="status" title="Holati">${opts(STATUS, b.status)}</select>
      </div>
      <div class="row__act">
        <button type="button" data-act="up" title="Yuqoriga">↑</button>
        <button type="button" data-act="down" title="Pastga">↓</button>
        <button type="button" data-act="dup" title="Nusxa olish">Nusxa</button>
        <button type="button" data-act="del" class="danger" title="O'chirish">🗑</button>
        <button type="button" data-act="edit" class="primary">Tahrirlash</button>
      </div>
    </div>`).join("") : `<p class="empty">Hech narsa topilmadi</p>`;
  $("#brandList").innerHTML = db.BRANDS.map(b => `<option value="${esc(b)}">`).join("");
}

function openBike(i) {
  const b = db.BIKES[i];
  $("#drawerTitle").textContent = b.brand || b.model ? `${b.brand} ${b.model}` : "Yangi mototsikl";
  $("#drawerBody").innerHTML = `<div class="form-grid" data-list="BIKES" data-i="${i}">
    ${inp("Brend", "brand", b.brand, { attrs: 'list="brandList"', ph: "Yamaha" })}
    ${inp("Model", "model", b.model, { ph: "YZF-R1" })}
    ${inp("Narx ($)", "price", b.price, { type: "number", attrs: 'min="0" step="100"' })}
    ${sel("Holati", "status", b.status, STATUS)}
    ${inp("Yili", "year", b.year, { type: "number", attrs: 'min="1970" max="2035"' })}
    ${inp("Yurgani (km)", "mileage", b.mileage, { type: "number", attrs: 'min="0"' })}
    ${inp("Dvigatel (cc)", "cc", b.cc, { type: "number", attrs: 'min="0"' })}
    ${inp("Quvvat (o.k.)", "hp", b.hp, { type: "number", attrs: 'min="0"' })}
    ${sel("Turi", "type", b.type, typeOpts())}
    ${sel("Qayerdan keltirilgan", "origin", b.origin, ORIGIN)}
    ${chk("Hujjatlari toza, original", "docsClean", b.docsClean)}
    ${color("Rang (rasm bo'lmasa chizma rangi)", "color", b.color)}
    <div class="span2">${photosField(b)}</div>
    <div class="span2">${inp("YouTube video", "video", b.video, { ph: "https://youtu.be/... yoki ID", attrs: 'data-parse="yt"' })}</div>
    <div class="span2">${pair("Tavsif", "desc", b.desc, true)}</div>
  </div>`;
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  setTimeout(() => { const f = $("#drawerBody input"); if (f && !b.brand) f.focus(); }, 300);
}
function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
  renderBikes();
}

function renderTypes() {
  $("#typesList").innerHTML = db.TYPES.map((tp, i) => `
    <div class="card" data-list="TYPES" data-i="${i}">
      <div class="card__head">
        <b>${esc((tp.title && tp.title.uz) || tp.id || "Yangi tur")}</b>
        <span class="muted">${db.BIKES.filter(b => b.type === tp.id).length} ta mototsikl</span>
        ${cardActions()}
      </div>
      <div class="form-grid">
        ${inp("ID (manzil uchun)", "id", tp.id, tp._new
          ? { ph: "enduro", hint: "Faqat kichik lotin harflari: category.html?type=enduro" }
          : { attrs: "readonly", hint: `Manzil: category.html?type=${esc(tp.id)}` })}
        ${color("Rang", "color", tp.color)}
        <div class="span2">${pair("Nomi", "title", tp.title)}</div>
        <div class="span2">${pair("Tavsif", "desc", tp.desc, true)}</div>
        <div class="span2">${imgField("Banner rasmi (ixtiyoriy)", "banner", tp.banner, "types")}</div>
      </div>
    </div>`).join("") || `<p class="empty">Turlar yo'q</p>`;
}

function renderSold() {
  $("#soldList").innerHTML = db.SOLD.map((s, i) => `
    <div class="card" data-list="SOLD" data-i="${i}">
      <div class="card__head"><b>${esc(s.bike) || "Yangi fikr"}</b>${cardActions()}</div>
      <div class="form-grid">
        ${inp("Mototsikl", "bike", s.bike, { ph: "Kawasaki Z900" })}
        ${inp("Mijoz ismi", "owner", s.owner, { ph: "Sardor" })}
        <div class="span2">${pair("Fikr", "text", s.text, true)}</div>
        ${imgField("Mijoz rasmi", "photo", s.photo, "sold")}
        ${color("Rang (rasm bo'lmasa)", "color", s.color)}
      </div>
    </div>`).join("") || `<p class="empty">Hozircha fikrlar yo'q</p>`;
}

function renderVideos() {
  $("#videoList").innerHTML = db.VIDEOS.map((v, i) => `
    <div class="card" data-list="VIDEOS" data-i="${i}">
      <div class="card__head"><b>${esc(v.title && v.title.uz) || "Yangi video"}</b>${cardActions()}</div>
      <div class="form-grid">
        <div>
          ${inp("YouTube havola yoki ID", "youtube", v.youtube, { ph: "https://youtu.be/...", attrs: 'data-parse="yt"' })}
        </div>
        ${v.youtube ? `<img class="yt-prev" src="https://i.ytimg.com/vi/${esc(v.youtube)}/hqdefault.jpg" alt="">` : `<div class="yt-prev"></div>`}
        <div class="span2">${pair("Sarlavha", "title", v.title)}</div>
      </div>
    </div>`).join("") || `<p class="empty">Videolar yo'q</p>`;
}

function renderSite() {
  const s = db.SITE;
  $("#siteForm").innerHTML = `
    <div class="cards">
      <div class="card" data-list="SITE">
        <h3 class="group-title">Aloqa</h3><br>
        <div class="form-grid">
          ${inp("Telefon", "phone", s.phone, { ph: "+998 90 123 45 67", hint: "Qo'ng'iroq havolasi o'zi yangilanadi" })}
          ${inp("Ish vaqti", "hours", s.hours, { ph: "12:00 – 21:00" })}
          ${inp("Telegram username", "telegram", s.telegram, { ph: "tiger_moto", attrs: 'data-parse="user"', hint: "@ belgisiz yoki t.me havolasi" })}
          ${inp("Instagram username", "instagram", s.instagram, { ph: "tiger_moto", attrs: 'data-parse="user"' })}
          ${inp("YouTube kanal havolasi", "youtube", s.youtube, { ph: "https://youtube.com/@..." })}
          ${inp("Xarita uchun manzil", "mapQuery", s.mapQuery, { ph: "Toshkent, ... ko'chasi 12", hint: "Manzil yoki koordinata: 41.31,69.24" })}
          <div class="span2">${pair("Manzil (saytda ko'rinadi)", "address", s.address)}</div>
        </div>
      </div>

      <div class="card" data-list="SITE">
        <h3 class="group-title">"Biz haqimizda" raqamlari</h3><br>
        <div class="form-grid">
          ${inp("Instagram obunachilar", "stats.followers", s.stats && s.stats.followers, { type: "number", attrs: 'min="0"' })}
          ${inp("Sotilgan mototsikllar", "stats.sold", s.stats && s.stats.sold, { type: "number", attrs: 'min="0"' })}
          ${inp("Tajriba (yil)", "stats.years", s.stats && s.stats.years, { type: "number", attrs: 'min="0"' })}
        </div>
      </div>

      <div class="card" data-list="SITE">
        <h3 class="group-title">Rasm va video</h3><br>
        <div class="form-grid">
          ${imgField("Asoschi rasmi (Biz haqimizda)", "ownerPhoto", s.ownerPhoto, "site")}
          ${imgField("Bosh sahifa videosi (mp4, ixtiyoriy)", "heroVideo", s.heroVideo, "site", "video/mp4,video/webm")}
        </div>
      </div>

      <div class="card" data-list="SITE">
        <h3 class="group-title">Sayt yaratuvchisi (footer)</h3><br>
        <div class="form-grid">
          ${inp("Ism yoki studiya nomi", "developer.name", s.developer && s.developer.name, { hint: "Bo'sh qoldirilsa, saytda ko'rinmaydi" })}
          ${inp("Telegram username", "developer.telegram", s.developer && s.developer.telegram, { attrs: 'data-parse="user"', ph: "username" })}
          ${inp("Telefon", "developer.phone", s.developer && s.developer.phone, { ph: "+998 90 123 45 67" })}
          ${inp("Portfolio havolasi (ixtiyoriy)", "developer.url", s.developer && s.developer.url, { ph: "https://..." })}
        </div>
      </div>

      <div class="card">
        <h3 class="group-title">Brendlar (katalog uchun)</h3><br>
        <label class="f"><span>Har bir qatorda bitta brend</span>
          <textarea id="brandsArea" rows="6">${esc(db.BRANDS.join("\n"))}</textarea></label>
      </div>
    </div>`;
}

const renderers = { BIKES: renderBikes, TYPES: renderTypes, SOLD: renderSold, VIDEOS: renderVideos };
function renderAll() { renderBikes(); renderTypes(); renderSold(); renderVideos(); renderSite(); }

/* =====================================================================
   HODISALAR
   ===================================================================== */

/* Maydon o'zgarganda — tegishli obyektga yozamiz */
document.addEventListener("input", e => {
  const el = e.target;
  if (el.id === "brandsArea") {
    db.BRANDS = el.value.split("\n").map(x => x.trim()).filter(Boolean);
    return setDirty();
  }
  if (!el.dataset.k) return;
  const obj = objOf(el);
  if (!obj) return;
  let v = el.type === "checkbox" ? el.checked
        : el.type === "number" ? (el.value === "" ? "" : Number(el.value))
        : el.value;
  if (el.dataset.parse) v = parsers[el.dataset.parse](v);
  setPath(obj, el.dataset.k, v);

  // Telefon o'zgarsa — tel: havolasini ham yangilaymiz
  if (obj === db.SITE && el.dataset.k === "phone") {
    const digits = String(v).replace(/\D/g, "");
    db.SITE.phoneHref = digits ? "+" + digits : "";
  }
  if (el.dataset.k === "status" && el.classList.contains("row__status")) el.className = `row__status st--${v}`;
  if (el.dataset.k === "title.uz" || el.dataset.k === "bike") {
    const head = el.closest(".card");
    if (head) $(".card__head b", head).textContent = v || "—";
  }
  setDirty();
});

/* Video havolasi kiritilgach — preview yangilanadi */
document.addEventListener("change", e => {
  if (e.target.dataset.k === "youtube") renderVideos();
});

/* Tugmalar */
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const item = btn.closest("[data-list]");
  const list = item && item.dataset.list;
  const i = item ? +item.dataset.i : -1;
  const arr = list && list !== "SITE" ? db[list] : null;

  switch (act) {
    case "close-drawer": closeDrawer(); break;
    case "edit": openBike(i); break;

    case "add-bike":
      db.BIKES.unshift({
        id: "", brand: "", model: "", year: new Date().getFullYear(), cc: 0, hp: 0, mileage: 0, price: 0,
        type: (db.TYPES[0] && db.TYPES[0].id) || "sport", status: "sale", origin: "AE", docsClean: true,
        color: "#E10600", photos: [], video: "", desc: { uz: "", ru: "" }
      });
      setDirty(); renderBikes(); openBike(0);
      break;
    case "dup": {
      const c = clone(arr[i]);
      c.id = ""; c.model += " (nusxa)";
      arr.splice(i + 1, 0, c);
      setDirty(); renderBikes();
      break;
    }
    case "add-type":
      db.TYPES.push({ id: "", _new: true, color: "#E10600", banner: "", title: { uz: "", ru: "" }, desc: { uz: "", ru: "" } });
      setDirty(); renderTypes();
      break;
    case "add-sold":
      db.SOLD.unshift({ bike: "", owner: "", photo: "", color: "#E10600", text: { uz: "", ru: "" } });
      setDirty(); renderSold();
      break;
    case "add-video":
      db.VIDEOS.push({ youtube: "", title: { uz: "", ru: "" } });
      setDirty(); renderVideos();
      break;

    case "del": {
      const o = arr[i];
      const name = list === "BIKES" ? `${o.brand} ${o.model}` : list === "TYPES" ? (o.title && o.title.uz) || o.id
                 : list === "SOLD" ? o.bike : (o.title && o.title.uz) || "video";
      if (list === "TYPES") {
        const used = db.BIKES.filter(b => b.type === o.id).length;
        if (used) { toast(`Bu turda ${used} ta mototsikl bor — avval ularning turini o'zgartiring`, "error", 4000); break; }
      }
      if (!confirm(`O'chirilsinmi: ${name || "nomsiz"}?`)) break;
      arr.splice(i, 1);
      setDirty(); renderers[list]();
      break;
    }
    case "up": case "down": {
      const j = i + (act === "up" ? -1 : 1);
      if (j < 0 || j >= arr.length) break;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      setDirty(); renderers[list]();
      break;
    }

    case "ph-move": case "ph-del": {
      const b = objOf(btn), n = +btn.dataset.n;
      if (act === "ph-del") {
        if (!confirm("Rasm olib tashlansinmi?")) break;
        b.photos.splice(n, 1);
      } else {
        const m = n + +btn.dataset.d;
        if (m < 0 || m >= b.photos.length) break;
        [b.photos[n], b.photos[m]] = [b.photos[m], b.photos[n]];
      }
      setDirty(); refreshPhotos(item);
      break;
    }
    case "img-clear": {
      const f = btn.closest(".imgf");
      setPath(objOf(f), f.dataset.imgK, "");
      setDirty(); refreshImg(f);
      break;
    }
  }
});

/* ---------- Fayl yuklash ---------- */
// Rasmni 1600px gacha kichraytirib WebP ga o'giradi — sayt tez ochiladi
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap) return { blob: file, name: file.name };
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return { blob: file, name: file.name };
    return { blob, name: file.name.replace(/\.\w+$/, "") + ".webp" };
  } catch (e) {
    return { blob: file, name: file.name };
  }
}

async function upload(file, dir) {
  toast(`Yuklanmoqda: ${file.name}…`, "ok", 0);
  try {
    const { blob, name } = await shrink(file);
    const r = await fetch(`/api/upload?dir=${dir}&name=${encodeURIComponent(name)}`, { method: "POST", body: blob });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || r.status);
    toast("Yuklandi ✓");
    return j.path;
  } catch (err) {
    toast(`Yuklab bo'lmadi: ${err.message || err}. admin.py ishlayaptimi?`, "error", 5000);
    return null;
  }
}

async function handleFiles(target, files) {
  files = [...files];
  if (!files.length) return;
  const photos = target.closest("[data-photos]");
  const imgf = target.closest(".imgf");
  const item = target.closest("[data-list]");
  if (photos) {
    const b = objOf(photos);
    b.photos = b.photos || [];
    for (const f of files.filter(f => f.type.startsWith("image/"))) {
      const p = await upload(f, "bikes");
      if (p) { b.photos.push(p); setDirty(); refreshPhotos(item); }
    }
  } else if (imgf) {
    const p = await upload(files[0], imgf.dataset.dir);
    if (p) { setPath(objOf(imgf), imgf.dataset.imgK, p); setDirty(); refreshImg(imgf); }
  }
}

document.addEventListener("change", e => {
  const el = e.target;
  if (el.type !== "file") return;
  const files = [...el.files];
  el.value = "";
  handleFiles(el, files);
});
// Rasmlarni sudrab tashlash
document.addEventListener("dragover", e => {
  const zone = e.target.closest("[data-photos], .imgf");
  if (!zone) return;
  e.preventDefault();
  zone.classList.add("is-drop");
});
document.addEventListener("dragleave", e => {
  const zone = e.target.closest("[data-photos], .imgf");
  if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove("is-drop");
});
document.addEventListener("drop", e => {
  const zone = e.target.closest("[data-photos], .imgf");
  if (!zone) return;
  e.preventDefault();
  zone.classList.remove("is-drop");
  handleFiles(zone, e.dataTransfer.files);
});

/* ---------- Saqlash ---------- */
function prepare() {
  const errors = [];
  db.BIKES.forEach(b => {
    NUM_FIELDS.forEach(k => { if (b[k] === "" || b[k] == null) b[k] = 0; });
    b.brand = String(b.brand || "").trim();
    b.model = String(b.model || "").trim();
    if (!b.brand || !b.model) errors.push("Brendi yoki modeli kiritilmagan mototsikl bor");
    else if (!(b.price > 0)) errors.push(`${b.brand} ${b.model}: narx kiritilmagan`);
    if (!b.id) {
      const base = slug(`${b.brand}-${b.model}-${b.year}`);
      let id = base, n = 2;
      while (db.BIKES.some(x => x !== b && x.id === id)) id = `${base}-${n++}`;
      b.id = id;
    }
    if (b.brand && !db.BRANDS.includes(b.brand)) db.BRANDS.push(b.brand);
  });
  const typeIds = new Set();
  db.TYPES.forEach(tp => {
    tp.id = String(tp.id || "").trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(tp.id)) errors.push(`Tur ID si noto'g'ri: "${tp.id}" (faqat lotin harflari)`);
    else if (typeIds.has(tp.id)) errors.push(`Tur ID si takrorlangan: ${tp.id}`);
    typeIds.add(tp.id);
    if (!tp.title || !tp.title.uz) errors.push(`"${tp.id}" turining nomi kiritilmagan`);
  });
  db.BIKES.forEach(b => { if (b.brand && !typeIds.has(b.type)) errors.push(`${b.brand} ${b.model}: turi tanlanmagan`); });
  return [...new Set(errors)];
}

async function save() {
  if (!dirty) return;
  const errors = prepare();
  if (errors.length) {
    toast(errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} ta xato)` : ""), "error", 5000);
    return;
  }
  // "_new" kabi ichki belgilar faylga yozilmaydi
  const body = JSON.stringify(db, (k, v) => (k.startsWith("_") ? undefined : v));
  $("#saveBtn").disabled = true;
  try {
    const r = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || r.status);
    db.TYPES.forEach(tp => delete tp._new);
    setDirty(false);
    renderAll();
    toast("Saqlandi ✓ Saytni yangilang (F5)");
  } catch (err) {
    $("#saveBtn").disabled = false;
    toast(`Saqlanmadi: ${err.message || err}. admin.py ishlayaptimi?`, "error", 6000);
  }
}
$("#saveBtn").addEventListener("click", save);
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  if (e.key === "Escape" && $("#drawer").classList.contains("open")) closeDrawer();
});

/* ---------- Tablar, qidiruv ---------- */
function showTab(name) {
  $$("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  $$(".panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
  try { localStorage.setItem("tiger-admin-tab", name); } catch (e) {}
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });
$("#bikeSearch").addEventListener("input", e => { bikeQuery = e.target.value.trim().toLowerCase(); renderBikes(); });
$("#bikeFilter").addEventListener("change", e => { bikeStatus = e.target.value; renderBikes(); });

/* ---------- Ishga tushirish ---------- */
renderAll();
try { const t = localStorage.getItem("tiger-admin-tab"); if (t && $("#tab-" + t)) showTab(t); } catch (e) {}
fetch("/api/ping").then(r => { if (!r.ok) throw 0; }).catch(() => { $("#serverWarn").hidden = false; });
