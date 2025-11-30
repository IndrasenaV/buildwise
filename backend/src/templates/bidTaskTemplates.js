function getTasksForBidName(bidName) {
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

function getQualityChecksForBidName(bidName) {
  const name = (bidName || '').toLowerCase();
  const checks = [];
  if (name.includes('foundation')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Post-tension tails cut and capped', notes: 'All tails trimmed and capped flush', accepted: false },
      { phaseKey: 'exterior', title: 'No voids under slab edges', notes: 'Verify no honeycombing or large voids', accepted: false },
      { phaseKey: 'exterior', title: 'Anchor bolts installed per plan', notes: 'Spacing and embedment verified', accepted: false }
    );
  }
  if (name.includes('framing')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Stud spacing and nailing per plan', notes: 'Check 16" o.c. unless noted', accepted: false },
      { phaseKey: 'exterior', title: 'Sheathing nailing pattern verified', notes: 'Per code and plan', accepted: false }
    );
  }
  if (name.includes('electrical')) {
    checks.push(
      { phaseKey: 'interior', title: 'Box locations and heights correct', notes: 'Per electrical plan', accepted: false },
      { phaseKey: 'interior', title: 'Rough-in inspected and passed', notes: 'City red tag cleared', accepted: false }
    );
  }
  if (name.includes('plumb')) {
    checks.push(
      { phaseKey: 'interior', title: 'DWV pressure test passed', notes: 'No leaks at joints', accepted: false },
      { phaseKey: 'interior', title: 'Shower pan test passed', notes: 'No leaks at pans', accepted: false }
    );
  }
  if (name.includes('stucco')) {
    checks.push(
      { phaseKey: 'exterior', title: 'Weep screed and lath installed correctly', notes: 'Clearances per code', accepted: false },
      { phaseKey: 'exterior', title: 'Final finish free of cracks/voids', notes: 'Uniform color/texture', accepted: false }
    );
  }
  return checks;
}

module.exports = { getTasksForBidName, getQualityChecksForBidName };


