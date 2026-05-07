document.addEventListener("DOMContentLoaded", () => {

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf5eIAAnwDrStavfvjSVztA-J4eM7guKdLGz60a5nUJBPDsg24mWLUtFpoTkkmD27jcTtWsC9KsrkT/pub?gid=0&single=true&output=csv";
let data = [];

let batteryEnabled = false;
let lcdEnabled = false;

async function loadData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();

  const rows = text.split(/\r?\n/);
  let separator = rows[0].includes(";") ? ";" : ",";
  const headers = rows[0].split(separator);

  data = [];

  rows.slice(1).forEach(row => {
    if (!row.trim()) return;
    const cols = row.split(separator);
    const model = cols[0];

    // Kup do jest ostatnią kolumną
    const kupDoCol = cols[5];
    const batteryCol = cols[7];
    const lcdCol = cols[8];
    let batteryCost = batteryCol && batteryCol !== "—"
      ? parseInt(batteryCol)
      : 0;

    let lcdCost = lcdCol && lcdCol !== "—"
        ? parseInt(lcdCol)
        : 0;

    let kupDo = kupDoCol ? kupDoCol.replace("zł", "").replace(/\s/g, "").replace(/\u00A0/g, "") : null;
    kupDo = kupDo ? parseInt(kupDo) : null;

    for (let i = 1; i <= 4; i++) { // ostatnia kolumna to Kup do
      let price = cols[i];
      if (!price || price === "—") continue;

      price = price.replace("zł", "").replace(/\s/g, "").replace(/\u00A0/g, "");

      data.push({
        model: model,
        memory: headers[i],
        price: parseInt(price),
        kupDo: kupDo,
        batteryCost: batteryCost,
        lcdCost: lcdCost
      });
    }
  });

  initFilters();
}

// reszta funkcji initFilters i updateMemory bez zmian

function initFilters() {
  const models = [...new Set(data.map(d => d.model))];
  const modelSelect = document.getElementById("model");
  modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join("");
  updateMemory();
}

function updateMemory() {
  const model = document.getElementById("model").value;
  const memorySelect = document.getElementById("memory");

  const memories = data.filter(d => d.model === model).map(d => d.memory);
  const uniqueMemories = [...new Set(memories)];

  memorySelect.innerHTML = uniqueMemories
    .map(m => `<option value="${m}">${m}</option>`)
    .join("");

  if(uniqueMemories.length > 0){
    memorySelect.value = uniqueMemories[0];
  }
}

document.getElementById("model").addEventListener("change", updateMemory);

// Funkcja obliczania wyników
function filterData() {
  const model = document.getElementById("model").value;
  const memory = document.getElementById("memory").value;
  const div = document.getElementById("results");

  const result = data.find(d => d.model === model && d.memory === memory);

  if (result) {
    let kupDo = result.kupDo || 0;

    if (batteryEnabled) {
        kupDo -= result.batteryCost || 0;
    }

    if (lcdEnabled) {
        kupDo -= result.lcdCost || 0;
    }

    const rynek = result.price;
    
    let repairCost = 0;

    if (batteryEnabled) {
        repairCost += result.batteryCost || 0;
    }

    if (lcdEnabled) {
        repairCost += result.lcdCost || 0;
    }

    const potencjal = rynek - kupDo - repairCost;

    div.innerHTML = `
        <div class="kupDo">💰 Kup do: ${kupDo} zł</div>
        <div class="rynek">📈 Rynek: ${rynek} zł</div>
        <div class="potencjal">🔥 Potencjał: ~${potencjal} zł</div>
    `;
  } else {
    div.innerHTML = `<div class="no-data">❌ Brak danych</div>`;
  }
}

document.getElementById("checkBtn").addEventListener("click", filterData);
document.getElementById("batteryBtn").addEventListener("click", () => {
    batteryEnabled = !batteryEnabled;

    document
        .getElementById("batteryBtn")
        .classList.toggle("active");

    filterData();
});

document.getElementById("lcdBtn").addEventListener("click", () => {
    lcdEnabled = !lcdEnabled;

    document
        .getElementById("lcdBtn")
        .classList.toggle("active");

    filterData();
});

loadData();

});
