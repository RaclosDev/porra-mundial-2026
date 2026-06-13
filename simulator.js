// Calcular la fuerza del equipo basándonos en sus probabilidades
// Fuerza = Probabilidad de Ganar + Probabilidad de Clasificar
// Probabilidad = 1 / Cuota
function calculateGroupStrength(team) {
  const winProb = 1 / team.win;
  const qualProb = 1 / team.qualify;
  return winProb + qualProb;
}

function calculateOverallStrength(team) {
  return 1 / team.outright;
}

// Simular la fase de grupos
function simulateGroupStage(oddsData) {
  const groups = {};
  const allThirds = [];

  for (const [groupName, teams] of Object.entries(oddsData)) {
    // Calcular fuerza y añadir el grupo
    const processedTeams = teams.map(t => ({
      ...t,
      group: groupName,
      groupStrength: calculateGroupStrength(t),
      overallStrength: calculateOverallStrength(t)
    }));

    // Ordenar de mayor a menor fuerza en grupos
    processedTeams.sort((a, b) => b.groupStrength - a.groupStrength);
    
    groups[groupName] = {
      first: processedTeams[0],
      second: processedTeams[1],
      third: processedTeams[2],
      fourth: processedTeams[3]
    };

    allThirds.push(processedTeams[2]);
  }

  return { groups, allThirds };
}

// Ordenar a los terceros lugares por fuerza y obtener los mejores 8
function getBestThirds(allThirds) {
  const sortedThirds = [...allThirds].sort((a, b) => b.groupStrength - a.groupStrength);
  return sortedThirds.slice(0, 8);
}

// Simular el bracket
function simulateBracket(oddsData) {
  const { groups, allThirds } = simulateGroupStage(oddsData);
  const bestThirds = getBestThirds(allThirds);
  
  // Obtenemos la combinación de grupos de los 8 mejores terceros ordenada
  const qualifiedGroups = bestThirds.map(t => t.group).sort().join("");
  
  // Obtenemos la fila de la matriz (Anexo C)
  // Nota: window.annexCMatrix viene de annex_c_matrix.js
  const matrixRow = window.annexCMatrix[qualifiedGroups];

  if (!matrixRow) {
    console.error("No se encontró la combinación en la matriz Anexo C: " + qualifiedGroups);
  }

  // Función para obtener al tercero que se enfrenta a un ganador de grupo específico
  function getThird(groupWinner) {
    if (!matrixRow) return bestThirds[0]; // Fallback
    const targetGroup = matrixRow[groupWinner];
    return bestThirds.find(t => t.group === targetGroup);
  }

  const r32 = {
    left: [
      { home: groups['E'].first, away: getThird("1E"), id: 'L1' },
      { home: groups['I'].first, away: getThird("1I"), id: 'L2' },
      { home: groups['A'].second, away: groups['B'].second, id: 'L3' },
      { home: groups['F'].first, away: groups['C'].second, id: 'L4' },
      { home: groups['K'].second, away: groups['L'].second, id: 'L5' },
      { home: groups['H'].first, away: groups['J'].second, id: 'L6' },
      { home: groups['D'].first, away: getThird("1D"), id: 'L7' },
      { home: groups['G'].first, away: getThird("1G"), id: 'L8' }
    ],
    right: [
      { home: groups['C'].first, away: groups['F'].second, id: 'R1' },
      { home: groups['E'].second, away: groups['I'].second, id: 'R2' },
      { home: groups['A'].first, away: getThird("1A"), id: 'R3' },
      { home: groups['L'].first, away: getThird("1L"), id: 'R4' },
      { home: groups['J'].first, away: groups['H'].second, id: 'R5' },
      { home: groups['D'].second, away: groups['G'].second, id: 'R6' },
      { home: groups['B'].first, away: getThird("1B"), id: 'R7' },
      { home: groups['K'].first, away: getThird("1K"), id: 'R8' }
    ]
  };

  // Función para determinar el ganador usando fuerza global
  function getWinner(match) {
    if (!match.home || !match.away) return match.home || match.away || null;
    return match.home.overallStrength >= match.away.overallStrength ? match.home : match.away;
  }
  
  function getLoser(match) {
      if (!match.home || !match.away) return match.away || match.home || null;
      return match.home.overallStrength < match.away.overallStrength ? match.home : match.away;
  }

  // Octavos (Round of 16)
  const r16 = {
    left: [
      { home: getWinner(r32.left[0]), away: getWinner(r32.left[1]), id: 'L1_16' },
      { home: getWinner(r32.left[2]), away: getWinner(r32.left[3]), id: 'L2_16' },
      { home: getWinner(r32.left[4]), away: getWinner(r32.left[5]), id: 'L3_16' },
      { home: getWinner(r32.left[6]), away: getWinner(r32.left[7]), id: 'L4_16' }
    ],
    right: [
      { home: getWinner(r32.right[0]), away: getWinner(r32.right[1]), id: 'R1_16' },
      { home: getWinner(r32.right[2]), away: getWinner(r32.right[3]), id: 'R2_16' },
      { home: getWinner(r32.right[4]), away: getWinner(r32.right[5]), id: 'R3_16' },
      { home: getWinner(r32.right[6]), away: getWinner(r32.right[7]), id: 'R4_16' }
    ]
  };

  // Cuartos (Quarter-Finals)
  const qf = {
    left: [
      { home: getWinner(r16.left[0]), away: getWinner(r16.left[1]), id: 'L1_8' },
      { home: getWinner(r16.left[2]), away: getWinner(r16.left[3]), id: 'L2_8' }
    ],
    right: [
      { home: getWinner(r16.right[0]), away: getWinner(r16.right[1]), id: 'R1_8' },
      { home: getWinner(r16.right[2]), away: getWinner(r16.right[3]), id: 'R2_8' }
    ]
  };

  // Semifinales (Semi-Finals)
  const sf = {
    left: [
      { home: getWinner(qf.left[0]), away: getWinner(qf.left[1]), id: 'L1_4' }
    ],
    right: [
      { home: getWinner(qf.right[0]), away: getWinner(qf.right[1]), id: 'R1_4' }
    ]
  };

  // Final and Third Place
  const finalMatch = {
    home: getWinner(sf.left[0]),
    away: getWinner(sf.right[0]),
    id: 'FINAL'
  };

  const thirdPlaceMatch = {
    home: getLoser(sf.left[0]),
    away: getLoser(sf.right[0]),
    id: 'THIRD_PLACE'
  };

  const champion = getWinner(finalMatch);

  return {
    groups,
    bestThirds,
    r32,
    r16,
    qf,
    sf,
    finalMatch,
    thirdPlaceMatch,
    champion
  };
}

// NUEVO: Generar solo dieciseisavos desde la entrada manual
function generateR32FromManual(manualGroups, manualThirds) {
  // manualGroups = { A: { first: team, second: team }, ... }
  // manualThirds = [team1, ..., team8]

  const qualifiedGroups = manualThirds.map(t => t.group).sort().join("");
  const matrixRow = window.annexCMatrix[qualifiedGroups];

  function getThird(groupWinner) {
    if (!matrixRow) return manualThirds[0];
    const targetGroup = matrixRow[groupWinner];
    return manualThirds.find(t => t.group === targetGroup);
  }

  const r32 = {
    left: [
      { home: manualGroups['E'].first, away: getThird("1E"), id: 'L1' },
      { home: manualGroups['I'].first, away: getThird("1I"), id: 'L2' },
      { home: manualGroups['A'].second, away: manualGroups['B'].second, id: 'L3' },
      { home: manualGroups['F'].first, away: manualGroups['C'].second, id: 'L4' },
      { home: manualGroups['K'].second, away: manualGroups['L'].second, id: 'L5' },
      { home: manualGroups['H'].first, away: manualGroups['J'].second, id: 'L6' },
      { home: manualGroups['D'].first, away: getThird("1D"), id: 'L7' },
      { home: manualGroups['G'].first, away: getThird("1G"), id: 'L8' }
    ],
    right: [
      { home: manualGroups['C'].first, away: manualGroups['F'].second, id: 'R1' },
      { home: manualGroups['E'].second, away: manualGroups['I'].second, id: 'R2' },
      { home: manualGroups['A'].first, away: getThird("1A"), id: 'R3' },
      { home: manualGroups['L'].first, away: getThird("1L"), id: 'R4' },
      { home: manualGroups['J'].first, away: manualGroups['H'].second, id: 'R5' },
      { home: manualGroups['D'].second, away: manualGroups['G'].second, id: 'R6' },
      { home: manualGroups['B'].first, away: getThird("1B"), id: 'R7' },
      { home: manualGroups['K'].first, away: getThird("1K"), id: 'R8' }
    ]
  };

  return r32;
}
