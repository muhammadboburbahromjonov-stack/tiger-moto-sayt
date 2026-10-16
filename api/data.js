/* GET /api/data — GitHub'dagi eng so'nggi ma'lumotlar (sayt hali yangilanmagan bo'lsa ham) */
const { send, guard, gh, branch, parseData, DATA_PATH } = require("./_lib");

module.exports = async (req, res) => {
  if (!guard(req, res)) return;
  try {
    const f = await gh(`/contents/${DATA_PATH}?ref=${branch()}`);
    const data = parseData(Buffer.from(f.content, "base64").toString("utf8"));
    send(res, 200, { data, sha: f.sha });
  } catch (e) {
    send(res, e.status || 500, { error: e.message });
  }
};
