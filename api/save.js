/* POST /api/save { data, files: [{path, blob}], baseSha }
   data.js va yangi rasmlarni GitHub'ga BITTA commit qilib yozadi.
   Vercel commit'ni ko'rib, saytni avtomatik qayta joylaydi. */
const { send, guard, readBody, gh, branch, buildData, validate, DATA_PATH } = require("./_lib");

const PATH_RE = /^img\/(bikes|types|sold|site)\/[a-z0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm)$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!guard(req, res)) return;
  try {
    let payload;
    try { payload = JSON.parse((await readBody(req, 3 * 1024 * 1024)).toString()); }
    catch (e) { throw Object.assign(new Error("Noto'g'ri so'rov"), { status: 400 }); }
    const { data, files = [], baseSha } = payload;
    try { validate(data); } catch (e) { throw Object.assign(e, { status: 400 }); }
    for (const f of files) {
      if (!f || !PATH_RE.test(f.path) || !/^[0-9a-f]{40}$/.test(f.blob)) throw Object.assign(new Error("Noto'g'ri fayl"), { status: 400 });
    }

    const ref = await gh(`/git/ref/heads/${branch()}`);
    const head = await gh(`/git/commits/${ref.object.sha}`);

    // Boshqa joyda (masalan kompyuterdagi admin orqali) o'zgartirilgan bo'lsa — ustidan yozmaymiz
    if (baseSha) {
      const cur = await gh(`/contents/${DATA_PATH}?ref=${ref.object.sha}`);
      if (cur.sha !== baseSha) throw Object.assign(new Error("Ma'lumotlar boshqa joyda o'zgartirilgan. Sahifani yangilab, qaytadan kiriting."), { status: 409 });
    }

    const dataBlob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: buildData(data), encoding: "utf-8" }) });
    const tree = await gh("/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: [
          { path: DATA_PATH, mode: "100644", type: "blob", sha: dataBlob.sha },
          ...files.map(f => ({ path: f.path, mode: "100644", type: "blob", sha: f.blob })),
        ],
      }),
    });
    const commit = await gh("/git/commits", {
      method: "POST",
      body: JSON.stringify({ message: `Admin panel: ma'lumotlar yangilandi${files.length ? ` (+${files.length} rasm)` : ""}`, tree: tree.sha, parents: [ref.object.sha] }),
    });
    await gh(`/git/refs/heads/${branch()}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });

    send(res, 200, { ok: true, commit: commit.sha, dataSha: dataBlob.sha });
  } catch (e) {
    send(res, e.status || 500, { error: e.message });
  }
};
