// Proefpagina voor stap 1: drie TomTom-routes met verschillende bochtigheid naast elkaar.
// Alles staat hier in één bestand. De sleutel komt uit sleutel.js (staat niet in git).

import * as maplibregl from "https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs";

const KAARTSTIJL = "https://tiles.openfreemap.org/styles/liberty";
const NEDERLAND = { center: [5.3, 52.1], zoom: 7 }; // alleen als je locatie niet lukt
const MAX_TUSSENPUNTEN = 3;

// De drie bochtigheidsstanden van TomTom (parameter "windingness").
// "offset" schuift de lijn een paar pixels op, zodat je alle drie ziet als ze over dezelfde weg lopen.
const STANDEN = [
  { id: "laag", naam: "Bochtigheid laag", windingness: "low", kleur: "#1d6fe0", offset: -4 },
  { id: "normaal", naam: "Bochtigheid normaal", windingness: "normal", kleur: "#f08c00", offset: 0 },
  { id: "hoog", naam: "Bochtigheid hoog", windingness: "high", kleur: "#c2255c", offset: 4 },
];

const el = {
  berekenknop: document.getElementById("berekenknop"),
  wisknop: document.getElementById("wisknop"),
  melding: document.getElementById("melding"),
  resultaten: document.getElementById("resultaten"),
  overzicht: document.getElementById("puntenoverzicht"),
  voertuig: document.getElementById("voertuig"),
};

// ---------- Sleutel laden ----------

let sleutel = null;
try {
  const bestand = await import("./sleutel.js");
  sleutel = bestand.TOMTOM_KEY;
} catch {
  sleutel = null;
}
const sleutelOk = typeof sleutel === "string" && sleutel.trim() !== "" && !sleutel.includes("PLAK");

// ---------- Kaart ----------

const kaart = new maplibregl.Map({
  container: "kaart",
  style: KAARTSTIJL,
  center: NEDERLAND.center,
  zoom: NEDERLAND.zoom,
});
kaart.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

kaart.on("load", () => {
  for (const stand of STANDEN) {
    const naam = `route-${stand.id}`;
    kaart.addSource(naam, { type: "geojson", data: leegeData() });
    kaart.addLayer({
      id: naam,
      type: "line",
      source: naam,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": stand.kleur, "line-width": 5, "line-offset": stand.offset },
    });
  }
});

function leegeData() {
  return { type: "FeatureCollection", features: [] };
}

// Naar je huidige locatie gaan zodra de browser die doorgeeft.
// De kaart staat eerst op Nederland, en springt naar jou als je toestemming geeft.
const ikzelf = document.createElement("div");
ikzelf.className = "ikzelf";

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (positie) => {
      const plek = [positie.coords.longitude, positie.coords.latitude];
      new maplibregl.Marker({ element: ikzelf }).setLngLat(plek).addTo(kaart);
      if (!punten.start) kaart.flyTo({ center: plek, zoom: 11 });
      toonMelding("Kaart staat op je huidige locatie (blauwe stip). Klik om een start te zetten.");
    },
    () => toonMelding("Je locatie is niet beschikbaar of niet toegestaan. De kaart toont Nederland."),
    { timeout: 10000 }
  );
} else {
  toonMelding("Deze browser kan geen locatie opvragen. De kaart toont Nederland.");
}

// ---------- Punten zetten ----------

const punten = { start: null, tussen: [], eind: null };

function maakPunt(lngLat, kleur) {
  const marker = new maplibregl.Marker({ color: kleur }).setLngLat(lngLat).addTo(kaart);
  return { lngLat, marker };
}

function kiesSoort(soort) {
  document.querySelector(`input[name="soort"][value="${soort}"]`).checked = true;
}

kaart.on("click", (gebeurtenis) => {
  const soort = document.querySelector('input[name="soort"]:checked').value;
  const lngLat = gebeurtenis.lngLat;

  if (soort === "start") {
    punten.start?.marker.remove();
    punten.start = maakPunt(lngLat, "#2b9348");
    kiesSoort("tussen");
  } else if (soort === "eind") {
    punten.eind?.marker.remove();
    punten.eind = maakPunt(lngLat, "#111111");
  } else {
    if (punten.tussen.length >= MAX_TUSSENPUNTEN) {
      return toonMelding(`Maximaal ${MAX_TUSSENPUNTEN} tussenpunten. Druk op "Wis alles" om opnieuw te beginnen.`);
    }
    punten.tussen.push(maakPunt(lngLat, "#6c757d"));
  }

  wisRoutes();
  werkOverzichtBij();
});

function werkOverzichtBij() {
  el.overzicht.textContent =
    `Start: ${punten.start ? "ja" : "nee"} · ` +
    `Tussenpunten: ${punten.tussen.length}/${MAX_TUSSENPUNTEN} · ` +
    `Eindpunt: ${punten.eind ? "ja" : "nee (rondrit)"}`;
}

function wisAlles() {
  punten.start?.marker.remove();
  punten.eind?.marker.remove();
  punten.tussen.forEach((p) => p.marker.remove());
  punten.start = null;
  punten.tussen = [];
  punten.eind = null;
  kiesSoort("start");
  wisRoutes();
  werkOverzichtBij();
  toonMelding("");
}

function wisRoutes() {
  for (const stand of STANDEN) {
    kaart.getSource(`route-${stand.id}`)?.setData(leegeData());
  }
  el.resultaten.replaceChildren();
}

// ---------- Meldingen ----------

function toonMelding(tekst, isFout = false) {
  el.melding.textContent = tekst;
  el.melding.classList.toggle("fout", isFout);
}

// ---------- TomTom aanroepen ----------

async function berekenRoute(stand, locaties, voertuig) {
  const parameters = new URLSearchParams({
    key: sleutel,
    travelMode: voertuig,
    routeType: "thrilling",
    windingness: stand.windingness,
    instructionsType: "text",
    language: "nl-NL",
    report: "effectiveSettings",
  });
  const adres = `https://api.tomtom.com/routing/1/calculateRoute/${locaties}/json?${parameters}`;

  const antwoord = await fetch(adres);
  const tekst = await antwoord.text();
  let data = null;
  try {
    data = JSON.parse(tekst);
  } catch {
    // geen JSON, dan tonen we de ruwe tekst hieronder
  }

  if (!antwoord.ok) {
    const uitleg = data?.detailedError?.message ?? data?.error?.description ?? data?.message ?? tekst.slice(0, 300);
    throw new Error(`HTTP ${antwoord.status}: ${uitleg}`);
  }
  if (!data?.routes?.length) {
    throw new Error("TomTom gaf geen route terug.");
  }
  return data;
}

async function bereken() {
  if (!sleutelOk) {
    return toonMelding(
      'Er is nog geen sleutel. Kopieer proef/sleutel.voorbeeld.js naar proef/sleutel.js en typ daar je TomTom-sleutel in. Ververs daarna de pagina.',
      true
    );
  }
  if (!punten.start) return toonMelding("Zet eerst een startpunt op de kaart.", true);
  if (!punten.tussen.length && !punten.eind) {
    return toonMelding("Zet minstens één tussenpunt of een eindpunt.", true);
  }

  const volgorde = [punten.start, ...punten.tussen, punten.eind ?? punten.start];
  const locaties = volgorde.map((p) => `${p.lngLat.lat.toFixed(5)},${p.lngLat.lng.toFixed(5)}`).join(":");

  const voertuig = el.voertuig.value;

  el.berekenknop.disabled = true;
  toonMelding("Routes berekenen…");
  el.resultaten.replaceChildren();

  const uitkomsten = await Promise.all(
    STANDEN.map((stand) =>
      berekenRoute(stand, locaties, voertuig).then(
        (data) => ({ stand, data }),
        (fout) => ({ stand, fout })
      )
    )
  );

  const grenzen = new maplibregl.LngLatBounds();
  let gelukt = 0;

  for (const uitkomst of uitkomsten) {
    if (uitkomst.fout) {
      el.resultaten.append(maakFoutkaart(uitkomst.stand, uitkomst.fout));
      continue;
    }
    gelukt += 1;
    const route = uitkomst.data.routes[0];
    const coordinaten = route.legs.flatMap((been) => been.points).map((p) => [p.longitude, p.latitude]);
    coordinaten.forEach((c) => grenzen.extend(c));

    kaart.getSource(`route-${uitkomst.stand.id}`).setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coordinaten },
    });
    el.resultaten.append(maakRoutekaart(uitkomst.stand, uitkomst.data, route, voertuig));
  }

  volgorde.forEach((p) => grenzen.extend([p.lngLat.lng, p.lngLat.lat]));
  if (gelukt > 0) kaart.fitBounds(grenzen, { padding: 60 });

  el.berekenknop.disabled = false;
  if (gelukt === STANDEN.length) {
    toonMelding("Klaar: 3 routes berekend.");
  } else {
    toonMelding(`${gelukt} van ${STANDEN.length} routes berekend. Zie de meldingen hieronder.`, true);
  }
}

// ---------- Resultaten tonen ----------

function maak(tag, opties = {}, ...kinderen) {
  const element = document.createElement(tag);
  if (opties.klasse) element.className = opties.klasse;
  if (opties.tekst) element.textContent = opties.tekst;
  element.append(...kinderen);
  return element;
}

function kopVan(stand, kinderen = []) {
  const kleurvlak = maak("span", { klasse: "kleurvlak" });
  kleurvlak.style.background = stand.kleur;
  return maak("div", { klasse: "kop" }, kleurvlak, maak("span", { tekst: stand.naam }), ...kinderen);
}

function maakFoutkaart(stand, fout) {
  return maak("div", { klasse: "route" }, kopVan(stand), maak("p", { tekst: fout.message }));
}

function formatTijd(seconden) {
  const minuten = Math.round(seconden / 60);
  const uren = Math.floor(minuten / 60);
  return uren > 0 ? `${uren} u ${minuten % 60} min` : `${minuten} min`;
}

function maakRoutekaart(stand, data, route, voertuig) {
  // Vinkje om deze route op de kaart aan of uit te zetten.
  const vinkje = maak("input");
  vinkje.type = "checkbox";
  vinkje.checked = true;
  vinkje.title = "Toon of verberg op de kaart";
  vinkje.addEventListener("change", () => {
    kaart.setLayoutProperty(`route-${stand.id}`, "visibility", vinkje.checked ? "visible" : "none");
  });

  const km = (route.summary.lengthInMeters / 1000).toFixed(1);
  const tijd = formatTijd(route.summary.travelTimeInSeconds);
  const voertuigNaam = voertuig === "motorcycle" ? "motor (bèta)" : "auto";
  const kaartje = maak(
    "div",
    { klasse: "route" },
    kopVan(stand, [vinkje]),
    maak("p", { tekst: `${km} km · ${tijd} · ${voertuigNaam}` })
  );

  // Afslaginstructies, om te zien of ze in het Nederlands komen.
  const instructies = route.guidance?.instructions ?? [];
  if (instructies.length) {
    const lijst = maak("ol");
    instructies.forEach((i) => lijst.append(maak("li", { tekst: i.message ?? "(geen tekst)" })));
    kaartje.append(maak("details", {}, maak("summary", { tekst: `Afslaginstructies (${instructies.length})` }), lijst));
  } else {
    kaartje.append(maak("p", { klasse: "klein", tekst: "Geen afslaginstructies in het antwoord." }));
  }

  // Wat TomTom echt heeft gebruikt, om te controleren of "thrilling" en bochtigheid zijn toegepast.
  const instellingen = data.report?.effectiveSettings ?? route.report?.effectiveSettings;
  const tekst = instellingen
    ? instellingen.map((s) => `${s.key} = ${s.value}`).join("\n")
    : "TomTom gaf geen overzicht van de gebruikte instellingen.";
  kaartje.append(
    maak("details", {}, maak("summary", { tekst: "Gebruikte instellingen (door TomTom)" }), maak("pre", { tekst }))
  );

  return kaartje;
}

// ---------- Knoppen ----------

el.berekenknop.addEventListener("click", bereken);
el.wisknop.addEventListener("click", wisAlles);
werkOverzichtBij();
if (!sleutelOk) {
  toonMelding("Nog geen sleutel gevonden. Zie proef/sleutel.voorbeeld.js voor wat je moet doen.", true);
}
