const express = require('express');
const {
  listTemplates,
  getTemplate,
  createTemplate,
  versionTemplate,
  updateTemplate,
  freezeTemplate,
  addTrade,
  deleteTrade,
  addTask,
  deleteTask,
  addQualityCheck,
  deleteQualityCheck,
} = require('../controllers/templateController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listTemplates);
router.get('/:id', requireAuth, getTemplate);
router.post('/', requireAuth, createTemplate);
router.post('/:id/version', requireAuth, versionTemplate);
router.patch('/:id', requireAuth, updateTemplate);
router.post('/:id/freeze', requireAuth, freezeTemplate);

// nested edits (draft templates only)
router.post('/:id/trades', requireAuth, addTrade);
router.delete('/:id/trades/:tradeId', requireAuth, deleteTrade);
router.post('/:id/trades/:tradeId/tasks', requireAuth, addTask);
router.delete('/:id/trades/:tradeId/tasks/:taskId', requireAuth, deleteTask);
router.post('/:id/trades/:tradeId/quality-checks', requireAuth, addQualityCheck);
router.delete('/:id/trades/:tradeId/quality-checks/:checkId', requireAuth, deleteQualityCheck);

module.exports = router;


