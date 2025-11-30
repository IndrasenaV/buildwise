// Phase keys: 'preconstruction' | 'exterior' | 'interior'
// Derived from customhome/requirements/allbids.txt
const DEFAULT_BIDS = [
  // Preconstruction / Admin / Permitting
  { name: 'Lot', phaseKeys: ['preconstruction'] },
  { name: 'Builder Fee', phaseKeys: ['preconstruction'] },
  { name: 'Designer', phaseKeys: ['preconstruction'] },
  { name: 'Architect', phaseKeys: ['preconstruction'] },
  { name: 'Soil Test', phaseKeys: ['preconstruction'] },
  { name: 'Structural Engineering', phaseKeys: ['preconstruction'] },
  { name: 'Land Survey', phaseKeys: ['preconstruction'] },
  { name: 'House Permit (City)', phaseKeys: ['preconstruction'] },
  { name: 'SWPPP / Storm Prevention', phaseKeys: ['preconstruction'] },
  { name: 'Builder Risk Insurance', phaseKeys: ['preconstruction'] },
  { name: 'Water Meter', phaseKeys: ['preconstruction'] },
  { name: 'Termite Control', phaseKeys: ['preconstruction'] },
  { name: 'Site Services - Portable Toilet', phaseKeys: ['preconstruction'] },
  { name: 'Site Fence', phaseKeys: ['preconstruction', 'exterior'] },
  { name: 'Landscape Design', phaseKeys: ['preconstruction'] },

  // Exterior / Shell
  { name: 'Retaining Wall', phaseKeys: ['exterior'] },
  { name: 'Foundation', phaseKeys: ['exterior'] },
  { name: 'Lot Cleaning / Concrete Wash', phaseKeys: ['exterior'] },
  { name: 'Framing', phaseKeys: ['exterior'] },
  { name: 'Steel I-Beams (Framing)', phaseKeys: ['exterior'] },
  { name: 'Lumber Package', phaseKeys: ['exterior'] },
  { name: 'Framing Fixes / Extra Lumber', phaseKeys: ['exterior'] },
  { name: 'Roof Contractor', phaseKeys: ['exterior'] },
  { name: 'Stucco', phaseKeys: ['exterior'] },
  { name: 'Stone Work', phaseKeys: ['exterior'] },
  { name: 'Windows (Pella / Iron)', phaseKeys: ['exterior', 'interior'] },
  { name: 'Exterior Trim Paint', phaseKeys: ['exterior'] },
  { name: 'Flatwork (Concrete)', phaseKeys: ['exterior'] },
  { name: 'Gutters', phaseKeys: ['exterior'] },
  { name: 'Landscaping', phaseKeys: ['exterior'] },
  { name: 'Garages', phaseKeys: ['exterior'] },
  { name: 'Pool', phaseKeys: ['exterior'] },

  // Interior / MEP / Finishes
  { name: 'Electrical', phaseKeys: ['preconstruction', 'interior'] },
  { name: 'Plumbing', phaseKeys: ['preconstruction', 'interior'] },
  { name: 'HVAC', phaseKeys: ['preconstruction', 'interior'] },
  { name: 'Fire Sprinkler', phaseKeys: ['interior'] },
  { name: 'Insulation', phaseKeys: ['interior'] },
  { name: 'Drywalls', phaseKeys: ['interior'] },
  { name: 'Paint (Interior)', phaseKeys: ['interior'] },
  { name: 'Hardwood Flooring', phaseKeys: ['interior'] },
  { name: 'Bathroom Tiles', phaseKeys: ['interior'] },
  { name: 'Cabinets', phaseKeys: ['interior'] },
  { name: 'Countertops', phaseKeys: ['interior'] },
  { name: 'Interior Doors', phaseKeys: ['interior'] },
  { name: 'Stairs', phaseKeys: ['interior'] },
  { name: 'Trim Work (Material/Labor)', phaseKeys: ['interior'] },
  { name: 'Faucets / Fixtures', phaseKeys: ['interior'] },
  { name: 'Fireplace', phaseKeys: ['interior'] },
  { name: 'Security Camera', phaseKeys: ['interior', 'exterior'] },
  { name: 'Appliances', phaseKeys: ['interior'] },
  { name: 'Appliance Install', phaseKeys: ['interior'] },
  { name: 'Door Installation', phaseKeys: ['interior'] },

  // Vendors/brands captured as separate optional bids if desired
  { name: 'Big Horn Iron Doors', phaseKeys: ['exterior', 'interior'] },
  { name: 'Big Horn Iron Windows', phaseKeys: ['exterior', 'interior'] },
  { name: 'Love That Door', phaseKeys: ['exterior', 'interior'] },
]

module.exports = { DEFAULT_BIDS }


