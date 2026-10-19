/* POST /api/login { password } — to'g'ri bo'lsa 7 kunlik sessiya cookie beradi */
import { json, configured, makeToken, safeEqual, sessionCookie, sameOrigin, SESSION_DAYS } from "../../cf/lib.js";

export async function onRequestPost({ request, env }) {
  if (!configured(env)) return json(503, { error: "Server sozlanmagan: Cloudflare'da o'zgaruvchilarni kiriting" });
  if (!sameOrigin(request)) return json(403, { error: "Ruxsat yo'q" });

  let password = "";
  try { password = (await request.json()).password || ""; } catch (e) {}

  if (!password || !(await safeEqual(password, env.ADMIN_PASSWORD))) {
    await new Promise(r => setTimeout(r, 1200)); // parolni tanlab topishni sekinlashtiradi
    return json(401, { error: "Parol noto'g'ri" });
  }
  return json(200, { ok: true }, { "Set-Cookie": sessionCookie(await makeToken(env), SESSION_DAYS * 86400) });
}
