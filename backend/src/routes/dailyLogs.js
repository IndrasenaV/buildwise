const express = require('express');
const { listDailyLogs, createDailyLog } = require('../controllers/dailyLogController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// /api/homes/:homeId/daily-logs
router.get('/:homeId/daily-logs', requireAuth, listDailyLogs);
router.post('/:homeId/daily-logs', requireAuth, createDailyLog);

module.exports = router;

*** End Patch  */}
JSON error: Unexpected token * in JSON at position 1+  }  */ at Object.<anonymous> (/root/.npm/_npx/1658259c2b6b6282/node_modules/json5/lib/parse.js:86:16)
    at JSON5.parse (/root/.npm/_npx/1658259c2b6b6282/node_modules/json5/lib/parse.js:138:18)
    at Object.parseJSON (/root/.npm/_npx/1658259c2b6b6282/node_modules/comment-json/index.js:246:10)
    at module.exports (/app/node_modules/@modelcontextprotocol/sdk/dist/index.js:1:94346)
    at isWellFormedLark (/app/.cache/tools.js:1:6882)
    at Object.tools.apply_patch (/app/.cache/tools.js:1:11694)
    at callTool (/app/.cache/kit.js:1:197642)
    at R (/app/.cache/kit.js:1:195834)
    at sU.u.tools.parallel.e (/app/.cache/kit.js:1:195187)
    at _handleToolCall (/app/.cache/kit.js:1:196086)  }```!json error

