const fs = require('fs');

// Mock DOM
const data = fs.readFileSync('data.js', 'utf8');
const annex = fs.readFileSync('annex_c_matrix.js', 'utf8');
const simulator = fs.readFileSync('simulator.js', 'utf8');
const main = fs.readFileSync('main.js', 'utf8');

// Combine to execute
const script = `
  ${data}
  ${annex}
  ${simulator}
  
  // mock for main.js variables
  let manualGroups = {};
  let manualThirds = [];

  // mock groupOdds to match what user did
  Object.keys(groupOdds).forEach(g => {
    const teams = groupOdds[g];
    manualGroups[g] = {
      first: { ...teams[0], group: g },
      second: { ...teams[1], group: g },
      third: { ...teams[2], group: g }
    };
  });

  manualThirds = [
    manualGroups['A'].third,
    manualGroups['B'].third,
    manualGroups['C'].third,
    manualGroups['D'].third,
    manualGroups['E'].third,
    manualGroups['F'].third,
    manualGroups['G'].third,
    manualGroups['H'].third
  ];

  try {
    const r32 = generateR32FromManual(manualGroups, manualThirds);
    console.log("SUCCESS:", !!r32);
  } catch(e) {
    console.log("ERROR in generateR32FromManual:", e.message);
  }
`;

fs.writeFileSync('test_run.js', script);
