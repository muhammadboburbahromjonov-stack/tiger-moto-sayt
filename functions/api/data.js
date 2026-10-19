/* GET /api/data — GitHub'dagi eng so'nggi ma'lumotlar (sayt hali yangilanmagan bo'lsa ham) */
import { json, fail, guard, gh, branch, parseData, fromBase64Utf8, DATA_PATH } from "../../cf/lib.js";

export async function onRequestGet({ request, env }) {
  try {
    await guard(request, env);
    const f = await gh(env, `/contents/${DATA_PATH}?ref=${branch(env)}`);
    return json(200, { data: parseData(fromBase64Utf8(f.content)), sha: f.sha });
  } catch (e) {
    return fail(e);
  }
}
