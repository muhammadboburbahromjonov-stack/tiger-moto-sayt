/* =====================================================================
   TIGER Automotocentre — asosiy skript
   Ma'lumotlar: data.js | Tarjimalar: i18n.js
   ===================================================================== */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ---------- Til ---------- */
let lang = "uz";
try { lang = localStorage.getItem("tiger-lang") || "uz"; } catch (e) {}
if (!I18N[lang]) lang = "uz";

const t = key => (I18N[lang] && I18N[lang][key]) || I18N.uz[key] || key;
const loc = obj => (obj && (obj[lang] || obj.uz)) || "";
/* Son bilan kelishadigan so'z: ruscha "мотоцикл|мотоцикла|мотоциклов" */
function tn(key, n) {
  const forms = t(key).split("|");
  if (forms.length < 3) return forms[0];
  const a = Math.abs(n) % 100, b = a % 10;
  return forms[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2];
}

/* ---------- Yordamchi funksiyalar ---------- */
const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const price = n => `${num(n)} $`;
const tgLink = text => `https://t.me/${SITE.telegram}` + (text ? `?text=${encodeURIComponent(text)}` : "");
const bikeUrl = b => `bike.html?id=${encodeURIComponent(b.id)}`;
const bikeName = b => `${b.brand} ${b.model}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Rasm bo'lmasa — mototsikl chizmasi (SVG) */
let artId = 0;
function bikeArt(color = "#E10600", cls = "") {
  const id = "ba" + (++artId);
  return `<svg class="bike-art ${cls}" viewBox="0 0 400 240" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#050505"/></linearGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <ellipse cx="205" cy="222" rx="175" ry="9" fill="#000" opacity=".7"/>
    <g fill="none">
      <circle cx="95" cy="170" r="48" stroke="#0d0d0d" stroke-width="17"/><circle cx="95" cy="170" r="56" stroke="#2b2b2b" stroke-width="1.5"/>
      <circle cx="95" cy="170" r="24" stroke="#8a8a8a" stroke-width="2" stroke-dasharray="4 3"/>
      <circle cx="310" cy="170" r="48" stroke="#0d0d0d" stroke-width="17"/><circle cx="310" cy="170" r="56" stroke="#2b2b2b" stroke-width="1.5"/>
      <circle cx="310" cy="170" r="24" stroke="#8a8a8a" stroke-width="2" stroke-dasharray="4 3"/>
    </g>
    <path d="M95 170 L205 146" stroke="#2c2c2c" stroke-width="10" stroke-linecap="round"/>
    <path d="M293 84 L310 170" stroke="#c9c9c9" stroke-width="7" stroke-linecap="round"/>
    <path d="M190 172 L130 164 L98 138" stroke="#5c5c5c" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M162 138 L240 128 L248 168 L176 177 Z" fill="#161616" stroke="#333"/>
    <path d="M56 104 L152 92 L162 108 L100 123 Z" fill="url(#${id})"/>
    <path d="M118 97 L192 86 L196 97 L128 107 Z" fill="#0b0b0b"/>
    <path d="M150 110 L180 89 L236 82 L262 90 L300 66 L330 70 L342 92 L302 121 L252 141 L170 147 Z" fill="url(#${id})"/>
    <path d="M186 92 L236 86 L258 94 L200 103 Z" fill="url(#${id}h)"/>
    <path d="M205 126 L292 108 L290 115 L208 133 Z" fill="#fff" opacity=".85"/>
    <path d="M300 66 L318 49 L331 70 Z" fill="#9fd0ff" opacity=".3"/>
    <path d="M331 80 L344 88 L335 95 Z" fill="#fff"/>
    <path d="M286 72 L268 61" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
}

function bikeMedia(b, i = 0, cls = "") {
  const src = b.photos && b.photos[i];
  return src
    ? `<img src="${esc(src)}" alt="${esc(bikeName(b))}" loading="lazy" decoding="async" class="${cls}">`
    : `<div class="art-wrap ${cls}" style="--c:${b.color}">${bikeArt(b.color)}</div>`;
}

const badge = s => `<span class="badge badge--${s}">${t("status." + s)}</span>`;

/* Mototsikl kartochkasi: rasm, nom, chiziq, narx */
function card(b) {
  return `<a href="${bikeUrl(b)}" class="mcard reveal ${b.status === "sold" ? "is-sold" : ""}">
    <div class="mcard__img">${bikeMedia(b)}${badge(b.status)}</div>
    <h3 class="mcard__name">${esc(bikeName(b))}</h3>
    <span class="mcard__line"></span>
    <p class="mcard__meta">${b.year} · ${num(b.cc)} cc · ${num(b.mileage)} km</p>
    <p class="mcard__price">${price(b.price)}</p>
  </a>`;
}

const typeUrl = id => id ? `category.html?type=${id}` : "category.html";
const statusOrder = { sale: 0, reserved: 1, sold: 2 };
const byStatus = (a, b) => statusOrder[a.status] - statusOrder[b.status];

/* ---------- Scroll animatsiyasi ---------- */
const revealObs = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); revealObs.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
  : null;
function observeReveal(root = document) {
  $$(".reveal:not(.is-in)", root).forEach(el => revealObs ? revealObs.observe(el) : el.classList.add("is-in"));
}

/* ---------- Sayt yaratuvchisi (footer) ---------- */
function renderDev() {
  const box = $("#devCredit"), d = SITE.developer;
  if (!box || !d || !d.name) { if (box) box.hidden = true; return; }
  const digits = String(d.phone || "").replace(/\D/g, "");
  box.innerHTML = `
    <button class="dev__link" type="button" aria-expanded="false" aria-controls="devCard">
      ${t("dev.by")} <b>${esc(d.name)}</b>
    </button>
    <div class="dev__card" id="devCard" hidden>
      <p class="dev__title">${t("dev.title")}</p>
      <p class="dev__text">${t("dev.text")}</p>
      <div class="dev__btns">
        ${d.telegram ? `<a class="btn btn--red btn--sm" href="https://t.me/${esc(d.telegram)}?text=${encodeURIComponent(t("dev.msg"))}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-tg"/></svg>${t("dev.tg")}</a>` : ""}
        ${digits ? `<a class="btn btn--ghost btn--sm" href="tel:+${digits}"><svg class="ico"><use href="#i-phone"/></svg>${esc(d.phone)}</a>` : ""}
        ${d.url ? `<a class="btn btn--ghost btn--sm" href="${esc(d.url)}" target="_blank" rel="noopener">${t("dev.portfolio")} ↗</a>` : ""}
      </div>
      <a class="dev__more" href="developer.html">${t("dev.more")}</a>
    </div>`;
  const btn = $(".dev__link", box), card = $(".dev__card", box);
  btn.addEventListener("click", e => {
    e.stopPropagation();
    card.hidden = !card.hidden;
    btn.setAttribute("aria-expanded", !card.hidden);
  });
}
document.addEventListener("click", e => {
  const card = $("#devCard");
  if (card && !card.hidden && !e.target.closest(".dev")) {
    card.hidden = true;
    $(".dev__link").setAttribute("aria-expanded", "false");
  }
});

/* ---------- Umumiy: header, menyu, havolalar ---------- */
function initShell() {
  const header = $("#header"), nav = $("#nav"), burger = $("#burger");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.classList.toggle("open", open);
    document.body.classList.toggle("no-scroll", open);
  });
  nav.addEventListener("click", e => {
    if (e.target.closest("a")) { nav.classList.remove("open"); burger.classList.remove("open"); document.body.classList.remove("no-scroll"); }
  });

  $$("[data-lang]").forEach(btn => btn.addEventListener("click", () => setLang(btn.dataset.lang)));

  $$(".js-tg").forEach(a => a.href = tgLink());
  $$(".js-ig").forEach(a => a.href = `https://instagram.com/${SITE.instagram}`);
  $$(".js-yt").forEach(a => a.href = SITE.youtube);
  $$(".js-phone").forEach(a => a.href = `tel:${SITE.phoneHref}`);
  $$(".js-phone-text").forEach(a => a.textContent = SITE.phone);
  $$(".js-hours").forEach(el => el.textContent = SITE.hours);
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
}

function setLang(l) {
  lang = l;
  try { localStorage.setItem("tiger-lang", l); } catch (e) {}
  applyLang();
}

function applyLang() {
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
  $$("[data-i18n-html]").forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
  $$("[data-lang]").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));
  $$(".js-address").forEach(el => el.textContent = loc(SITE.address));
  renderDev();
  renderers.forEach(fn => fn());
}
const renderers = []; // tilni almashtirganda qayta chiziladigan bo'limlar

/* =====================================================================
   BOSH SAHIFA
   ===================================================================== */
function initHome() {
  if (!$("#typesGrid")) return;

  /* Hero: video yoki mototsikl chizmasi */
  const media = $("#heroMedia");
  media.innerHTML = SITE.heroVideo
    ? `<video autoplay muted loop playsinline preload="metadata" src="${esc(SITE.heroVideo)}"></video>`
    : `<div class="hero__bike">${bikeArt("#E10600")}${bikeArt("#E10600", "bike-art--reflect")}</div>`;

  /* --- Mototsikl turlari --- */
  function renderTypes() {
    $("#typesGrid").innerHTML = TYPES.map(tp => {
      const count = BIKES.filter(x => x.type === tp.id && x.status !== "sold").length;
      return `<a href="${typeUrl(tp.id)}" class="type-tile reveal" style="--c:${tp.color}">
        <div class="type-tile__art">${tp.banner ? `<img src="${esc(tp.banner)}" alt="" loading="lazy">` : bikeArt(tp.color)}</div>
        <div class="type-tile__body">
          <h3>${esc(loc(tp.title))}</h3>
          <span>${count} ${tn("types.count", count)}</span>
        </div>
        <span class="type-tile__arrow">→</span>
      </a>`;
    }).join("");
    observeReveal($("#typesGrid"));
  }

  /* --- Yangi kelganlar: sotuvdagi oxirgi 6 ta --- */
  function renderLatest() {
    $("#latestGrid").innerHTML = BIKES.filter(x => x.status !== "sold").slice(0, 6).map(card).join("");
    observeReveal($("#latestGrid"));
  }

  /* --- Arizalar: Trade-in va Sotib berish --- */
  // Server (masalan Telegram bot) ulanmaguncha ariza Telegram chatga matn bo'lib yuboriladi
  function leadForm(formId, photosId, previewId, okId, buildMsg) {
    const photos = $("#" + photosId), preview = $("#" + previewId);
    photos.addEventListener("change", () => {
      preview.innerHTML = [...photos.files].slice(0, 8)
        .map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join("");
    });
    $("#" + formId).addEventListener("submit", e => {
      e.preventDefault();
      window.open(tgLink(buildMsg(new FormData(e.target))), "_blank", "noopener");
      $("#" + okId).hidden = false;
    });
  }
  leadForm("tradeForm", "tradePhotos", "tradePreview", "tradeOk", d =>
    `Trade-in:\n${d.get("model")}, ${d.get("year")}, ${d.get("km")} km\nTel: ${d.get("phone")}`);
  leadForm("sellForm", "sellPhotos", "sellPreview", "sellOk", d =>
    `${t("sell.msg")}\n${d.get("model")}, ${d.get("year")}, ${d.get("km")} km` +
    (d.get("price") ? `\n${t("sell.priceLabel")}: ${price(d.get("price"))}` : "") + `\nTel: ${d.get("phone")}`);

  /* --- Sotilganlar karuseli --- */
  function renderSold() {
    const list = SOLD.filter(s => s.bike && loc(s.text));
    $("#sold").hidden = !list.length;
    $("#soldTrack").innerHTML = list.map(s => `
      <figure class="sold-card">
        <div class="sold-card__media" style="--c:${s.color}">
          ${s.photo ? `<img src="${esc(s.photo)}" alt="${esc(s.bike)}" loading="lazy">` : bikeArt(s.color)}
          ${badge("sold")}
        </div>
        <figcaption>
          <h3>${esc(s.bike)}</h3>
          <blockquote>“${esc(loc(s.text))}”</blockquote>
          <p class="sold-card__owner">— ${esc(s.owner)}</p>
        </figcaption>
      </figure>`).join("");
  }
  const track = $("#soldTrack");
  const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth + 20 : 300);
  $("#soldPrev").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  $("#soldNext").addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));

  /* --- Asoschi rasmi --- */
  if (SITE.ownerPhoto) $("#ownerPhoto").style.backgroundImage = `url("${SITE.ownerPhoto}")`;
  else $("#ownerPhoto").classList.add("is-placeholder");

  /* --- Raqamlar animatsiyasi --- */
  const counters = $$(".js-count");
  const runCount = el => {
    const target = SITE.stats[el.dataset.key], t0 = performance.now(), dur = 1600;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = num(v) + (p === 1 ? "+" : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else counters.forEach(c => c.textContent = num(SITE.stats[c.dataset.key]) + "+");

  /* --- Videolar (bosilganda yuklanadi — sahifa tez ochiladi) --- */
  function renderVideos() {
    const list = VIDEOS.filter(v => v.youtube);
    $("#videos").hidden = !list.length;
    $("#videoGrid").innerHTML = list.map((v, i) => `
      <div class="video reveal" data-yt="${esc(v.youtube)}">
        ${v.youtube
          ? `<img src="https://i.ytimg.com/vi/${esc(v.youtube)}/hqdefault.jpg" alt="" loading="lazy">`
          : `<div class="video__ph">${bikeArt(["#E10600", "#1E5BFF", "#555"][i % 3])}</div>`}
        <button class="video__play" aria-label="Play"><span></span></button>
        <p class="video__title">${esc(loc(v.title))}${v.youtube ? "" : ` · <small>${t("video.soon")}</small>`}</p>
      </div>`).join("");
    observeReveal($("#videoGrid"));
  }
  $("#videoGrid").addEventListener("click", e => {
    const v = e.target.closest(".video"); if (!v || !v.dataset.yt) return;
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="YouTube"></iframe>`;
  });

  /* --- Xarita (ko'rinishga kelganda yuklanadi) --- */
  const map = $("#map");
  const loadMap = () => map.innerHTML =
    `<iframe src="https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>`;
  if ("IntersectionObserver" in window) {
    const mo = new IntersectionObserver(es => { if (es[0].isIntersecting) { loadMap(); mo.disconnect(); } }, { rootMargin: "300px" });
    mo.observe(map);
  } else loadMap();

  renderers.push(renderTypes, renderLatest, renderSold, renderVideos);
}

/* =====================================================================
   MOTOTSIKL SAHIFASI (bike.html?id=...)
   ===================================================================== */
function initDetail() {
  const root = $("#bikeDetail"); if (!root) return;
  const id = new URLSearchParams(location.search).get("id");
  const b = BIKES.find(x => x.id === id);

  function render() {
    if (!b) {
      root.innerHTML = `<div class="container detail__nf"><h1 class="section__title">${t("detail.notfound")}</h1>
        <a href="category.html" class="btn btn--red">${t("cta.catalog")}</a></div>`;
      return;
    }
    document.title = `${bikeName(b)} ${b.year} — ${price(b.price)} | TIGER Automotocentre`;

    const photos = b.photos && b.photos.length ? b.photos : [null];
    const specs = [
      ["spec.year", b.year], ["spec.km", `${num(b.mileage)} km`], ["spec.cc", `${num(b.cc)} cc`],
      ["spec.hp", `${b.hp} ${lang === "ru" ? "л.с." : "o.k."}`], ["spec.origin", t("origin." + b.origin)],
      ["spec.docs", b.docsClean ? `✓ ${t("docs.clean")}` : t("docs.check")],
      ["spec.type", esc(loc((TYPES.find(x => x.id === b.type) || {}).title) || b.type)], ["spec.status", badge(b.status)]
    ];
    const similar = BIKES
      .filter(x => x.id !== b.id && (x.type === b.type || x.brand === b.brand))
      .sort((x, y) => (x.status === "sold") - (y.status === "sold") || Math.abs(x.price - b.price) - Math.abs(y.price - b.price))
      .slice(0, 3);

    root.innerHTML = `
      <div class="container">
        <a href="${typeUrl(b.type)}" class="detail__back">${t("detail.back")}</a>
        <div class="detail__grid">
          <div class="gallery">
            <div class="gallery__main" id="galMain">${bikeMedia(b, 0)}${badge(b.status)}</div>
            ${photos.length > 1 ? `<div class="gallery__thumbs">${photos.map((_, i) =>
              `<button class="gallery__thumb ${i ? "" : "active"}" data-i="${i}">${bikeMedia(b, i)}</button>`).join("")}</div>` : ""}
            ${b.video ? `<div class="gallery__video"><h3>${t("detail.video")}</h3>
              <div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${esc(b.video)}" loading="lazy" allowfullscreen title="YouTube"></iframe></div></div>` : ""}
          </div>

          <div class="detail__info">
            <p class="detail__brand">${esc(b.brand)} · ${t("origin." + b.origin)}</p>
            <h1 class="detail__title">${esc(b.model)} <span>${b.year}</span></h1>
            <p class="detail__price">${price(b.price)}</p>
            <p class="detail__desc">${esc(loc(b.desc))}</p>
            <div class="detail__actions">
              <a class="btn btn--red btn--block" href="${tgLink(`${t("tg.ask")} ${bikeName(b)} ${b.year}, ${price(b.price)}`)}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-tg"/></svg>${t("btn.askTg")}</a>
              <a class="btn btn--outline btn--block" href="tel:${SITE.phoneHref}"><svg class="ico"><use href="#i-phone"/></svg>${t("btn.call")}</a>
              <a class="btn btn--blue btn--block" href="${tgLink(`${t("tg.test")} ${bikeName(b)} ${b.year}`)}" target="_blank" rel="noopener"><svg class="ico"><use href="#i-cal"/></svg>${t("btn.testdrive")}</a>
            </div>
            <h2 class="detail__h">${t("detail.specs")}</h2>
            <table class="specs">${specs.map(([k, v]) => `<tr><th>${t(k)}</th><td>${v}</td></tr>`).join("")}</table>
          </div>
        </div>

        ${similar.length ? `<section class="detail__similar">
          <h2 class="section__title">${t("detail.similar")}</h2>
          <div class="mgrid">${similar.map(card).join("")}</div>
        </section>` : ""}
      </div>`;

    $$(".gallery__thumb", root).forEach(th => th.addEventListener("click", () => {
      $$(".gallery__thumb", root).forEach(x => x.classList.toggle("active", x === th));
      $("#galMain").innerHTML = bikeMedia(b, +th.dataset.i) + badge(b.status);
    }));
    observeReveal(root);
  }
  renderers.push(render);
}

/* =====================================================================
   TUR SAHIFASI (category.html?type=sport)
   ===================================================================== */
function initCategory() {
  if (!$("#category")) return;
  let current = new URLSearchParams(location.search).get("type") || "";
  if (current && !TYPES.some(x => x.id === current)) current = "";

  function render() {
    const tp = TYPES.find(x => x.id === current);
    const title = tp ? loc(tp.title) : t("cat.all");
    document.title = `${title} — TIGER Automotocentre`;
    $("#catTitle").textContent = title;
    $("#catDesc").textContent = tp ? loc(tp.desc) : t("cat.allDesc");
    $("#catBanner").style.setProperty("--c", tp ? tp.color : "#E10600");
    $("#catArt").innerHTML = tp && tp.banner
      ? `<img src="${esc(tp.banner)}" alt="">`
      : bikeArt(tp ? tp.color : "#E10600");

    $("#catTabs").innerHTML = [{ id: "", title: { uz: t("f.all"), ru: t("f.all") } }, ...TYPES]
      .map(x => `<a href="${typeUrl(x.id)}" data-type="${x.id}" class="tab ${x.id === current ? "active" : ""}">${esc(loc(x.title))}</a>`)
      .join("");

    const list = BIKES.filter(x => !current || x.type === current).sort(byStatus);
    $("#catGrid").innerHTML = list.length ? list.map(card).join("") : `<p class="empty">${t("f.empty")}</p>`;
    observeReveal($("#catGrid"));
  }

  // Tab bosilganda sahifa qayta yuklanmaydi
  $("#catTabs").addEventListener("click", e => {
    const tab = e.target.closest(".tab"); if (!tab) return;
    e.preventDefault();
    current = tab.dataset.type;
    history.replaceState(null, "", typeUrl(current));
    render();
  });
  renderers.push(render);
}

/* =====================================================================
   SAYT YARATUVCHISI SAHIFASI (developer.html)
   ===================================================================== */
function initDevPage() {
  if (!$("#devPage")) return;
  const d = SITE.developer || {};
  const digits = String(d.phone || "").replace(/\D/g, "");
  renderers.push(() => {
    $$(".js-dev-tg").forEach(a => {
      a.hidden = !d.telegram;
      a.href = `https://t.me/${d.telegram}?text=${encodeURIComponent(t("dev.msg"))}`;
    });
    $$(".js-dev-tg-text").forEach(el => el.textContent = "@" + d.telegram);
    $$(".js-dev-url").forEach(a => { a.hidden = !d.url; a.href = d.url || "#"; });
    $$(".js-dev-url-text").forEach(el => el.textContent = String(d.url || "").replace(/^https?:\/\//, "").replace(/\/$/, "") + " ↗");
    $$(".js-dev-phone").forEach(a => { a.hidden = !digits; a.href = `tel:+${digits}`; });
    $$(".js-dev-phone-text").forEach(el => el.textContent = d.phone || "");
  });
}

/* ---------- Ishga tushirish ---------- */
initShell();
initHome();
initDetail();
initCategory();
initDevPage();
applyLang();
observeReveal();
