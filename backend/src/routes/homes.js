const express = require('express');
const {
  listHomes,
  getHome,
  createHome,
  updateHome,
  // new endpoint handler inline below
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
router.post('/', requireAuth, createHome);
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
  const { storeChunk } = require('../services/vectorService');
  const { Home } = require('../models/Home');
  const { homeId, docId } = req.params;
  const home = await Home.findById(homeId);
  if (!home) return res.status(404).json({ message: 'Home not found' });
  const doc = (home.documents || []).find((d) => String(d._id) === String(docId));
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  if (!doc.url) return res.status(400).json({ message: 'Document URL missing' });
  try {
    // Build extra context from homeowner requirements and interview
    const parts = [];
    if ((home.requirements || '').trim()) {
      parts.push(`Homeowner freeform requirements:\n${home.requirements}`);
    }
    if (home.requirementsInterview && typeof home.requirementsInterview === 'object') {
      try {
        parts.push(`Homeowner interview answers (JSON):\n${JSON.stringify(home.requirementsInterview)}`);
      } catch { }
    }
    const extraContext = parts.join('\n\n');
    const result = await analyzeArchitectureUrls([doc.url], undefined, extraContext);

    // [RAG] Index the analysis for the home
    try {
      const summaryText = `Architecture Analysis for ${result.address || 'Home'}.
      Document: ${doc.title || doc.fileName || 'Plan'}.
      House Type: ${result.houseType || ''}. Roof: ${result.roofType || ''}. Exterior: ${result.exteriorType || ''}.
      Total SqFt: ${result.totalSqFt || 0}.
      Suggestions: ${(result.suggestions || []).join('. ')}.
      Rooms: ${(result.roomAnalysis || []).map(r => `${r.name} (${r.dimensions?.lengthFt}x${r.dimensions?.widthFt})`).join(', ')}.
      `;
      await storeChunk({
        homeId,
        content: summaryText,
        metadata: { source: 'automated_analysis', docId: String(docId), docUrl: doc.url }
      });
    } catch (e) { console.error('RAG Indexing failed', e); }

    const updated = await Home.findOneAndUpdate(
      { _id: homeId },
      {
        $set: {
          'documents.$[d].analysis': {
            houseType: result.houseType || '',
            roofType: result.roofType || '',
            exteriorType: result.exteriorType || '',
            address: result.address || '',
            totalSqFt: result.totalSqFt || 0,
            projectInfo: result.projectInfo || undefined,
            functionalScores: result.functionalScores || undefined,
            suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
            suggestedTasks: Array.isArray(result.suggestedTasks) ? result.suggestedTasks : [],
            roomAnalysis: Array.isArray(result.roomAnalysis) ? result.roomAnalysis : [],
            costAnalysis: typeof result.costAnalysis === 'object' && result.costAnalysis ? result.costAnalysis : { summary: '', highImpactItems: [], valueEngineeringIdeas: [] },
            accessibilityComfort: typeof result.accessibilityComfort === 'object' && result.accessibilityComfort ? result.accessibilityComfort : { metrics: {}, issues: [] },
            optimizationSuggestions: Array.isArray(result.optimizationSuggestions) ? result.optimizationSuggestions : [],
            raw: result.raw || '',
            analyzed: true,
            analyzedAt: new Date(),
          }
        }
      },
      { new: true, arrayFilters: [{ 'd._id': String(docId) }] }
    );
    return res.json({ home: updated, result });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Analysis failed' });
  }
});


// Save requirements interview answers
router.put('/:homeId/requirements-interview', require('../middleware/auth').requireAuth, async (req, res) => {
  const { Home } = require('../models/Home');
  const { homeId } = req.params;
  const answers = req.body && typeof req.body === 'object' ? req.body : {};
  const updated = await Home.findByIdAndUpdate(homeId, { $set: { requirementsInterview: answers } }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Home not found' });
  return res.json(updated);
});

router.post('/:homeId/assign-client', assignClientToHome);
router.post('/:homeId/monitors', addMonitorToHome);

module.exports = router;


