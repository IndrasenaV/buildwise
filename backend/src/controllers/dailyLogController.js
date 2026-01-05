const { DailyLog } = require('../models/DailyLog');

async function listDailyLogs(req, res) {
  const { homeId } = req.params;
  const { limit, before, type } = req.query;
  const q = { homeId: String(homeId) };
  if (type) q.type = String(type);
  if (before) {
    const dt = new Date(before);
    if (!isNaN(dt.getTime())) {
      q.createdAt = { $lt: dt };
    }
  }
  const items = await DailyLog.find(q)
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(200, Number(limit) || 50)))
    .lean();
  res.json({ items });
}

async function createDailyLog(req, res) {
  const { homeId } = req.params;
  const { message, type, timestamp, meta } = req.body || {};
  const userEmail = (() => {
    try { return req.user?.email || '' } catch { return '' }
  })();
  const userName = (() => {
    try { return req.user?.fullName || '' } catch { return '' }
  })();
  const ts = timestamp ? new Date(timestamp) : new Date();
  if (isNaN(ts.getTime())) {
    return res.status(400).json({ message: 'Invalid timestamp' });
  }
  const doc = await DailyLog.create({
    homeId: String(homeId),
    timestamp: ts,
    type: type || 'note',
    message: String(message || ''),
    author: { email: userEmail, fullName: userName },
    meta: meta && typeof meta === 'object' ? meta : {},
  });
  res.status(201).json({ item: { ...doc.toObject() } });
}

module.exports = { listDailyLogs, createDailyLog };
