// Pool - residential pool scope with per-template tasks and checks
function tasksFor(nameRaw) {
  const name = (nameRaw || '').toLowerCase();
  const t = [];
  if (name.includes('design')) {
    t.push(
      { title: 'Finalize pool design', phaseKey: 'preconstruction', description: 'Dimensions, depth, features.' },
      { title: 'Engineering calcs', phaseKey: 'preconstruction', description: 'Structural design and details.' }
    );
  } else if (name.includes('permitting')) {
    t.push(
      { title: 'Prepare permit packet', phaseKey: 'preconstruction', description: 'Plans and specs for city/HOA.' },
      { title: 'Submit permit', phaseKey: 'preconstruction', description: 'Pay fees and track review.' }
    );
  } else if (name.includes('excavation')) {
    t.push(
      { title: 'Layout pool', phaseKey: 'exterior', description: 'Stake layout and verify setbacks.' },
      { title: 'Excavate pool', phaseKey: 'exterior', description: 'Excavate to design depth and shape.' }
    );
  } else if (name.includes('steel') || name.includes('rebar')) {
    t.push(
      { title: 'Install rebar', phaseKey: 'exterior', description: 'Tie rebar per engineering.' },
      { title: 'Steel inspection', phaseKey: 'exterior', description: 'Pass inspection before gunite.' }
    );
  } else if (name.includes('plumbing')) {
    t.push(
      { title: 'Stub-out plumbing', phaseKey: 'exterior', description: 'Run skimmer/returns/main drains.' },
      { title: 'Pressure test', phaseKey: 'exterior', description: 'Hold pressure prior to gunite.' }
    );
  } else if (name.includes('electrical')) {
    t.push(
      { title: 'Bonding', phaseKey: 'exterior', description: 'Bond steel and equipment per code.' },
      { title: 'Run power', phaseKey: 'exterior', description: 'Install conduits and equipment feeds.' }
    );
  } else if (name.includes('gunite') || name.includes('shotcrete')) {
    t.push(
      { title: 'Shoot shell', phaseKey: 'exterior', description: 'Gunite/shotcrete application.' },
      { title: 'Curing', phaseKey: 'exterior', description: 'Keep shell moist for cure period.' }
    );
  } else if (name.includes('tile') || name.includes('coping')) {
    t.push(
      { title: 'Install tile', phaseKey: 'exterior', description: 'Waterline tile install.' },
      { title: 'Install coping', phaseKey: 'exterior', description: 'Set coping per spec.' }
    );
  } else if (name.includes('deck') || name.includes('flatwork')) {
    t.push(
      { title: 'Form and pour deck', phaseKey: 'exterior', description: 'Concrete/pavers as specified.' }
    );
  } else if (name.includes('equipment install')) {
    t.push(
      { title: 'Set equipment', phaseKey: 'exterior', description: 'Pumps, filters, heaters installed.' },
      { title: 'Plumb and wire', phaseKey: 'exterior', description: 'Connect all equipment.' }
    );
  } else if (name.includes('fencing')) {
    t.push(
      { title: 'Install fencing', phaseKey: 'exterior', description: 'Meet code height/locking.' }
    );
  } else if (name.includes('startup') || name.includes('balancing')) {
    t.push(
      { title: 'Water fill', phaseKey: 'exterior', description: 'Fill and start equipment.' },
      { title: 'Chem balance', phaseKey: 'exterior', description: 'Balance water chemistry.' }
    );
  } else if (name.includes('final inspection')) {
    t.push(
      { title: 'Schedule final inspection', phaseKey: 'exterior', description: 'City/HOA final.' }
    );
  }
  return t;
}

function checksFor(nameRaw) {
  const name = (nameRaw || '').toLowerCase();
  const c = [];
  if (name.includes('design')) {
    c.push(
      { phaseKey: 'preconstruction', title: 'Hydraulics verified', notes: 'Pipe sizes/head loss acceptable', accepted: false }
    );
  }
  if (name.includes('permitting')) {
    c.push(
      { phaseKey: 'preconstruction', title: 'Barrier plan approved', notes: 'Fencing/alarms per code', accepted: false }
    );
  }
  if (name.includes('excavation')) {
    c.push(
      { phaseKey: 'exterior', title: 'Layout within setbacks', notes: 'Dimensions and offsets verified', accepted: false },
      { phaseKey: 'exterior', title: 'Overdig and subgrade', notes: 'Uniform base; no soft spots', accepted: false }
    );
  }
  if (name.includes('steel') || name.includes('rebar')) {
    c.push(
      { phaseKey: 'exterior', title: 'Rebar spacing per plan', notes: 'Inspect chairs/ties; cover maintained', accepted: false },
      { phaseKey: 'exterior', title: 'Bonding to steel', notes: 'Bond wire connected per code', accepted: false }
    );
  }
  if (name.includes('plumbing')) {
    c.push(
      { phaseKey: 'exterior', title: 'Pressure test', notes: 'Holds pressure prior to gunite', accepted: false },
      { phaseKey: 'exterior', title: 'Main drain sumps', notes: 'Dual drains; covers VGBA compliant', accepted: false }
    );
  }
  if (name.includes('electrical')) {
    c.push(
      { phaseKey: 'exterior', title: 'Bonding verified', notes: 'Equipotential bonding complete', accepted: false },
      { phaseKey: 'exterior', title: 'Lighting niche bond/ground', notes: 'Per manufacturer/code', accepted: false }
    );
  }
  if (name.includes('gunite') || name.includes('shotcrete')) {
    c.push(
      { phaseKey: 'exterior', title: 'Shell thickness/cover', notes: 'Meets spec at walls/floor', accepted: false },
      { phaseKey: 'exterior', title: 'Curing maintained', notes: 'Moist cure per duration', accepted: false }
    );
  }
  if (name.includes('tile') || name.includes('coping')) {
    c.push(
      { phaseKey: 'exterior', title: 'Tile alignment/adhesion', notes: 'Waterline straight; proper thinset', accepted: false },
      { phaseKey: 'exterior', title: 'Coping slope/secure', notes: 'Drains away; set solid', accepted: false }
    );
  }
  if (name.includes('deck') || name.includes('flatwork')) {
    c.push(
      { phaseKey: 'exterior', title: 'Deck pitch/drainage', notes: 'No back pitch to pool; joints cut', accepted: false }
    );
  }
  if (name.includes('equipment install')) {
    c.push(
      { phaseKey: 'exterior', title: 'Flow and head', notes: 'Pump/filter sized; valves labeled', accepted: false },
      { phaseKey: 'exterior', title: 'Heater/chem equipment', notes: 'Venting and clearances per spec', accepted: false }
    );
  }
  if (name.includes('fencing')) {
    c.push(
      { phaseKey: 'exterior', title: 'Fence meets code', notes: 'Height, latch direction, gaps', accepted: false },
      { phaseKey: 'exterior', title: 'Gates self-close/latch', notes: 'Proper spring tension', accepted: false }
    );
  }
  if (name.includes('startup') || name.includes('balancing')) {
    c.push(
      { phaseKey: 'exterior', title: 'Equipment startup', notes: 'Prime pump; check leaks and flows', accepted: false },
      { phaseKey: 'exterior', title: 'Water chemistry', notes: 'pH/alkalinity/CL balanced per startup card', accepted: false }
    );
  }
  if (name.includes('final inspection')) {
    c.push(
      { phaseKey: 'exterior', title: 'Safety devices', notes: 'Alarms, life-ring, signage if required', accepted: false }
    );
  }
  return c;
}

const POOL_TRADES = [
  // Preconstruction
  { name: 'Pool Design / Engineering', phaseKeys: ['preconstruction'], promptBaseKey: 'pool_design_engineering', tasks: tasksFor('Pool Design / Engineering'), qualityChecks: [] },
  { name: 'Permitting (Pool)', phaseKeys: ['preconstruction'], promptBaseKey: 'pool_permitting', tasks: tasksFor('Permitting (Pool)'), qualityChecks: [] },
  { name: 'Utility Locates / Survey', phaseKeys: ['preconstruction'], promptBaseKey: 'pool_utility_locates', tasks: [], qualityChecks: [] },

  // Exterior Construction
  { name: 'Excavation', phaseKeys: ['exterior'], promptBaseKey: 'pool_excavation', tasks: tasksFor('Excavation'), qualityChecks: [] },
  { name: 'Steel / Rebar', phaseKeys: ['exterior'], promptBaseKey: 'pool_steel_rebar', tasks: tasksFor('Steel / Rebar'), qualityChecks: checksFor('Steel / Rebar') },
  { name: 'Plumbing (Pool Lines / Equipment Pads)', phaseKeys: ['preconstruction', 'exterior'], promptBaseKey: 'pool_plumbing', tasks: tasksFor('Plumbing (Pool Lines / Equipment Pads)'), qualityChecks: [] },
  { name: 'Electrical (Bonding / Equipment Power)', phaseKeys: ['preconstruction', 'exterior'], promptBaseKey: 'pool_electrical', tasks: tasksFor('Electrical (Bonding / Equipment Power)'), qualityChecks: checksFor('Electrical (Bonding / Equipment Power)') },
  { name: 'Gunite / Shotcrete', phaseKeys: ['exterior'], promptBaseKey: 'pool_gunite_shotcrete', tasks: tasksFor('Gunite / Shotcrete'), qualityChecks: [] },
  { name: 'Tile / Coping', phaseKeys: ['exterior'], promptBaseKey: 'pool_tile_coping', tasks: tasksFor('Tile / Coping'), qualityChecks: [] },
  { name: 'Deck / Flatwork', phaseKeys: ['exterior'], promptBaseKey: 'pool_deck_flatwork', tasks: tasksFor('Deck / Flatwork'), qualityChecks: [] },
  { name: 'Equipment Install (Pumps / Filters / Heaters)', phaseKeys: ['exterior'], promptBaseKey: 'pool_equipment_install', tasks: tasksFor('Equipment Install (Pumps / Filters / Heaters)'), qualityChecks: [] },
  { name: 'Fencing (Code Requirements)', phaseKeys: ['exterior'], promptBaseKey: 'pool_fencing', tasks: tasksFor('Fencing (Code Requirements)'), qualityChecks: checksFor('Fencing (Code Requirements)') },
  { name: 'Startup / Balancing', phaseKeys: ['exterior'], promptBaseKey: 'pool_startup_balancing', tasks: tasksFor('Startup / Balancing'), qualityChecks: [] },
  { name: 'Final Inspection', phaseKeys: ['exterior'], promptBaseKey: 'pool_final_inspection', tasks: tasksFor('Final Inspection'), qualityChecks: [] },
];

module.exports = { POOL_TRADES };


