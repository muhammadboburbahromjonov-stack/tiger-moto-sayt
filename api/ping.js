/* GET /api/ping — admin panel serverga ulanganini tekshiradi */
const { send } = require("./_lib");

module.exports = (req, res) => send(res, 200, { ok: true, online: true });
