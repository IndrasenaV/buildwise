// Single Family Home - trades with per-template tasks and quality checks (duplicated for this template by design)
const { DEFAULT_BIDS } = require('./defaultBids');

function getTasksForBidNameLocal(bidName) {
  const name = (bidName || '').toLowerCase();
  const tasks = [];
  if (name.includes('architect')) {
    tasks.push(
      { title: 'Finalize floor plans', phaseKey: 'preconstruction', description: 'Confirm room sizes, circulation, and code compliance before engineering.' },
      { title: 'Exterior elevations', phaseKey: 'preconstruction', description: 'Produce final elevations with materials and heights for review/permit.' },
      { title: 'Window and door schedule', phaseKey: 'preconstruction', description: 'Create window/door schedule for ordering and framing rough openings.' },
      { title: 'Structural coordination with engineer', phaseKey: 'preconstruction', description: 'Coordinate beams, loads, and structural details with engineering.' },
      { title: 'City submittal set', phaseKey: 'preconstruction', description: 'Compile complete permit set including site plan, elevations, and details.' },
    );
  } else if (name.includes('soil') || name.includes('geotech')) {
    tasks.push(
      { title: 'Schedule soil test', phaseKey: 'preconstruction', description: 'Book geotechnical boring to determine foundation recommendations.' },
      { title: 'Receive soil report', phaseKey: 'preconstruction', description: 'Collect formal report with bearing capacity and moisture content.' },
      { title: 'Share report with engineer', phaseKey: 'preconstruction', description: 'Forward report to structural engineer for slab/footing design.' },
    );
  } else if (name.includes('structural')) {
    tasks.push(
      { title: 'Foundation design', phaseKey: 'preconstruction', description: 'Engineer slab/footings based on soil report and architecture.' },
      { title: 'Framing plans', phaseKey: 'preconstruction', description: 'Produce framing plans with joist/truss layout and sheathing.' },
      { title: 'Beam sizing', phaseKey: 'preconstruction', description: 'Size steel/wood beams for spans and loads per code.' },
      { title: 'Issue stamped drawings', phaseKey: 'preconstruction', description: 'Deliver signed/sealed structural sheets for permit and build.' },
    );
  } else if (name.includes('permit') || name.includes('city')) {
    tasks.push(
      { title: 'Prepare permit packet', phaseKey: 'preconstruction', description: 'Assemble all drawings, energy forms, and applications.' },
      { title: 'Submit application', phaseKey: 'preconstruction', description: 'Submit application and pay fees to AHJ.' },
      { title: 'Respond to plan review comments', phaseKey: 'preconstruction', description: 'Address reviewer comments and resubmit as needed.' },
      { title: 'Obtain permit', phaseKey: 'preconstruction', description: 'Pick up final permit and post on site.' },
    );
  } else if (name.includes('electrical')) {
    tasks.push(
      { title: 'Sign contract', phaseKey: 'preconstruction', description: 'Execute contract with electrical subcontractor and confirm scope.' },
      { title: 'Electrical rough-in', phaseKey: 'interior', description: 'Run wiring, boxes, and panels per plan before drywall.' },
      { title: 'Rough inspection', phaseKey: 'interior', description: 'Pass electrical rough inspection prior to insulation.' },
      { title: 'Trim-out', phaseKey: 'interior', description: 'Install devices, fixtures, and breakers after finishes.' },
      { title: 'Final inspection', phaseKey: 'interior', description: 'Pass final power inspection for CO.' },
    );
  } else if (name.includes('plumb')) {
    tasks.push(
      { title: 'Sign contract', phaseKey: 'preconstruction', description: 'Execute contract with plumber and align on fixture schedule.' },
      { title: 'Plumbing rough-in', phaseKey: 'interior', description: 'Install drain, waste, and vent plus water lines before drywall.' },
      { title: 'Top-out', phaseKey: 'interior', description: 'Set tubs/showers and pressure-test plumbing.' },
      { title: 'Rough inspection', phaseKey: 'interior', description: 'Pass plumbing rough inspection prior to insulation.' },
      { title: 'Final inspection', phaseKey: 'interior', description: 'Pass final plumbing inspection for CO.' },
    );
  } else if (name.includes('hvac')) {
    tasks.push(
      { title: 'Sign contract', phaseKey: 'preconstruction', description: 'Execute HVAC contract and verify tonnage/SEER selections.' },
      { title: 'Duct layout', phaseKey: 'interior', description: 'Lay out ducts/returns per Manual D and architectural constraints.' },
      { title: 'Rough-in', phaseKey: 'interior', description: 'Install ductwork, line sets, and boots before drywall.' },
      { title: 'Rough inspection', phaseKey: 'interior', description: 'Pass HVAC rough inspection prior to insulation.' },
      { title: 'Startup and balance', phaseKey: 'interior', description: 'Commission equipment and balance airflow.' },
    );
  } else if (name.includes('foundation')) {
    tasks.push(
      { title: 'Formwork', phaseKey: 'exterior', description: 'Set forms per slab plan and verify dimensions and elevations.' },
      { title: 'Rebar inspection', phaseKey: 'exterior', description: 'Pass rebar inspection before pour.' },
      { title: 'Pour', phaseKey: 'exterior', description: 'Place concrete per spec; ensure proper curing conditions.' },
      { title: 'Cure and strip forms', phaseKey: 'exterior', description: 'Allow curing, then remove forms and protect slab.' },
    );
  } else if (name.includes('framing')) {
    tasks.push(
      { title: 'Frame walls and roof', phaseKey: 'exterior', description: 'Build walls/roof per plans; coordinate with trades.' },
      { title: 'Set beams', phaseKey: 'exterior', description: 'Install beams per structural drawings.' },
      { title: 'Sheathing', phaseKey: 'exterior', description: 'Apply wall/roof sheathing and nail off per spec.' },
      { title: 'Framing inspection', phaseKey: 'exterior', description: 'Pass framing inspection prior to MEP rough-in.' },
    );
  } else if (name.includes('window')) {
    tasks.push(
      { title: 'Verify rough openings', phaseKey: 'exterior', description: 'Check RO dimensions before order/install.' },
      { title: 'Order windows', phaseKey: 'preconstruction', description: 'Place order early to avoid schedule delays.' },
      { title: 'Install windows', phaseKey: 'exterior', description: 'Set and fasten per manufacturer instructions.' },
      { title: 'Flashing and sealing', phaseKey: 'exterior', description: 'Install flashing/tape to maintain envelope integrity.' },
    );
  } else if (name.includes('roof')) {
    tasks.push(
      { title: 'Dry-in', phaseKey: 'exterior', description: 'Install underlayment and waterproofing.' },
      { title: 'Install roofing', phaseKey: 'exterior', description: 'Install shingles/tile/metal per spec.' },
      { title: 'Final roof inspection', phaseKey: 'exterior', description: 'Pass roof inspection and warranty registration if required.' },
    );
  } else if (name.includes('stucco')) {
    tasks.push(
      { title: 'Lath inspection', phaseKey: 'exterior', description: 'Pass lath inspection before scratch/brown coats.' },
      { title: 'Brown coat', phaseKey: 'exterior', description: 'Apply brown coat; allow proper cure time.' },
      { title: 'Finish coat', phaseKey: 'exterior', description: 'Apply finish coat with specified texture/color.' },
    );
  } else if (name.includes('drywall')) {
    tasks.push(
      { title: 'Hang drywall', phaseKey: 'interior', description: 'Hang boards per layout, avoid butt joints where possible.' },
      { title: 'Tape and float', phaseKey: 'interior', description: 'Tape seams and apply joint compound to Level standard.' },
      { title: 'Texture', phaseKey: 'interior', description: 'Apply agreed texture (smooth/orange peel/etc.).' },
      { title: 'Prime', phaseKey: 'interior', description: 'Prime walls/ceilings to reveal imperfections before paint.' },
    );
  } else if (name.includes('cabinet')) {
    tasks.push(
      { title: 'Field verify', phaseKey: 'interior', description: 'Field measure for accurate shop drawings and orders.' },
      { title: 'Shop drawings approval', phaseKey: 'interior', description: 'Approve cabinet drawings and finishes.' },
      { title: 'Install cabinets', phaseKey: 'interior', description: 'Install per layout; verify clearances and reveals.' },
    );
  } else if (name.includes('counter')) {
    tasks.push(
      { title: 'Template', phaseKey: 'interior', description: 'Template tops after cabinets are set and appliances verified.' },
      { title: 'Fabrication', phaseKey: 'interior', description: 'Fabricate stone/solid surface per selections.' },
      { title: 'Install countertops', phaseKey: 'interior', description: 'Install tops, seam, and caulk as specified.' },
    );
  } else if (name.includes('floor')) {
    tasks.push(
      { title: 'Acclimate materials', phaseKey: 'interior', description: 'Acclimate materials to site conditions before install.' },
      { title: 'Install flooring', phaseKey: 'interior', description: 'Install per manufacturer spec and pattern.' },
      { title: 'Punch and finish', phaseKey: 'interior', description: 'Punch list and finish as needed for handoff.' },
    );
  } else if (name.includes('paint')) {
    tasks.push(
      { title: 'Interior prime', phaseKey: 'interior', description: 'Prime walls/ceilings; check for imperfections.' },
      { title: 'Wall paint', phaseKey: 'interior', description: 'Apply specified coats and sheen.' },
      { title: 'Trim paint', phaseKey: 'interior', description: 'Paint trim/doors per spec.' },
      { title: 'Final touch-ups', phaseKey: 'interior', description: 'Blue-tape walkthrough and touch-up before CO.' },
    );
  } else if (name.includes('fireplace')) {
    tasks.push(
      { title: 'Rough-in box', phaseKey: 'interior', description: 'Frame fireplace box to spec and clearances.' },
      { title: 'Flue/vent', phaseKey: 'interior', description: 'Install venting per manufacturer spec.' },
      { title: 'Finish surround', phaseKey: 'interior', description: 'Install surround, hearth, and trim.' },
    );
  }
  return tasks;
}

function getQualityChecksForBidNameLocal(bidName) {
  const name = (bidName || '').toLowerCase();
  const checks = [];
  // Design / Preconstruction
  if (name.includes('architect') || name.includes('designer')) {
    checks.push(
      { phaseKey: 'preconstruction', title: 'Floor plans coordinated', notes: 'Room sizes, door swings, circulation verified', accepted: false },
      { phaseKey: 'preconstruction', title: 'Elevations complete', notes: 'Materials called out; heights consistent with sections', accepted: false },
      { phaseKey: 'preconstruction', title: 'Window/door schedule verified', notes: 'ROs, handing, egress compliance', accepted: false },
      { phaseKey: 'preconstruction', title: 'Energy code alignment', notes: 'U-factor/SHGC, insulation values specified', accepted: false }
    );
  }
  if (name.includes('soil') || name.includes('geotech')) {
    checks.push(
      { phaseKey: 'preconstruction', title: 'Boring locations adequate', notes: 'Representative of slab areas', accepted: false },
      { phaseKey: 'preconstruction', title: 'Engineer reviewed report', notes: 'PI/bearing capacity acknowledged', accepted: false }
    );
  }
  if (name.includes('structural')) {
    checks.push(
      { phaseKey: 'preconstruction', title: 'Load paths resolved', notes: 'Beams/posts align with openings below', accepted: false },
      { phaseKey: 'preconstruction', title: 'Shear/hold-downs detailed', notes: 'Straps/anchors/nail schedules set', accepted: false }
    );
  }
  if (name.includes('permit') || name.includes('city')) {
    checks.push(
      { phaseKey: 'preconstruction', title: 'Permit set complete', notes: 'All sheets, schedules and details included', accepted: false },
      { phaseKey: 'preconstruction', title: 'Plan review closed', notes: 'Comments addressed; approvals received', accepted: false }
    );
  }
  // Exterior / Shell
  if (name.includes('foundation')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Subgrade and compaction', notes: 'Proof-rolled; no pumping/soft areas', accepted: false },
      { phaseKey: 'exterior', title: 'Vapor barrier intact', notes: 'Laps sealed; penetrations taped', accepted: false },
      { phaseKey: 'exterior', title: 'Rebar/mesh per design', notes: 'Size, spacing, clear cover verified', accepted: false },
      { phaseKey: 'exterior', title: 'Anchor bolts per plan', notes: 'Spacing and embedment verified', accepted: false },
      { phaseKey: 'exterior', title: 'Post-tension tails cut/capped', notes: 'All tails trimmed and capped flush', accepted: false },
      { phaseKey: 'exterior', title: 'Finish/levelness', notes: 'FF/FL or straightedge within tolerance', accepted: false }
    );
  }
  if (name.includes('framing')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Stud spacing and nailing', notes: '16" o.c. unless noted; nail schedule per plan', accepted: false },
      { phaseKey: 'exterior', title: 'Headers/beams installed', notes: 'Bearing and connectors installed correctly', accepted: false },
      { phaseKey: 'exterior', title: 'Sheathing nailing pattern', notes: 'Edge/field spacing per code', accepted: false },
      { phaseKey: 'exterior', title: 'Truss bracing', notes: 'Temporary/permanent bracing per truss drawings', accepted: false }
    );
  }
  if (name.includes('window')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Flashing sequence correct', notes: 'Sill first, jambs, then head; taped corners', accepted: false },
      { phaseKey: 'exterior', title: 'Fasteners per spec', notes: 'No overdriven heads; spacing per mfr', accepted: false },
      { phaseKey: 'exterior', title: 'Air/water seal', notes: 'Continuous sealant; no gaps at fins', accepted: false }
    );
  }
  if (name.includes('roof')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Underlayment coverage', notes: 'Laps, valleys and penetrations flashed', accepted: false },
      { phaseKey: 'exterior', title: 'Shingle/tile fastening', notes: 'Starter/course aligned; per wind zone', accepted: false },
      { phaseKey: 'exterior', title: 'Penetration flashings', notes: 'Stacks/vents/chimneys sealed', accepted: false }
    );
  }
  if (name.includes('stucco')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Weep screed/lath correct', notes: 'Clearances; fasteners; paper laps', accepted: false },
      { phaseKey: 'exterior', title: 'Scratch/brown coat cure', notes: 'Cure times met; no delamination', accepted: false },
      { phaseKey: 'exterior', title: 'Finish free of defects', notes: 'Uniform color/texture; no cracks/voids', accepted: false }
    );
  }
  // Interior / MEP / Finishes
  if (name.includes('electrical')) {
    checks.push(
      { phaseKey: 'interior', title: 'Box locations/heights', notes: 'Per plan; ADA clearances where required', accepted: false },
      { phaseKey: 'interior', title: 'Circuiting and protection', notes: 'AFCI/GFCI as required; load calc fits', accepted: false },
      { phaseKey: 'interior', title: 'Low-voltage separation', notes: 'Data/AV separated from power conductors', accepted: false },
      { phaseKey: 'interior', title: 'Rough-in passed', notes: 'Inspection approval documented', accepted: false },
      { phaseKey: 'interior', title: 'Trim-out polarity/grounding', notes: 'Devices wired correctly; fixtures bonded', accepted: false },
      { phaseKey: 'interior', title: 'Final function test', notes: 'Switching and lighting per schedule', accepted: false }
    );
  }
  if (name.includes('plumb')) {
    checks.push(
      { phaseKey: 'interior', title: 'DWV pressure test', notes: 'Holds pressure; no leaks at joints', accepted: false },
      { phaseKey: 'interior', title: 'Water line pressure test', notes: 'Duration and PSI per code', accepted: false },
      { phaseKey: 'interior', title: 'Shower pan test', notes: '24-hour flood; no leaks; weeps open', accepted: false },
      { phaseKey: 'interior', title: 'Final fixtures', notes: 'Flows, temps, traps and vents correct', accepted: false }
    );
  }
  if (name.includes('hvac')) {
    checks.push(
      { phaseKey: 'interior', title: 'Duct leakage test', notes: 'Leakage within limits; mastic at joints', accepted: false },
      { phaseKey: 'interior', title: 'Returns/transfer sizing', notes: 'Pressure balance and Manual D verified', accepted: false },
      { phaseKey: 'interior', title: 'Condensate routing', notes: 'Primary/secondary drains with cleanouts', accepted: false },
      { phaseKey: 'interior', title: 'Startup and balance', notes: 'Delta-T and airflow per design', accepted: false }
    );
  }
  if (name.includes('drywall')) {
    checks.push(
      { phaseKey: 'interior', title: 'Fastener spacing', notes: 'Perimeter/field per GA-216', accepted: false },
      { phaseKey: 'interior', title: 'Level of finish', notes: 'Consistent with specified level', accepted: false },
      { phaseKey: 'interior', title: 'Surface defects', notes: 'No nail pops; raking light after prime', accepted: false }
    );
  }
  if (name.includes('cabinet')) {
    checks.push(
      { phaseKey: 'interior', title: 'Plumb/level/secure', notes: 'Stud/cleat anchorage verified', accepted: false },
      { phaseKey: 'interior', title: 'Clearances/reveals', notes: 'Appliance and door swing clear', accepted: false },
      { phaseKey: 'interior', title: 'Finish condition', notes: 'No scratches; touch-up complete', accepted: false }
    );
  }
  if (name.includes('counter')) {
    checks.push(
      { phaseKey: 'interior', title: 'Seams tight/flush', notes: 'Color match and flatness verified', accepted: false },
      { phaseKey: 'interior', title: 'Sink cutouts sealed', notes: 'Edges sealed; clips secure', accepted: false },
      { phaseKey: 'interior', title: 'Overhang support', notes: 'Brackets/corbels where required', accepted: false }
    );
  }
  if (name.includes('floor')) {
    checks.push(
      { phaseKey: 'interior', title: 'Subfloor flatness/moisture', notes: 'Acclimation complete; within tolerance', accepted: false },
      { phaseKey: 'interior', title: 'Expansion gaps', notes: 'Perimeter/transitions per spec', accepted: false },
      { phaseKey: 'interior', title: 'Transitions/trim', notes: 'Reducers and thresholds neat', accepted: false }
    );
  }
  if (name.includes('paint')) {
    checks.push(
      { phaseKey: 'interior', title: 'Primer coverage', notes: 'No holidays; uniform', accepted: false },
      { phaseKey: 'interior', title: 'Finish uniformity', notes: 'Color/sheen even; no lap marks', accepted: false },
      { phaseKey: 'interior', title: 'Masking/cleanliness', notes: 'No overspray; hardware clean', accepted: false }
    );
  }
  if (name.includes('fireplace')) {
    checks.push(
      { phaseKey: 'interior', title: 'Clearances to combustibles', notes: 'As per manufacturer/listing', accepted: false },
      { phaseKey: 'interior', title: 'Venting installed', notes: 'Slope and joints per manufacturer', accepted: false },
      { phaseKey: 'interior', title: 'Combustion air', notes: 'Provided where required', accepted: false }
    );
  }
  if (name.includes('insulation')) {
    checks.push(
      { phaseKey: 'interior', title: 'R-value and coverage', notes: 'No voids; depth at eaves correct', accepted: false },
      { phaseKey: 'interior', title: 'Air sealing complete', notes: 'Top plates/penetrations sealed', accepted: false }
    );
  }
  return checks;
}

// Hard-coded prompt base keys for each DEFAULT_BIDS entry
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
  'Big Horn Iron Doors': 'big_horn_iron_doors',
  'Big Horn Iron Windows': 'big_horn_iron_windows',
  'Love That Door': 'love_that_door',
};

const SINGLE_FAMILY_TRADES = (DEFAULT_BIDS || []).map((b) => ({
  name: b.name,
  phaseKeys: b.phaseKeys,
  promptBaseKey: PROMPT_BASE_BY_NAME[b.name] || '',
  tasks: getTasksForBidNameLocal(b.name),
  qualityChecks: getQualityChecksForBidNameLocal(b.name),
}));

module.exports = { SINGLE_FAMILY_TRADES };


