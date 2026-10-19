/* GET /api/ping — admin panel serverga ulanganini tekshiradi */
import { json } from "../../cf/lib.js";

export const onRequestGet = () => json(200, { ok: true, online: true });
