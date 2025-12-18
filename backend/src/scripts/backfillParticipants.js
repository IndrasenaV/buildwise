/* Backfill participants on existing Home documents
 * Adds the specified email as the first participant with role 'owner' and permission 'admin'
 * if the home has no participants or does not already include that email.
 *
 * Usage:
 *   EMAIL=sravya.ksr@gmail.com node backend/src/scripts/backfillParticipants.js
 *
 * Requires DB env vars to be configured (same as the server).
 */
const dotenv = require('dotenv');
dotenv.config();

const { connectToDatabase } = require('../config/db');
const { Home } = require('../models/Home');

async function run() {
  const email = String(process.env.EMAIL || 'sravya.ksr@gmail.com').toLowerCase();
  const fullName = process.env.FULL_NAME || '';
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('EMAIL env variable is required');
    process.exit(1);
  }
  await connectToDatabase();
  // eslint-disable-next-line no-console
  console.log('Connected. Backfilling participants for', email);

  const filter = {
    $or: [
      { participants: { $exists: false } },
      { participants: { $size: 0 } },
      { participants: { $not: { $elemMatch: { email } } } },
    ],
  };
  const update = {
    $push: {
      participants: {
        $each: [{
          fullName,
          email,
          phone: '',
          role: 'owner',
          permission: 'admin',
        }],
        $position: 0,
      }
    }
  };
  const result = await Home.updateMany(filter, update);
  // eslint-disable-next-line no-console
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
  process.exit(0);
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


