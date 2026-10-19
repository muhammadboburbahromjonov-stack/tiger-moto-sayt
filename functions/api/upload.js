/* POST /api/upload?dir=bikes&name=rasm.webp  (tana — fayl)
   Faylni GitHub'ga "blob" sifatida yuklaydi. Commit "Saqlash" bosilganda
   ma'lumotlar bilan birga bitta qilib yaratiladi. */
import { json, fail, guard, gh, toBase64, HttpError } from "../../cf/lib.js";

const DIRS = new Set(["bikes", "types", "sold", "site"]);
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"]);
const LIMIT = 20 * 1024 * 1024; // GitHub API uchun xavfsiz chegara

function safeName(name) {
  const m = String(name || "").match(/^(.*?)(\.[A-Za-z0-9]+)?$/);
  const ext = (m[2] || "").toLowerCase();
  if (!EXT.has(ext)) throw new HttpError(400, `Bu turdagi fayl qabul qilinmaydi: ${ext || "?"}`);
  const base = (m[1] || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
  return `${base}-${Date.now() % 1e8}${ext}`;
}

export async function onRequestPost({ request, env }) {
  try {
    await guard(request, env);
    const url = new URL(request.url);
    const dir = url.searchParams.get("dir") || "bikes";
    if (!DIRS.has(dir)) throw new HttpError(400, "Noto'g'ri papka");
    const name = safeName(url.searchParams.get("name"));
    const len = Number(request.headers.get("Content-Length") || 0);
    if (len > LIMIT) throw new HttpError(413, "Fayl juda katta (20 MB gacha)");
    const body = await request.arrayBuffer();
    if (!body.byteLength) throw new HttpError(400, "Fayl bo'sh");
    if (body.byteLength > LIMIT) throw new HttpError(413, "Fayl juda katta (20 MB gacha)");

    const blob = await gh(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: toBase64(body), encoding: "base64" }) });
    return json(200, { path: `img/${dir}/${name}`, blob: blob.sha });
  } catch (e) {
    return fail(e);
  }
}
