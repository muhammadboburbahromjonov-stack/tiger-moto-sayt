/* =====================================================================
   TIGER Automotocentre — internetdagi admin panel uchun umumiy funksiyalar
   (Vercel Functions). "_" bilan boshlangan fayl alohida manzil bo'lmaydi.

   Vercel → Settings → Environment Variables:
     ADMIN_PASSWORD  — admin panel paroli
     SESSION_SECRET  — uzun tasodifiy satr (sessiyani imzolash uchun)
     GITHUB_TOKEN    — GitHub fine-grained token (faqat shu repo, Contents: Read and write)
     GITHUB_REPO     — masalan: muhammadboburbahromjonov-stack/tiger-moto-sayt
     GITHUB_BRANCH   — main (ixtiyoriy)
   ===================================================================== */
const crypto = require("crypto");

const KEYS = ["SITE", "BRANDS", "TYPES", "BIKES", "SOLD", "VIDEOS"];
const DATA_PATH = "js/data.js";
const COOKIE = "tiger_admin";
const SESSION_DAYS = 7;

const HEADER = `/* =====================================================================
   TIGER Automotocentre — SAYT MA'LUMOTLARI
   ---------------------------------------------------------------------
   Bu fayl admin panel orqali saqlanadi:
     python admin.py  →  http://localhost:8000/admin/
   Qo'lda ham tahrirlash mumkin, faqat JSON formatini buzmang.
   Har saqlashda eski nusxa backups/ papkasiga ko'chiriladi.
   ===================================================================== */
`;

/* ---------- Javob yordamchilari ---------- */
function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

function configured() {
  return !!(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

/* ---------- Sessiya: imzolangan cookie ---------- */
function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 864e5 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
function readCookie(req, name) {
  const m = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}
function isAuthed(req) {
  if (!process.env.SESSION_SECRET) return false;
  const [payload, sig] = readCookie(req, COOKIE).split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); }
  catch (e) { return false; }
}
function setSession(res, token, maxAge) {
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}

/* Boshqa saytlardan yuborilgan so'rovlarni rad etish */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  try { return new URL(origin).host === host; } catch (e) { return false; }
}

/* POST + kirgan foydalanuvchi + shu saytdan kelgan so'rov */
function guard(req, res) {
  if (req.method !== "POST" && req.method !== "GET") { send(res, 405, { error: "Method not allowed" }); return false; }
  if (!configured()) { send(res, 503, { error: "Server sozlanmagan: Vercel'da muhit o'zgaruvchilarini kiriting" }); return false; }
  if (!isAuthed(req)) { send(res, 401, { error: "Kirish talab qilinadi" }); return false; }
  if (req.method === "POST" && !sameOrigin(req)) { send(res, 403, { error: "Ruxsat yo'q" }); return false; }
  return true;
}

/* ---------- So'rov tanasini o'qish ---------- */
async function readBody(req, limit) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body && typeof req.body === "object") return Buffer.from(JSON.stringify(req.body));
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error("Fayl juda katta (4 MB gacha)"), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

/* ---------- GitHub API ---------- */
async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tiger-admin",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`GitHub: ${j.message || r.status}`), { status: r.status === 409 || r.status === 422 ? 409 : 502 });
  return j;
}
const branch = () => process.env.GITHUB_BRANCH || "main";

/* ---------- data.js: o'qish va yozish ---------- */
function parseData(src) {
  src = src.replace(/\r\n/g, "\n"); // Windows qator oxirlari
  const out = {};
  for (const k of KEYS) {
    const start = src.indexOf(`const ${k} = `);
    if (start < 0) throw new Error(`data.js: ${k} topilmadi`);
    const from = start + `const ${k} = `.length;
    const end = src.indexOf(";\n", from);
    out[k] = JSON.parse(src.slice(from, end < 0 ? undefined : end));
  }
  return out;
}
function buildData(data) {
  return [HEADER, ...KEYS.map(k => `const ${k} = ${JSON.stringify(data[k], null, 2)};\n`)].join("\n");
}
function validate(data) {
  if (!data || typeof data !== "object") throw new Error("Ma'lumotlar to'liq emas");
  for (const k of KEYS) if (!(k in data)) throw new Error("Ma'lumotlar to'liq emas");
  if (typeof data.SITE !== "object" || Array.isArray(data.SITE)) throw new Error("SITE noto'g'ri");
  for (const k of KEYS.slice(1)) if (!Array.isArray(data[k])) throw new Error(`${k} ro'yxat bo'lishi kerak`);
  const ids = data.BIKES.map(b => b && b.id);
  if (ids.some(i => !i) || new Set(ids).size !== ids.length) throw new Error("Mototsikl ID lari bo'sh yoki takrorlangan");
}

module.exports = {
  KEYS, DATA_PATH, send, configured, makeToken, safeEqual, isAuthed, setSession, sameOrigin,
  guard, readBody, gh, branch, parseData, buildData, validate, SESSION_DAYS,
};
