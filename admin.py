"""
TIGER Automotocentre — admin panel serveri
------------------------------------------
Ishga tushirish:  python admin.py   (yoki admin.bat ni ikki marta bosing)
Admin panel:      http://localhost:8000/admin/

Server faqat shu kompyuterda ishlaydi (127.0.0.1). U:
  * saytni ko'rsatadi,
  * admin paneldagi o'zgarishlarni js/data.js ga yozadi (eski nusxa backups/ ga),
  * yuklangan rasmlarni img/ papkasiga saqlaydi.
Qo'shimcha kutubxona kerak emas — faqat Python 3.
"""
import json
import os
import re
import shutil
import sys
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(ROOT, "js", "data.js")
BACKUP_DIR = os.path.join(ROOT, "backups")
PORT = 8000
KEEP_BACKUPS = 30

KEYS = ["SITE", "BRANDS", "TYPES", "BIKES", "SOLD", "VIDEOS"]
UPLOAD_DIRS = {"bikes", "types", "sold", "site"}
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"}
MAX_UPLOAD = 200 * 1024 * 1024  # 200 MB (video uchun)
ALLOWED_ORIGINS = {f"http://localhost:{PORT}", f"http://127.0.0.1:{PORT}"}

HEADER = """/* =====================================================================
   TIGER Automotocentre — SAYT MA'LUMOTLARI
   ---------------------------------------------------------------------
   Bu fayl admin panel orqali saqlanadi:
     python admin.py  →  http://localhost:8000/admin/
   Qo'lda ham tahrirlash mumkin, faqat JSON formatini buzmang.
   Har saqlashda eski nusxa backups/ papkasiga ko'chiriladi.
   ===================================================================== */
"""


def write_data(data):
    """data.js ni yangilaydi, avval eski nusxasini saqlab qo'yadi."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    if os.path.exists(DATA_FILE):
        shutil.copy2(DATA_FILE, os.path.join(BACKUP_DIR, time.strftime("data-%Y%m%d-%H%M%S.js")))
        old = sorted(f for f in os.listdir(BACKUP_DIR) if f.startswith("data-"))
        for name in old[:-KEEP_BACKUPS]:
            os.remove(os.path.join(BACKUP_DIR, name))

    parts = [HEADER]
    for key in KEYS:
        parts.append(f"const {key} = {json.dumps(data[key], ensure_ascii=False, indent=2)};\n")
    tmp = DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    os.replace(tmp, DATA_FILE)  # yarim yozilgan fayl qolmasligi uchun


def validate(data):
    if not isinstance(data, dict) or any(k not in data for k in KEYS):
        raise ValueError("Ma'lumotlar to'liq emas")
    if not isinstance(data["SITE"], dict):
        raise ValueError("SITE noto'g'ri")
    for key in ("BRANDS", "TYPES", "BIKES", "SOLD", "VIDEOS"):
        if not isinstance(data[key], list):
            raise ValueError(f"{key} ro'yxat bo'lishi kerak")
    ids = [b.get("id") for b in data["BIKES"]]
    if any(not i for i in ids) or len(ids) != len(set(ids)):
        raise ValueError("Mototsikl ID lari bo'sh yoki takrorlangan")


def safe_name(name):
    base, ext = os.path.splitext(os.path.basename(name))
    ext = ext.lower()
    if ext not in ALLOWED_EXT:
        raise ValueError(f"Bu turdagi fayl qabul qilinmaydi: {ext or '?'}")
    base = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")[:40] or "file"
    return f"{base}-{int(time.time() * 1000) % 100000000}{ext}"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Brauzer eski data.js ni ko'rsatib qo'ymasligi uchun
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if urlparse(self.path).path == "/api/ping":
            return self.send_json(200, {"ok": True})
        # Zaxira nusxalar va server fayli brauzerga berilmaydi
        if self.path.startswith(("/backups", "/admin.py")):
            return self.send_json(404, {"error": "not found"})
        super().do_GET()

    def do_POST(self):
        # Faqat shu kompyuterdagi admin sahifadan kelgan so'rovlar qabul qilinadi
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            return self.send_json(403, {"error": "Ruxsat yo'q"})
        if self.headers.get("Origin") not in ALLOWED_ORIGINS:
            return self.send_json(403, {"error": "Ruxsat yo'q"})

        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_UPLOAD:
            return self.send_json(413, {"error": "Fayl juda katta"})
        body = self.rfile.read(length)
        url = urlparse(self.path)

        try:
            if url.path == "/api/save":
                data = json.loads(body.decode("utf-8"))
                validate(data)
                write_data(data)
                return self.send_json(200, {"ok": True})

            if url.path == "/api/upload":
                q = parse_qs(url.query)
                folder = q.get("dir", ["bikes"])[0]
                if folder not in UPLOAD_DIRS:
                    raise ValueError("Noto'g'ri papka")
                name = safe_name(q.get("name", ["file.jpg"])[0])
                dest = os.path.join(ROOT, "img", folder)
                os.makedirs(dest, exist_ok=True)
                with open(os.path.join(dest, name), "wb") as f:
                    f.write(body)
                return self.send_json(200, {"path": f"img/{folder}/{name}"})
        except (ValueError, json.JSONDecodeError) as e:
            return self.send_json(400, {"error": str(e)})

        self.send_json(404, {"error": "not found"})

    def log_message(self, fmt, *args):
        if self.command == "POST":  # faqat saqlash/yuklashni ko'rsatamiz
            super().log_message(fmt, *args)


def main():
    try:
        server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        print(f"{PORT}-port band. Admin panel allaqachon ochiq bo'lishi mumkin: http://localhost:{PORT}/admin/")
        input("Chiqish uchun Enter bosing...")
        return
    url = f"http://localhost:{PORT}/admin/"
    print("TIGER Automotocentre — admin panel")
    print(f"  Admin:  {url}")
    print(f"  Sayt:   http://localhost:{PORT}/")
    print("To'xtatish uchun shu oynani yoping yoki Ctrl+C bosing.")
    if "--no-browser" not in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
