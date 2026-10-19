/* POST /api/save { data, files: [{path, blob}], baseSha }
   data.js va yangi rasmlarni GitHub'ga BITTA commit qilib yozadi.
   Cloudflare Pages commit'ni ko'rib, saytni avtomatik qayta joylaydi. */
import { json, fail, guard, gh, branch, buildData, validate, HttpError, DATA_PATH } from "../../cf/lib.js";

const PATH_RE = /^img\/(bikes|types|sold|site)\/[a-z0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm)$/;

export async function onRequestPost({ request, env }) {
  try {
    await guard(request, env);
    let payload;
    try { payload = await request.json(); } catch (e) { throw new HttpError(400, "Noto'g'ri so'rov"); }
    const { data, files = [], baseSha } = payload;
    validate(data);
    if (!Array.isArray(files)) throw new HttpError(400, "Noto'g'ri fayl");
    for (const f of files) {
      if (!f || !PATH_RE.test(f.path) || !/^[0-9a-f]{40}$/.test(f.blob)) throw new HttpError(400, "Noto'g'ri fayl");
    }

    const ref = await gh(env, `/git/ref/heads/${branch(env)}`);
    const head = await gh(env, `/git/commits/${ref.object.sha}`);

    // Boshqa joyda (masalan kompyuterdagi admin orqali) o'zgartirilgan bo'lsa — ustidan yozmaymiz
    if (baseSha) {
      const cur = await gh(env, `/contents/${DATA_PATH}?ref=${ref.object.sha}`);
      if (cur.sha !== baseSha) throw new HttpError(409, "Ma'lumotlar boshqa joyda o'zgartirilgan. Sahifani yangilab, qaytadan kiriting.");
    }

    const dataBlob = await gh(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: buildData(data), encoding: "utf-8" }) });
    const tree = await gh(env, "/git/trees", {
      method: "POST",
      body: JSON.stringify({
        base_tree: head.tree.sha,
        tree: [
          { path: DATA_PATH, mode: "100644", type: "blob", sha: dataBlob.sha },
          ...files.map(f => ({ path: f.path, mode: "100644", type: "blob", sha: f.blob })),
        ],
      }),
    });
    const commit = await gh(env, "/git/commits", {
      method: "POST",
      body: JSON.stringify({ message: `Admin panel: ma'lumotlar yangilandi${files.length ? ` (+${files.length} rasm)` : ""}`, tree: tree.sha, parents: [ref.object.sha] }),
    });
    await gh(env, `/git/refs/heads/${branch(env)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });

    return json(200, { ok: true, commit: commit.sha, dataSha: dataBlob.sha });
  } catch (e) {
    return fail(e);
  }
}
