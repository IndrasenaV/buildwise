// Airport Hangar - steel structure focused with per-template tasks/checks
function tasksFor(nameRaw) {
  const name = (nameRaw || '').toLowerCase();
  const t = [];
  if (name.includes('permitting')) {
    t.push(
      { title: 'Coordinate with airport authority', phaseKey: 'preconstruction', description: 'Confirm submittal requirements and schedule.' },
      { title: 'Submit permit package', phaseKey: 'preconstruction', description: 'Plans, calculations, specs.' }
    );
  } else if (name.includes('foundation')) {
    t.push(
      { title: 'Formwork', phaseKey: 'exterior', description: 'Set forms and elevations per slab plan.' },
      { title: 'Rebar inspection', phaseKey: 'exterior', description: 'Pass inspection prior to pour.' },
      { title: 'Pour slab', phaseKey: 'exterior', description: 'Place concrete and finish as specified.' }
    );
  } else if (name.includes('steel erection')) {
    t.push(
      { title: 'Unload and stage steel', phaseKey: 'exterior', description: 'Stage components for erection.' },
      { title: 'Erect primary frame', phaseKey: 'exterior', description: 'Bolt-up/torque per spec.' },
      { title: 'Install secondary members', phaseKey: 'exterior', description: 'Girts/purlins installed.' }
    );
  } else if (name.includes('roofing')) {
    t.push(
      { title: 'Install underlayment', phaseKey: 'exterior', description: 'Dry-in roof.' },
      { title: 'Install metal panels', phaseKey: 'exterior', description: 'Fasten per manufacturer.' }
    );
  } else if (name.includes('exterior skin')) {
    t.push(
      { title: 'Install wall panels', phaseKey: 'exterior', description: 'Insulated or single-skin panels.' },
      { title: 'Seal and flash', phaseKey: 'exterior', description: 'Weather-tightness details.' }
    );
  } else if (name.includes('hangar door')) {
    t.push(
      { title: 'Door track install', phaseKey: 'exterior', description: 'Align and anchor tracks.' },
      { title: 'Door panel install', phaseKey: 'exterior', description: 'Install and test operation.' }
    );
  } else if (name.includes('electrical')) {
    t.push(
      { title: 'Service coordination', phaseKey: 'preconstruction', description: 'Coordinate utility service size.' },
      { title: 'Lighting rough-in', phaseKey: 'interior', description: 'High-bay and controls rough-in.' },
      { title: 'Finals and testing', phaseKey: 'interior', description: 'Test panels and circuits.' }
    );
  } else if (name.includes('plumbing')) {
    t.push(
      { title: 'Floor drains layout', phaseKey: 'preconstruction', description: 'Coordinate slab slopes and drains.' },
      { title: 'Rough-in', phaseKey: 'interior', description: 'Install drains and water lines.' }
    );
  } else if (name.includes('hvac')) {
    t.push(
      { title: 'Equipment selection', phaseKey: 'preconstruction', description: 'Ventilation and heating design.' },
      { title: 'Install duct/fans', phaseKey: 'interior', description: 'Install per design.' }
    );
  }
  return t;
}

function checksFor(nameRaw) {
  const name = (nameRaw || '').toLowerCase();
  const c = [];
  if (name.includes('foundation')) {
    c.push(
      { phaseKey: 'exterior', title: 'Anchor bolts per plan', notes: 'Spacing and embedment', accepted: false },
      { phaseKey: 'exterior', title: 'Vapor barrier & rebar', notes: 'Laps taped; size/spacing per design', accepted: false },
      { phaseKey: 'exterior', title: 'Slab flatness', notes: 'FF/FL within tolerance for hangar use', accepted: false }
    );
  }
  if (name.includes('steel')) {
    c.push(
      { phaseKey: 'exterior', title: 'Bolt torque verified', notes: 'Per spec; documented torque values', accepted: false },
      { phaseKey: 'exterior', title: 'Column/plumb alignment', notes: 'Within erection tolerances', accepted: false },
      { phaseKey: 'exterior', title: 'Weld inspections (if any)', notes: 'Visual/UT as specified', accepted: false }
    );
  }
  if (name.includes('roofing')) {
    c.push(
      { phaseKey: 'exterior', title: 'Panel fastening per spec', notes: 'Fastener pattern correct; no oil-canning', accepted: false },
      { phaseKey: 'exterior', title: 'Seams sealed', notes: 'Sealant/tape continuous; ridge closures', accepted: false },
      { phaseKey: 'exterior', title: 'Penetration flashings', notes: 'Curb and pipe flashings watertight', accepted: false }
    );
  }
  if (name.includes('exterior skin')) {
    c.push(
      { phaseKey: 'exterior', title: 'Wall panel alignment', notes: 'Consistent reveals; fasteners seated', accepted: false },
      { phaseKey: 'exterior', title: 'Insulation continuity', notes: 'No gaps; thermal breaks installed', accepted: false }
    );
  }
  if (name.includes('hangar door')) {
    c.push(
      { phaseKey: 'exterior', title: 'Track alignment', notes: 'Level; smooth operation end-to-end', accepted: false },
      { phaseKey: 'exterior', title: 'Door safety interlocks', notes: 'Limit switches and safeties tested', accepted: false }
    );
  }
  if (name.includes('windows') || name.includes('doors')) {
    c.push(
      { phaseKey: 'exterior', title: 'Glazing/door hardware', notes: 'Installed per schedule; smooth operation', accepted: false },
      { phaseKey: 'exterior', title: 'Weather seals', notes: 'Gaskets/caulk continuous', accepted: false }
    );
  }
  if (name.includes('apron') || name.includes('flatwork')) {
    c.push(
      { phaseKey: 'exterior', title: 'Paving thickness/finish', notes: 'Meets spec; joints cut/sealed', accepted: false },
      { phaseKey: 'exterior', title: 'Drainage slopes', notes: 'No ponding; positive flow', accepted: false }
    );
  }
  if (name.includes('site utilities')) {
    c.push(
      { phaseKey: 'exterior', title: 'As-built depths/locations', notes: 'Verified and recorded', accepted: false },
      { phaseKey: 'exterior', title: 'Pressure/leak tests', notes: 'Pass hydro/pneumatic tests as applicable', accepted: false }
    );
  }
  if (name.includes('gutters') || name.includes('downspouts')) {
    c.push(
      { phaseKey: 'exterior', title: 'Slope and outlets', notes: 'Proper pitch; secure outlets', accepted: false },
      { phaseKey: 'exterior', title: 'Leak check', notes: 'Seams sealed; no drips at joints', accepted: false }
    );
  }
  if (name.includes('electrical')) {
    c.push(
      { phaseKey: 'interior', title: 'Lighting levels', notes: 'Meet foot-candle targets; controls operational', accepted: false },
      { phaseKey: 'interior', title: 'Panel labeling and torque', notes: 'Directory complete; lugs torqued', accepted: false }
    );
  }
  if (name.includes('plumbing')) {
    c.push(
      { phaseKey: 'interior', title: 'Floor drain flood test', notes: 'Slope to drains; traps primed', accepted: false }
    );
  }
  if (name.includes('hvac')) {
    c.push(
      { phaseKey: 'interior', title: 'Ventilation rates', notes: 'Meets design CFM; CO/CO2 sensors configured', accepted: false },
      { phaseKey: 'interior', title: 'Equipment commissioning', notes: 'Start-up checklists complete', accepted: false }
    );
  }
  if (name.includes('sprinkler') || name.includes('suppression')) {
    c.push(
      { phaseKey: 'interior', title: 'Hydrostatic test', notes: 'Piping holds pressure; no leaks', accepted: false },
      { phaseKey: 'interior', title: 'Head spacing/coverage', notes: 'Per NFPA layout; obstructions cleared', accepted: false }
    );
  }
  return c;
}

const AIRPORT_HANGAR_TRADES = [
  // Preconstruction
  { name: 'Land Survey', phaseKeys: ['preconstruction'], tasks: [], qualityChecks: [] },
  { name: 'Geotechnical / Soil Test', phaseKeys: ['preconstruction'], tasks: [], qualityChecks: [] },
  { name: 'Structural Engineering (Steel)', phaseKeys: ['preconstruction'], tasks: [], qualityChecks: [] },
  { name: 'Permitting / Airport Authority Approvals', phaseKeys: ['preconstruction'], tasks: tasksFor('Permitting / Airport Authority Approvals'), qualityChecks: [] },
  { name: 'SWPPP / Storm Prevention', phaseKeys: ['preconstruction'], tasks: [], qualityChecks: [] },
  { name: 'Builder Risk Insurance', phaseKeys: ['preconstruction'], tasks: [], qualityChecks: [] },

  // Exterior / Shell
  { name: 'Foundation (Slab / Footings)', phaseKeys: ['exterior'], tasks: tasksFor('Foundation (Slab / Footings)'), qualityChecks: checksFor('Foundation (Slab / Footings)') },
  { name: 'Steel Erection', phaseKeys: ['exterior'], tasks: tasksFor('Steel Erection'), qualityChecks: checksFor('Steel Erection') },
  { name: 'Roofing (Metal Panels)', phaseKeys: ['exterior'], tasks: tasksFor('Roofing (Metal Panels)'), qualityChecks: checksFor('Roofing (Metal Panels)') },
  { name: 'Exterior Skin (Metal Panels / Insulated Panels)', phaseKeys: ['exterior'], tasks: tasksFor('Exterior Skin (Metal Panels / Insulated Panels)'), qualityChecks: [] },
  { name: 'Hangar Door System', phaseKeys: ['exterior'], tasks: tasksFor('Hangar Door System'), qualityChecks: [] },
  { name: 'Windows / Man Doors', phaseKeys: ['exterior'], tasks: [], qualityChecks: [] },
  { name: 'Apron / Flatwork (Concrete Paving)', phaseKeys: ['exterior'], tasks: [], qualityChecks: [] },
  { name: 'Site Utilities', phaseKeys: ['exterior'], tasks: [], qualityChecks: [] },
  { name: 'Gutters / Downspouts', phaseKeys: ['exterior'], tasks: [], qualityChecks: [] },

  // MEP / Interior (as applicable)
  { name: 'Electrical (Lighting / Power)', phaseKeys: ['preconstruction', 'interior'], tasks: tasksFor('Electrical (Lighting / Power)'), qualityChecks: [] },
  { name: 'Plumbing (Floor Drains / Restrooms)', phaseKeys: ['preconstruction', 'interior'], tasks: tasksFor('Plumbing (Floor Drains / Restrooms)'), qualityChecks: [] },
  { name: 'HVAC / Ventilation', phaseKeys: ['preconstruction', 'interior'], tasks: tasksFor('HVAC / Ventilation'), qualityChecks: [] },
  { name: 'Fire Sprinkler / Suppression', phaseKeys: ['interior'], tasks: [], qualityChecks: [] },
  { name: 'Interior Build-out (Office / Restrooms)', phaseKeys: ['interior'], tasks: [], qualityChecks: [] },
];

module.exports = { AIRPORT_HANGAR_TRADES };


