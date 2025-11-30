const express = require('express');
const { listMessages, createMessage, createTaskFromMessage } = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// /api/homes/:homeId/messages
router.get('/:homeId/messages', requireAuth, listMessages);
router.post('/:homeId/messages', requireAuth, createMessage);
router.post('/:homeId/messages/task-from-message', requireAuth, createTaskFromMessage);

module.exports = router;



