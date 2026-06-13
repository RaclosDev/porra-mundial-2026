// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxP84aopRRyNdYqbO9j15p5MmpV_loCeE",
  authDomain: "porra-mundial-2026-6d233.firebaseapp.com",
  databaseURL: "https://porra-mundial-2026-6d233-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "porra-mundial-2026-6d233",
  storageBucket: "porra-mundial-2026-6d233.firebasestorage.app",
  messagingSenderId: "225355848403",
  appId: "1:225355848403:web:1e1b2e4dfd9944189b9226"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// State for Leaderboard
window.participantsHashes = [];
window.officialResultsHash = "";
window.officialPoints = {};
window.allGames = [];
window.nameToIdMap = {};
window.manualTiebreakers = {}; // { groupName: { teamName: manualScore } }

window.compareTeams = function(a, b, groupName) {
  const statsA = (window.officialPoints[groupName] && window.officialPoints[groupName][a.name.replace(/[.#$\[\]]/g, "")]);
  const statsB = (window.officialPoints[groupName] && window.officialPoints[groupName][b.name.replace(/[.#$\[\]]/g, "")]);
  
  const ptsA = (typeof statsA === 'object' && statsA !== null) ? (statsA.pts || 0) : (statsA || 0);
  const ptsB = (typeof statsB === 'object' && statsB !== null) ? (statsB.pts || 0) : (statsB || 0);
  
  const diffA = (typeof statsA === 'object' && statsA !== null) ? (statsA.diff || 0) : 0;
  const diffB = (typeof statsB === 'object' && statsB !== null) ? (statsB.diff || 0) : 0;
  
  const glsA = (typeof statsA === 'object' && statsA !== null) ? (statsA.gls || 0) : 0;
  const glsB = (typeof statsB === 'object' && statsB !== null) ? (statsB.gls || 0) : 0;

  const mpA = (typeof statsA === 'object' && statsA !== null) ? (statsA.mp || 0) : 0;
  const mpB = (typeof statsB === 'object' && statsB !== null) ? (statsB.mp || 0) : 0;

  // Equipos que no han jugado van al final
  if ((mpA > 0 && mpB === 0) || (mpB > 0 && mpA === 0)) {
      return mpB > 0 ? 1 : -1;
  }

  if (ptsB !== ptsA) return ptsB - ptsA;
  if (diffB !== diffA) return diffB - diffA;
  if (glsB !== glsA) return glsB - glsA;
  
  // Custom manual tiebreakers from the admin (if configured)
  const safeNameA = a.name.replace(/[.#$\[\]]/g, "");
  const safeNameB = b.name.replace(/[.#$\[\]]/g, "");
  const manualA = (window.manualTiebreakers[groupName] && window.manualTiebreakers[groupName][safeNameA]) || 0;
  const manualB = (window.manualTiebreakers[groupName] && window.manualTiebreakers[groupName][safeNameB]) || 0;
  if (manualB !== manualA) return manualB - manualA;
  
  // Head-to-Head fallback
  if (window.allGames && window.nameToIdMap) {
      const idA = window.nameToIdMap[a.name];
      const idB = window.nameToIdMap[b.name];
      if (idA && idB) {
          const h2hGame = window.allGames.find(g => 
              (g.home_team_id === idA && g.away_team_id === idB) ||
              (g.home_team_id === idB && g.away_team_id === idA)
          );
          if (h2hGame && h2hGame.home_score !== null && h2hGame.away_score !== null && h2hGame.home_score !== "" && h2hGame.away_score !== "") {
              const scoreA = h2hGame.home_team_id === idA ? parseInt(h2hGame.home_score) : parseInt(h2hGame.away_score);
              const scoreB = h2hGame.home_team_id === idB ? parseInt(h2hGame.home_score) : parseInt(h2hGame.away_score);
              if (!isNaN(scoreA) && !isNaN(scoreB) && scoreB !== scoreA) {
                  return scoreB - scoreA;
              }
          }
      }
  }

  return a.name.localeCompare(b.name);
};

// Attach real-time listeners
function updateOfficialUI() {
  if (window.officialResultsHash) {
     const n = document.getElementById("user-name").value;
     const b = document.getElementById("user-bet-name").value;
     loadHash(window.officialResultsHash);
     document.getElementById("user-name").value = n;
     document.getElementById("user-bet-name").value = b;
  }
  const isAdmin = checkAdmin(document.getElementById("user-name").value.trim());
  
  const selects = document.querySelectorAll("select:not(#search-condition)");
  selects.forEach(s => s.disabled = !isAdmin);
  
  const scorerInput = document.getElementById("top-scorer-input");
  if (scorerInput) scorerInput.disabled = !isAdmin;

  const btnGroups = document.getElementById("btn-generate-bracket");
  if (btnGroups) btnGroups.innerText = isAdmin ? "Guardar y Continuar a Eliminatorias ➡️" : "Siguiente: Ver Eliminatorias ➡️";

  const btnBracket = document.getElementById("btn-save-hash");
  if (btnBracket) btnBracket.style.display = isAdmin ? "inline-block" : "none";

  const btnAdmin = document.getElementById("nav-admin");
  if (btnAdmin) btnAdmin.style.display = isAdmin ? "inline-block" : "none";
  
  if(typeof renderHomeStandings === "function") renderHomeStandings();
}

onValue(ref(database, 'official'), (snapshot) => {
  window.officialResultsHash = snapshot.val() || "";
  if(typeof renderLeaderboard === "function") renderLeaderboard();
  updateOfficialUI();
});

onValue(ref(database, 'officialPoints'), (snapshot) => {
  window.officialPoints = snapshot.val() || {};
  if(typeof renderHomeStandings === "function") renderHomeStandings();
});

onValue(ref(database, 'matchRadar'), (snapshot) => {
  window.matchRadar = snapshot.val() || { last: [], next: [] };
  if(typeof renderLastMatches === "function") renderLastMatches();
});

onValue(ref(database, 'bets'), (snapshot) => {
  const data = snapshot.val();
  window.participantsHashes = [];
  if (data) {
    Object.entries(data).forEach(([key, val]) => {
      if (typeof val === 'string') {
        window.participantsHashes.push({ key, hash: val, paid: true });
      } else {
        window.participantsHashes.push({ key, hash: val.hash, paid: !!val.paid });
      }
    });
  }
  
  // Update Prize Pot
  const potElement = document.getElementById("prize-pot-rules");
  if (potElement) {
    const totalPot = window.participantsHashes.length * 5;
    potElement.innerText = totalPot + "€";
  }

  if(typeof renderLeaderboard === "function") renderLeaderboard();
  if(typeof renderStats === "function") renderStats();
});

window.deleteBet = function(key) {
  if (confirm("¿Estás seguro de que quieres borrar esta apuesta de la base de datos?")) {
    remove(ref(database, `bets/${key}`))
      .then(() => alert("Apuesta eliminada con éxito."))
      .catch(e => alert("Error al borrar: " + e.message));
  }
};

window.fixThird = function(key, hash, winner) {
  if (!confirm("¿Asignar a " + winner + " como ganador del 3º Puesto para esta apuesta?")) return;
  const part = decodeHash(hash);
  if (!part) return;
  part.thirdPlaceWinner = winner;
  const jsonString = JSON.stringify(part);
  const newHash = btoa(unescape(encodeURIComponent(jsonString)));
  
  set(ref(database, 'bets/' + key + '/hash'), newHash).then(() => {
    alert("¡Tercer puesto corregido con éxito!");
  }).catch(e => alert("Error: " + e.message));
};

window.acceptBet = function(key) {
  set(ref(database, `bets/${key}/paid`), true)
    .then(() => alert("¡Apuesta confirmada! Ahora contará en la clasificación."))
    .catch(e => alert("Error al confirmar: " + e.message));
};

window.viewBet = function(hash) {
  const part = decodeHash(hash);
  if (!part) return;
  
  const now = new Date();
  const isAdmin = checkAdmin(document.getElementById("user-name").value.trim());
  
  if (now < deadline && !isAdmin) {
    alert("¡Tranquilo! Las apuestas son secretas hasta que se cierre el plazo a las 21:00.");
    return;
  }
  
  document.getElementById("viewer-title").innerText = `Apuesta de ${part.user} (${part.bet})`;
  document.getElementById("viewer-scorer").innerHTML = `<b>Máximo Goleador:</b> <span>${part.scorer}</span>`;
  
  const getHtmlTeam = (name, isWinner = false) => {
    if (!name) return `<div class="team-slot empty">Por definir</div>`;
    const flag = `<img src="https://flagcdn.com/24x18/${getCountryCode(name)}.png" alt="">`;
    return `<div class="team-slot ${isWinner ? 'winner' : ''}">${flag} <span>${name}</span></div>`;
  };

  const renderRoundCol = (matches) => {
    return matches.map(m => `
      <div class="match">
        ${getHtmlTeam(m[0])}
        ${getHtmlTeam(m[1])}
      </div>
    `).join('');
  };

  const r32Left = part.r32 ? part.r32.slice(0, 8) : [];
  const r32Right = part.r32 ? part.r32.slice(8, 16) : [];
  const r16Left = part.r16.slice(0,4);
  const r16Right = part.r16.slice(4,8);
  const qfLeft = part.qf.slice(0,2);
  const qfRight = part.qf.slice(2,4);
  const sfLeft = part.sf.slice(0,1);
  const sfRight = part.sf.slice(1,2);

  const html = `
    <div class="bracket-wrapper">
        <section class="bracket-side left-side">
            ${r32Left.length ? `<div class="round r32"><h2>Dieciseisavos</h2>${renderRoundCol(r32Left)}</div>` : ''}
            <div class="round r16"><h2>Octavos</h2>${renderRoundCol(r16Left)}</div>
            <div class="round qf"><h2>Cuartos</h2>${renderRoundCol(qfLeft)}</div>
            <div class="round sf"><h2>Semifinales</h2>${renderRoundCol(sfLeft)}</div>
        </section>
        <section class="center-side">
            <div class="finals-container">
                <div class="match final-match">
                    <h3>FINAL</h3>
                    ${part.final && part.final.length === 2 ? getHtmlTeam(part.final[0]) + getHtmlTeam(part.final[1]) : getHtmlTeam(null) + getHtmlTeam(null)}
                </div>
                <div class="match champion-display">
                    <h3>CAMPEÓN</h3>
                    ${getHtmlTeam(part.champion, true)}
                </div>
                <div class="match third-place">
                    <h3>TERCER PUESTO</h3>
                    ${part.thirdPlaceMatch && part.thirdPlaceMatch.length === 2 ? getHtmlTeam(part.thirdPlaceMatch[0]) + getHtmlTeam(part.thirdPlaceMatch[1]) : getHtmlTeam(null) + getHtmlTeam(null)}
                </div>
            </div>
        </section>
        <section class="bracket-side right-side">
            <div class="round sf"><h2>Semifinales</h2>${renderRoundCol(sfRight)}</div>
            <div class="round qf"><h2>Cuartos</h2>${renderRoundCol(qfRight)}</div>
            <div class="round r16"><h2>Octavos</h2>${renderRoundCol(r16Right)}</div>
            ${r32Right.length ? `<div class="round r32"><h2>Dieciseisavos</h2>${renderRoundCol(r32Right)}</div>` : ''}
        </section>
    </div>
  `;
  
  document.getElementById("viewer-content").innerHTML = html;
  document.getElementById("viewer-modal").style.display = "flex";
};

document.getElementById("btn-close-viewer")?.addEventListener("click", () => {
  document.getElementById("viewer-modal").style.display = "none";
});

let manualGroups = {}; // { A: { first: team, second: team, third: team } ... }
let manualThirds = []; // array of selected third-place teams (max 8)

function checkAdmin(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash === 1517890930;
}
let bracketState = {
  r32: { left: [], right: [] },
  r16: { left: [], right: [] },
  qf: { left: [], right: [] },
  sf: { left: [], right: [] },
  final: null,
  champion: null,
  thirdPlaceMatch: null,
  thirdPlaceWinner: null
};

// ----------------------------------------------------
// NEWS TICKER FACTS
// ----------------------------------------------------

function generateRandomFact() {
  if (!window.participantsHashes || window.participantsHashes.length === 0) return null;
  
  const official = window.officialResultsHash ? decodeHash(window.officialResultsHash) : null;
  
  const parsedBets = window.participantsHashes.map(h => {
    const part = decodeHash(h.hash);
    if (!part) return null;
    const pts = calculatePoints(part, official);
    return { name: part.user || h.key || "Anónimo", part, pts: pts.total };
  }).filter(Boolean);

  if (parsedBets.length === 0) return null;

  parsedBets.sort((a, b) => b.pts - a.pts);

  const facts = [];

  // Leader / Tie and Last place
  if (parsedBets.length > 1) {
    const topScore = parsedBets[0].pts;
    const minScore = parsedBets[parsedBets.length - 1].pts;
    
    if (topScore > 0) {
      const leaders = parsedBets.filter(p => p.pts === topScore);
      if (leaders.length > 1) {
        const names = leaders.map(l => l.name).join(", ");
        facts.push(`🔥 ¡Tenemos un empate en cabeza! ${names} lideran con ${topScore} pts.`);
      } else {
        facts.push(`🏆 ¡${parsedBets[0].name} lidera la porra con ${topScore} puntos!`);
      }
      
      // Only show last place if there's actually a difference in points
      if (minScore < topScore) {
        const lasts = parsedBets.filter(p => p.pts === minScore);
        if (lasts.length > 1) {
          const names = lasts.map(l => l.name).join(", ");
          facts.push(`🐢 Farolillo rojo: ${names} van últimos empatados con ${minScore} puntos.`);
        } else {
          facts.push(`🐢 Farolillo rojo: ${lasts[0].name} va último con ${minScore} puntos.`);
        }
      }
    }
  }

  const scorerCounts = {};
  const champCounts = {};
  const teamsR16 = {};
  const teamsQF = {};
  const teamsSF = {};
  const teamsFinal = {};

  const addVote = (map, key, name) => {
    if (!key) return;
    if (!map[key]) map[key] = [];
    if (!map[key].includes(name)) map[key].push(name);
  };

  parsedBets.forEach(b => {
    addVote(scorerCounts, b.part.scorer, b.name);
    addVote(champCounts, b.part.champion, b.name);
    
    if (b.part.r16) b.part.r16.flat().forEach(t => addVote(teamsR16, t, b.name));
    if (b.part.qf) b.part.qf.flat().forEach(t => addVote(teamsQF, t, b.name));
    if (b.part.sf) b.part.sf.flat().forEach(t => addVote(teamsSF, t, b.name));
    if (b.part.final) b.part.final.forEach(t => addVote(teamsFinal, t, b.name));
  });

  const pickRandomKey = (obj) => {
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    return keys[Math.floor(Math.random() * keys.length)];
  };

  const formatNames = (arr) => {
    if (arr && arr.length > 0 && arr.length <= 5) {
      return ` (${arr.join(", ")})`;
    }
    return "";
  };

  // Random scorer fact
  const rScorer = pickRandomKey(scorerCounts);
  if (rScorer) {
    const arr = scorerCounts[rScorer];
    facts.push(`⚽ Dato: ${arr.length} ${arr.length===1?'persona ha':'personas han'} elegido a ${rScorer} como Máximo Goleador${formatNames(arr)}.`);
  }

  // Random champion fact
  const rChamp = pickRandomKey(champCounts);
  if (rChamp) {
    const arr = champCounts[rChamp];
    facts.push(`🌍 Dato: ${arr.length} ${arr.length===1?'persona ve':'personas ven'} a ${rChamp} ganando el Mundial${formatNames(arr)}.`);
  }

  // Random team reaching a specific round
  const roundPick = Math.floor(Math.random() * 4);
  if (roundPick === 0) {
    const rTeam = pickRandomKey(teamsFinal);
    if (rTeam) facts.push(`🏟️ Apuestas: ${teamsFinal[rTeam].length} ${teamsFinal[rTeam].length===1?'cree':'creen'} que ${rTeam} llegará a la Gran Final${formatNames(teamsFinal[rTeam])}.`);
  } else if (roundPick === 1) {
    const rTeam = pickRandomKey(teamsSF);
    if (rTeam) facts.push(`🏟️ Apuestas: ${teamsSF[rTeam].length} ${teamsSF[rTeam].length===1?'cree':'creen'} que ${rTeam} llegará a Semifinales${formatNames(teamsSF[rTeam])}.`);
  } else if (roundPick === 2) {
    const rTeam = pickRandomKey(teamsQF);
    if (rTeam) facts.push(`🏟️ Apuestas: ${teamsQF[rTeam].length} ${teamsQF[rTeam].length===1?'apuesta':'apuestan'} que ${rTeam} llegará a Cuartos${formatNames(teamsQF[rTeam])}.`);
  } else {
    const rTeam = pickRandomKey(teamsR16);
    if (rTeam) facts.push(`🏟️ Apuestas: ${teamsR16[rTeam].length} ${teamsR16[rTeam].length===1?'persona asegura':'personas aseguran'} que ${rTeam} pasa a Octavos${formatNames(teamsR16[rTeam])}.`);
  }

  window.recentFacts = window.recentFacts || [];
  
  // Filter out recently shown facts to avoid repetition
  const availableFacts = facts.filter(f => !window.recentFacts.includes(f));
  
  let chosenFact;
  if (availableFacts.length > 0) {
    chosenFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
  } else {
    // If all facts have been shown (small pool), pick randomly again
    chosenFact = facts[Math.floor(Math.random() * facts.length)];
  }

  // Add to recent history, keep max 10
  window.recentFacts.push(chosenFact);
  if (window.recentFacts.length > 10) {
    window.recentFacts.shift();
  }

  return chosenFact;
}

function updateNewsTicker() {
  const tickerText = document.getElementById("news-ticker-text");
  if (!tickerText) return;

  const newFact = generateRandomFact();
  if (!newFact) {
    tickerText.textContent = "Esperando participantes...";
    tickerText.style.opacity = 1;
    return;
  }

  // Fade out
  tickerText.style.opacity = 0;
  tickerText.style.transform = "translateY(-10px)";
  
  setTimeout(() => {
    tickerText.textContent = newFact;
    tickerText.style.transition = "none";
    tickerText.style.transform = "translateY(10px)";
    
    const marquee = document.getElementById("news-ticker-marquee");
    if (marquee) {
      marquee.style.animation = 'none';
      marquee.offsetHeight; /* trigger reflow */
      
      // If text is wider than the screen minus some margin, animate it!
      if (tickerText.scrollWidth > window.innerWidth * 0.9 && window.innerWidth <= 768) {
         marquee.style.animation = 'scrollText 11s linear forwards';
      } else {
         marquee.style.animation = 'none';
      }
    }
    
    // Give it a tiny bit of time to apply transform before transitioning back to 0
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tickerText.style.transition = "opacity 0.5s, transform 0.5s";
        tickerText.style.opacity = 1;
        tickerText.style.transform = "translateY(0)";
      });
    });
  }, 500);
}

setInterval(updateNewsTicker, 12000);
setTimeout(updateNewsTicker, 3000); // Initial load

// Initialization moved to the bottom of the file

function setupNavigation() {
  const views = ["view-home", "view-radar", "view-bracket", "view-leaderboard", "view-rules", "view-group-stage", "view-thirds", "view-stats", "view-search"];
  
  window.switchView = function(viewId) {
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });
    document.getElementById(viewId).classList.add("active");
    window.currentViewId = viewId;
    if (viewId === "view-bracket") {
      renderInteractiveBracket();
    }
  }

  document.getElementById("nav-home").addEventListener("click", () => switchView("view-home"));
  document.getElementById("nav-radar")?.addEventListener("click", () => switchView("view-radar"));
  document.getElementById("nav-rules")?.addEventListener("click", () => switchView("view-rules"));
  document.getElementById("nav-group")?.addEventListener("click", () => switchView("view-group-stage"));
  document.getElementById("nav-thirds")?.addEventListener("click", () => switchView("view-thirds"));
  document.getElementById("nav-bracket")?.addEventListener("click", () => switchView("view-bracket"));
  document.getElementById("nav-stats")?.addEventListener("click", () => switchView("view-stats"));
  document.getElementById("nav-search")?.addEventListener("click", () => {
    if (!window.currentSearchCondition) {
        setupSearchTeams();
    }
    switchView("view-search");
  });
  document.getElementById("nav-admin")?.addEventListener("click", () => switchView("view-group-stage"));
  document.getElementById("nav-load")?.addEventListener("click", () => switchView("view-load-bet"));
  document.getElementById("nav-leaderboard").addEventListener("click", () => {
    renderLeaderboard();
    switchView("view-leaderboard");
  });

  const siteTitle = document.getElementById("site-title");
  const userInfoBar = document.getElementById("user-info-bar");
  if (siteTitle && userInfoBar) {
    siteTitle.addEventListener("dblclick", () => {
      userInfoBar.style.display = userInfoBar.style.display === "none" ? "flex" : "none";
    });
  }

  document.getElementById("btn-start-bet")?.addEventListener("click", () => {
    document.getElementById("user-info-bar").style.display = "flex";
    document.getElementById("nav-group").style.display = "block";
    switchView("view-group-stage");
  });

  function updateChangeUserButton() {
    const btn = document.getElementById("btn-change-my-bet");
    if(btn) {
      if(localStorage.getItem("my_bet_name")) {
        btn.style.display = "none"; // Oculto de momento a petición del usuario
      } else {
        btn.style.display = "none";
      }
    }
  }
  updateChangeUserButton();

  document.getElementById("btn-change-my-bet")?.addEventListener("click", () => {
    localStorage.removeItem("my_bet_name");
    updateChangeUserButton();
    document.getElementById("btn-view-my-bet")?.click();
  });

  document.getElementById("btn-view-my-bet")?.addEventListener("click", () => {
    const participants = window.participantsHashes || [];
    
    if (participants.length === 0) {
      alert("Cargando datos... espera unos segundos y vuelve a darle.");
      return;
    }
    
    const savedName = localStorage.getItem("my_bet_name");
    
    if (savedName) {
      const found = participants.find(p => {
        const part = decodeHash(p.hash);
        return part && part.user === savedName;
      });
      if (found) {
        viewBet(found.hash);
        return;
      } else {
        localStorage.removeItem("my_bet_name");
        updateChangeUserButton();
      }
    }
    
    const datalist = document.getElementById("my-bet-names-list");
    if(datalist) {
      try {
        datalist.innerHTML = '';
        const names = participants.map(p => {
          const part = decodeHash(p.hash);
          return part && part.user ? String(part.user) : "";
        }).filter(n => n).sort((a, b) => String(a).localeCompare(String(b)));
        
        const uniqueNames = [...new Set(names)];
        uniqueNames.forEach(n => {
          const opt = document.createElement("option");
          opt.value = n;
          datalist.appendChild(opt);
        });
      } catch (err) {
        alert("Error JS: " + err.message);
      }
    }
    
    document.getElementById("my-bet-modal").style.display = "flex";
  });

  document.getElementById("btn-save-my-bet")?.addEventListener("click", () => {
    const selectedName = document.getElementById("my-bet-input").value.trim();
    if (!selectedName) {
      alert("Por favor, selecciona tu nombre.");
      return;
    }
    
    localStorage.setItem("my_bet_name", selectedName);
    updateChangeUserButton();
    document.getElementById("my-bet-modal").style.display = "none";
    
    const found = window.participantsHashes.find(p => {
      const part = decodeHash(p.hash);
      return part && part.user === selectedName;
    });
    
    if (found) {
      viewBet(found.hash);
    }
  });

  document.getElementById("user-name").addEventListener("input", (e) => {
    const isAdmin = checkAdmin(e.target.value.trim());
    // Removed perfect fill buttons
    updateOfficialUI();
  });
  
  window.viewBet = function(hash) {
    const part = decodeHash(hash);
    if (!part) return;
    
    window.previousViewForReadOnly = document.querySelector('.view-section.active')?.id || "view-leaderboard";
    window.isReadOnly = true;
    const bracketToolbar = document.querySelector(".bracket-toolbar");
    if (bracketToolbar) bracketToolbar.style.display = "none";
    document.getElementById("read-only-banner").style.display = "block";
    document.getElementById("thirds-read-only-banner").style.display = "block";
    document.getElementById("bracket-read-only-banner").style.display = "block";
    document.getElementById("read-only-name").textContent = part.user;
    document.getElementById("thirds-read-only-name").textContent = part.user;
    document.getElementById("bracket-read-only-name").textContent = part.user;
    
    // Set Scorer in Banners
    document.getElementById("read-only-scorer-name").textContent = part.scorer || "Ninguno";
    document.getElementById("thirds-read-only-scorer-name").textContent = part.scorer || "Ninguno";
    document.getElementById("bracket-read-only-scorer-name").textContent = part.scorer || "Ninguno";
    
    // Hide UI elements not needed in Read-Only
    const groupDesc = document.getElementById("group-stage-desc");
    if(groupDesc) groupDesc.style.display = "none";
    const thirdsDesc = document.getElementById("thirds-stage-desc");
    if(thirdsDesc) thirdsDesc.style.display = "none";
    const btnGenBracket = document.getElementById("btn-generate-bracket");
    if(btnGenBracket) btnGenBracket.style.display = "none";
    const btnGoThirds = document.getElementById("btn-go-thirds");
    if(btnGoThirds) btnGoThirds.style.display = "none";
    
    // Hide save button
    const saveBtn = document.getElementById("btn-save-bet");
    if(saveBtn) saveBtn.style.display = "none";
    
    // Populate Groups
    if (part.groups) {
      Object.keys(part.groups).forEach(g => {
        const sel1 = document.getElementById(`select-g${g}-1`);
        const sel2 = document.getElementById(`select-g${g}-2`);
        const sel3 = document.getElementById(`select-g${g}-3`);
        const getOfficialPositionAndMp = (groupName, teamName) => {
            if (!window.officialPoints || !window.officialPoints[groupName] || !window.groupOdds) return {pos: -1, mp: 0};
            const teams = window.groupOdds[groupName].map(t => {
                const safeKey = t.name.replace(/[.#$\[\]]/g, "");
                const officialData = window.officialPoints[groupName][safeKey];
                const pts = (typeof officialData === 'object' && officialData !== null) ? (officialData.pts || 0) : (officialData || 0);
                const diff = officialData?.diff || 0;
                const gls = officialData?.gls || 0;
                const mp = officialData?.mp || 0;
                return { name: t.name, pts, diff, gls, mp };
            });
            teams.sort((a,b) => {
                if(b.pts !== a.pts) return b.pts - a.pts;
                if(b.diff !== a.diff) return b.diff - a.diff;
                return b.gls - a.gls;
            });
            const pos = teams.findIndex(t => t.name === teamName) + 1;
            const mp = teams.find(t => t.name === teamName)?.mp || 0;
            return {pos, mp};
        };

        const applyColor = (sel, groupName, teamName, expectedPos) => {
            if (!sel || !teamName) return;
            const {pos, mp} = getOfficialPositionAndMp(groupName, teamName);
            if (mp > 0) {
                if (pos === expectedPos) {
                    sel.style.backgroundColor = "rgba(46, 204, 113, 0.25)";
                    sel.style.color = "#2ecc71";
                    sel.style.borderColor = "#2ecc71";
                } else if (pos <= 3) {
                    sel.style.backgroundColor = "rgba(52, 152, 219, 0.25)";
                    sel.style.color = "#3498db";
                    sel.style.borderColor = "#3498db";
                } else {
                    sel.style.backgroundColor = "rgba(231, 76, 60, 0.25)";
                    sel.style.color = "#e74c3c";
                    sel.style.borderColor = "#e74c3c";
                }
            } else {
                sel.style.backgroundColor = "";
                sel.style.color = "";
                sel.style.borderColor = "";
            }
        };

        if (sel1 && part.groups[g][0]) {
            sel1.value = part.groups[g][0];
            applyColor(sel1, g, part.groups[g][0], 1);
        }
        if (sel2 && part.groups[g][1]) {
            sel2.value = part.groups[g][1];
            applyColor(sel2, g, part.groups[g][1], 2);
        }
        if (sel3 && part.groups[g][2]) {
            sel3.value = part.groups[g][2];
            applyColor(sel3, g, part.groups[g][2], 3);
        }
        
        // Update labels
        const btn = document.getElementById(`third-btn-${g}`);
        if(btn) {
           const teamName = part.groups[g][2] || "-";
           let flagHtml = "";
           if (teamName !== "-" && !teamName.includes("º")) {
               flagHtml = `<img src="https://flagcdn.com/16x12/${getCountryCode(teamName)}.png" alt="" style="margin-right:5px; vertical-align:middle;">`;
           }
           btn.querySelector(".t-name").innerHTML = `${flagHtml}${teamName}`;
           if (part.thirds && part.thirds.includes(part.groups[g][2])) {
              btn.classList.add("selected");
           } else {
              btn.classList.remove("selected");
           }
        }
      });
      validateGroupStage();
    }
    
    // Populate Bracket
    const parseRound = (roundData) => {
      if(!roundData) return [];
      return roundData.map((m, i) => ({
         home: findTeamObj(m[0]),
         away: findTeamObj(m[1]),
         id: 'L_' + i // dummy
      }));
    };
    
    if (part.r32) {
       bracketState.r32.left = parseRound(part.r32.slice(0, 8));
       bracketState.r32.right = parseRound(part.r32.slice(8, 16));
    }
    if (part.r16) {
       bracketState.r16.left = parseRound(part.r16.slice(0, 4));
       bracketState.r16.right = parseRound(part.r16.slice(4, 8));
    }
    if (part.qf) {
       bracketState.qf.left = parseRound(part.qf.slice(0, 2));
       bracketState.qf.right = parseRound(part.qf.slice(2, 4));
    }
    if (part.sf) {
       bracketState.sf.left = parseRound(part.sf.slice(0, 1));
       bracketState.sf.right = parseRound(part.sf.slice(1, 2));
    }
    if (part.final) {
       bracketState.final = { home: findTeamObj(part.final[0]), away: findTeamObj(part.final[1]) };
    }
    if (part.champion) {
       bracketState.champion = findTeamObj(part.champion);
    }
    if (part.thirdPlaceMatch) {
       bracketState.thirdPlaceMatch = { home: findTeamObj(part.thirdPlaceMatch[0]), away: findTeamObj(part.thirdPlaceMatch[1]) };
    }
    if (part.thirdPlaceWinner) {
       bracketState.thirdPlaceWinner = findTeamObj(part.thirdPlaceWinner);
    }
    
    if (part.scorer) {
       const input = document.getElementById("top-scorer-select");
       if(input) input.value = part.scorer;
    }
    
    // Disable inputs
    document.querySelectorAll(".group-slot select").forEach(s => s.disabled = true);
    document.querySelectorAll(".third-checkbox").forEach(c => c.style.pointerEvents = "none");
    const topScorerSelect = document.getElementById("top-scorer-select");
    if(topScorerSelect) topScorerSelect.disabled = true;

    if(typeof updateThirdsContainers === "function") updateThirdsContainers();
    switchView("view-group-stage");
  };
}

window.isReadOnly = false;
window.exitReadOnlyMode = function() {
   window.isReadOnly = false;
   if (window.groupOdds) {
       Object.keys(window.groupOdds).forEach(g => {
           for (let i = 1; i <= 3; i++) {
               const sel = document.getElementById(`select-g${g}-${i}`);
               if (sel) {
                   sel.style.backgroundColor = "";
                   sel.style.color = "";
                   sel.style.borderColor = "";
               }
           }
       });
   }
   const bracketToolbar = document.querySelector(".bracket-toolbar");
   if (bracketToolbar) bracketToolbar.style.display = "flex";
   document.getElementById("read-only-banner").style.display = "none";
   document.getElementById("thirds-read-only-banner").style.display = "none";
   document.getElementById("bracket-read-only-banner").style.display = "none";
   
   // Restore UI elements
   const groupDesc = document.getElementById("group-stage-desc");
   if(groupDesc) groupDesc.style.display = "block";
   const thirdsDesc = document.getElementById("thirds-stage-desc");
   if(thirdsDesc) thirdsDesc.style.display = "block";
   const btnGenBracket = document.getElementById("btn-generate-bracket");
   if(btnGenBracket) btnGenBracket.style.display = "inline-block";
   const btnGoThirds = document.getElementById("btn-go-thirds");
   if(btnGoThirds) btnGoThirds.style.display = "inline-block";
   
   updateOfficialUI();
   
   const prevView = window.previousViewForReadOnly || "view-leaderboard";
   if (prevView === "view-leaderboard") {
      const navLeaderboard = document.getElementById("nav-leaderboard");
      if(navLeaderboard) navLeaderboard.click();
   } else {
      switchView(prevView);
   }
};

// ----------------------------------------------------
// GROUP STAGE SELECT VIEW
// ----------------------------------------------------
function renderHomeStandings() {
  const grid = document.getElementById("home-standings-grid");
  if (!grid) return;
  
  const isAdmin = checkAdmin(document.getElementById("user-name").value.trim());
  
  grid.innerHTML = "";
  
  Object.keys(window.groupOdds).forEach(groupName => {
    const teams = window.groupOdds[groupName];
    
    // Sort by points, diff, goals, head-to-head, then alphabetically
    const sortedTeams = [...teams].sort((a,b) => window.compareTeams(a, b, groupName));
    
    const card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML = `<h3>Grupo ${groupName}</h3>`;
    
    sortedTeams.forEach((t, idx) => {
      const stats = (window.officialPoints[groupName] && window.officialPoints[groupName][t.name.replace(/[.#$\[\]]/g, "")]);
      const pts = (typeof stats === 'object' && stats !== null) ? (stats.pts || 0) : (stats || 0);
      const row = document.createElement("div");
      row.className = "group-slot";
      
      const adminTiebreakerBtn = isAdmin ? `<button onclick="window.bumpTeam('${groupName}', '${t.name.replace(/'/g, "\\'")}')" class="glass-btn" style="padding: 2px 5px; margin-right: 5px; font-size: 0.7em; background: rgba(0, 255, 0, 0.2);" title="Subir posición (Desempate Manual)">⬆️</button>` : '';

      row.innerHTML = `
        <span style="font-weight: bold; width: 20px;">${idx+1}.</span>
        ${adminTiebreakerBtn}
        <img src="https://flagcdn.com/16x12/${getCountryCode(t.name)}.png" alt="" style="margin-right: 8px;">
        <span style="flex-grow: 1;">${t.name}</span>
        <span style="font-weight: bold; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px;">${pts}</span>
      `;
      card.appendChild(row);
    });
    
    grid.appendChild(card);
  });
  
  // Inject API Sync button if not exists
  if (isAdmin && !document.getElementById("btn-sync-api")) {
    const actionContainer = document.getElementById("btn-view-my-bet") ? document.getElementById("btn-view-my-bet").parentElement : null;
    if (actionContainer) {
      const syncBtn = document.createElement("button");
      syncBtn.id = "btn-sync-api";
      syncBtn.className = "glass-btn primary-btn";
      syncBtn.style.background = "#2563eb";
      syncBtn.style.borderColor = "#3b82f6";
      syncBtn.innerHTML = "🤖 Auto-Actualizar (API)";
      syncBtn.onclick = syncWithApi;
      actionContainer.appendChild(syncBtn);
    }
  } else if (!isAdmin && document.getElementById("btn-sync-api")) {
    document.getElementById("btn-sync-api").style.display = "none";
  } else if (isAdmin && document.getElementById("btn-sync-api")) {
    document.getElementById("btn-sync-api").style.display = "inline-block";
  }
  
  // Inject Fake Goal button if not exists
  if (isAdmin && !document.getElementById("btn-fake-goal")) {
    const actionContainer = document.getElementById("btn-view-my-bet") ? document.getElementById("btn-view-my-bet").parentElement : null;
    if (actionContainer) {
      const fakeBtn = document.createElement("button");
      fakeBtn.id = "btn-fake-goal";
      fakeBtn.className = "glass-btn primary-btn";
      fakeBtn.style.background = "#dc2626";
      fakeBtn.style.borderColor = "#ef4444";
      fakeBtn.innerHTML = "⚽ Fake Goal (Test)";
      fakeBtn.onclick = () => {
          window.fakeGoalTriggered = true;
          syncWithApi(true);
      };
      actionContainer.appendChild(fakeBtn);
    }
  } else if (!isAdmin && document.getElementById("btn-fake-goal")) {
    document.getElementById("btn-fake-goal").style.display = "none";
  } else if (isAdmin && document.getElementById("btn-fake-goal")) {
    document.getElementById("btn-fake-goal").style.display = "inline-block";
  }
}

window.openRtvePlayer = function() {
    const modal = document.getElementById('rtve-modal');
    if (modal) {
        window.setPlayerSource('rtve');
        modal.style.display = 'flex';
    }
};

window.setPlayerSource = function(source) {
    const btnRtve = document.getElementById('btn-player-rtve');
    const btnAce = document.getElementById('btn-player-ace');
    const btnFctv = document.getElementById('btn-player-fctv');
    const containerRtve = document.getElementById('player-container-rtve');
    const containerAce = document.getElementById('player-container-ace');
    const containerFctv = document.getElementById('player-container-fctv');
    const iframeRtve = document.getElementById('rtve-iframe');
    const iframeFctv = document.getElementById('fctv-iframe');

    // Reset styles
    [btnRtve, btnAce, btnFctv].forEach(btn => {
        if(btn) {
            btn.style.background = '#2a2a35';
            btn.style.border = '1px solid #444';
        }
    });

    if (source === 'rtve') {
        if(btnRtve) { btnRtve.style.background = '#ff4757'; btnRtve.style.border = 'none'; }
        
        containerAce.style.display = 'none';
        if(containerFctv) containerFctv.style.display = 'none';
        containerRtve.style.display = 'block';
        
        if (!iframeRtve.src.includes('rtve.es')) {
            iframeRtve.src = "https://secure-embed.rtve.es/drmn/embed/video/1688877/";
        }
    } else if (source === 'acestream') {
        if(btnAce) { btnAce.style.background = '#ff4757'; btnAce.style.border = 'none'; }
        
        containerRtve.style.display = 'none';
        if(containerFctv) containerFctv.style.display = 'none';
        containerAce.style.display = 'block';
        
        iframeRtve.src = ""; // Stop audio
    } else if (source === 'fctv') {
        if(btnFctv) { btnFctv.style.background = '#ff4757'; btnFctv.style.border = 'none'; }
        
        containerRtve.style.display = 'none';
        containerAce.style.display = 'none';
        if(containerFctv) containerFctv.style.display = 'block';
        
        iframeRtve.src = ""; // Stop audio
        
        // Buscar el partido en directo
        const liveMatches = (window.matchRadar && window.matchRadar.live) ? window.matchRadar.live : [];
        let fctvUrl = null;
        
        for (const m of liveMatches) {
            const key = _normalizeFctv(m.home) + ' vs ' + _normalizeFctv(m.away);
            if (window.fctvMatchUrls[key]) {
                fctvUrl = window.fctvMatchUrls[key];
                break;
            }
            // Probar invertido
            const keyRev = _normalizeFctv(m.away) + ' vs ' + _normalizeFctv(m.home);
            if (window.fctvMatchUrls[keyRev]) {
                fctvUrl = window.fctvMatchUrls[keyRev];
                break;
            }
        }
        
        if (fctvUrl) {
            // Transformar la URL estática al formato del reproductor directo (live)
            // Original: https://fctv33hd.yachts/es/football/fifa-world-cup-match-4318059/usa-vs-paraguay-06-2026.html
            // Destino:  https://jack07eo.mpstickv5m73jgravity.my/es/football/fifa-world-cup-4318059/usa-vs-paraguay.html?icg=RVM&ilang=es
            let liveUrl = fctvUrl.replace('https://fctv33hd.yachts/es/football/fifa-world-cup-match-', 'https://jack07eo.mpstickv5m73jgravity.my/es/football/fifa-world-cup-');
            liveUrl = liveUrl.replace('-06-2026.html', '.html?icg=RVM&ilang=es');
            
            iframeFctv.src = liveUrl;
        } else if (liveMatches.length === 0) {
            alert('No hay ningún partido en directo ahora mismo.');
            iframeFctv.src = "";
        } else {
            // Fallback (poco probable que pase)
            iframeFctv.src = 'https://jack07eo.mpstickv5m73jgravity.my/es/football';
        }
    }
};

// El mapa fctvMatchUrls y la funcion _normalizeFctv se han movido a fctv-links.js


function renderLastMatches() {
  const renderMatches = (matches, containerId, matchType) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";
    
    if (!matches || matches.length === 0) {
      container.innerHTML = `<p style='color: var(--text-muted); font-style: italic; width: 100%; text-align: center;'>No hay partidos ${matchType === "next" ? "próximos" : (matchType === "live" ? "en curso" : "finalizados")}.</p>`;
      return;
    }
    
    matches.forEach(m => {
      let dateFormatted = m.date;
      try {
        const d = new Date(m.date);
        if (!isNaN(d.getTime())) {
           dateFormatted = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + " - " + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' });
        }
      } catch(e) {}

      const homeCode = getCountryCode(m.home);
      const awayCode = getCountryCode(m.away);
      const homeFlag = homeCode ? `<img src="https://flagcdn.com/24x18/${homeCode}.png" alt="">` : `<div style="width:24px; height:18px; background:rgba(255,255,255,0.1); border-radius:3px;"></div>`;
      const awayFlag = awayCode ? `<img src="https://flagcdn.com/24x18/${awayCode}.png" alt="">` : `<div style="width:24px; height:18px; background:rgba(255,255,255,0.1); border-radius:3px;"></div>`;

      const scoreHtml = (matchType === 'next' || m.isStartingSoon)
          ? `<div class="last-match-score score-vs">VS</div>`
          : `<div class="last-match-score">${m.homeScore} - ${m.awayScore}</div>`;

      let icon = '✔️';
      if (matchType === 'next') icon = '🕒';
      if (matchType === 'live') {
          if (m.isStartingSoon) {
              icon = '<span style="color:#00d2d3; font-weight:900; font-style:italic;">PRÓXIMO</span>';
          } else {
              icon = '<span style="color:#ff4757; font-weight:900; font-style:italic;">LIVE</span>';
          }
      }

      const card = document.createElement("div");
      card.className = "last-match-card";
      
      let rtveBtn = '';
      if (matchType === 'live') {
          // Both actual LIVE and Starting Soon matches get the watch button
          rtveBtn = `<button onclick="window.openRtvePlayer()" style="width: 100%; margin-top: 10px; background: #ff0000; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;"><span>🔴</span> Ver Partido${m.isStartingSoon ? '' : ' en Directo'}</button>`;
      }

      card.innerHTML = `
        <div class="last-match-date">${icon} ${dateFormatted}</div>
        <div class="last-match-teams">
          <div class="last-match-team">
            ${homeFlag}
            <span>${m.home}</span>
          </div>
          ${scoreHtml}
          <div class="last-match-team away">
            ${awayFlag}
            <span>${m.away}</span>
          </div>
        </div>
        ${rtveBtn}
      `;
      container.appendChild(card);
    });
  };

  const radar = window.matchRadar || {};
  const radarLive = radar.live || [];
  const radarLast = radar.last || [];
  const radarNext = radar.next || [];
  
  const liveWrapperHome = document.getElementById("live-matches-wrapper-home");
  const liveWrapperGroups = document.getElementById("live-matches-wrapper-groups");
  
  if (radarLive.length > 0) {
      if (liveWrapperHome) liveWrapperHome.style.display = "block";
      if (liveWrapperGroups) liveWrapperGroups.style.display = "block";
      renderMatches(radarLive, "live-matches-container-home", 'live');
      renderMatches(radarLive, "live-matches-container-groups", 'live');
  } else {
      if (liveWrapperHome) liveWrapperHome.style.display = "none";
      if (liveWrapperGroups) liveWrapperGroups.style.display = "none";
  }
  
  // Render for home (3 matches)
  renderMatches(radarLast.slice(0, 3), "last-matches-container-home", 'last');
  renderMatches(radarNext.slice(0, 3), "next-matches-container-home", 'next');

  // Render for radar tab (5 matches)
  renderMatches(radarLast.slice(0, 5), "last-matches-container-radar", 'last');
  renderMatches(radarNext.slice(0, 5), "next-matches-container-radar", 'next');
}

function setupGroupStageView() {
  const grid = document.getElementById("groups-grid");
  
  // Create 12 group cards
  Object.keys(window.groupOdds).forEach(groupName => {
    const teams = window.groupOdds[groupName];
    
    // Sort alphabetically for display
    const sortedTeams = [...teams].sort((a,b) => a.name.localeCompare(b.name));
    
    const card = document.createElement("div");
    card.className = "group-card";
    
    // Create a list of the 4 teams
    const teamNames = sortedTeams.map(t => `<div class="team-badge" style="cursor: pointer;" onclick="fillGroupSlot('${groupName}', '${t.name}')"><img src="https://flagcdn.com/16x12/${getCountryCode(t.name)}.png" alt=""> ${t.name}</div>`).join('');
    
    card.innerHTML = `
      <h3>GRUPO ${groupName}</h3>
      <div class="group-teams-list">${teamNames}</div>
      <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 15px 0;">
    `;
    
    // 1st, 2nd, 3rd dropdowns
    ['1º', '2º', '3º'].forEach((pos, idx) => {
      const slot = document.createElement("div");
      slot.className = "group-slot";
      slot.innerHTML = `<span>${pos}</span>`;
      
      const select = document.createElement("select");
      select.className = "glass-select";
      select.id = `select-g${groupName}-${idx+1}`;
      select.innerHTML = `<option value="">-- Seleccionar --</option>`;
      
      sortedTeams.forEach(t => {
        select.innerHTML += `<option value="${t.name}">${t.name}</option>`;
      });
      
      select.addEventListener("change", validateGroupStage);
      slot.appendChild(select);
      card.appendChild(slot);
    });
    
    grid.appendChild(card);
    
    // Create third-place checkbox
    const thirdBtn = document.createElement("div");
    thirdBtn.className = "third-checkbox";
    thirdBtn.id = `third-btn-${groupName}`;
    thirdBtn.innerHTML = `<b>3º ${groupName}</b> <span class="t-name">-</span>`;
    thirdBtn.dataset.group = groupName;
    thirdBtn.addEventListener("click", () => toggleThird(groupName));
    document.getElementById("thirds-eliminated")?.appendChild(thirdBtn);
  });

  document.getElementById("btn-generate-bracket").addEventListener("click", goToBracket);

  if(typeof updateThirdsContainers === "function") updateThirdsContainers();
}

window.updateThirdsContainers = function() {
  const classified = document.getElementById("thirds-classified");
  const eliminated = document.getElementById("thirds-eliminated");
  if (!classified || !eliminated) return;
  
  const allThirds = document.querySelectorAll(".third-checkbox");
  allThirds.forEach(btn => {
    if (btn.classList.contains("selected")) {
      classified.appendChild(btn);
    } else {
      eliminated.appendChild(btn);
    }
  });
};



function fillGroupSlot(groupName, teamName) {
  if(window.isReadOnly) return;
  const s1 = document.getElementById(`select-g${groupName}-1`);
  const s2 = document.getElementById(`select-g${groupName}-2`);
  const s3 = document.getElementById(`select-g${groupName}-3`);

  // Evitar duplicados
  if (s1.value === teamName || s2.value === teamName || s3.value === teamName) return;

  if (!s1.value) {
    s1.value = teamName;
  } else if (!s2.value) {
    s2.value = teamName;
  } else if (!s3.value) {
    s3.value = teamName;
  } else {
    // Si están todos llenos, resetear y empezar por el 1
    s1.value = teamName;
    s2.value = "";
    s3.value = "";
  }
  
  validateGroupStage();
}

function toggleThird(groupName) {
  if(window.isReadOnly) return;
  const isAdmin = checkAdmin(document.getElementById("user-name").value.trim());
  if (!isAdmin) return;

  const btn = document.getElementById(`third-btn-${groupName}`);
  const thirdSelect = document.getElementById(`select-g${groupName}-3`);
  
  if (!thirdSelect.value) {
    alert("Primero selecciona quién queda 3º en el grupo " + groupName);
    return;
  }
  
  if (btn.classList.contains("selected")) {
    btn.classList.remove("selected");
  } else {
    // Check if we already have 8
    const selectedCount = document.querySelectorAll(".third-checkbox.selected").length;
    if (selectedCount >= 8) {
      alert("Ya has seleccionado los 8 mejores terceros.");
      return;
    }
    btn.classList.add("selected");
  }
  validateGroupStage();
}

function validateGroupStage() {
  let allFilled = true;
  manualGroups = {};
  
  // Update third place names in the checkbox area
  Object.keys(window.groupOdds).forEach(g => {
    const s1 = document.getElementById(`select-g${g}-1`).value;
    const s2 = document.getElementById(`select-g${g}-2`).value;
    const s3 = document.getElementById(`select-g${g}-3`).value;
    
    const tNameSpan = document.getElementById(`third-btn-${g}`).querySelector(".t-name");
    if (s3) {
       const flagHtml = s3.includes("º") ? '' : `<img src="https://flagcdn.com/16x12/${getCountryCode(s3)}.png" alt="" style="margin-right:5px; vertical-align:middle;">`;
       tNameSpan.innerHTML = `${flagHtml}${s3}`;
    } else {
       tNameSpan.textContent = "-";
    }

    if (!s1 || !s2 || !s3 || s1===s2 || s1===s3 || s2===s3) {
      allFilled = false;
    } else {
      // Find full team objects and inject the group property
      const getTeam = (name) => {
        const t = window.groupOdds[g].find(team => team.name === name);
        return t ? { ...t, group: g } : null;
      };
      manualGroups[g] = { first: getTeam(s1), second: getTeam(s2), third: getTeam(s3) };
    }
  });

  const selectedThirdsCount = document.querySelectorAll(".third-checkbox.selected").length;
  
  const btnNext = document.getElementById("btn-generate-bracket");
  if (allFilled && selectedThirdsCount === 8) {
    btnNext.disabled = false;
  } else {
    btnNext.disabled = true;
  }
  if(typeof updateThirdsContainers === "function") updateThirdsContainers();
}

function goToBracket() {
  if (window.isReadOnly) {
    document.getElementById("nav-bracket").style.display = "block";
    document.getElementById("nav-bracket").click();
    return;
  }

  // Collect selected thirds
  manualThirds = [];
  document.querySelectorAll(".third-checkbox.selected").forEach(btn => {
    const g = btn.dataset.group;
    manualThirds.push(manualGroups[g].third);
  });

  // Generate R32 using simulator logic (Annex C)
  bracketState.r32 = generateR32FromManual(manualGroups, manualThirds);
  
  // Initialize empty next rounds
  bracketState.r16 = { 
    left: Array(4).fill(null).map((_,i)=>({home:null, away:null, id:`L8_${i}`})), 
    right: Array(4).fill(null).map((_,i)=>({home:null, away:null, id:`R8_${i}`})) 
  };
  bracketState.qf = { 
    left: Array(2).fill(null).map((_,i)=>({home:null, away:null, id:`L4_${i}`})), 
    right: Array(2).fill(null).map((_,i)=>({home:null, away:null, id:`R4_${i}`})) 
  };
  bracketState.sf = { 
    left: [{home:null, away:null, id:'FINAL0'}], 
    right: [{home:null, away:null, id:'FINAL1'}] 
  };
  bracketState.final = null;
  bracketState.champion = null;
  bracketState.thirdPlaceMatch = null;
  bracketState.thirdPlaceWinner = null;

  renderInteractiveBracket();
  
  // Disable group selects once in bracket view
  document.querySelectorAll(".group-slot select").forEach(s => s.disabled = true);
  
  document.getElementById("nav-bracket").style.display = "block";
  document.getElementById("nav-bracket").click();
}

// ----------------------------------------------------
// BRACKET VIEW (INTERACTIVE)
// ----------------------------------------------------

function createInteractiveMatch(homeTeam, awayTeam, matchId, nextRoundMatchId, side, roundIndex, matchIndex) {
  const matchDiv = document.createElement("div");
  matchDiv.className = "match";
  matchDiv.id = `match-${matchId}`;

  // Check who advanced
  let advancedTeam = null;
  if (roundIndex < 3) {
    let nextRoundArray = null;
    if (roundIndex === 0) nextRoundArray = bracketState.r16[side];
    else if (roundIndex === 1) nextRoundArray = bracketState.qf[side];
    else if (roundIndex === 2) nextRoundArray = bracketState.sf[side];
    
    if (nextRoundArray) {
      const nextMatchIdx = Math.floor(matchIndex / 2);
      const nextMatch = nextRoundArray[nextMatchIdx];
      if (nextMatch) {
        if (nextMatch.home && homeTeam && nextMatch.home.name === homeTeam.name) advancedTeam = homeTeam.name;
        else if (nextMatch.away && homeTeam && nextMatch.away.name === homeTeam.name) advancedTeam = homeTeam.name;
        else if (nextMatch.home && awayTeam && nextMatch.home.name === awayTeam.name) advancedTeam = awayTeam.name;
        else if (nextMatch.away && awayTeam && nextMatch.away.name === awayTeam.name) advancedTeam = awayTeam.name;
      }
    }
  } else if (roundIndex === 3) {
    if (bracketState.final) {
      if (bracketState.final.home?.name === homeTeam?.name || bracketState.final.away?.name === homeTeam?.name) advancedTeam = homeTeam?.name;
      else if (bracketState.final.home?.name === awayTeam?.name || bracketState.final.away?.name === awayTeam?.name) advancedTeam = awayTeam?.name;
    }
  } else if (roundIndex === 4) {
    if (bracketState.champion) advancedTeam = bracketState.champion.name;
  } else if (roundIndex === 5) {
    if (bracketState.thirdPlaceWinner) advancedTeam = bracketState.thirdPlaceWinner.name;
  }

  const renderTeam = (team) => {
    if (!team) return `<div class="team-slot empty">Por definir</div>`;
    
    let stateClass = "";
    if (advancedTeam) {
      if (team.name === advancedTeam) stateClass = "winner";
      else stateClass = "loser";
    }

    const flagHtml = `<img src="https://flagcdn.com/24x18/${getCountryCode(team.name)}.png" alt="">`;
    return `<div class="team-slot ${stateClass}" data-team="${team.name}" onclick="advanceTeam('${team.name}', '${matchId}', '${nextRoundMatchId}', '${side}', ${roundIndex}, ${matchIndex})">
              ${flagHtml} <span>${team.name}</span>
            </div>`;
  };

  matchDiv.innerHTML = `
    ${renderTeam(homeTeam)}
    ${renderTeam(awayTeam)}
  `;
  return matchDiv;
}

const countryCodeMap = {
  "México": "mx", "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz",
  "Canadá": "ca", "Bosnia y Her.": "ba", "Catar": "qa", "Suiza": "ch",
  "Brasil": "br", "Marruecos": "ma", "Haití": "ht", "Escocia": "gb-sct",
  "EEUU": "us", "Paraguay": "py", "Australia": "au", "Turquía": "tr",
  "Alemania": "de", "Curaçao": "cw", "Costa de Marfil": "ci", "Ecuador": "ec",
  "Países Bajos": "nl", "Japón": "jp", "Suecia": "se", "Túnez": "tn",
  "Bélgica": "be", "Egipto": "eg", "Irán": "ir", "Nueva Zelanda": "nz",
  "España": "es", "Cabo Verde": "cv", "Arabia Saudí": "sa", "Uruguay": "uy",
  "Francia": "fr", "Senegal": "sn", "Irak": "iq", "Noruega": "no",
  "Argentina": "ar", "Argelia": "dz", "Austria": "at", "Jordania": "jo",
  "Portugal": "pt", "RD Congo": "cd", "Uzbekistán": "uz", "Colombia": "co",
  "Inglaterra": "gb-eng", "Croacia": "hr", "Ghana": "gh", "Panamá": "pa"
};

function getCountryCode(name) {
  return countryCodeMap[name] || "xx";
}

function findTeamObj(name) {
  if(!name) return null;
  for (const group of Object.values(window.groupOdds)) {
    const t = group.find(t => t.name === name);
    if (t) return t;
  }
  return null;
}

function advanceTeam(teamName, currentMatchId, nextMatchId, side, roundIndex, matchIndex) {
  if(window.isReadOnly) return;
  if (!teamName || teamName.includes("º")) return;
  const team = findTeamObj(teamName);
  
  // Determine which round is next based on roundIndex
  // roundIndex: 0=r32, 1=r16, 2=qf, 3=sf, 4=final, 5=thirdPlace
  let nextRoundArray = null;
  if (roundIndex === 0) nextRoundArray = bracketState.r16[side];
  else if (roundIndex === 1) nextRoundArray = bracketState.qf[side];
  else if (roundIndex === 2) nextRoundArray = bracketState.sf[side];
  
  if (roundIndex < 3) {
    // Determine target match index in the next round (integer division by 2)
    const nextMatchIdx = Math.floor(matchIndex / 2);
    const isHome = matchIndex % 2 === 0; // Even index goes to home slot, odd to away slot
    
    if (!nextRoundArray[nextMatchIdx]) {
      nextRoundArray[nextMatchIdx] = { home: null, away: null, id: nextMatchId };
    }
    
    if (isHome) nextRoundArray[nextMatchIdx].home = team;
    else nextRoundArray[nextMatchIdx].away = team;

    // Clear cascade if selection changes
    clearCascade(side, roundIndex + 1, nextMatchIdx);
  } else if (roundIndex === 3) {
    // Advancing from SF to Final / Third Place
    if (!bracketState.final) bracketState.final = { home: null, away: null, id: "FINAL" };
    if (!bracketState.thirdPlaceMatch) bracketState.thirdPlaceMatch = { home: null, away: null, id: "THIRD" };
    
    const loserTeam = bracketState.sf[side][0].home.name === teamName ? bracketState.sf[side][0].away : bracketState.sf[side][0].home;

    if (side === 'left') {
      bracketState.final.home = team;
      bracketState.thirdPlaceMatch.home = loserTeam;
    } else {
      bracketState.final.away = team;
      bracketState.thirdPlaceMatch.away = loserTeam;
    }
    
    bracketState.champion = null;
    bracketState.thirdPlaceWinner = null;
  } else if (roundIndex === 4) {
    bracketState.champion = team;
  } else if (roundIndex === 5) {
    bracketState.thirdPlaceWinner = team;
  }

  renderInteractiveBracket();
}

window.advanceTeam = advanceTeam;

// Admin helper function to bump a team's tiebreaker score manually
window.bumpTeam = function(groupName, teamName) {
    const safeTeamName = teamName.replace(/[.#$\[\]]/g, "");
    if (!window.manualTiebreakers[groupName]) {
        window.manualTiebreakers[groupName] = {};
    }
    if (!window.manualTiebreakers[groupName][safeTeamName]) {
        window.manualTiebreakers[groupName][safeTeamName] = 0;
    }
    window.manualTiebreakers[groupName][safeTeamName] += 1;
    
    // Save to Firebase so everyone sees the updated ranking
    set(ref(database, 'manualTiebreakers'), window.manualTiebreakers)
      .then(() => {
          renderHomeStandings();
          syncWithApi(true); // Recalculate virtual groups
      });
};

onValue(ref(database, 'manualTiebreakers'), (snapshot) => {
    if (snapshot.exists()) {
        window.manualTiebreakers = snapshot.val();
        renderHomeStandings();
    }
});

function clearCascade(side, roundIndex, matchIndex) {
    // Complex to clear cascade fully in simple arrays, 
    // for simplicity we will just let users overwrite slots if they change their mind
}

function renderInteractiveBracket() {
  const containerLeft = document.getElementById("left-bracket");
  const containerRight = document.getElementById("right-bracket");
  
  // Clear containers
  containerLeft.innerHTML = `
    <div class="round r32" id="r32-left"><h2>Dieciseisavos</h2></div>
    <div class="round r16" id="r16-left"><h2>Octavos</h2></div>
    <div class="round qf" id="qf-left"><h2>Cuartos</h2></div>
    <div class="round sf" id="sf-left"><h2>Semifinales</h2></div>
  `;
  containerRight.innerHTML = `
    <div class="round sf" id="sf-right"><h2>Semifinales</h2></div>
    <div class="round qf" id="qf-right"><h2>Cuartos</h2></div>
    <div class="round r16" id="r16-right"><h2>Octavos</h2></div>
    <div class="round r32" id="r32-right"><h2>Dieciseisavos</h2></div>
  `;

  // Helper to render a round array into a column
  function renderRoundCol(colId, matchesArray, side, roundIndex, nextPrefix) {
    const col = document.getElementById(colId);
    if (!matchesArray) return;
    matchesArray.forEach((match, idx) => {
      const nextMatchId = `${nextPrefix}${Math.floor(idx/2)}`;
      col.appendChild(createInteractiveMatch(match.home, match.away, match.id, nextMatchId, side, roundIndex, idx));
    });
  }

  let renderState = bracketState;
  if (!bracketState.r32 || !bracketState.r32.left || bracketState.r32.left.length === 0) {
    renderState = {
      r32: {
        left: [
          { home: {name: "1º Grupo E"}, away: {name: "3º A/B/C/D/F"}, id: 'L1' },
          { home: {name: "1º Grupo I"}, away: {name: "3º C/D/F/G/H"}, id: 'L2' },
          { home: {name: "2º Grupo A"}, away: {name: "2º Grupo B"}, id: 'L3' },
          { home: {name: "1º Grupo F"}, away: {name: "2º Grupo C"}, id: 'L4' },
          { home: {name: "2º Grupo K"}, away: {name: "2º Grupo L"}, id: 'L5' },
          { home: {name: "1º Grupo H"}, away: {name: "2º Grupo J"}, id: 'L6' },
          { home: {name: "1º Grupo D"}, away: {name: "3º B/E/F/I/J"}, id: 'L7' },
          { home: {name: "1º Grupo G"}, away: {name: "3º A/E/H/I/J"}, id: 'L8' }
        ],
        right: [
          { home: {name: "1º Grupo C"}, away: {name: "2º Grupo F"}, id: 'R1' },
          { home: {name: "2º Grupo E"}, away: {name: "2º Grupo I"}, id: 'R2' },
          { home: {name: "1º Grupo A"}, away: {name: "3º C/E/F/H/I"}, id: 'R3' },
          { home: {name: "1º Grupo L"}, away: {name: "3º E/H/I/J/K"}, id: 'R4' },
          { home: {name: "1º Grupo J"}, away: {name: "2º Grupo H"}, id: 'R5' },
          { home: {name: "2º Grupo D"}, away: {name: "2º Grupo G"}, id: 'R6' },
          { home: {name: "1º Grupo B"}, away: {name: "3º E/F/G/I/J"}, id: 'R7' },
          { home: {name: "1º Grupo K"}, away: {name: "3º D/E/I/J/L"}, id: 'R8' }
        ]
      },
      r16: { left: Array(4).fill(null).map((_,i)=>({home:null, away:null, id:`L8_${i}`})), right: Array(4).fill(null).map((_,i)=>({home:null, away:null, id:`R8_${i}`})) },
      qf: { left: Array(2).fill(null).map((_,i)=>({home:null, away:null, id:`L4_${i}`})), right: Array(2).fill(null).map((_,i)=>({home:null, away:null, id:`R4_${i}`})) },
      sf: { left: [{home:null, away:null, id:'L2_0'}], right: [{home:null, away:null, id:'R2_0'}] },
      final: null,
      champion: null,
      thirdPlaceMatch: null,
      thirdPlaceWinner: null
    };
  };




  // Left side
  renderRoundCol("r32-left", renderState.r32.left, 'left', 0, "L16_");
  renderRoundCol("r16-left", renderState.r16.left, 'left', 1, "L8_");
  renderRoundCol("qf-left", renderState.qf.left, 'left', 2, "L4_");
  renderRoundCol("sf-left", renderState.sf.left, 'left', 3, "FINAL");

  // Right side
  renderRoundCol("r32-right", renderState.r32.right, 'right', 0, "R16_");
  renderRoundCol("r16-right", renderState.r16.right, 'right', 1, "R8_");
  renderRoundCol("qf-right", renderState.qf.right, 'right', 2, "R4_");
  renderRoundCol("sf-right", renderState.sf.right, 'right', 3, "FINAL");

  // Center Finals
  const renderTeamDisplay = (team, onclickStr, title) => {
    if (!team) return `<h3>${title}</h3><div class="team-slot empty">Por definir</div>`;
    const flagHtml = team.name.includes("º") ? '' : `<img src="https://flagcdn.com/24x18/${getCountryCode(team.name)}.png" alt="">`;
    return `<h3>${title}</h3><div class="team-slot" ${onclickStr ? `onclick="${onclickStr}"` : ''}>${flagHtml} <span>${team.name}</span></div>`;
  };

  document.getElementById("final-match").innerHTML = `
    <h3>FINAL</h3>
    ${renderState.final ? createInteractiveMatch(renderState.final.home, renderState.final.away, "FINAL", "CHAMP", 'center', 4, 0).innerHTML : '<div class="team-slot empty">Por definir</div><div class="team-slot empty">Por definir</div>'}
  `;

  document.getElementById("champion-display").innerHTML = renderTeamDisplay(renderState.champion, null, "CAMPEÓN");

  document.getElementById("third-place").innerHTML = `
    <h3>TERCER PUESTO</h3>
    ${renderState.thirdPlaceMatch ? createInteractiveMatch(renderState.thirdPlaceMatch.home, renderState.thirdPlaceMatch.away, "THIRD", "THIRD_WIN", 'center', 5, 0).innerHTML : '<div class="team-slot empty">Por definir</div><div class="team-slot empty">Por definir</div>'}
  `;
}

// ----------------------------------------------------
// HASH / CODE GENERATION
// ----------------------------------------------------

document.getElementById("btn-save-hash").addEventListener("click", () => {
  const userName = document.getElementById("user-name").value.trim();
  const betName = document.getElementById("user-bet-name").value.trim();
  const topScorer = document.getElementById("top-scorer-select").value.trim();
  const isAdmin = checkAdmin(userName);

  if (!userName || !betName) {
    alert("¡Por favor, rellena tu Nombre y el Nombre de la Apuesta en la parte superior antes de generar el código!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (!isAdmin && !bracketState.champion) {
    alert("¡Tienes que completar el bracket hasta elegir un campeón!");
    return;
  }
  if (!isAdmin && !topScorer) {
    alert("¡No olvides seleccionar a tu Máximo Goleador!");
    return;
  }

  // Simplify state to just team names
  const simplifiedState = {
    user: userName,
    bet: betName,
    scorer: topScorer,
    groups: {},
    thirds: manualThirds.map(t => t.name),
    r32: [...(bracketState.r32.left||[]), ...(bracketState.r32.right||[])].map(m => m.home?.name && m.away?.name ? [m.home.name, m.away.name] : []),
    r16: [...(bracketState.r16.left||[]), ...(bracketState.r16.right||[])].map(m => m.home?.name && m.away?.name ? [m.home.name, m.away.name] : []),
    qf: [...(bracketState.qf.left||[]), ...(bracketState.qf.right||[])].map(m => m.home?.name && m.away?.name ? [m.home.name, m.away.name] : []),
    sf: [...(bracketState.sf.left||[]), ...(bracketState.sf.right||[])].map(m => m.home?.name && m.away?.name ? [m.home.name, m.away.name] : []),
    final: bracketState.final ? [bracketState.final.home?.name, bracketState.final.away?.name] : [],
    champion: bracketState.champion ? bracketState.champion.name : null,
    thirdPlaceMatch: bracketState.thirdPlaceMatch ? [bracketState.thirdPlaceMatch.home?.name, bracketState.thirdPlaceMatch.away?.name] : [],
    thirdPlaceWinner: bracketState.thirdPlaceWinner ? bracketState.thirdPlaceWinner.name : null
  };

  Object.keys(manualGroups).forEach(g => {
    simplifiedState.groups[g] = [manualGroups[g].first.name, manualGroups[g].second.name, manualGroups[g].third.name];
  });

  const jsonString = JSON.stringify(simplifiedState);
  const hash = btoa(unescape(encodeURIComponent(jsonString)));

  if (checkAdmin(userName)) {
    // Admin override for official results
    set(ref(database, 'official'), hash)
      .then(() => {
        alert("¡Resultados OFICIALES actualizados en la nube con éxito!");
        const btn = document.getElementById("btn-save-hash");
        btn.disabled = true;
        btn.innerText = "✅ Oficiales Guardados";
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
      })
      .catch(e => alert("Error guardando oficiales: " + e.message));
  } else {
    // Standard user bet push (pending confirmation)
    push(ref(database, 'bets'), { hash: hash, paid: false })
      .then(() => {
        alert("¡Apuesta enviada a la nube! Aparecerá como 'Pendiente' hasta que el Administrador confirme tu pago.");
        const btn = document.getElementById("btn-save-hash");
        btn.disabled = true;
        btn.innerText = "✅ Apuesta Enviada";
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
      })
      .catch(e => alert("Error enviando apuesta: " + e.message));
  }
});

document.getElementById("btn-close-modal").addEventListener("click", () => {
  document.getElementById("hash-modal").style.display = "none";
});

document.getElementById("btn-copy-hash").addEventListener("click", () => {
  const output = document.getElementById("hash-output");
  output.select();
  document.execCommand("copy");
  alert("¡Código copiado al portapapeles!");
});

// ----------------------------------------------------
// LEADERBOARD LOGIC
// ----------------------------------------------------

function decodeHash(hash) {
  try {
    const jsonString = decodeURIComponent(escape(atob(hash)));
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

// Initialize UI after all declarations
setupNavigation();
setupGroupStageView();
setupSearchTeams();

// Make globally accessible for inline onclick handlers
window.fillGroupSlot = fillGroupSlot;
window.advanceTeam = advanceTeam;

function calculatePoints(participant, official, officialPoints = window.officialPoints) {
  let points = { r1: 0, r32: 0, r16: 0, qf: 0, sf: 0, finals: 0, scorer: 0, total: 0, log: [] };

  // Helper arrays
  const getTeams = (arrOfArrays) => arrOfArrays ? arrOfArrays.flat().filter(Boolean) : [];
  
  const offR32 = (official && official.groups) ? Object.values(official.groups).map(g => [g[0], g[1]]).flat().concat(official.thirds||[]) : [];
  const offR16 = official ? getTeams(official.r16) : [];
  const offQF = official ? getTeams(official.qf) : [];
  const offSF = official ? getTeams(official.sf) : [];
  const offFinal = official ? (official.final||[]) : [];
  
  // Virtual groups tracking (only if all 4 teams played at least 1 match)
  const virtualGroups = {};
  let allVirtualThirds = [];
  if (officialPoints) {
    Object.keys(window.groupOdds).forEach(g => {
       const teamsInGroup = window.groupOdds[g].map(t => {
         const safeKey = t.name.replace(/[.#$\[\]]/g, "");
         const stats = (officialPoints[g] && officialPoints[g][safeKey]) || {pts:0, diff:0, gls:0, mp:0};
         return { name: t.name, stats: stats };
       });
       
       const totalMatchesPlayed = teamsInGroup.reduce((sum, t) => sum + (t.stats.mp || 0), 0);
       
       // Always calculate virtual groups based on current standings for real-time excitement
       // ONLY if at least 1 match has been played in the group
       if (totalMatchesPlayed > 0) {
         teamsInGroup.sort((a,b) => window.compareTeams(a, b, g));
         virtualGroups[g] = [teamsInGroup[0].name, teamsInGroup[1].name, teamsInGroup[2].name];
         allVirtualThirds.push({ name: teamsInGroup[2].name, stats: teamsInGroup[2].stats });
       }
    });
  }

  // Calculate best 8 virtual thirds
  allVirtualThirds.sort((a, b) => {
    if (b.stats.pts !== a.stats.pts) return b.stats.pts - a.stats.pts;
    if (b.stats.diff !== a.stats.diff) return b.stats.diff - a.stats.diff;
    return b.stats.gls - a.stats.gls;
  });
  const bestVirtualThirds = allVirtualThirds.slice(0, 8).map(t => t.name);

  // 1. Group Stage / R32 (Primera ronda: 10 pts pasa, +10 si acierta posición exacta)
  if (participant.groups) {
    Object.keys(participant.groups).forEach(g => {
      const p1 = participant.groups[g][0];
      const p2 = participant.groups[g][1];
      const p3 = participant.groups[g][2];
      
      const o1 = (official && official.groups && official.groups[g]) ? official.groups[g][0] : null;
      const o2 = (official && official.groups && official.groups[g]) ? official.groups[g][1] : null;
      const o3 = (official && official.groups && official.groups[g]) ? official.groups[g][2] : null;
      
      const v1 = virtualGroups[g] ? virtualGroups[g][0] : null;
      const v2 = virtualGroups[g] ? virtualGroups[g][1] : null;
      const v3 = virtualGroups[g] ? virtualGroups[g][2] : null;

      // Use official if it exists and is not a placeholder, otherwise use virtual
      const actualO1 = (o1 && !o1.includes("º")) ? o1 : v1;
      const actualO2 = (o2 && !o2.includes("º")) ? o2 : v2;
      const actualO3 = (o3 && !o3.includes("º")) ? o3 : v3;
      
      const isPassed = (team) => {
         if (offR32.includes(team)) return true;
         if (actualO1 === team || actualO2 === team) return true;
         if (official && official.thirds && official.thirds.includes(team)) return true;
         if (bestVirtualThirds.includes(team)) return true;
         return false;
      };

      const award = (amount, stage, msg) => {
        points[stage] += amount;
        points.log.push({ stage: stage, amount: amount, msg: msg });
      };

      // P1 Guess
      if (isPassed(p1)) award(10, 'r1', `Grupo ${g}: ${p1} pasa de fase`);
      if (actualO1 && p1 === actualO1) award(10, 'r1', `Grupo ${g}: ${p1} acierto posición exacta (1º)`);
      
      // P2 Guess
      if (isPassed(p2)) award(10, 'r1', `Grupo ${g}: ${p2} pasa de fase`);
      if (actualO2 && p2 === actualO2) award(10, 'r1', `Grupo ${g}: ${p2} acierto posición exacta (2º)`);
      
      // P3 Guess
      const p3SelectedToPass = participant.thirds && participant.thirds.includes(p3);
      if (p3SelectedToPass && isPassed(p3)) award(10, 'r1', `Grupo ${g}: ${p3} pasa de fase`);
      if (actualO3 && p3 === actualO3) award(10, 'r1', `Grupo ${g}: ${p3} acierto posición exacta (3º)`);
    });
  }

  // Remaining rounds (only if official bracket is defined)
  if (official) {
    const award = (amount, stage, msg) => {
      points[stage] += amount;
      points.log.push({ stage: stage, amount: amount, msg: msg });
    };

    // 2. Dieciseisavos (25 pts)
    const partR16 = getTeams(participant.r16);
    partR16.forEach(t => { if (offR16.includes(t)) award(25, 'r32', `1/16: ${t} clasificado a octavos`); });

    // 3. Octavos (30 pts)
    const partQF = getTeams(participant.qf);
    partQF.forEach(t => { if (offQF.includes(t)) award(30, 'r16', `Octavos: ${t} clasificado a cuartos`); });

    // 4. Cuartos (40 pts)
    const partSF = getTeams(participant.sf);
    partSF.forEach(t => { if (offSF.includes(t)) award(40, 'qf', `Cuartos: ${t} clasificado a semis`); });

    // 5. Semifinales (60 pts)
    const partFinal = participant.final;
    if (partFinal) {
       partFinal.forEach(t => { if (offFinal.includes(t)) award(60, 'sf', `Semis: ${t} clasificado a la final`); });
    }

    // 6. Final y 3a Plaza
    const official1st = official.champion;
    const official2nd = official.final ? official.final.find(t => t !== official1st) : null;
    const official3rd = official.thirdPlaceWinner;
    const official4th = official.thirdPlaceMatch ? official.thirdPlaceMatch.find(t => t !== official3rd) : null;

    const part1st = participant.champion;
    const part2nd = participant.final ? participant.final.find(t => t !== part1st) : null;
    const part3rd = participant.thirdPlaceWinner;
    const part4th = participant.thirdPlaceMatch ? participant.thirdPlaceMatch.find(t => t !== part3rd) : null;

    if (part1st && part1st === official1st) award(200, 'finals', `Final: ${part1st} Campeón`);
    if (part2nd && part2nd === official2nd) award(150, 'finals', `Final: ${part2nd} Subcampeón`);
    if (part3rd && part3rd === official3rd) award(100, 'finals', `Tercer y Cuarto: ${part3rd} Tercer puesto`);
    if (part4th && part4th === official4th) award(75, 'finals', `Tercer y Cuarto: ${part4th} Cuarto puesto`);

    // 7. Goleador
    if (participant.scorer && official.scorer && participant.scorer === official.scorer) award(100, 'scorer', `Goleador: ${participant.scorer} acertado`);
  }

  points.total = points.r1 + points.r32 + points.r16 + points.qf + points.sf + points.finals + points.scorer;
  return points;
}

window.renderStats = function() {
  const scorersMap = {};
  const championsMap = {};
  const finalsMap = {};

  const participants = window.participantsHashes || [];
  
  participants.forEach(p => {
    const part = decodeHash(p.hash);
    if (!part) return;
    
    const userName = part.user || p.key || "Anónimo";

    if (part.scorer) {
      if (!scorersMap[part.scorer]) scorersMap[part.scorer] = [];
      scorersMap[part.scorer].push(userName);
    }
    
    if (part.champion) {
      if (!championsMap[part.champion]) championsMap[part.champion] = [];
      championsMap[part.champion].push(userName);
    }
    
    if (part.final && part.final.length === 2) {
      const f1 = part.final[0];
      const f2 = part.final[1];
      if (f1 && f2) {
         const sortedFinal = [f1, f2].sort().join(" vs ");
         if (!finalsMap[sortedFinal]) finalsMap[sortedFinal] = [];
         finalsMap[sortedFinal].push(userName);
      }
    }
  });

  const getTop = (map, limit=10) => {
    return Object.entries(map)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, limit);
  };

  const renderList = (items, containerId, isFinals = false) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    if (items.length === 0) {
      container.innerHTML = "<div style='color: rgba(255,255,255,0.5); font-style: italic;'>No hay datos suficientes todavía.</div>";
      return;
    }
    items.forEach(([name, countArr], index) => {
      const count = countArr.length;
      let icon = "";
      if (index === 0) icon = "🥇 ";
      else if (index === 1) icon = "🥈 ";
      else if (index === 2) icon = "🥉 ";
      else icon = `<span style="display:inline-block; width: 22px; text-align: left; font-weight: normal; font-size: 0.9em; color: rgba(255,255,255,0.5);">${index+1}.</span>`;

      let flagHtml = "";
      let cleanName = name;
      if (isFinals) {
         const teams = name.split(" vs ");
         const t1 = teams[0], t2 = teams[1];
         const f1 = t1.includes("º") ? "" : `<img src="https://flagcdn.com/16x12/${getCountryCode(t1)}.png" alt="">`;
         const f2 = t2.includes("º") ? "" : `<img src="https://flagcdn.com/16x12/${getCountryCode(t2)}.png" alt="">`;
         name = `${f1} ${t1} vs ${t2} ${f2}`;
      } else if (containerId === "stats-champions" && !name.includes("º")) {
         flagHtml = `<img src="https://flagcdn.com/16x12/${getCountryCode(name)}.png" alt="" style="margin-right: 8px;">`;
      }
      
      const votersJson = JSON.stringify(countArr).replace(/'/g, "&#39;");
      
      const itemHtml = `
        <div onclick='showStatsDetail("${cleanName.replace(/'/g, "\\'")}", ${votersJson})' style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
          <div style="font-weight: bold; font-size: 1.05em; display: flex; align-items: center;">${icon}${flagHtml}${name}</div>
          <div style="background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 12px; font-size: 0.9em;">
             ${count} ${count === 1 ? 'voto' : 'votos'}
          </div>
        </div>
      `;
      container.innerHTML += itemHtml;
    });
  };

  renderList(getTop(scorersMap, 10), "stats-scorers");
  renderList(getTop(championsMap, 10), "stats-champions");
  renderList(getTop(finalsMap, 10), "stats-finals", true);
}

window.showStatsDetail = function(title, usersArray) {
  document.getElementById("stats-detail-title").textContent = `Han votado por ${title}:`;
  const listEl = document.getElementById("stats-detail-list");
  listEl.innerHTML = "";
  usersArray.forEach(u => {
    listEl.innerHTML += `<li style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center;"><span style="background: var(--accent-color); color: black; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; font-weight: bold; margin-right: 10px;">${u.charAt(0).toUpperCase()}</span> ${u}</li>`;
  });
  document.getElementById("stats-detail-modal").style.display = "flex";
};

window.currentSearchCondition = null;
window.currentSearchConditionLabel = null;

function setupSearchTeams() {
  const allTeams = [];
  Object.keys(window.groupOdds).forEach(g => {
    window.groupOdds[g].forEach(t => allTeams.push(t.name));
  });
  allTeams.sort((a,b) => a.localeCompare(b));
  
  const searchConditions = [
    { val: "first_group", label: "Queda 1º de grupo", icon: "1️⃣" },
    { val: "second_group", label: "Queda 2º de grupo", icon: "2️⃣" },
    { val: "third_group", label: "Queda 3º de grupo", icon: "3️⃣" },
    { val: "eliminated_groups", label: "Eliminado en Grupos", icon: "❌" },
    { val: "passes_groups", label: "Pasa a 1/16", icon: "✅" },
    { val: "passes_as_third", label: "Pasa como 3º", icon: "✅" },
    { val: "reaches_r16", label: "Llega a Octavos", icon: "⚽" },
    { val: "reaches_qf", label: "Llega a Cuartos", icon: "🔥" },
    { val: "reaches_sf", label: "Llega a Semis", icon: "🥉" },
    { val: "reaches_final", label: "Llega a la Final", icon: "🥈" },
    { val: "is_runnerup", label: "Es Subcampeón", icon: "🥈" },
    { val: "is_champion", label: "Es Campeón", icon: "🏆" }
  ];

  const condGrid = document.getElementById("search-conditions-grid");
  if(condGrid) {
    condGrid.innerHTML = searchConditions.map(c => `
      <button onclick="selectSearchCondition('${c.val}', '${c.label}')" class="glass-btn" style="padding: 15px; font-size: 1.1em; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 100%;">
        <span style="font-size: 1.5em;">${c.icon}</span>
        <span>${c.label}</span>
      </button>
    `).join("");
  }

  const teamsGrid = document.getElementById("search-teams-grid");
  if(teamsGrid) {
    teamsGrid.innerHTML = allTeams.map(t => `
      <button onclick="executeSearchFromWizard('${t}')" class="glass-btn" style="padding: 10px; font-size: 0.9em; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
        <img src="https://flagcdn.com/24x18/${getCountryCode(t)}.png" alt="${t}">
        <span style="text-align: center;">${t}</span>
      </button>
    `).join("");
  }
};

window.selectSearchCondition = function(cond, label) {
  window.currentSearchCondition = cond;
  window.currentSearchConditionLabel = label;
  
  document.getElementById("search-step-1").style.display = "none";
  document.getElementById("search-step-2").style.display = "block";
  document.getElementById("search-results-container").style.display = "none";
  
  document.getElementById("search-teams-grid").style.display = "grid";
};

window.resetSearchWizard = function() {
  window.currentSearchCondition = null;
  window.currentSearchConditionLabel = null;
  document.getElementById("search-step-1").style.display = "block";
  document.getElementById("search-step-2").style.display = "none";
  document.getElementById("search-results-container").style.display = "none";
};

window.executeSearchFromWizard = function(teamName) {
  const cond = window.currentSearchCondition;
  let team = teamName;
  if(!team) {
    alert("Introduce un nombre para buscar.");
    return;
  }
  
  const resultsList = document.getElementById("search-results-list");
  const titleEl = document.getElementById("search-results-title");
  const resultsContainer = document.getElementById("search-results-container");
  
  const results = [];
  const participants = window.participantsHashes || [];
  
  participants.forEach(p => {
    const part = decodeHash(p.hash);
    if (!part) return;
    const userName = part.user || p.key || "Anónimo";
    
    let match = false;
    const lowerTeam = team.toLowerCase();
    
    if (cond === "first_group" && part.groups) {
      match = Object.values(part.groups).some(g => g[0].toLowerCase() === lowerTeam);
    } else if (cond === "second_group" && part.groups) {
      match = Object.values(part.groups).some(g => g[1].toLowerCase() === lowerTeam);
    } else if (cond === "third_group" && part.groups) {
      match = Object.values(part.groups).some(g => g[2].toLowerCase() === lowerTeam);
    } else if (cond === "eliminated_groups" && part.r32) {
      match = !part.r32.flat().map(t => t.toLowerCase()).includes(lowerTeam);
    } else if (cond === "passes_groups" && part.r32) {
      match = part.r32.flat().map(t => t.toLowerCase()).includes(lowerTeam);
    } else if (cond === "passes_as_third" && part.r32 && part.groups) {
      match = part.r32.flat().map(t => t.toLowerCase()).includes(lowerTeam) && Object.values(part.groups).some(g => g[2] && g[2].toLowerCase() === lowerTeam);
    } else if (cond === "reaches_r16" && part.r16) {
      match = part.r16.flat().map(t => t.toLowerCase()).includes(lowerTeam);
    } else if (cond === "reaches_qf" && part.qf) {
      match = part.qf.flat().map(t => t.toLowerCase()).includes(lowerTeam);
    } else if (cond === "reaches_sf" && part.sf) {
      match = part.sf.flat().map(t => t.toLowerCase()).includes(lowerTeam);
    } else if (cond === "reaches_final" && part.final) {
      match = part.final.map(t => t.toLowerCase()).includes(lowerTeam);
    } else if (cond === "is_runnerup" && part.final && part.champion) {
      match = part.final.map(t => t.toLowerCase()).includes(lowerTeam) && part.champion.toLowerCase() !== lowerTeam;
    } else if (cond === "is_champion" && part.champion) {
      match = part.champion.toLowerCase() === lowerTeam;
    }
    
    if(match) {
      results.push(userName);
    }
  });
  
  const condText = window.currentSearchConditionLabel;
  let flagHtml = `<img src="https://flagcdn.com/20x15/${getCountryCode(team)}.png" alt="" style="margin-right: 8px; vertical-align: text-bottom;">`;
  if(getCountryCode(team) === "xx") flagHtml = "";
  
  titleEl.innerHTML = `${flagHtml}${team} <span style="font-size: 0.7em; opacity: 0.8; display: block; margin-top: 5px;">${condText}</span>`;
  
  resultsList.innerHTML = "";
  if(results.length === 0) {
    resultsList.innerHTML = `<li style="text-align: center; color: #ff4757; font-style: italic; grid-column: 1 / -1;">Nadie ha apostado esto.</li>`;
  } else {
    results.forEach(u => {
      resultsList.innerHTML += `<li style="padding: 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center;"><span style="background: var(--accent-color); color: black; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; font-weight: bold; margin-right: 12px; font-size: 0.9em;">${u.charAt(0).toUpperCase()}</span> <span style="font-weight:bold;">${u}</span></li>`;
    });
  }
  
  if (resultsContainer) resultsContainer.style.display = "block";
};

function renderLeaderboard() {
  const tbodyHome = document.getElementById("leaderboard-body-home");
  const tbodyTab = document.getElementById("leaderboard-body-tab");
  if (tbodyHome) tbodyHome.innerHTML = "";
  if (tbodyTab) tbodyTab.innerHTML = "";

  // If no official result hash exists, we might show empty or mock
  let official = null;
  
  // Safeguard against missing data
  const hasParticipants = window.participantsHashes && window.participantsHashes.length > 0;
  const hasOfficial = window.officialResultsHash && window.officialResultsHash !== "";

  if (hasOfficial) {
    official = decodeHash(window.officialResultsHash);
  }

  let isProvisional = false;
  if (!hasOfficial && window.officialPoints) {
    Object.keys(window.groupOdds).forEach(g => {
       const teamsInGroup = window.groupOdds[g].map(t => {
         const safeKey = t.name.replace(/[.#$\[\]]/g, "");
         return (window.officialPoints[g] && window.officialPoints[g][safeKey]) || {mp:0};
       });
       if (teamsInGroup.every(t => typeof t === 'object' && t.mp >= 1)) {
         isProvisional = true;
       }
    });
  }
  
  const banner = document.getElementById("provisional-banner");
  if (banner) {
    banner.style.display = isProvisional ? "block" : "none";
  }

  const results = [];

  
  const isAdmin = checkAdmin(document.getElementById("user-name").value.trim());

  if (hasParticipants) {
    window.participantsHashes.forEach(h => {
      const part = decodeHash(h.hash);
      if (part) {
        const pts = calculatePoints(part, official);
        results.push({ key: h.key, hash: h.hash, name: part.user, betName: part.bet, points: pts, paid: h.paid, part: part });
      }
    });
  }

  results.sort((a,b) => {
    // Pending bets go to the bottom
    if (a.paid !== b.paid) return a.paid ? -1 : 1;
    return b.points.total - a.points.total;
  });

  let currentRank = 1;
  let previousPoints = -1;

  results.forEach((r) => {
    if (r.paid) {
      if (previousPoints !== -1 && r.points.total < previousPoints) {
        currentRank++;
      }
      r.rank = currentRank;
      previousPoints = r.points.total;
    } else {
      r.rank = '-';
    }
  });

  let lowestPaidRank = 1;
  results.forEach(r => {
    if (r.paid && typeof r.rank === 'number' && r.rank > lowestPaidRank) {
      lowestPaidRank = r.rank;
    }
  });

  results.forEach((r) => {
    let rankDisplay = r.rank;
    if (r.paid) {
      if (r.rank === 1) rankDisplay = "🥇";
      else if (r.rank === 2) rankDisplay = "🥈";
      else if (r.rank === 3) rankDisplay = "🥉";
      else if (r.rank === lowestPaidRank && lowestPaidRank > 3) rankDisplay = "🐢";
    }

    const tr = document.createElement("tr");
    if (!r.paid) tr.style.opacity = "0.5";
    tr.style.cursor = "pointer";
    tr.setAttribute("onclick", `if(event.target.tagName !== 'BUTTON' || event.target.title.includes('Ver Apuesta')) viewBet('${r.hash}')`);
    
    tr.innerHTML = `
      <td style="font-size: 1.2em; text-align: center;">${rankDisplay}</td>
      <td>
        <span title="Ver Apuesta de ${r.name}"><strong>${r.name}</strong></span><br>
        <span style="font-size: 0.85em; color: var(--text-muted);">${r.betName}</span>
        ${!r.paid ? '<span style="font-size:10px;background:orange;color:white;padding:2px;border-radius:3px;margin-left:5px;">Pendiente</span>' : ''}
        ${isAdmin && !r.paid ? `<button onclick="acceptBet('${r.key}')" style="background:green;color:white;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;margin-left:5px;" title="Confirmar Bizum">✅</button>` : ''}
        ${isAdmin ? `<button onclick="deleteBet('${r.key}')" style="background:red;color:white;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;margin-left:5px;" title="Borrar Apuesta">🗑️</button>` : ''}
        ${isAdmin && r.paid && r.part && r.part.thirdPlaceMatch && r.part.thirdPlaceMatch.length === 2 && !r.part.thirdPlaceWinner ? `
          <button onclick="fixThird('${r.key}', '${r.hash}', '${r.part.thirdPlaceMatch[0]}')" style="background:#00d2d3;color:black;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;margin-left:5px;" title="Fijar ${r.part.thirdPlaceMatch[0]}">3º: ${r.part.thirdPlaceMatch[0]}</button>
          <button onclick="fixThird('${r.key}', '${r.hash}', '${r.part.thirdPlaceMatch[1]}')" style="background:#ff4757;color:white;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;margin-left:5px;" title="Fijar ${r.part.thirdPlaceMatch[1]}">3º: ${r.part.thirdPlaceMatch[1]}</button>
        ` : ''}
        <button onclick="viewBet('${r.hash}')" style="background:var(--primary-color);color:white;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;margin-left:5px;" title="Ver Apuesta">👁️</button>
      </td>
      <td style="color: var(--accent-color); font-weight: bold; font-size: 1.1em; text-align: center;">
        ${r.paid ? r.points.total + ' pts' : '-'}
        ${r.paid && r.points.total > 0 ? `<button onclick="showPointsBreakdown('${r.hash}')" style="background:none;border:none;cursor:pointer;font-size:1em;vertical-align:middle;margin-left:5px;" title="Ver desglose de puntos">ℹ️</button>` : ''}
      </td>
      <td>${r.paid ? r.points.r1 : '-'}</td>
      <td>${r.paid ? r.points.r32 : '-'}</td>
      <td>${r.paid ? r.points.r16 : '-'}</td>
      <td>${r.paid ? r.points.qf : '-'}</td>
      <td>${r.paid ? r.points.sf : '-'}</td>
      <td>${r.paid ? r.points.finals : '-'}</td>
      <td>${r.paid ? r.points.scorer : '-'}</td>
    `;
    if (tbodyHome) tbodyHome.appendChild(tr);
    if (tbodyTab) tbodyTab.appendChild(tr.cloneNode(true));
  });
  
  window.currentLeaderboard = results;
}

document.getElementById("btn-save-points")?.addEventListener("click", () => {
  const inputs = document.querySelectorAll(".points-input");
  const newPoints = {};
  inputs.forEach(inp => {
    const g = inp.dataset.group;
    let t = inp.dataset.team;
    t = t.replace(/[.#$\[\]]/g, ""); // Sanitize for Firebase
    if(!newPoints[g]) newPoints[g] = {};
    newPoints[g][t] = parseInt(inp.value) || 0;
  });
  set(ref(database, 'officialPoints'), newPoints)
    .then(() => alert("Puntos guardados correctamente."))
    .catch(e => alert("Error: " + e.message));
});
window.showPointsBreakdown = function(hash) {
  const part = decodeHash(hash);
  if (!part) return;
  
  let official = null;
  if (window.officialResultsHash && window.officialResultsHash !== "") {
    official = decodeHash(window.officialResultsHash);
  }
  
  const points = calculatePoints(part, official);
  
  const modal = document.getElementById("points-breakdown-modal");
  const modalBody = document.getElementById("points-breakdown-body");
  if (!modal || !modalBody) return;
  
  let html = `<h3 style="color: var(--accent-color); margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">Desglose de Puntos: ${part.user}</h3>`;
  
  if (points.log && points.log.length > 0) {
    html += `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px;">`;
    points.log.forEach(item => {
      html += `<li style="background: rgba(255, 255, 255, 0.05); padding: 8px 12px; margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.9em; color: var(--text-color);">${item.msg}</span>
        <span style="color: var(--primary-color); font-weight: bold; background: rgba(0, 210, 211, 0.2); padding: 2px 6px; border-radius: 4px;">+${item.amount}</span>
      </li>`;
    });
    html += `</ul>`;
    html += `<div style="text-align: right; font-size: 1.2em; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
      <strong>Total: <span style="color: var(--accent-color);">${points.total} pts</span></strong>
    </div>`;
  } else {
    html += `<p style="text-align: center; color: var(--text-muted); padding: 20px 0;">Todavía no hay puntos asignados.</p>`;
  }
  
  modalBody.innerHTML = html;
  modal.style.display = "flex";
};

const apiToLocalNames = {
  "Mexico": "México", "South Africa": "Sudáfrica", "South Korea": "Corea del Sur", "Czech Republic": "Chequia",
  "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia y Her.", "Bosnia": "Bosnia y Her.", "Qatar": "Catar", "Switzerland": "Suiza",
  "Brazil": "Brasil", "Morocco": "Marruecos", "Haiti": "Haití", "Scotland": "Escocia",
  "United States": "EEUU", "USA": "EEUU", "Paraguay": "Paraguay", "Australia": "Australia", "Turkey": "Turquía",
  "Germany": "Alemania", "Curacao": "Curaçao", "Ivory Coast": "Costa de Marfil", "Ecuador": "Ecuador",
  "Netherlands": "Países Bajos", "Japan": "Japón", "Sweden": "Suecia", "Tunisia": "Túnez",
  "Belgium": "Bélgica", "Egypt": "Egipto", "Iran": "Irán", "New Zealand": "Nueva Zelanda",
  "Spain": "España", "Cape Verde": "Cabo Verde", "Cape Verde Islands": "Cabo Verde", "Saudi Arabia": "Arabia Saudí", "Uruguay": "Uruguay",
  "France": "Francia", "Senegal": "Senegal", "Iraq": "Irak", "Norway": "Noruega",
  "Argentina": "Argentina", "Algeria": "Argelia", "Austria": "Austria", "Jordan": "Jordania",
  "Portugal": "Portugal", "DR Congo": "RD Congo", "Congo DR": "RD Congo", "Uzbekistan": "Uzbekistán", "Colombia": "Colombia",
  "England": "Inglaterra", "Croatia": "Croacia", "Ghana": "Ghana", "Panama": "Panamá"
};

async function syncWithApi(silent = false) {
  const syncBtn = document.getElementById("btn-sync-api");
  if (syncBtn && !silent) {
    syncBtn.innerHTML = "⏳ Cargando...";
    syncBtn.disabled = true;
  }
  
  try {
    // 1. Get teams mapping
    const teamsRes = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://worldcup26.ir/get/teams?_cb=' + Date.now()));
    const teamsData = await teamsRes.json();
    
    if (!teamsData || !teamsData.teams) {
      throw new Error("No se pudo obtener la lista de equipos.");
    }
    
    const idToNameMap = {};
    const nameToIdMap = {};
    teamsData.teams.forEach(t => {
      idToNameMap[t.id] = t.name_en;
      nameToIdMap[t.name_en] = t.id;
      if (apiToLocalNames[t.name_en]) {
          nameToIdMap[apiToLocalNames[t.name_en]] = t.id;
      }
    });
    window.nameToIdMap = nameToIdMap;

    // 2. Get games and calculate points
    const gamesRes = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://worldcup26.ir/get/games?_cb=' + Date.now()));
    const gamesData = await gamesRes.json();
    
    if (!gamesData || !gamesData.games) {
      throw new Error("No se pudo obtener la lista de partidos.");
    }
    
    if (window.mockLiveMatch) {
        gamesData.games.push(window.mockLiveMatch);
    }
    
    window.allGames = gamesData.games;
    
    const teamCalculatedPts = {}; // { "team_id": pts }
    const finishedMatches = [];
    const upcomingMatches = [];
    const liveMatches = [];
    window.lastKnownScores = window.lastKnownScores || {};
    window.lastKnownScores = window.lastKnownScores || {};
    
    // Diferencia de horas desde la hora local del estadio a la hora de España (CEST / UTC+2)
    const stadiumOffsetsToSpain = { "14": 9, "8": 6, "13": 9, "15": 9, "3": 8, "1": 8, "2": 8, "5": 7, "16": 9, "7": 6, "9": 6, "6": 7, "10": 6, "4": 7, "11": 6, "12": 6 };

    gamesData.games.forEach(game => {
      let gameDateStr = game.local_date; // "06/11/2026 13:00"
      if (gameDateStr) {
        try {
          const localMatchDate = new Date(gameDateStr);
          const offsetHours = stadiumOffsetsToSpain[game.stadium_id] || 0;
          localMatchDate.setHours(localMatchDate.getHours() + offsetHours);
          gameDateStr = localMatchDate.toISOString();
        } catch(e) { }
      }

      const homeScoreStr = game.home_score;
      const awayScoreStr = game.away_score;
      const hasValidScores = (homeScoreStr !== null && homeScoreStr !== "null" && homeScoreStr !== "" && awayScoreStr !== null && awayScoreStr !== "null" && awayScoreStr !== "");
      
      let isLiveOrFinished = game.finished === "TRUE";
      let isLive = false;
      let isStartingSoon = false;
      
      const matchDate = new Date(gameDateStr);
      
      if (!isLiveOrFinished) {
          if (!isNaN(matchDate)) {
              const diffMs = matchDate - new Date();
              if (diffMs <= 0) {
                  isLiveOrFinished = true;
                  isLive = true;
              } else if (diffMs <= 30 * 60 * 1000) {
                  isLiveOrFinished = true;
                  isLive = true;
                  isStartingSoon = true;
              }
          } else if (hasValidScores) {
              isLiveOrFinished = true;
              isLive = true;
          }
      }

      if (!isLiveOrFinished) {
        if (game.home_team_id && game.away_team_id) {
           upcomingMatches.push({
             homeId: game.home_team_id,
             awayId: game.away_team_id,
             date: gameDateStr
           });
        }
        return; 
      }
      
      let homeScore = 0;
      let awayScore = 0;
      const homeId = game.home_team_id;
      const awayId = game.away_team_id;
      
      if (hasValidScores) {
        homeScore = parseInt(homeScoreStr, 10);
        awayScore = parseInt(awayScoreStr, 10);

        const previousScore = window.lastKnownScores[game.id];
        if (previousScore !== undefined && isLive && !isStartingSoon) {
            // goal detection removed
        }
        if (isLiveOrFinished) {
            window.lastKnownScores[game.id] = { home: homeScore, away: awayScore };
        }

        if (!isNaN(homeScore) && !isNaN(awayScore) && homeId && awayId && (game.finished === "TRUE" || (isLive && !isStartingSoon))) {
          // Add to points
          if (!teamCalculatedPts[homeId]) teamCalculatedPts[homeId] = {pts: 0, diff: 0, gls: 0, mp: 0};
          if (!teamCalculatedPts[awayId]) teamCalculatedPts[awayId] = {pts: 0, diff: 0, gls: 0, mp: 0};
          
          teamCalculatedPts[homeId].mp += 1;
          teamCalculatedPts[awayId].mp += 1;
          
          teamCalculatedPts[homeId].gls += homeScore;
          teamCalculatedPts[awayId].gls += awayScore;
          teamCalculatedPts[homeId].diff += (homeScore - awayScore);
          teamCalculatedPts[awayId].diff += (awayScore - homeScore);
          
          if (homeScore > awayScore) {
            teamCalculatedPts[homeId].pts += 3;
          } else if (awayScore > homeScore) {
            teamCalculatedPts[awayId].pts += 3;
          } else {
            teamCalculatedPts[homeId].pts += 1;
            teamCalculatedPts[awayId].pts += 1;
          }
        }
      }
      
      if (homeId && awayId) {
          const matchObj = {
            homeId: homeId,
            awayId: awayId,
            homeScore: hasValidScores ? homeScore : 0,
            awayScore: hasValidScores ? awayScore : 0,
            date: gameDateStr,
            isStartingSoon: isStartingSoon
          };
          
          if (isLive) {
              liveMatches.push(matchObj);
          } else {
              finishedMatches.push(matchObj);
          }
      }
    });
    
    const newPoints = {};
    
    
    // Convert current groups array format for fast lookup
    const localTeamGroupMap = {};
    Object.keys(window.groupOdds).forEach(g => {
      window.groupOdds[g].forEach(t => {
        localTeamGroupMap[t.name] = g;
      });
    });

    // We still need to loop through all teams in our system to ensure 0 points for unplayed teams
    // Or we iterate through the idToNameMap
    Object.keys(idToNameMap).forEach(teamId => {
      const apiName = idToNameMap[teamId];
      const localName = apiToLocalNames[apiName] || apiName;
      const stats = teamCalculatedPts[teamId] || {pts: 0, diff: 0, gls: 0, mp: 0};
      
      const g = localTeamGroupMap[localName];
      if (g) {
        if (!newPoints[g]) newPoints[g] = {};
        const safeKey = localName.replace(/[.#$\[\]]/g, "");
        newPoints[g][safeKey] = stats;
      }
    });
    
    // Format Radar
    finishedMatches.sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending
    upcomingMatches.sort((a, b) => new Date(a.date) - new Date(b.date)); // Ascending
    liveMatches.sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending

    const formatMatch = (m) => {
      const hApi = idToNameMap[m.homeId];
      const aApi = idToNameMap[m.awayId];
      return {
        home: apiToLocalNames[hApi] || hApi || "Por definir",
        away: apiToLocalNames[aApi] || aApi || "Por definir",
        homeScore: m.homeScore !== undefined ? m.homeScore : null,
        awayScore: m.awayScore !== undefined ? m.awayScore : null,
        date: m.date,
        isStartingSoon: !!m.isStartingSoon
      };
    };

    const radar = {
      live: liveMatches.map(formatMatch),
      last: finishedMatches.slice(0, 5).map(formatMatch),
      next: upcomingMatches.slice(0, 5).map(formatMatch)
    };
    
    // Save to firebase
    await set(ref(database, 'officialPoints'), newPoints);
    await set(ref(database, 'matchRadar'), radar);
    if (!silent) alert("¡Puntuaciones sincronizadas y guardadas correctamente desde la API!");
    
  } catch (error) {
    if (!silent) alert("Error al conectar con la API: " + error.message);
  } finally {
    if (syncBtn && !silent) {
      syncBtn.innerHTML = "🤖 Auto-Actualizar (API)";
      syncBtn.disabled = false;
    }
  }
}

// Background sync every 30 seconds (30,000 ms)
setInterval(() => {
  syncWithApi(true);
}, 30000);

// ----------------------------------------------------
// WHAT'S NEW MODAL (CLASIFICACION LIVE)
// ----------------------------------------------------
// ----------------------------------------------------
// WHAT'S NEW MODAL (CLASIFICACION LIVE)
// ----------------------------------------------------
const updateKey = 'update_seen_v3';
if (!localStorage.getItem(updateKey)) {
  // Give a tiny delay to ensure HTML is fully parsed if async
  setTimeout(() => {
    const modal = document.getElementById("whats-new-modal");
    if (modal) {
      modal.style.display = "flex";
      document.getElementById("btn-close-whats-new").addEventListener("click", () => {
        modal.style.display = "none";
        localStorage.setItem(updateKey, 'true');
      });
    }
  }, 100);
}


// Sync immediately on page load
setTimeout(() => {
  syncWithApi(true);
}, 500);

// SHARE IMAGE FUNCTIONALITY
document.getElementById('btn-share-wa')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-share-wa');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Generando...';
  btn.disabled = true;

  try {
    const results = window.currentLeaderboard || [];
    const validResults = results.filter(r => r.paid); // Only show paid participants
    
    const colLeft = document.getElementById('share-col-left');
    const colRight = document.getElementById('share-col-right');
    colLeft.innerHTML = '';
    colRight.innerHTML = '';

    const mid = Math.ceil(validResults.length / 2);
    
    let lowestRank = 1;
    validResults.forEach(r => { if (typeof r.rank === 'number' && r.rank > lowestRank) lowestRank = r.rank; });
    
    validResults.forEach((r, idx) => {
      let rankDisplay = r.rank;
      if (r.rank === 1) rankDisplay = "🥇";
      else if (r.rank === 2) rankDisplay = "🥈";
      else if (r.rank === 3) rankDisplay = "🥉";
      else if (r.rank === lowestRank && lowestRank > 3) rankDisplay = "🐢";

      const rowHtml = `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem; font-weight: bold; width: 30px; text-align: center; color: var(--accent-color);">${rankDisplay}</span>
            <span style="font-size: 1.1rem; font-weight: bold; color: white;">${r.name}</span>
          </div>
          <span style="font-size: 1.2rem; font-weight: bold; color: #00d2d3;">${r.points.total} pts</span>
        </div>
      `;

      if (idx < mid) {
        colLeft.innerHTML += rowHtml;
      } else {
        colRight.innerHTML += rowHtml;
      }
    });

    const template = document.getElementById('share-image-template');
    
    // Use html2canvas
    const canvas = await html2canvas(template, {
      backgroundColor: '#0f0f1a',
      scale: 2, // High resolution
      logging: false,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    
    try {
      // Convert dataURL to Blob/File for native sharing
      const fetchRes = await fetch(imgData);
      const blob = await fetchRes.blob();
      const file = new File([blob], 'Clasificacion_Porra.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Porra Mundial 2026',
          text: '¡Así va la clasificación de la Porra!'
        });
      } else {
        // Fallback: Trigger download if native sharing is not supported
        const link = document.createElement('a');
        link.download = 'Clasificacion_Porra_Mundial.png';
        link.href = imgData;
        link.click();
      }
    } catch (shareErr) {
      // If user cancels share or it fails, silently ignore or fallback
      console.log('Share API error/cancelled:', shareErr);
    }
    
  } catch (error) {
    console.error("Error generating share image:", error);
    alert("Hubo un error al generar la imagen. Inténtalo de nuevo.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});
