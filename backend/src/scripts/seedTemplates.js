/* Seed static code-based templates into MongoDB as versioned Template documents */
require('dotenv').config();
const { connectToDatabase } = require('../config/db');
const { Template } = require('../models/Template');
const { normalizeKey, TRADE_PROMPTS } = require('../services/bidComparisonPrompts');

async function main() {
  await connectToDatabase();

  const { SINGLE_FAMILY_TRADES } = require('../templates/singleFamily');
  const { TOWNHOME_TRADES } = require('../templates/townhome');
  const { AIRPORT_HANGAR_TRADES } = require('../templates/airportHangar');
  const { POOL_TRADES } = require('../templates/pool');

  const candidates = [
    {
      templateKey: 'single_family',
      name: 'Single Family Home',
      description: 'Standard single family custom home covering preconstruction, exterior, and interior trades.',
      trades: SINGLE_FAMILY_TRADES,
    },
    {
      templateKey: 'townhome',
      name: 'Townhome',
      description: 'Townhome-focused template (pool excluded).',
      trades: TOWNHOME_TRADES,
    },
    {
      templateKey: 'airport_hangar',
      name: 'Airport Hangar',
      description: 'Core trades for a steel hangar build.',
      trades: AIRPORT_HANGAR_TRADES,
    },
    {
      templateKey: 'pool',
      name: 'Pool',
      description: 'Pool-focused scope with site finishes.',
      trades: POOL_TRADES,
    },
  ];

  let createdCount = 0;
  for (const c of candidates) {
    const existing = await Template.findOne({ templateKey: c.templateKey }).sort({ version: -1 });
    const nextVersion = existing ? (existing.version + 1) : 1;
    const created = await Template.create({
      templateKey: c.templateKey,
      name: c.name,
      description: c.description,
      version: nextVersion,
      status: 'frozen', // import baseline as immutable; create new versions for edits
      trades: (c.trades || []).map((t) => {
        // Use promptBaseKey directly from template definitions (no derivation)
        const base = String(t.promptBaseKey || '').trim();
        return {
          name: t.name,
          phaseKeys: t.phaseKeys || [],
          // Set promptBaseKey for all trades so prompts can be added later in DB
          promptBaseKey: base,
          tasks: (t.tasks || []).map((tk) => ({
            title: tk.title,
            description: tk.description || '',
            phaseKey: tk.phaseKey,
          })),
          qualityChecks: (t.qualityChecks || []).map((qc) => ({
            phaseKey: qc.phaseKey,
            title: qc.title,
            notes: qc.notes || '',
          })),
        };
      }),
    });
    console.log(`Seeded ${c.templateKey} v${created.version} (frozen)`);
    createdCount += 1; 
  }

  console.log(`Done. Created ${createdCount} template(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



