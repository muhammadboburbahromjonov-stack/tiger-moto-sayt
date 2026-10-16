/* =====================================================================
   TIGER Automotocentre — SAYT MA'LUMOTLARI
   ---------------------------------------------------------------------
   Bu fayl admin panel orqali saqlanadi:
     python admin.py  →  http://localhost:8000/admin/
   Qo'lda ham tahrirlash mumkin, faqat JSON formatini buzmang.
   Har saqlashda eski nusxa backups/ papkasiga ko'chiriladi.
   ===================================================================== */

const SITE = {
  "name": "TIGER Automotocentre",
  "phone": "+998 90 000 00 00",
  "phoneHref": "+998900000000",
  "telegram": "tiger_automotocentre",
  "instagram": "tiger_automotocentre",
  "youtube": "https://youtube.com/",
  "address": {
    "uz": "Toshkent sh., manzil kiritilsin",
    "ru": "г. Ташкент, укажите адрес"
  },
  "mapQuery": "Tashkent",
  "hours": "12:00 – 21:00",
  "stats": {
    "followers": 31500,
    "sold": 200,
    "years": 5
  },
  "heroVideo": "",
  "ownerPhoto": "img/site/about.webp",
  "developer": {
    "name": "TargetBot.uz",
    "telegram": "pila2837",
    "phone": "",
    "url": "https://targetbot.uz"
  },
  "heroImage": "img/site/hero.webp",
  "catalogBanner": "img/site/type-all.webp",
  "gallery": [
    "img/site/gal-01",
    "img/site/gal-02",
    "img/site/gal-03",
    "img/site/gal-04",
    "img/site/gal-05",
    "img/site/gal-06",
    "img/site/gal-07",
    "img/site/gal-08",
    "img/site/gal-09",
    "img/site/gal-10",
    "img/site/gal-11"
  ]
};

const BRANDS = [
  "Harley-Davidson",
  "Ducati",
  "BMW",
  "Honda",
  "Yamaha",
  "Kawasaki",
  "CFMoto",
  "Benda",
  "Cyclone"
];

const TYPES = [
  {
    "id": "sport",
    "color": "#E10600",
    "banner": "img/site/type-sport.webp",
    "title": {
      "uz": "Sport",
      "ru": "Спорт"
    },
    "desc": {
      "uz": "Sport mototsikllar — tezlik va adrenalin ixlosmandlari uchun. Aerodinamik korpus, kuchli dvigatel va aniq boshqaruv.",
      "ru": "Спортбайки — для любителей скорости и адреналина. Аэродинамичный корпус, мощный двигатель и точная управляемость."
    },
    "tile": "img/site/tile-sport.webp"
  },
  {
    "id": "naked",
    "color": "#1E5BFF",
    "banner": "img/site/type-naked.webp",
    "title": {
      "uz": "Naked",
      "ru": "Нейкед"
    },
    "desc": {
      "uz": "Naked — shahar uchun ideal: qulay o‘tirish, yengil boshqaruv va har kuni haydash uchun yetarli quvvat.",
      "ru": "Нейкеды — идеальны для города: удобная посадка, лёгкое управление и мощность для ежедневной езды."
    },
    "tile": ""
  },
  {
    "id": "cruiser",
    "color": "#8a8a8a",
    "banner": "img/site/type-cruiser.webp",
    "title": {
      "uz": "Kruizer",
      "ru": "Круизер"
    },
    "desc": {
      "uz": "Kruizerlar — shoshilmasdan, uslub bilan sayr qilish uchun. Past o‘rindiq, katta moment va klassik ko‘rinish.",
      "ru": "Круизеры — для неспешных поездок со стилем. Низкая посадка, большой крутящий момент и классический вид."
    },
    "tile": "img/site/tile-cruiser.webp"
  },
  {
    "id": "touring",
    "color": "#0d3b8c",
    "banner": "img/site/type-touring.webp",
    "title": {
      "uz": "Turing",
      "ru": "Туринг"
    },
    "desc": {
      "uz": "Turing mototsikllar — uzoq safarlar uchun. Qulaylik, kofrlar va har qanday yo‘lga tayyor.",
      "ru": "Туристические мотоциклы — для дальних поездок. Комфорт, кофры и готовность к любой дороге."
    },
    "tile": ""
  }
];

const BIKES = [
  {
    "id": "yamaha-r1-2019",
    "brand": "Yamaha",
    "model": "YZF-R1",
    "year": 2019,
    "cc": 998,
    "hp": 200,
    "mileage": 12400,
    "price": 14500,
    "type": "sport",
    "status": "sale",
    "origin": "JP",
    "docsClean": true,
    "color": "#1E5BFF",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Ideal holatda, barcha servis ishlari bajarilgan. Original plastiklar.",
      "ru": "Идеальное состояние, всё обслуживание выполнено. Оригинальный пластик."
    }
  },
  {
    "id": "ducati-panigale-v2-2020",
    "brand": "Ducati",
    "model": "Panigale V2",
    "year": 2020,
    "cc": 955,
    "hp": 155,
    "mileage": 8900,
    "price": 16900,
    "type": "sport",
    "status": "sale",
    "origin": "AE",
    "docsClean": true,
    "color": "#E10600",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "BAAdan keltirilgan, garaj saqlovida bo‘lgan.",
      "ru": "Привезён из ОАЭ, гаражное хранение."
    }
  },
  {
    "id": "harley-fatboy-2018",
    "brand": "Harley-Davidson",
    "model": "Fat Boy 114",
    "year": 2018,
    "cc": 1868,
    "hp": 94,
    "mileage": 15200,
    "price": 18500,
    "type": "cruiser",
    "status": "reserved",
    "origin": "KR",
    "docsClean": true,
    "color": "#3a3a3a",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Klassik kruizer, Screamin' Eagle chiqindi tizimi.",
      "ru": "Классический круизер, выхлоп Screamin' Eagle."
    }
  },
  {
    "id": "bmw-r1250gs-2021",
    "brand": "BMW",
    "model": "R 1250 GS",
    "year": 2021,
    "cc": 1254,
    "hp": 136,
    "mileage": 21000,
    "price": 19900,
    "type": "touring",
    "status": "sale",
    "origin": "KR",
    "docsClean": true,
    "color": "#0d3b8c",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Kofrlar to‘plami, isitiladigan tutqichlar.",
      "ru": "Комплект кофров, подогрев ручек."
    }
  },
  {
    "id": "honda-cb650r-2020",
    "brand": "Honda",
    "model": "CB650R",
    "year": 2020,
    "cc": 649,
    "hp": 94,
    "mileage": 9800,
    "price": 7500,
    "type": "naked",
    "status": "sale",
    "origin": "JP",
    "docsClean": true,
    "color": "#b30000",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Neo Sports Café uslubi, shahar uchun ideal.",
      "ru": "Стиль Neo Sports Café, идеален для города."
    }
  },
  {
    "id": "kawasaki-z900-2019",
    "brand": "Kawasaki",
    "model": "Z900",
    "year": 2019,
    "cc": 948,
    "hp": 125,
    "mileage": 14300,
    "price": 8900,
    "type": "naked",
    "status": "sold",
    "origin": "JP",
    "docsClean": true,
    "color": "#2f9e2f",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Kuchli va ishonchli naked.",
      "ru": "Мощный и надёжный нейкед."
    }
  },
  {
    "id": "cfmoto-800nk-2023",
    "brand": "CFMoto",
    "model": "800NK",
    "year": 2023,
    "cc": 799,
    "hp": 95,
    "mileage": 2100,
    "price": 8200,
    "type": "naked",
    "status": "sale",
    "origin": "KR",
    "docsClean": true,
    "color": "#1E5BFF",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Deyarli yangi, kafolat qoldig‘i bilan.",
      "ru": "Почти новый, с остатком гарантии."
    }
  },
  {
    "id": "benda-napoleonbob-2023",
    "brand": "Benda",
    "model": "Napoleon Bob 500",
    "year": 2023,
    "cc": 500,
    "hp": 47,
    "mileage": 1500,
    "price": 5900,
    "type": "cruiser",
    "status": "sale",
    "origin": "KR",
    "docsClean": true,
    "color": "#5a5a5a",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Zamonaviy bobber, yangidek holatda.",
      "ru": "Современный боббер, как новый."
    }
  },
  {
    "id": "cyclone-rx401-2022",
    "brand": "Cyclone",
    "model": "RX401",
    "year": 2022,
    "cc": 400,
    "hp": 38,
    "mileage": 6200,
    "price": 4800,
    "type": "touring",
    "status": "sale",
    "origin": "KR",
    "docsClean": true,
    "color": "#E10600",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Boshlang‘ich turist uchun zo‘r tanlov.",
      "ru": "Отличный выбор для начинающего туриста."
    }
  },
  {
    "id": "yamaha-mt09-2021",
    "brand": "Yamaha",
    "model": "MT-09",
    "year": 2021,
    "cc": 890,
    "hp": 119,
    "mileage": 7600,
    "price": 9900,
    "type": "naked",
    "status": "reserved",
    "origin": "JP",
    "docsClean": true,
    "color": "#2a2a5a",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Quickshifter, uch xil haydash rejimi.",
      "ru": "Квикшифтер, три режима езды."
    }
  },
  {
    "id": "ducati-diavel-2017",
    "brand": "Ducati",
    "model": "Diavel Carbon",
    "year": 2017,
    "cc": 1198,
    "hp": 162,
    "mileage": 19800,
    "price": 15500,
    "type": "cruiser",
    "status": "sale",
    "origin": "AE",
    "docsClean": true,
    "color": "#151515",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Karbon elementlar, Termignoni.",
      "ru": "Карбоновые элементы, Termignoni."
    }
  },
  {
    "id": "kawasaki-zx6r-2020",
    "brand": "Kawasaki",
    "model": "Ninja ZX-6R",
    "year": 2020,
    "cc": 636,
    "hp": 130,
    "mileage": 11000,
    "price": 10500,
    "type": "sport",
    "status": "sold",
    "origin": "JP",
    "docsClean": true,
    "color": "#2f9e2f",
    "photos": [],
    "video": "",
    "desc": {
      "uz": "Trekka tayyor sport mototsikl.",
      "ru": "Готовый к треку спортбайк."
    }
  }
];

const SOLD = [];

const VIDEOS = [
  {
    "youtube": "",
    "title": {
      "uz": "Test-drayv: Ducati Panigale",
      "ru": "Тест-драйв: Ducati Panigale"
    }
  },
  {
    "youtube": "",
    "title": {
      "uz": "Koreyadan yangi partiya",
      "ru": "Новая партия из Кореи"
    }
  },
  {
    "youtube": "",
    "title": {
      "uz": "Mijozga topshirish",
      "ru": "Выдача клиенту"
    }
  }
];
