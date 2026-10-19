/* POST /api/logout — sessiyani tugatadi */
import { json, sessionCookie } from "../../cf/lib.js";

export const onRequestPost = () => json(200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) });
