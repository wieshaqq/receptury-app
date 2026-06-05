/* =========================
   STORAGE KEYS
========================= */
const STORAGE_RECEPTURY = "receptury";
const STORAGE_BAZOWE    = "recepturyBazowe";

/* =========================
   STATE
========================= */
let receptury = {};
let recepturyBazowe = {};
let nowaRecepturaSkladniki = [];

/* =========================
   INIT — ładuje dane lub wgrywa defaults
========================= */
async function init() {
    const zapisaneRobocze = localStorage.getItem(STORAGE_RECEPTURY);
    const zapisaneBazowe  = localStorage.getItem(STORAGE_BAZOWE);

    if (zapisaneRobocze && zapisaneBazowe) {
        receptury       = JSON.parse(zapisaneRobocze);
        recepturyBazowe = JSON.parse(zapisaneBazowe);
    } else {
        try {
            const response = await fetch("defaultRecipes.json");
            const defaults = await response.json();
            receptury       = JSON.parse(JSON.stringify(defaults));
            recepturyBazowe = JSON.parse(JSON.stringify(defaults));
            zapiszDoPamieci();
        } catch (e) {
            console.error("Nie można załadować defaultRecipes.json", e);
            receptury       = {};
            recepturyBazowe = {};
        }
    }

    initSelect();
    pokazEdytor();
    przelicz();
    pokazWidok("kalkulator");

    // Schowaj splash, pokaż app
    const splash = document.getElementById("splash");
    const app    = document.getElementById("app");
    splash.classList.add("hidden");
    app.style.display = "block";
}

/* =========================
   BUTTON LOADING HELPERS
========================= */
function setLoading(btn, loading) {
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = "Ładowanie...";
        btn.classList.add("loading");
    } else {
        btn.textContent = btn.dataset.originalText || btn.textContent;
        btn.classList.remove("loading");
    }
}

/* =========================
   SKELETON LOADER
========================= */
function pokazSkeleton(rows = 5) {
    let html = "";
    for (let i = 0; i < rows; i++) {
        const w1 = 60 + Math.floor(Math.random() * 30);
        const w2 = 50 + Math.floor(Math.random() * 30);
        html += `
            <div class="skeleton-row">
                <div class="skeleton" style="width:${w1}%"></div>
                <div class="skeleton" style="width:${w2}%"></div>
                <div class="skeleton" style="width:40%"></div>
            </div>
        `;
    }
    document.getElementById("wynik").innerHTML = `<div style="margin-top:16px">${html}</div>`;
}

/* =========================
   LOCAL STORAGE
========================= */
function zapiszDoPamieci() {
    localStorage.setItem(STORAGE_RECEPTURY, JSON.stringify(receptury));
    localStorage.setItem(STORAGE_BAZOWE,    JSON.stringify(recepturyBazowe));
}

/* =========================
   SELECT
========================= */
function initSelect() {
    const select1 = document.getElementById("produkt");
    const select2 = document.getElementById("produktEdytor");

    const prev1 = select1.value;
    const prev2 = select2.value;

    select1.innerHTML = "";
    select2.innerHTML = "";

    for (let key in receptury) {
        const option = `<option value="${key}">${receptury[key].nazwa}</option>`;
        select1.innerHTML += option;
        select2.innerHTML += option;
    }

    // Zachowaj poprzedni wybór jeśli nadal istnieje
    if (receptury[prev1]) select1.value = prev1;
    if (receptury[prev2]) select2.value = prev2;
}

/* =========================
   PRZELICZANIE
========================= */
function przelicz() {
    const kg     = parseFloat(document.getElementById("iloscKg").value);
    const wybor  = document.getElementById("produkt").value;
    const wynikEl = document.getElementById("wynik");

    if (!wybor || !receptury[wybor]) {
        wynikEl.innerHTML = "";
        return;
    }

    const receptura = receptury[wybor];

    if (!kg || kg <= 0) {
        wynikEl.innerHTML = "<p>Podaj poprawną ilość kg</p>";
        return;
    }

    let sumaBazowa = 0;
    for (let s of receptura.skladniki) sumaBazowa += s.ilosc;

    const mnoznik = kg / sumaBazowa;
    let sumaKoncowa = 0;

    let rows = "";
    for (let s of receptura.skladniki) {
        const nowaIlosc = s.ilosc * mnoznik;
        sumaKoncowa += nowaIlosc;
        rows += `
            <tr>
                <td>${s.nazwa}</td>
                <td>${nowaIlosc.toFixed(3)}&nbsp;kg</td>
                <td>${s.ilosc.toFixed(2)}%</td>
            </tr>
        `;
    }

    wynikEl.innerHTML = `
        <div class="wynik-header">
            <div class="wynik-nazwa">${receptura.nazwa}</div>
        </div>
        <div class="wynik-meta">Baza: <span>${sumaBazowa.toFixed(2)} kg</span> → cel: <span>${kg} kg</span></div>
        <table>
            <thead>
                <tr>
                    <th>Składnik</th>
                    <th>Ilość</th>
                    <th>%</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="wynik-suma">Suma: ${sumaKoncowa.toFixed(3)} kg</div>
    `;

    // Pokaż proces i notatki w kalkulatorze
    const procesWidok = document.getElementById("procesWidok");
    if (procesWidok) {
        const proces  = receptura.proces  || "";
        const notatki = receptura.notatki || [];

        let procesHTML = "";

        if (proces) {
            procesHTML += `
                <div class="kalk-sekcja">
                    <div class="kalk-sekcja-title">Proces wytwarzania</div>
                    <div class="kalk-tekst">${proces.replace(/\n/g, "<br>")}</div>
                </div>
            `;
        }

        if (notatki.length > 0) {
            procesHTML += `
                <div class="kalk-sekcja">
                    <div class="kalk-sekcja-title">Notatki</div>
                    ${notatki.map(n => `<div class="kalk-notatka">• ${n}</div>`).join("")}
                </div>
            `;
        }

        procesWidok.innerHTML = procesHTML;
    }
}

/* =========================
   EDYTOR
========================= */
function pokazEdytor() {
    const wybor = document.getElementById("produktEdytor").value;

    if (!wybor || !receptury[wybor]) {
        document.getElementById("edytor").innerHTML = "";
        document.getElementById("sumaReceptury").innerHTML = "";
        return;
    }

    const receptura = receptury[wybor];
    let html = "";
    let suma = 0;

    for (let i = 0; i < receptura.skladniki.length; i++) {
        const s = receptura.skladniki[i];
        suma += s.ilosc;

        html += `
            <div class="skladnik-row">
                <span>${s.nazwa}</span>
                <input
                    type="number"
                    id="skladnik-${i}"
                    value="${s.ilosc}"
                    step="0.01"
                >
                <button onclick="usunSkladnik(${i})">✕</button>
            </div>
        `;
    }

    document.getElementById("edytor").innerHTML = html;

    const kolor = Math.abs(suma - 100) < 0.01 ? "#4CAF50" : "#e05252";
    document.getElementById("sumaReceptury").innerHTML =
        `<strong style="color:${kolor}">Suma receptury: ${suma.toFixed(2)}</strong>`;

    // Wypełnij pole procesu
    const procesEl = document.getElementById("edytorProces");
    if (procesEl) procesEl.value = receptura.proces || "";

    // Pokaż notatki
    pokazNotatki(wybor);
}

/* =========================
   ZAPIS ZMIAN
========================= */
function zapiszRecepture() {
    const wybor    = document.getElementById("produktEdytor").value;
    const receptura = receptury[wybor];

    for (let i = 0; i < receptura.skladniki.length; i++) {
        const val = parseFloat(document.getElementById(`skladnik-${i}`).value);
        receptura.skladniki[i].ilosc = isNaN(val) ? 0 : val;
    }

    // Zapisz proces
    const procesEl = document.getElementById("edytorProces");
    if (procesEl) receptura.proces = procesEl.value;

    zapiszDoPamieci();
    pokazEdytor();
    przelicz();
}

/* =========================
   NOTATKI
========================= */
function dodajNotatke() {
    const wybor   = document.getElementById("produktEdytor").value;
    const input   = document.getElementById("nowaNotatka");
    const tekst   = input.value.trim();

    if (!tekst) return;

    const receptura = receptury[wybor];
    if (!receptura.notatki) receptura.notatki = [];

    receptura.notatki.push(tekst);
    input.value = "";

    zapiszDoPamieci();
    pokazNotatki(wybor);
}

function usunNotatke(index) {
    const wybor = document.getElementById("produktEdytor").value;
    const receptura = receptury[wybor];

    if (!confirm("Usunąć notatkę?")) return;

    receptura.notatki.splice(index, 1);
    zapiszDoPamieci();
    pokazNotatki(wybor);
}

function pokazNotatki(wybor) {
    const receptura = receptury[wybor];
    const el = document.getElementById("listaNotatek");
    if (!el) return;

    const notatki = receptura.notatki || [];

    if (notatki.length === 0) {
        el.innerHTML = `<p class="notatki-empty">Brak notatek</p>`;
        return;
    }

    el.innerHTML = notatki.map((n, i) => `
        <div class="notatka-row">
            <span>${n}</span>
            <button onclick="usunNotatke(${i})">✕</button>
        </div>
    `).join("");
}

/* =========================
   ZAPISZ JAKO BAZOWĄ
========================= */
function zapiszJakoBazowa() {
    const wybor = document.getElementById("produktEdytor").value;

    // Najpierw zapisz aktualne zmiany
    zapiszRecepture();

    const potwierdzenie = confirm(
        `Zapisać "${receptury[wybor].nazwa}" jako wersję bazową?\nTo nadpisze poprzednią bazę tej receptury.`
    );

    if (!potwierdzenie) return;

    recepturyBazowe[wybor] = JSON.parse(JSON.stringify(receptury[wybor]));
    zapiszDoPamieci();
    alert("Zapisano jako bazową ✓");
}

/* =========================
   PRZYWRÓĆ DO BAZOWEJ
========================= */
function przywrocRecepture() {
    const wybor = document.getElementById("produktEdytor").value;

    if (!recepturyBazowe[wybor]) {
        alert("Ta receptura nie posiada zapisanej wersji bazowej.");
        return;
    }

    const potwierdzenie = confirm(
        `Przywrócić "${receptury[wybor].nazwa}" do wersji bazowej?`
    );

    if (!potwierdzenie) return;

    receptury[wybor] = JSON.parse(JSON.stringify(recepturyBazowe[wybor]));
    zapiszDoPamieci();
    pokazEdytor();
    przelicz();
}

/* =========================
   DODAJ SKŁADNIK — EDYTOR
========================= */
function dodajSkladnikEdytor() {
    const wybor    = document.getElementById("produktEdytor").value;
    const receptura = receptury[wybor];
    const nazwa    = document.getElementById("edytorNowySkladnik").value.trim();
    const ilosc    = parseFloat(document.getElementById("edytorNowaIlosc").value);

    if (!nazwa || !ilosc || ilosc <= 0) {
        alert("Podaj poprawne dane");
        return;
    }

    receptura.skladniki.push({ nazwa, ilosc });

    document.getElementById("edytorNowySkladnik").value = "";
    document.getElementById("edytorNowaIlosc").value    = "";

    pokazEdytor();
    przelicz();
}

/* =========================
   USUŃ SKŁADNIK
========================= */
function usunSkladnik(index) {
    const wybor    = document.getElementById("produktEdytor").value;
    const receptura = receptury[wybor];
    const nazwa    = receptura.skladniki[index].nazwa;

    if (!confirm(`Usunąć składnik "${nazwa}"?`)) return;

    receptura.skladniki.splice(index, 1);
    zapiszDoPamieci();
    pokazEdytor();
    przelicz();
}

/* =========================
   NOWA RECEPTURA
========================= */
function pokazNowaRecepture() {
    let html = "";
    let suma = 0;

    for (let s of nowaRecepturaSkladniki) {
        suma += s.ilosc;
        html += `
            <div class="skladnik-row">
                <span>${s.nazwa}</span>
                <span>${s.ilosc}</span>
            </div>
        `;
    }

    document.getElementById("podgladNowejReceptury").innerHTML = html;
    document.getElementById("sumaNowejReceptury").innerHTML =
        `<strong>Suma: ${suma.toFixed(2)}</strong>`;
}

function dodajSkladnikNowejReceptury() {
    const nazwa = document.getElementById("nowySkladnik").value.trim();
    const ilosc = parseFloat(document.getElementById("nowaIlosc").value);

    if (!nazwa || !ilosc || ilosc <= 0) {
        alert("Podaj poprawne dane");
        return;
    }

    nowaRecepturaSkladniki.push({ nazwa, ilosc });

    document.getElementById("nowySkladnik").value = "";
    document.getElementById("nowaIlosc").value    = "";

    pokazNowaRecepture();
}

function dodajRecepture() {
    const nazwa = document.getElementById("nowaReceptura").value.trim();

    if (!nazwa) {
        alert("Podaj nazwę receptury");
        return;
    }

    if (nowaRecepturaSkladniki.length === 0) {
        alert("Dodaj co najmniej jeden składnik");
        return;
    }

    const key = nazwa.toLowerCase().replaceAll(" ", "_");

    const nowyCProces = document.getElementById("nowyProces");

    receptury[key] = {
        nazwa,
        skladniki: JSON.parse(JSON.stringify(nowaRecepturaSkladniki)),
        proces: nowyCProces ? nowyCProces.value.trim() : "",
        notatki: []
    };

    // Nowa receptura nie ma jeszcze wersji bazowej
    // Użytkownik może ją zapisać jako bazową w edytorze

    zapiszDoPamieci();
    initSelect();

    document.getElementById("produkt").value       = key;
    document.getElementById("produktEdytor").value = key;

    pokazEdytor();
    przelicz();

    document.getElementById("nowaReceptura").value = "";
    if (document.getElementById("nowyProces")) document.getElementById("nowyProces").value = "";
    nowaRecepturaSkladniki = [];
    pokazNowaRecepture();

    pokazWidok("edytor");
}

/* =========================
   USUŃ RECEPTURĘ
========================= */
function usunRecepture() {
    const wybor = document.getElementById("produktEdytor").value;
    const nazwa = receptury[wybor].nazwa;

    if (Object.keys(receptury).length <= 1) {
        alert("Nie można usunąć ostatniej receptury.");
        return;
    }

    if (!confirm(`Usunąć recepturę "${nazwa}"?`)) return;

    delete receptury[wybor];
    if (recepturyBazowe[wybor]) delete recepturyBazowe[wybor];

    zapiszDoPamieci();
    initSelect();
    pokazEdytor();
    przelicz();
}

/* =========================
   ZMIEŃ PRODUKT
========================= */
function zmienProdukt(zrodlo) {
    if (zrodlo === "kalkulator") {
        const val = document.getElementById("produkt").value;
        document.getElementById("produktEdytor").value = val;
    } else {
        const val = document.getElementById("produktEdytor").value;
        document.getElementById("produkt").value = val;
    }

    pokazEdytor();
    przelicz();
}

/* =========================
   NAWIGACJA
========================= */
function pokazWidok(widok) {
    ["kalkulator", "edytor", "nowa", "skan"].forEach(w => {
        document.getElementById(`widok-${w}`).classList.add("hidden");
    });

    document.getElementById(`widok-${widok}`).classList.remove("hidden");

    const buttons = document.querySelectorAll(".menu button");
    buttons.forEach(b => b.classList.remove("active"));

    const index = ["kalkulator", "edytor", "nowa", "skan"].indexOf(widok);
    if (index >= 0) buttons[index].classList.add("active");
}

/* =========================
   START
========================= */
init();