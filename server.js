// Kleine webserver om de proefpagina op je eigen pc te openen.
// Start hem met:  node server.js   en open daarna http://localhost:8080
//
// De server luistert alleen op 127.0.0.1 (jouw eigen pc). Niemand anders in je
// netwerk kan dus bij de pagina, en ook niet bij je sleutel in proef/sleutel.js.

const http = require("http");
const fs = require("fs");
const path = require("path");

const MAP = path.join(__dirname, "proef");
const POORT = 8080;

const BESTANDSTYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

http
  .createServer((verzoek, antwoord) => {
    let pad;
    try {
      pad = decodeURIComponent(new URL(verzoek.url, "http://localhost").pathname);
    } catch {
      antwoord.writeHead(400);
      return antwoord.end("Ongeldig adres");
    }

    const bestand = path.join(MAP, pad === "/" ? "index.html" : pad);

    // Alleen bestanden uit de map "proef" geven, niets daarbuiten.
    if (!bestand.startsWith(MAP + path.sep)) {
      antwoord.writeHead(403);
      return antwoord.end("Niet toegestaan");
    }

    fs.readFile(bestand, (fout, inhoud) => {
      if (fout) {
        antwoord.writeHead(404);
        return antwoord.end("Niet gevonden");
      }
      antwoord.writeHead(200, {
        "Content-Type": BESTANDSTYPES[path.extname(bestand)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      antwoord.end(inhoud);
    });
  })
  .listen(POORT, "127.0.0.1", () => {
    console.log(`Proefpagina draait op http://localhost:${POORT}`);
    console.log("Stoppen doe je met Ctrl+C.");
  });
