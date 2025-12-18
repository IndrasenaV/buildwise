// Mocked architecture analysis response shaped like the backend output,
// with extra fields to drive richer visualizations.
export const mockArchitectureAnalysis = {
  houseType: 'Modern Two-Story',
  roofType: 'Flat',
  exteriorType: 'Stucco + Glass',
  functionalScores: {
    spaceEfficiency: 0.72,
    circulation: 0.68,
    storage: 0.55,
    privacy: 0.7,
    adaptability: 0.6,
    accessibility: 0.58,
  },
  lightingAnalysis: {
    summary: 'Strong daylight in social spaces; secondary bedrooms could benefit from larger or additional windows.',
    avgDaylightScore: 0.73,
    rooms: [
      { name: 'Great Room', daylightScore: 0.9, orientation: 'S', glazingAreaPct: 22 },
      { name: 'Kitchen', daylightScore: 0.82, orientation: 'SE', glazingAreaPct: 18 },
      { name: 'Primary Bedroom', daylightScore: 0.75, orientation: 'E', glazingAreaPct: 15 },
      { name: 'Bedroom 2', daylightScore: 0.56, orientation: 'N', glazingAreaPct: 9 },
      { name: 'Bedroom 3', daylightScore: 0.52, orientation: 'NW', glazingAreaPct: 8 },
      { name: 'Office', daylightScore: 0.64, orientation: 'W', glazingAreaPct: 12 },
    ],
  },
  costAnalysis: {
    summary: 'Build cost is projected to be higher than typical primarily due to extensive glazing and a flat roof assembly. Structural spans in the great room also contribute.',
    highImpactItems: [
      {
        item: 'Glazing Ratio',
        rationale: 'Window/glass area is ~22% vs a typical 15–18%, increasing material and installation costs.',
        estCostImpact: 18000,
        units: 'USD',
        metricName: 'Glazing % of envelope',
        projectValue: 22,
        typicalValue: 17,
        typicalRange: [15, 18],
      },
      {
        item: 'Roof Type',
        rationale: 'Flat roof assemblies require additional waterproofing and insulation detailing compared to gable roofs.',
        estCostImpact: 12000,
        units: 'USD',
        metricName: 'Roof complexity index',
        projectValue: 0.75,
        typicalValue: 0.45,
      },
      {
        item: 'Great Room Span',
        rationale: 'Long clear spans drive up structure (LVL/steel) costs and installation time.',
        estCostImpact: 9500,
        units: 'USD',
        metricName: 'Primary span length (ft)',
        projectValue: 24,
        typicalValue: 18,
      },
      {
        item: 'Exterior Cladding',
        rationale: 'Smooth stucco with architectural reveals and glass corners increase labor time.',
        estCostImpact: 6500,
        units: 'USD',
        metricName: 'Detailing complexity (0–1)',
        projectValue: 0.7,
        typicalValue: 0.5,
      },
    ],
    valueEngineeringIdeas: [
      { idea: 'Reduce glazing in secondary spaces by ~15%', trade: 'Windows/Doors', estSavings: '$6,000–$9,000' },
      { idea: 'Convert part of flat roof to low-slope gable', trade: 'Roofing', estSavings: '$7,000–$11,000' },
      { idea: 'Introduce hidden beam with shorter spans', trade: 'Framing', estSavings: '$4,000–$6,000' },
    ],
  },
  roomAnalysis: [
    { name: 'Great Room', level: '1', areaSqFt: 420, dimensions: { lengthFt: 28, widthFt: 15 }, windows: 5, doors: 2, notes: 'Open concept; potential echo—consider acoustic panels.' },
    { name: 'Kitchen', level: '1', areaSqFt: 210, dimensions: { lengthFt: 14, widthFt: 15 }, windows: 2, doors: 1, notes: 'Good work triangle; consider pantry shelving optimization.' },
    { name: 'Primary Bedroom', level: '2', areaSqFt: 220, dimensions: { lengthFt: 16, widthFt: 13.5 }, windows: 3, doors: 2, notes: 'Add sound insulation at shared walls.' },
    { name: 'Bedroom 2', level: '2', areaSqFt: 150, dimensions: { lengthFt: 12, widthFt: 12.5 }, windows: 1, doors: 1, notes: 'Improve natural light with larger window.' },
    { name: 'Bedroom 3', level: '2', areaSqFt: 148, dimensions: { lengthFt: 12, widthFt: 12.3 }, windows: 1, doors: 1, notes: 'Comparable to Bedroom 2.' },
    { name: 'Office', level: '1', areaSqFt: 130, dimensions: { lengthFt: 10, widthFt: 13 }, windows: 1, doors: 1, notes: 'Consider built-in storage wall.' },
  ],
  accessibilityComfort: {
    metrics: { stepFreeEntries: 1, primaryDoorWidthIn: 36, hallwayWidthIn: 40, stairRiserIn: 7.5 },
    issues: [
      { area: 'Hallway 2F', severity: 'medium', issue: 'Some hallway widths below 42"', recommendation: 'Target 42–48" where feasible' },
      { area: 'Powder Bath', severity: 'low', issue: 'Tight turning radius', recommendation: 'Increase by 6–8"' },
    ],
  },
  optimizationSuggestions: [
    { title: 'Daylight tuning', impact: 'medium', description: 'Slightly enlarge north-facing bedroom windows; add light shelf in office.' },
    { title: 'Mechanical zoning', impact: 'high', description: 'Separate upstairs/downstairs zones to improve comfort and energy efficiency.' },
  ],
  suggestions: [
    'Confirm structural support for long-span great room.',
    'Coordinate roof drains and scuppers for flat roof.',
  ],
  suggestedTasks: [
    { title: 'Review glazing specification with vendor', description: 'Balance U-factor/SHGC with cost.', phaseKey: 'planning' },
    { title: 'Structural consult on span strategy', description: 'Hidden beam vs. post option.', phaseKey: 'preconstruction' },
  ],
}


