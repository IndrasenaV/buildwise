const express = require('express');
const {
  listHomes,
  getHome,
  createHome,
  updateHome,
  addBid,
  addTaskToBid,
  addSchedule,
  addDocument,
  assignClientToHome,
  addMonitorToHome,
  updateTask,
  updateBid,
  addBidInvoice,
  updateBidInvoice,
} = require('../controllers/homeController');
const { compareTradeBids } = require('../controllers/bidCompareController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', listHomes);
router.post('/', createHome);
router.get('/:homeId', getHome);
router.put('/:homeId', updateHome);

// Trades routes
router.post('/:homeId/trades', addBid);
router.post('/:homeId/trades/:bidId/tasks', addTaskToBid);
router.patch('/:homeId/trades/:bidId/tasks/:taskId', updateTask);
router.put('/:homeId/trades/:bidId', updateBid);
router.post('/:homeId/trades/:bidId/invoices', addBidInvoice);
router.patch('/:homeId/trades/:bidId/invoices/:invoiceId', updateBidInvoice);
router.post('/:homeId/trades/:bidId/quality-checks', require('../controllers/homeController').addQualityCheckToBid);
router.patch('/:homeId/trades/:bidId/quality-checks/:checkId', require('../controllers/homeController').updateQualityCheck);
// Bid comparison (PDFs -> OpenAI with trade-specific prompt)
router.post('/:homeId/trades/:bidId/compare-bids', requireAuth, compareTradeBids);

router.post('/:homeId/schedules', addSchedule);
router.post('/:homeId/documents', addDocument);
router.delete('/:homeId/documents/:docId', require('../controllers/homeController').deleteDocument);

router.post('/:homeId/assign-client', assignClientToHome);
router.post('/:homeId/monitors', addMonitorToHome);

module.exports = router;


