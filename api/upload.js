/* POST /api/upload?dir=bikes&name=rasm.webp  (tana — fayl)
   Faylni GitHub'ga "blob" sifatida yuklaydi. Commit "Saqlash" bosilganda
   ma'lumotlar bilan birga bitta qilib yaratiladi. */
const { send, guard, readBody, gh } = require("./_lib");

const DIRS = new Set(["bikes", "types", "sold", "site"]);
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"]);
const LIMIT = 4 * 1024 * 1024; // Vercel cheklovi ~4.5 MB

function safeName(name) {
  const m = String(name || "").match(/^(.*?)(\.[A-Za-z0-9]+)?$/);
  const ext = (m[2] || "").toLowerCase();
  if (!EXT.has(ext)) throw Object.assign(new Error(`Bu turdagi fayl qabul qilinmaydi: ${ext || "?"}`), { status: 400 });
  const base = (m[1] || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
  return `${base}-${Date.now() % 1e8}${ext}`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!guard(req, res)) return;
  try {
    const url = new URL(req.url, "http://x");
    const dir = url.searchParams.get("dir") || "bikes";
    if (!DIRS.has(dir)) throw Object.assign(new Error("Noto'g'ri papka"), { status: 400 });
    const name = safeName(url.searchParams.get("name"));
    const body = await readBody(req, LIMIT);
    if (!body.length) throw Object.assign(new Error("Fayl bo'sh"), { status: 400 });
    if (body.length > LIMIT) throw Object.assign(new Error("Fayl juda katta (4 MB gacha)"), { status: 413 });

    const blob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: body.toString("base64"), encoding: "base64" }) });
    send(res, 200, { path: `img/${dir}/${name}`, blob: blob.sha });
  } catch (e) {
    send(res, e.status || 500, { error: e.message });
  }
};
