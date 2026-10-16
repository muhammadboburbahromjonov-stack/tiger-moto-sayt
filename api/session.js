/* GET /api/session — foydalanuvchi kirganmi */
const { send, configured, isAuthed } = require("./_lib");

module.exports = (req, res) => {
  if (!configured()) return send(res, 503, { error: "Server sozlanmagan: Vercel'da muhit o'zgaruvchilarini kiriting" });
  send(res, isAuthed(req) ? 200 : 401, { ok: isAuthed(req) });
};
