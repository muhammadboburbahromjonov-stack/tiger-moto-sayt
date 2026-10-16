/* POST /api/login { password } — to'g'ri bo'lsa 7 kunlik sessiya cookie beradi */
const { send, configured, makeToken, safeEqual, setSession, sameOrigin, readBody, SESSION_DAYS } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!configured()) return send(res, 503, { error: "Server sozlanmagan: Vercel'da muhit o'zgaruvchilarini kiriting" });
  if (!sameOrigin(req)) return send(res, 403, { error: "Ruxsat yo'q" });

  let password = "";
  try { password = JSON.parse((await readBody(req, 10_000)).toString()).password || ""; } catch (e) {}

  if (!password || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    await new Promise(r => setTimeout(r, 1200)); // parolni tanlab topishni sekinlashtiradi
    return send(res, 401, { error: "Parol noto'g'ri" });
  }
  setSession(res, makeToken(), SESSION_DAYS * 86400);
  send(res, 200, { ok: true });
};
