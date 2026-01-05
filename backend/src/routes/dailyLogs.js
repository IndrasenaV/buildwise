const express = require('express');
const { listDailyLogs, createDailyLog } = require('../controllers/dailyLogController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// /api/homes/:homeId/daily-logs
router.get('/:homeId/daily-logs', requireAuth, listDailyLogs);
router.post('/:homeId/daily-logs', requireAuth, createDailyLog);

module.exports = router;
