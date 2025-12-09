// Townhome - per-template tasks/checks (duplicated intentionally for this template)
const { DEFAULT_BIDS } = require('./defaultBids');

function getTasksForBidNameLocal(bidName) {
  const name = (bidName || '').toLowerCase();
  const tasks = [];
  if (name.includes('architect')) {
    tasks.push(
      { title: 'Finalize unit plans', phaseKey: 'preconstruction', description: 'Coordinate party walls and shared systems.' },
      { title: 'Exterior elevations', phaseKey: 'preconstruction', description: 'Ensure materials comply with HOA/city requirements.' },
      { title: 'Window and door schedule', phaseKey: 'preconstruction', description: 'Consolidate SKUs for multi-unit ordering.' },
      { title: 'Structural coordination', phaseKey: 'preconstruction', description: 'Coordinate structural for repetitive spans.' },
      { title: 'City submittal set', phaseKey: 'preconstruction', description: 'Compile permit set for multi-unit review.' },
    );
  } else if (name.includes('electrical')) {
    tasks.push(
      { title: 'Service coordination', phaseKey: 'preconstruction', description: 'Coordinate meter banks and common lighting.' },
      { title: 'Electrical rough-in', phaseKey: 'interior', description: 'Run wiring for each unit and common spaces.' },
      { title: 'Rough inspection', phaseKey: 'interior', description: 'Pass electrical rough inspections.' },
      { title: 'Trim-out', phaseKey: 'interior', description: 'Devices and fixtures per unit schedule.' },
      { title: 'Final inspection', phaseKey: 'interior', description: 'Pass final for CO.' },
    );
  } else if (name.includes('plumb')) {
    tasks.push(
      { title: 'Riser coordination', phaseKey: 'preconstruction', description: 'Plan shared risers and isolation.' },
      { title: 'Plumbing rough-in', phaseKey: 'interior', description: 'Run DWV and supply per stack layout.' },
      { title: 'Top-out', phaseKey: 'interior', description: 'Set tubs/showers and pressure test.' },
      { title: 'Rough inspection', phaseKey: 'interior', description: 'Pass inspections per unit.' },
      { title: 'Final inspection', phaseKey: 'interior', description: 'Pass finals for CO.' },
    );
  } else if (name.includes('hvac')) {
    tasks.push(
      { title: 'Equipment selection', phaseKey: 'preconstruction', description: 'Verify tonnage across unit types.' },
      { title: 'Rough-in', phaseKey: 'interior', description: 'Ducts/returns per unit; common ventilation as needed.' },
      { title: 'Rough inspection', phaseKey: 'interior', description: 'Pass HVAC rough inspections.' },
      { title: 'Startup and balance', phaseKey: 'interior', description: 'Commission per unit and common spaces.' },
    );
  } else if (name.includes('foundation')) {
    tasks.push(
      { title: 'Formwork', phaseKey: 'exterior', description: 'Shared foundation layout and elevations.' },
      { title: 'Rebar inspection', phaseKey: 'exterior', description: 'Pass rebar inspections.' },
      { title: 'Pour', phaseKey: 'exterior', description: 'Place concrete per spec.' },
      { title: 'Cure and strip', phaseKey: 'exterior', description: 'Protect slab and strip forms.' },
    );
  } else if (name.includes('framing')) {
    tasks.push(
      { title: 'Frame party walls', phaseKey: 'exterior', description: 'Build as rated assemblies.' },
      { title: 'Sheathing', phaseKey: 'exterior', description: 'Apply and nail off per spec.' },
      { title: 'Framing inspection', phaseKey: 'exterior', description: 'Pass framing inspections.' },
    );
  } else if (name.includes('roof')) {
    tasks.push(
      { title: 'Dry-in', phaseKey: 'exterior', description: 'Underlayment and details for shared roof lines.' },
      { title: 'Install roofing', phaseKey: 'exterior', description: 'Install per spec.' },
      { title: 'Final roof inspection', phaseKey: 'exterior', description: 'Pass roof inspection.' },
    );
  } else if (name.includes('drywall')) {
    tasks.push(
      { title: 'Hang drywall', phaseKey: 'interior', description: 'Install per unit and rated walls as required.' },
      { title: 'Tape and float', phaseKey: 'interior', description: 'Finish to level standard.' },
      { title: 'Prime', phaseKey: 'interior', description: 'Prime for paint.' },
    );
  } else if (name.includes('paint')) {
    tasks.push(
      { title: 'Interior prime', phaseKey: 'interior', description: 'Prime walls/ceilings.' },
      { title: 'Paint', phaseKey: 'interior', description: 'Apply coats and sheens per spec.' },
      { title: 'Touch-ups', phaseKey: 'interior', description: 'Blue-tape walkthrough and touch-ups.' },
    );
  }
  return tasks;
}

function getQualityChecksForBidNameLocal(bidName) {
  const name = (bidName || '').toLowerCase();
  const checks = [];
  // Preconstruction / Coordination
  if (name.includes('architect') || name.includes('designer')) {
    checks.push(
      { phaseKey: 'preconstruction', title: 'Unit plans coordinated', notes: 'Stairs/egress; stacking for MEP risers', accepted: false },
      { phaseKey: 'preconstruction', title: 'Party wall details set', notes: 'UL assemblies, acoustic targets', accepted: false }
    );
  }
  // Foundation / Structure
  if (name.includes('foundation')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Anchor bolts as designed', notes: 'Spacing/embed verified', accepted: false },
      { phaseKey: 'exterior', title: 'Control/expansion joints', notes: 'Placed per plan; sealed', accepted: false }
    );
  }
  if (name.includes('framing')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Rated assemblies correct', notes: 'Party wall layers/penetration protection', accepted: false },
      { phaseKey: 'exterior', title: 'Sheathing nailing pattern', notes: 'Meets structural schedule', accepted: false },
      { phaseKey: 'exterior', title: 'Fire blocking/draftstopping', notes: 'At chases and concealed spaces', accepted: false }
    );
  }
  if (name.includes('roof')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Underlayment and flashings', notes: 'Common ridges/valleys sealed', accepted: false },
      { phaseKey: 'exterior', title: 'Parapet or party wall caps', notes: 'Weatherproof terminations', accepted: false }
    );
  }
  // MEP
  if (name.includes('electrical')) {
    checks.push(
      { phaseKey: 'interior', title: 'Meter bank labeling', notes: 'Clearly labeled per unit', accepted: false },
      { phaseKey: 'interior', title: 'Common lighting circuits', notes: 'Photosensors/timers set', accepted: false },
      { phaseKey: 'interior', title: 'Rough-in passed', notes: 'Inspections approved per building', accepted: false }
    );
  }
  if (name.includes('plumb')) {
    checks.push(
      { phaseKey: 'interior', title: 'Riser isolation', notes: 'Acoustic wrap and firestopping at penetrations', accepted: false },
      { phaseKey: 'interior', title: 'DWV pressure test', notes: 'City standard test; no leaks', accepted: false },
      { phaseKey: 'interior', title: 'Water pressure test', notes: 'Holds for duration', accepted: false }
    );
  }
  if (name.includes('hvac')) {
    checks.push(
      { phaseKey: 'interior', title: 'Vent terminations', notes: 'Shared shaft caps and spacing', accepted: false },
      { phaseKey: 'interior', title: 'Transfer air/smoke separation', notes: 'No cross-unit leakage', accepted: false }
    );
  }
  // Finishes
  if (name.includes('drywall')) {
    checks.push(
      { phaseKey: 'interior', title: 'Rated walls intact', notes: 'Penetrations sealed/rated putty pads at boxes', accepted: false },
      { phaseKey: 'interior', title: 'Sound attenuation batts', notes: 'Installed at party walls/ceilings', accepted: false }
    );
  }
  if (name.includes('paint')) {
    checks.push(
      { phaseKey: 'interior', title: 'Common area finish', notes: 'Durable finish; touch-up complete', accepted: false }
    );
  }
  return checks;
}

// Hard-coded prompt base keys (reuse where applicable from single family)
const PROMPT_BASE_BY_NAME = {
  'Lot': 'lot',
  'Builder Fee': 'builder_fee',
  'Designer': 'designer',
  'Architect': 'architect',
  'Soil Test': 'soil_test',
  'Structural Engineering': 'structural_engineer',
  'Land Survey': 'land_survey',
  'House Permit (City)': 'permit_city',
  'SWPPP / Storm Prevention': 'swppp',
  'Builder Risk Insurance': 'builder_risk_insurance',
  'Water Meter': 'water_meter',
  'Termite Control': 'termite_control',
  'Site Services - Portable Toilet': 'portable_toilet',
  'Site Fence': 'site_fence',
  'Landscape Design': 'landscape_design',
  'Retaining Wall': 'retaining_wall',
  'Foundation': 'foundation',
  'Lot Cleaning / Concrete Wash': 'lot_cleaning',
  'Framing': 'framing',
  'Steel I-Beams (Framing)': 'steel_beams',
  'Lumber Package': 'lumber_package',
  'Framing Fixes / Extra Lumber': 'framing_fixes',
  'Roof Contractor': 'roofing',
  'Stucco': 'stucco',
  'Stone Work': 'stone_work',
  'Windows (Pella / Iron)': 'windows',
  'Exterior Trim Paint': 'exterior_paint',
  'Flatwork (Concrete)': 'flatwork',
  'Gutters': 'gutters',
  'Landscaping': 'landscaping',
  'Garages': 'garages',
  'Pool': 'pool',
  'Electrical': 'electrical',
  'Plumbing': 'plumbing',
  'HVAC': 'hvac',
  'Fire Sprinkler': 'fire_sprinkler',
  'Insulation': 'insulation',
  'Drywalls': 'drywall',
  'Paint (Interior)': 'interior_paint',
  'Hardwood Flooring': 'hardwood_flooring',
  'Bathroom Tiles': 'bathroom_tile',
  'Cabinets': 'cabinets',
  'Countertops': 'countertops',
  'Interior Doors': 'interior_doors',
  'Stairs': 'stairs',
  'Trim Work (Material/Labor)': 'trim_work',
  'Faucets / Fixtures': 'faucets_fixtures',
  'Fireplace': 'fireplace',
  'Security Camera': 'security_cameras',
  'Appliances': 'appliances',
  'Appliance Install': 'appliance_install',
  'Door Installation': 'door_installation',
};

const TOWNHOME_TRADES = (DEFAULT_BIDS || [])
  .filter((b) => {
    const n = b.name.toLowerCase();
    return !n.includes('pool') && !n.includes('garages');
  })
  .map((b) => ({
    name: b.name,
    phaseKeys: b.phaseKeys,
    promptBaseKey: PROMPT_BASE_BY_NAME[b.name] || '',
    tasks: getTasksForBidNameLocal(b.name),
    qualityChecks: getQualityChecksForBidNameLocal(b.name),
  }));

module.exports = { TOWNHOME_TRADES };


