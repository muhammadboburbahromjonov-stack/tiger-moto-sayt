/* POST /api/logout — sessiyani tugatadi */
const { send, setSession } = require("./_lib");

module.exports = (req, res) => {
  setSession(res, "", 0);
  send(res, 200, { ok: true });
};
