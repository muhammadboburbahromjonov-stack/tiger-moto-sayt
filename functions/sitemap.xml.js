/* GET /sitemap.xml → Google uchun sahifalar ro'yxati.
   data.js dan o'qiladi, shuning uchun admin paneldan qo'shilgan mototsikllar o'zi qo'shiladi. */
import { parseData } from "../cf/lib.js";

const BASE = "https://www.tigerautomotocentre.uz";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

export async function onRequestGet({ request, env }) {
  const urls = [
    { loc: `${BASE}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE}/category.html`, priority: "0.9", changefreq: "daily" },
  ];
  try {
    // Statik fayl shu saytning o'zidan o'qiladi
    const r = await env.ASSETS.fetch(new URL("/js/data.js", request.url));
    const data = parseData(await r.text());
    for (const tp of data.TYPES) urls.push({ loc: `${BASE}/category.html?type=${encodeURIComponent(tp.id)}`, priority: "0.8", changefreq: "weekly" });
    for (const b of data.BIKES) urls.push({ loc: `${BASE}/bike.html?id=${encodeURIComponent(b.id)}`, priority: b.status === "sold" ? "0.4" : "0.7", changefreq: "weekly" });
  } catch (e) { /* ma'lumot o'qilmasa ham asosiy sahifalar beriladi */ }
  urls.push({ loc: `${BASE}/developer.html`, priority: "0.3", changefreq: "monthly" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
