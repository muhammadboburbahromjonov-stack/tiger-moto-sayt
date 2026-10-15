// ===== 1. MA'LUMOTLAR =====
// Har bir mototsikl — bu obyekt. Hammasi bitta massivda.
const motos = [
  { name: "Yamaha R1",         type: "sport",   price: 18000, power: "200 o.k.", speed: "299 km/s", color: "#1e3a8a" },
  { name: "Kawasaki Ninja ZX-10R", type: "sport", price: 17500, power: "203 o.k.", speed: "299 km/s", color: "#15803d" },
  { name: "Ducati Panigale V4", type: "sport",  price: 25000, power: "215 o.k.", speed: "305 km/s", color: "#b91c1c" },
  { name: "Harley-Davidson Fat Boy", type: "cruiser", price: 21000, power: "94 o.k.", speed: "180 km/s", color: "#3f3f46" },
  { name: "Indian Scout",      type: "cruiser", price: 13000, power: "100 o.k.", speed: "190 km/s", color: "#7c2d12" },
  { name: "KTM 690 Enduro R",  type: "enduro",  price: 12000, power: "74 o.k.",  speed: "170 km/s", color: "#ea580c" },
  { name: "Honda CRF450L",     type: "enduro",  price: 10500, power: "45 o.k.",  speed: "150 km/s", color: "#dc2626" },
  { name: "BMW R 1250 GS",     type: "enduro",  price: 19000, power: "136 o.k.", speed: "220 km/s", color: "#0369a1" },
];

// Turlarni o'zbekcha nomlari
const typeNames = { sport: "Sport", cruiser: "Kruizer", enduro: "Enduro" };

// ===== 2. KARTOCHKALARNI CHIZISH =====
const grid = document.getElementById("grid");

function renderCards(filter) {
  // Filtr bo'yicha kerakli motolarni tanlaymiz
  const list = filter === "all" ? motos : motos.filter(m => m.type === filter);

  // Har bir moto uchun HTML yasab, birlashtiramiz
  grid.innerHTML = list.map(m => `
    <div class="card" data-name="${m.name}">
      <div class="card__img" style="background:${m.color}">🏍️</div>
      <div class="card__body">
        <div class="card__type">${typeNames[m.type]}</div>
        <h3 class="card__name">${m.name}</h3>
        <div class="card__price">$${m.price.toLocaleString()}</div>
      </div>
    </div>
  `).join("");
}

renderCards("all"); // sahifa ochilganda hammasini ko'rsatamiz

// ===== 3. FILTR TUGMALARI =====
document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    // Avvalgi faol tugmadan "active" ni olib tashlaymiz
    document.querySelector(".filter.active").classList.remove("active");
    btn.classList.add("active");
    renderCards(btn.dataset.filter);
  });
});

// ===== 4. MODAL OYNA =====
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

// Kartochkalar keyin yaratilgani uchun hodisani grid ga ilamiz (event delegation)
grid.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;

  const m = motos.find(x => x.name === card.dataset.name);
  modalContent.innerHTML = `
    <h2>${m.name}</h2>
    <ul>
      <li><b>Turi:</b> ${typeNames[m.type]}</li>
      <li><b>Quvvati:</b> ${m.power}</li>
      <li><b>Maks. tezlik:</b> ${m.speed}</li>
      <li><b>Narxi:</b> $${m.price.toLocaleString()}</li>
    </ul>
    <a href="#contact" class="btn" id="orderBtn">Buyurtma berish</a>
  `;
  modal.classList.add("open");
});

// Yopish: ✕ tugmasi, fon yoki "Buyurtma berish" bosilganda
modal.addEventListener("click", e => {
  if (e.target === modal || e.target.id === "modalClose" || e.target.id === "orderBtn") {
    modal.classList.remove("open");
  }
});

// ===== 5. TELEFON MENYUSI =====
const nav = document.getElementById("nav");
document.getElementById("burger").addEventListener("click", () => nav.classList.toggle("open"));
nav.addEventListener("click", () => nav.classList.remove("open")); // havola bosilsa yopiladi

// ===== 6. FORMA =====
document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault(); // sahifa qayta yuklanmasligi uchun
  const name = document.getElementById("name").value;
  document.getElementById("result").textContent =
    `Rahmat, ${name}! Tez orada siz bilan bog'lanamiz.`;
  e.target.reset(); // formani tozalaymiz
});
