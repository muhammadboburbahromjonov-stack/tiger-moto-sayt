/* GET /api/session — foydalanuvchi kirganmi */
import { json, configured, isAuthed } from "../../cf/lib.js";

export async function onRequestGet({ request, env }) {
  if (!configured(env)) return json(503, { error: "Server sozlanmagan: Cloudflare'da o'zgaruvchilarni kiriting" });
  const ok = await isAuthed(request, env);
  return json(ok ? 200 : 401, { ok });
}
