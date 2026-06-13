// Helper para normalizar nombres de equipos al formato del mapa FCTV
window._normalizeFctv = function(name) {
    const map = {
        'méxico': 'mexico', 'sudáfrica': 'sudafrica', 'corea del sur': 'corea del sur',
        'chequia': 'chequia', 'canadá': 'canada', 'bosnia y her.': 'bosnia',
        'catar': 'catar', 'suiza': 'suiza', 'brasil': 'brasil', 'marruecos': 'marruecos',
        'haití': 'haiti', 'escocia': 'escocia', 'eeuu': 'eeuu', 'paraguay': 'paraguay',
        'australia': 'australia', 'turquía': 'turquia', 'alemania': 'alemania',
        'curaçao': 'curazao', 'costa de marfil': 'costa de marfil', 'ecuador': 'ecuador',
        'países bajos': 'holanda', 'japón': 'japon', 'suecia': 'suecia', 'túnez': 'tunez',
        'bélgica': 'belgica', 'egipto': 'egipto', 'irán': 'iran', 'nueva zelanda': 'nueva zelanda',
        'españa': 'espana', 'cabo verde': 'cabo verde', 'arabia saudí': 'arabia saudi',
        'uruguay': 'uruguay', 'francia': 'francia', 'senegal': 'senegal', 'irak': 'irak',
        'noruega': 'noruega', 'argentina': 'argentina', 'argelia': 'argelia',
        'austria': 'austria', 'jordania': 'jordania', 'portugal': 'portugal',
        'rd congo': 'rd congo', 'uzbekistán': 'uzbekistan', 'colombia': 'colombia',
        'inglaterra': 'inglaterra', 'croacia': 'croacia', 'ghana': 'ghana', 'panamá': 'panama'
    };
    return map[(name || '').toLowerCase()] || (name || '').toLowerCase();
};

// Mapa de TODOS los partidos del Mundial con sus URLs de FCTV
// Formato: "local vs visitante" → URL completa de FCTV
window.fctvMatchUrls = {
    // ===== RONDA 1 =====
    'mexico vs sudafrica': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324305/mexico-vs-south-africa-06-2026.html',
    'corea del sur vs chequia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370284/south-korea-vs-czechia-06-2026.html',
    'canada vs bosnia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4331450/canada-vs-bosnia-and-herzegovina-06-2026.html',
    'eeuu vs paraguay': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318059/usa-vs-paraguay-06-2026.html',
    'catar vs suiza': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318277/qatar-vs-switzerland-06-2026.html',
    'brasil vs marruecos': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324335/brazil-vs-morocco-06-2026.html',
    'haiti vs escocia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370286/haiti-vs-scotland-06-2026.html',
    'australia vs turquia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341131/australia-vs-turkiye-06-2026.html',
    'alemania vs curazao': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341127/germany-vs-curacao-06-2026.html',
    'holanda vs japon': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370281/netherlands-vs-japan-06-2026.html',
    'costa de marfil vs ecuador': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324573/cote-divoire-vs-ecuador-06-2026.html',
    'suecia vs tunez': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324481/sweden-vs-tunisia-06-2026.html',
    'espana vs cabo verde': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370283/spain-vs-cabo-verde-06-2026.html',
    'belgica vs egipto': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324306/belgium-vs-egypt-06-2026.html',
    'arabia saudi vs uruguay': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318281/saudi-arabia-vs-uruguay-06-2026.html',
    'iran vs nueva zelanda': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4374271/ir-iran-vs-new-zealand-06-2026.html',
    'francia vs senegal': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324444/france-vs-senegal-06-2026.html',
    'irak vs noruega': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370285/iraq-vs-norway-06-2026.html',
    'argentina vs argelia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324568/argentina-vs-algeria-06-2026.html',
    'austria vs jordania': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318159/austria-vs-jordan-06-2026.html',
    'portugal vs rd congo': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4374270/portugal-vs-democratic-republic-of-the-congo-06-2026.html',
    'inglaterra vs croacia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370282/england-vs-croatia-06-2026.html',
    'ghana vs panama': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4320242/ghana-vs-panama-06-2026.html',
    'uzbekistan vs colombia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341125/uzbekistan-vs-colombia-06-2026.html',
    // ===== RONDA 2 =====
    'chequia vs sudafrica': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324311/czechia-vs-south-africa-06-2026.html',
    'suiza vs bosnia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318278/switzerland-vs-bosnia-and-herzegovina-06-2026.html',
    'canada vs catar': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318061/canada-vs-qatar-06-2026.html',
    'mexico vs corea del sur': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318062/mexico-vs-south-korea-06-2026.html',
    'eeuu vs australia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318060/usa-vs-australia-06-2026.html',
    'escocia vs marruecos': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324337/scotland-vs-morocco-06-2026.html',
    'brasil vs haiti': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324336/brazil-vs-haiti-06-2026.html',
    'turquia vs paraguay': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341133/turkiye-vs-paraguay-06-2026.html',
    'holanda vs suecia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324482/netherlands-vs-sweden-06-2026.html',
    'alemania vs costa de marfil': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324575/germany-vs-cote-divoire-06-2026.html',
    'ecuador vs curazao': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324576/ecuador-vs-curacao-06-2026.html',
    'tunez vs japon': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324485/tunisia-vs-japan-06-2026.html',
    'espana vs arabia saudi': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318280/spain-vs-saudi-arabia-06-2026.html',
    'belgica vs iran': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324308/belgium-vs-ir-iran-06-2026.html',
    'uruguay vs cabo verde': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318283/uruguay-vs-cabo-verde-06-2026.html',
    'nueva zelanda vs egipto': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324309/new-zealand-vs-egypt-06-2026.html',
    'argentina vs austria': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318160/argentina-vs-austria-06-2026.html',
    'francia vs irak': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324446/france-vs-iraq-06-2026.html',
    'noruega vs senegal': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324448/norway-vs-senegal-06-2026.html',
    'jordania vs argelia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318162/jordan-vs-algeria-06-2026.html',
    'portugal vs uzbekistan': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341124/portugal-vs-uzbekistan-06-2026.html',
    'inglaterra vs ghana': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4320241/england-vs-ghana-06-2026.html',
    'panama vs croacia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4320243/panama-vs-croatia-06-2026.html',
    'colombia vs rd congo': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341130/colombia-vs-democratic-republic-of-the-congo-06-2026.html',
    // ===== RONDA 3 =====
    'suiza vs canada': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318063/switzerland-vs-canada-06-2026.html',
    'bosnia vs catar': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318279/bosnia-and-herzegovina-vs-qatar-06-2026.html',
    'marruecos vs haiti': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324338/morocco-vs-haiti-06-2026.html',
    'escocia vs brasil': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324339/scotland-vs-brazil-06-2026.html',
    'chequia vs mexico': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318066/czechia-vs-mexico-06-2026.html',
    'sudafrica vs corea del sur': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318065/south-africa-vs-south-korea-06-2026.html',
    'paraguay vs australia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318064/paraguay-vs-australia-06-2026.html',
    'turquia vs eeuu': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341132/turkiye-vs-usa-06-2026.html',
    'curazao vs costa de marfil': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324574/curacao-vs-cote-divoire-06-2026.html',
    'ecuador vs alemania': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341128/ecuador-vs-germany-06-2026.html',
    'japon vs suecia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324483/japan-vs-sweden-06-2026.html',
    'tunez vs holanda': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324484/tunisia-vs-netherlands-06-2026.html',
    'cabo verde vs arabia saudi': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318282/cabo-verde-vs-saudi-arabia-06-2026.html',
    'espana vs uruguay': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370288/spain-vs-uruguay-06-2026.html',
    'egipto vs iran': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324307/egypt-vs-ir-iran-06-2026.html',
    'nueva zelanda vs belgica': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4374272/new-zealand-vs-belgium-06-2026.html',
    'senegal vs irak': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324447/senegal-vs-iraq-06-2026.html',
    'noruega vs francia': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4324445/norway-vs-france-06-2026.html',
    'argelia vs austria': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318161/algeria-vs-austria-06-2026.html',
    'jordania vs argentina': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370287/jordan-vs-argentina-06-2026.html',
    'rd congo vs uzbekistan': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4341129/democratic-republic-of-the-congo-vs-uzbekistan-06-2026.html',
    'colombia vs portugal': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370289/colombia-vs-portugal-06-2026.html',
    'croacia vs ghana': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4320244/croatia-vs-ghana-06-2026.html',
    'panama vs inglaterra': 'https://fctv33hd.yachts/es/football/fifa-world-cup-match-4370290/panama-vs-england-06-2026.html',
};

// Partidos que se emiten en abierto por La 1 (RTVE)
// Solo necesitamos comparar los equipos normalizados
window.la1Matches = [
    'mexico vs sudafrica',
    'canada vs bosnia',
    'brasil vs marruecos',
    'alemania vs curazao',
    'espana vs cabo verde',
    'francia vs senegal',
    'inglaterra vs croacia',
    'suiza vs bosnia',
    'eeuu vs australia',
    'holanda vs suecia',
    'espana vs arabia saudi',
    'argentina vs austria',
    'inglaterra vs ghana',
    'escocia vs brasil',
    'ecuador vs alemania',
    'uruguay vs espana',
    'colombia vs portugal'
];

// Opcional: Proxy de Cloudflare para saltarse el bloqueo de iframes de SofaScore
// Si creas un Worker en Cloudflare, pon aquí su URL sin la barra final (ej: 'https://sofa.tu-usuario.workers.dev')
window.sofascoreProxy = 'https://polished-frost-dabd.cst-pod.workers.dev';

// Enlaces directos a las estadísticas de SofaScore para los partidos terminados
window.sofascoreUrls = {
    // ===== RONDA 1 =====
    'mexico vs sudafrica': 'https://www.fotmob.com/es/matches/south-africa-vs-mexico/1einvt#4667751:tab=stats',
    'corea del sur vs chequia': 'https://www.fotmob.com/es/matches/south-korea-vs-czechia/273opa#4667752:tab=stats',
    'canada vs bosnia': 'https://www.fotmob.com/es/matches/canada-vs-bosnia-herzegovina/23f1qo#4667757:tab=stats',
    'eeuu vs paraguay': 'https://www.fotmob.com/es/matches/usa-vs-paraguay/1hr85j#4667771:tab=stats',
    'catar vs suiza': 'https://www.fotmob.com/es/matches/qatar-vs-switzerland/1beswv#4667758:tab=stats',
    'brasil vs marruecos': 'https://www.fotmob.com/es/matches/morocco-vs-brazil/1qr4gd#4667764:tab=stats',
    'haiti vs escocia': 'https://www.fotmob.com/es/matches/haiti-vs-scotland/1q0g2q#4667765:tab=stats',
    'australia vs turquia': 'https://www.fotmob.com/es/matches/turkiye-vs-australia/1gr3uk#4667772:tab=stats',
    'alemania vs curazao': 'https://www.fotmob.com/es/matches/germany-vs-curacao/k77fsyu#4667777:tab=stats',
    'holanda vs japon': 'https://www.fotmob.com/es/matches/netherlands-vs-japan/1hn72b#4667783:tab=stats',
    'costa de marfil vs ecuador': 'https://www.fotmob.com/es/matches/ecuador-vs-ivory-coast/1hl6kp#4667778:tab=stats',
    'suecia vs tunez': 'https://www.fotmob.com/es/matches/tunisia-vs-sweden/1x5290#4667784:tab=stats',
    'espana vs cabo verde': 'https://www.fotmob.com/es/matches/cape-verde-vs-spain/1bbtuo#4667798:tab=stats',
    'belgica vs egipto': 'https://www.fotmob.com/es/matches/belgium-vs-egypt/2u3bhg#4667790:tab=stats',
    'uruguay vs arabia saudi': 'https://www.fotmob.com/es/matches/uruguay-vs-saudi-arabia/1izuvb#4667799:tab=stats',
    'iran vs nueva zelanda': 'https://www.fotmob.com/es/matches/new-zealand-vs-iran/1ar30l#4667791:tab=stats',
    'francia vs senegal': 'https://www.fotmob.com/es/matches/senegal-vs-france/1f8fvo#4667804:tab=stats',
    
    'sudafrica vs chequia': 'https://www.sofascore.com/football/match/south-africa-czechia/oUbsLUb#id:15186731,tab:statistics',
    'suiza vs bosnia': 'https://www.sofascore.com/football/match/switzerland-bosnia-and-herzegovina/EObsZTb#id:15186806,tab:statistics',
    'catar vs canada': 'https://www.sofascore.com/football/match/qatar-canada/cVbsRVb#id:15186798,tab:statistics',
    'mexico vs corea del sur': 'https://www.sofascore.com/football/match/mexico-south-korea/KUbsGVb#id:15186490,tab:statistics',
    'australia vs eeuu': 'https://www.sofascore.com/football/match/australia-usa/zUbsQUb#id:15186878,tab:statistics',
    'marruecos vs escocia': 'https://www.sofascore.com/football/match/morocco-scotland/VTbsDVb#id:15186859,tab:statistics',
    'haiti vs brasil': 'https://www.sofascore.com/football/match/haiti-brazil/YUbsEUc#id:15186856,tab:statistics',
    'paraguay vs turquia': 'https://www.sofascore.com/football/match/paraguay-turkiye/aUbsOVb#id:15186879,tab:statistics',
    'holanda vs suecia': 'https://www.sofascore.com/football/match/netherlands-sweden/NTbsfUb#id:15186957,tab:statistics',
    'costa de marfil vs alemania': 'https://www.sofascore.com/football/match/cote-divoire-germany/lUbstVb#id:15186905,tab:statistics',
    'curazao vs ecuador': 'https://www.sofascore.com/football/match/curacao-ecuador/hVbsCqx#id:15186906,tab:statistics',
    'japon vs tunez': 'https://www.sofascore.com/football/match/japan-tunisia/EUbsvVb#id:15186963,tab:statistics',
    'arabia saudi vs espana': 'https://www.sofascore.com/football/match/saudi-arabia-spain/xUbsJUb#id:15186840,tab:statistics'
};
