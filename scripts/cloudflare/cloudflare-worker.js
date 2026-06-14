// Worker sencillo: proxy de FCTV33 + quitar bloqueos + fullscreen + comunicación con padre
const UPSTREAM = "https://jack09eo.mpstickv5m73jgravity.my/"; // O el dominio actual de FCTV
const SECRET_TOKEN = "porrita"; // Cambia esto por tu contraseña secreta

// AQUÍ PEGAS TUS ENLACES DE LOS PARTIDOS:
// El formato debe ser: "equipo local vs equipo visitante" : "URL_RELATIVA_DEL_FCTV"
// El nombre del partido es tal cual lo lee FutbolLibre/FCTV
const MATCH_LINKS = {
  "mexico vs sudafrica": "/es/football/fifa-world-cup-match-4324305/mexico-vs-south-africa-06-2026.html",
  "corea del sur vs chequia": "/es/football/fifa-world-cup-match-4370284/south-korea-vs-czechia-06-2026.html",
  "canada vs bosnia": "/es/football/fifa-world-cup-match-4331450/canada-vs-bosnia-and-herzegovina-06-2026.html",
  "eeuu vs paraguay": "/es/football/fifa-world-cup-match-4318059/usa-vs-paraguay-06-2026.html",
  "catar vs suiza": "/es/football/fifa-world-cup-match-4318277/qatar-vs-switzerland-06-2026.html",
  "brasil vs marruecos": "/es/football/fifa-world-cup-match-4324335/brazil-vs-morocco-06-2026.html",
  "haiti vs escocia": "/es/football/fifa-world-cup-match-4370286/haiti-vs-scotland-06-2026.html",
  "australia vs turquia": "/es/football/fifa-world-cup-match-4341131/australia-vs-turkiye-06-2026.html",
  "alemania vs curazao": "/es/football/fifa-world-cup-match-4341127/germany-vs-curacao-06-2026.html",
  "holanda vs japon": "/es/football/fifa-world-cup-match-4370281/netherlands-vs-japan-06-2026.html",
  "costa de marfil vs ecuador": "/es/football/fifa-world-cup-match-4324573/cote-divoire-vs-ecuador-06-2026.html",
  "suecia vs tunez": "/es/football/fifa-world-cup-match-4324481/sweden-vs-tunisia-06-2026.html",
  "espana vs cabo verde": "/es/football/fifa-world-cup-match-4370283/spain-vs-cabo-verde-06-2026.html",
  "belgica vs egipto": "/es/football/fifa-world-cup-match-4324306/belgium-vs-egypt-06-2026.html",
  "arabia saudi vs uruguay": "/es/football/fifa-world-cup-match-4318281/saudi-arabia-vs-uruguay-06-2026.html",
  "iran vs nueva zelanda": "/es/football/fifa-world-cup-match-4374271/ir-iran-vs-new-zealand-06-2026.html",
  "francia vs senegal": "/es/football/fifa-world-cup-match-4324444/france-vs-senegal-06-2026.html",
  "irak vs noruega": "/es/football/fifa-world-cup-match-4370285/iraq-vs-norway-06-2026.html",
  "argentina vs argelia": "/es/football/fifa-world-cup-match-4324568/argentina-vs-algeria-06-2026.html",
  "austria vs jordania": "/es/football/fifa-world-cup-match-4318159/austria-vs-jordan-06-2026.html",
  "portugal vs rd congo": "/es/football/fifa-world-cup-match-4374270/portugal-vs-democratic-republic-of-the-congo-06-2026.html",
  "inglaterra vs croacia": "/es/football/fifa-world-cup-match-4370282/england-vs-croatia-06-2026.html",
  "ghana vs panama": "/es/football/fifa-world-cup-match-4320242/ghana-vs-panama-06-2026.html",
  "uzbekistan vs colombia": "/es/football/fifa-world-cup-match-4341125/uzbekistan-vs-colombia-06-2026.html",
  "chequia vs sudafrica": "/es/football/fifa-world-cup-match-4324311/czechia-vs-south-africa-06-2026.html",
  "suiza vs bosnia": "/es/football/fifa-world-cup-match-4318278/switzerland-vs-bosnia-and-herzegovina-06-2026.html",
  "canada vs catar": "/es/football/fifa-world-cup-match-4318061/canada-vs-qatar-06-2026.html",
  "mexico vs corea del sur": "/es/football/fifa-world-cup-match-4318062/mexico-vs-south-korea-06-2026.html",
  "eeuu vs australia": "/es/football/fifa-world-cup-match-4318060/usa-vs-australia-06-2026.html",
  "escocia vs marruecos": "/es/football/fifa-world-cup-match-4324337/scotland-vs-morocco-06-2026.html",
  "brasil vs haiti": "/es/football/fifa-world-cup-match-4324336/brazil-vs-haiti-06-2026.html",
  "turquia vs paraguay": "/es/football/fifa-world-cup-match-4341133/turkiye-vs-paraguay-06-2026.html",
  "holanda vs suecia": "/es/football/fifa-world-cup-match-4324482/netherlands-vs-sweden-06-2026.html",
  "alemania vs costa de marfil": "/es/football/fifa-world-cup-match-4324575/germany-vs-cote-divoire-06-2026.html",
  "ecuador vs curazao": "/es/football/fifa-world-cup-match-4324576/ecuador-vs-curacao-06-2026.html",
  "tunez vs japon": "/es/football/fifa-world-cup-match-4324485/tunisia-vs-japan-06-2026.html",
  "espana vs arabia saudi": "/es/football/fifa-world-cup-match-4318280/spain-vs-saudi-arabia-06-2026.html",
  "belgica vs iran": "/es/football/fifa-world-cup-match-4324308/belgium-vs-ir-iran-06-2026.html",
  "uruguay vs cabo verde": "/es/football/fifa-world-cup-match-4318283/uruguay-vs-cabo-verde-06-2026.html",
  "nueva zelanda vs egipto": "/es/football/fifa-world-cup-match-4324309/new-zealand-vs-egypt-06-2026.html",
  "argentina vs austria": "/es/football/fifa-world-cup-match-4318160/argentina-vs-austria-06-2026.html",
  "francia vs irak": "/es/football/fifa-world-cup-match-4324446/france-vs-iraq-06-2026.html",
  "noruega vs senegal": "/es/football/fifa-world-cup-match-4324448/norway-vs-senegal-06-2026.html",
  "jordania vs argelia": "/es/football/fifa-world-cup-match-4318162/jordan-vs-algeria-06-2026.html",
  "portugal vs uzbekistan": "/es/football/fifa-world-cup-match-4341124/portugal-vs-uzbekistan-06-2026.html",
  "inglaterra vs ghana": "/es/football/fifa-world-cup-match-4320241/england-vs-ghana-06-2026.html",
  "panama vs croacia": "/es/football/fifa-world-cup-match-4320243/panama-vs-croatia-06-2026.html",
  "colombia vs rd congo": "/es/football/fifa-world-cup-match-4341130/colombia-vs-democratic-republic-of-the-congo-06-2026.html",
  "suiza vs canada": "/es/football/fifa-world-cup-match-4318063/switzerland-vs-canada-06-2026.html",
  "bosnia vs catar": "/es/football/fifa-world-cup-match-4318279/bosnia-and-herzegovina-vs-qatar-06-2026.html",
  "marruecos vs haiti": "/es/football/fifa-world-cup-match-4324338/morocco-vs-haiti-06-2026.html",
  "escocia vs brasil": "/es/football/fifa-world-cup-match-4324339/scotland-vs-brazil-06-2026.html",
  "chequia vs mexico": "/es/football/fifa-world-cup-match-4318066/czechia-vs-mexico-06-2026.html",
  "sudafrica vs corea del sur": "/es/football/fifa-world-cup-match-4318065/south-africa-vs-south-korea-06-2026.html",
  "paraguay vs australia": "/es/football/fifa-world-cup-match-4318064/paraguay-vs-australia-06-2026.html",
  "turquia vs eeuu": "/es/football/fifa-world-cup-match-4341132/turkiye-vs-usa-06-2026.html",
  "curazao vs costa de marfil": "/es/football/fifa-world-cup-match-4324574/curacao-vs-cote-divoire-06-2026.html",
  "ecuador vs alemania": "/es/football/fifa-world-cup-match-4341128/ecuador-vs-germany-06-2026.html",
  "japon vs suecia": "/es/football/fifa-world-cup-match-4324483/japan-vs-sweden-06-2026.html",
  "tunez vs holanda": "/es/football/fifa-world-cup-match-4324484/tunisia-vs-netherlands-06-2026.html",
  "cabo verde vs arabia saudi": "/es/football/fifa-world-cup-match-4318282/cabo-verde-vs-saudi-arabia-06-2026.html",
  "espana vs uruguay": "/es/football/fifa-world-cup-match-4370288/spain-vs-uruguay-06-2026.html",
  "egipto vs iran": "/es/football/fifa-world-cup-match-4324307/egypt-vs-ir-iran-06-2026.html",
  "nueva zelanda vs belgica": "/es/football/fifa-world-cup-match-4374272/new-zealand-vs-belgium-06-2026.html",
  "senegal vs irak": "/es/football/fifa-world-cup-match-4324447/senegal-vs-iraq-06-2026.html",
  "noruega vs francia": "/es/football/fifa-world-cup-match-4324445/norway-vs-france-06-2026.html",
  "argelia vs austria": "/es/football/fifa-world-cup-match-4318161/algeria-vs-austria-06-2026.html",
  "jordania vs argentina": "/es/football/fifa-world-cup-match-4370287/jordan-vs-argentina-06-2026.html",
  "rd congo vs uzbekistan": "/es/football/fifa-world-cup-match-4341129/democratic-republic-of-the-congo-vs-uzbekistan-06-2026.html",
  "colombia vs portugal": "/es/football/fifa-world-cup-match-4370289/colombia-vs-portugal-06-2026.html",
  "croacia vs ghana": "/es/football/fifa-world-cup-match-4320244/croatia-vs-ghana-06-2026.html",
  "panama vs inglaterra": "/es/football/fifa-world-cup-match-4370290/panama-vs-england-06-2026.html",
};

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  // Rutas protegidas (Entrypoints)
  if (url.pathname === "/stream") {

    if (token !== SECRET_TOKEN) return new Response("No autorizado", { status: 403 });
    const matchId = url.searchParams.get("match");
    if (!matchId) return new Response("Partido no encontrado", { status: 404 });
    const streamPath = MATCH_LINKS[matchId] || MATCH_LINKS[matchId.replace(/-/g, " ")] || MATCH_LINKS[matchId.replace(/ /g, "-")];

    if (!streamPath) {
      return new Response("Partido no encontrado o sin enlace", { status: 404 });
    }

    // Como Cloudflare bloquea el proxy a su propia red (Error 1010),
    // el Worker solo actuará como caja fuerte de URLs (API).

    // El reproductor interno ahora es jack09eo y respeta la misma ruta exacta que fctv33hd
    const targetUrl = "https://jack09eo.mpstickv5m73jgravity.my" + streamPath;

    return new Response(JSON.stringify({ url: targetUrl }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  return new Response("Not found", { status: 404 });
}