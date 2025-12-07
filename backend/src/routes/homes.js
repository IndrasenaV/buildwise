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
router.patch('/:homeId/documents/:docId', require('../controllers/homeController').updateDocument);
router.delete('/:homeId/documents/:docId', require('../controllers/homeController').deleteDocument);
router.post('/:homeId/documents/:docId/analyze-architecture', async (req, res) => {
  const { analyzeArchitectureUrls } = require('../controllers/aiController');
  const { Home } = require('../models/Home');
  const { homeId, docId } = req.params;
  const home = await Home.findById(homeId);
  if (!home) return res.status(404).json({ message: 'Home not found' });
  const doc = (home.documents || []).find((d) => String(d._id) === String(docId));
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  if (!doc.url) return res.status(400).json({ message: 'Document URL missing' });
  try {
    const result = await analyzeArchitectureUrls([doc.url]);
    const updated = await Home.findOneAndUpdate(
      { _id: homeId },
      {
        $set: {
          'documents.$[d].analysis': {
            houseType: result.houseType || '',
            roofType: result.roofType || '',
            exteriorType: result.exteriorType || '',
            raw: result.raw || '',
            analyzedAt: new Date(),
          }
        }
      },
      { new: true, arrayFilters: [{ 'd._id': String(docId) }] }
    );
    return res.json(updated);
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Analysis failed' });
  }
});

router.post('/:homeId/assign-client', assignClientToHome);
router.post('/:homeId/monitors', addMonitorToHome);

module.exports = router;


