const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const DailyLogSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    homeId: { type: String, required: true, index: true },
    // Event timestamp for the log entry (not just createdAt)
    timestamp: { type: Date, required: true, index: true },
    type: { type: String, default: 'note', index: true },
    message: { type: String, default: '' },
    author: {
      email: { type: String, default: '' },
      fullName: { type: String, default: '' },
    },
    // Flexible metadata for future extension: weather, deliveries, incidents, task refs, etc.
    meta: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Unique key per home + timestamp to avoid duplicate entries for same moment
DailyLogSchema.index({ homeId: 1, timestamp: 1 }, { unique: true });
DailyLogSchema.index({ homeId: 1, createdAt: -1 });

const DailyLog = mongoose.model('DailyLog', DailyLogSchema);

module.exports = { DailyLog };