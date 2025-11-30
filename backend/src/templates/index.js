const { SINGLE_FAMILY_TRADES } = require('./singleFamily');
const { TOWNHOME_TRADES } = require('./townhome');
const { AIRPORT_HANGAR_TRADES } = require('./airportHangar');
const { POOL_TRADES } = require('./pool');

// Templates (ordered so the first is the default choice in the UI)
const TEMPLATES = [
  {
    id: 'single_family',
    name: 'Single Family Home',
    description: 'Standard single family custom home covering preconstruction, exterior, and interior trades.',
    getBids: () => SINGLE_FAMILY_TRADES,
  },
  {
    id: 'townhome',
    name: 'Townhome',
    description: 'Townhome-focused template (pool excluded).',
    getBids: () => TOWNHOME_TRADES,
  },
  {
    id: 'airport_hangar',
    name: 'Airport Hangar',
    description: 'Core trades for a steel hangar build.',
    getBids: () => AIRPORT_HANGAR_TRADES,
  },
  {
    id: 'pool',
    name: 'Pool',
    description: 'Pool-focused scope with site finishes.',
    getBids: () => POOL_TRADES,
  },
];

function listTemplates() {
  return TEMPLATES.map(({ id, name, description }) => ({ id, name, description }));
}

function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

module.exports = { listTemplates, getTemplateById };


