/* =====================================================================
   TIGER Automotocentre — internetdagi admin panel (Cloudflare Pages Functions)
   Umumiy funksiyalar. functions/ papkasidagi har bir fayl shundan foydalanadi.

   Cloudflare → Workers & Pages → loyiha → Settings → Variables and Secrets:
     ADMIN_PASSWORD  — admin panel paroli               (Secret)
     SESSION_SECRET  — uzun tasodifiy satr               (Secret)
     GITHUB_TOKEN    — GitHub fine-grained token          (Secret)
     GITHUB_REPO     — muhammadboburbahromjonov-stack/tiger-moto-sayt
     GITHUB_BRANCH   — main (ixtiyoriy)
   ===================================================================== */

export const KEYS = ["SITE", "BRANDS", "TYPES", "BIKES", "SOLD", "VIDEOS"];
export const DATA_PATH = "js/data.js";
const COOKIE = "tiger_admin";
export const SESSION_DAYS = 7;

const HEADER = `/* =====================================================================
   TIGER Automotocentre — SAYT MA'LUMOTLARI
   ---------------------------------------------------------------------
   Bu fayl admin panel orqali saqlanadi:
     python admin.py  →  http://localhost:8000/admin/
   Qo'lda ham tahrirlash mumkin, faqat JSON formatini buzmang.
   Har saqlashda eski nusxa backups/ papkasiga ko'chiriladi.
   ===================================================================== */
`;

/* ---------- Javoblar ---------- */
export function json(code, obj, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = e => json(e.status || 500, { error: e.message });

export const configured = env => !!(env.ADMIN_PASSWORD && env.SESSION_SECRET && env.GITHUB_TOKEN && env.GITHUB_REPO);

/* ---------- Kriptografiya (Web Crypto) ---------- */
const enc = new TextEncoder();
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = s => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}
/* Vaqtga bog'liq bo'lmagan taqqoslash (parolni taxmin qilishni qiyinlashtiradi) */
export async function safeEqual(a, b) {
  const [x, y] = await Promise.all([String(a), String(b)].map(s => crypto.subtle.digest("SHA-256", enc.encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}

/* ---------- Sessiya ---------- */
export async function makeToken(env) {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 864e5 })));
  return `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
}
function readCookie(request, name) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}
export async function isAuthed(request, env) {
  if (!env.SESSION_SECRET) return false;
  const [payload, sig] = readCookie(request, COOKIE).split(".");
  if (!payload || !sig) return false;
  if (!(await safeEqual(sig, await hmac(env.SESSION_SECRET, payload)))) return false;
  try { return JSON.parse(fromB64url(payload)).exp > Date.now(); } catch (e) { return false; }
}
export const sessionCookie = (token, maxAge) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

/* Boshqa saytlardan yuborilgan so'rovlarni rad etish */
export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch (e) { return false; }
}

/* Kirgan foydalanuvchi + (POST bo'lsa) shu saytdan kelgan so'rov */
export async function guard(request, env) {
  if (!configured(env)) throw new HttpError(503, "Server sozlanmagan: Cloudflare'da o'zgaruvchilarni kiriting");
  if (!(await isAuthed(request, env))) throw new HttpError(401, "Kirish talab qilinadi");
  if (request.method === "POST" && !sameOrigin(request)) throw new HttpError(403, "Ruxsat yo'q");
}

/* ---------- GitHub API ---------- */
export async function gh(env, path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tiger-admin",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(r.status === 409 || r.status === 422 ? 409 : 502, `GitHub: ${j.message || r.status}`);
  return j;
}
export const branch = env => env.GITHUB_BRANCH || "main";

/* Binar ma'lumotni base64 ga (katta fayllar uchun bo'laklab) */
export function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromBase64Utf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

/* ---------- data.js ---------- */
export function parseData(src) {
  src = src.replace(/\r\n/g, "\n");
  const out = {};
  for (const k of KEYS) {
    const marker = `const ${k} = `;
    const start = src.indexOf(marker);
    if (start < 0) throw new Error(`data.js: ${k} topilmadi`);
    const from = start + marker.length;
    const end = src.indexOf(";\n", from);
    out[k] = JSON.parse(src.slice(from, end < 0 ? undefined : end));
  }
  return out;
}
export const buildData = data => [HEADER, ...KEYS.map(k => `const ${k} = ${JSON.stringify(data[k], null, 2)};\n`)].join("\n");

export function validate(data) {
  if (!data || typeof data !== "object") throw new HttpError(400, "Ma'lumotlar to'liq emas");
  for (const k of KEYS) if (!(k in data)) throw new HttpError(400, "Ma'lumotlar to'liq emas");
  if (typeof data.SITE !== "object" || Array.isArray(data.SITE)) throw new HttpError(400, "SITE noto'g'ri");
  for (const k of KEYS.slice(1)) if (!Array.isArray(data[k])) throw new HttpError(400, `${k} ro'yxat bo'lishi kerak`);
  const ids = data.BIKES.map(b => b && b.id);
  if (ids.some(i => !i) || new Set(ids).size !== ids.length) throw new HttpError(400, "Mototsikl ID lari bo'sh yoki takrorlangan");
}
