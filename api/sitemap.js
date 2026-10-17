/* GET /sitemap.xml → Google uchun sahifalar ro'yxati.
   data.js dan o'qiladi, shuning uchun admin paneldan qo'shilgan mototsikllar o'zi qo'shiladi. */
const { parseData } = require("./_lib");

const BASE = "https://www.tigerautomotocentre.uz";
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

module.exports = async (req, res) => {
  const urls = [
    { loc: `${BASE}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE}/category.html`, priority: "0.9", changefreq: "daily" },
  ];
  try {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const r = await fetch(`https://${host}/js/data.js`, { cache: "no-store" });
    const data = parseData(await r.text());
    for (const tp of data.TYPES) urls.push({ loc: `${BASE}/category.html?type=${encodeURIComponent(tp.id)}`, priority: "0.8", changefreq: "weekly" });
    for (const b of data.BIKES) urls.push({ loc: `${BASE}/bike.html?id=${encodeURIComponent(b.id)}`, priority: b.status === "sold" ? "0.4" : "0.7", changefreq: "weekly" });
  } catch (e) { /* ma'lumot o'qilmasa ham asosiy sahifalar beriladi */ }
  urls.push({ loc: `${BASE}/developer.html`, priority: "0.3", changefreq: "monthly" });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.end(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`);
};
