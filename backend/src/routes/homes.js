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
router.put('/:homeId/windows-doors', requireAuth, require('../controllers/homeController').updateWindowsDoors);
router.put('/:homeId/appliances', requireAuth, require('../controllers/homeController').updateAppliances);
router.put('/:homeId/cabinets', requireAuth, require('../controllers/homeController').updateCabinets);

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
  console.log(`[Analyze] Request for homeId: ${req.params.homeId}, docId: ${req.params.docId}`);
  const { analyzeArchitectureUrls } = require('../controllers/aiController');
  const { storeChunk, ingestPdf } = require('../services/vectorService');
  const { Home } = require('../models/Home');
  const { homeId, docId } = req.params;

  try {
    const home = await Home.findById(homeId);
    if (!home) return res.status(404).json({ message: 'Home not found' });
    const doc = (home.documents || []).find((d) => String(d._id) === String(docId));
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (!doc.url) return res.status(400).json({ message: 'Document URL missing' });

    // Build extra context from homeowner requirements and interview
    const parts = [];
    if (Array.isArray(home.requirementsList) && home.requirementsList.length) {
      const lines = [];
      for (const it of home.requirementsList) {
        if (!it) continue;
        const text = typeof it === 'string' ? String(it || '').trim() : String(it.text || '').trim();
        if (!text) continue;
        const tags = Array.isArray(it.tags) ? it.tags.filter(Boolean) : [];
        const cat = typeof it.category === 'string' && it.category ? it.category : '';
        const tagFmt = (cat ? [cat, ...tags] : tags).join(', ');
        lines.push(tagFmt ? `${text} [${tagFmt}]` : text);
      }
      if (lines.length) {
        parts.push(`Homeowner requirements (list):\n- ${lines.join('\n- ')}`);
      }
    }
    if ((home.requirements || '').trim()) {
      parts.push(`Homeowner freeform requirements:\n${home.requirements}`);
    }
    if (home.requirementsInterview && typeof home.requirementsInterview === 'object') {
      try {
        parts.push(`Homeowner interview answers (JSON):\n${JSON.stringify(home.requirementsInterview)}`);
      } catch { }
    }
    const extraContext = parts.join('\n\n');

    console.log('[Analyze] Calling analyzeArchitectureUrls...');
    const result = await analyzeArchitectureUrls([doc.url], undefined, extraContext);
    console.log('[Analyze] Analysis complete.');

    // [RAG] Index the analysis for the home
    try {
      const summaryText = `Architecture Analysis for ${result.address || 'Home'}.
      Document: ${doc.title || doc.fileName || 'Plan'}.
      House Type: ${result.houseType || ''}. Roof: ${result.roofType || ''}. Exterior: ${result.exteriorType || ''}.
      Total SqFt: ${result.totalSqFt || 0}.
      Suggestions: ${(result.suggestions || []).join('. ')}.
      Rooms: ${(result.roomAnalysis || []).map(r => `${r.name} (${r.dimensions?.lengthFt}x${r.dimensions?.widthFt})`).join(', ')}.
      `;

      console.log('[Analyze] Storing summary chunk...');
      await storeChunk({
        homeId,
        content: summaryText,
        metadata: { source: 'automated_analysis', docId: String(docId), docUrl: doc.url }
      });

      // [RAG] Multi-modal Ingestion via LlamaParse
      console.log('[Analyze] Triggering LlamaParse ingestion (background) for:', doc.url);
      ingestPdf(doc.url, homeId).catch(err => {
        console.error('[Analyze] Background LlamaParse ingestion failed:', err.message);
      });

    } catch (e) {
      console.error('[Analyze] RAG Indexing/Ingestion failed:', e);
      // We don't fail the whole request if RAG fails, but we log it.
    }

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
            feedback: typeof result.feedback === 'object' && result.feedback ? result.feedback : { summary: '', matches: [], mismatches: [], suggestions: [] },
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
    console.error('[Analyze] CRITICAL ERROR:', e);
    return res.status(500).json({ message: e.message || 'Analysis failed', stack: e.stack });
  }
});

// Extract exterior materials (windows, doors, roofing, cladding) from architecture docs
router.post('/:homeId/extract-exterior-materials', requireAuth, async (req, res) => {
  const { z } = require('zod');
  const { executeWithLangChain } = require('../services/langchainService');
  const { getPromptText, getPrompt } = require('../services/promptService');
  const { Home } = require('../models/Home');
  const { homeId } = req.params;
  const { docId } = req.body || {};

  try {
    const home = await Home.findById(homeId);
    if (!home) return res.status(404).json({ message: 'Home not found' });

    // Find the document to analyze - prefer final architecture doc, or use provided docId
    const archDocs = (home.documents || []).filter(d => String(d.category || '').startsWith('architecture_'));
    let doc;
    if (docId) {
      doc = (home.documents || []).find(d => String(d._id) === String(docId));
    } else {
      doc = archDocs.find(d => d.isFinal) || archDocs[0];
    }
    if (!doc || !doc.url) {
      return res.status(400).json({ message: 'No architecture document found. Upload one first.' });
    }

    console.log(`[ExtractExterior] Processing doc: ${doc.title || doc._id}`);

    // Build room context from existing roomAnalysis (if available) to help with room name matching
    let roomContextStr = '';
    const roomAnalysis = doc.analysis?.roomAnalysis || [];
    if (roomAnalysis.length > 0) {
      const roomList = roomAnalysis.map((r, idx) => {
        const level = r.level || 'unknown';
        const dims = r.dimensions ? `${r.dimensions.lengthFt || 0}x${r.dimensions.widthFt || 0}ft` : '';
        return `${idx + 1}. "${r.name}" (Level: ${level}${dims ? `, ${dims}` : ''})`;
      }).join('\n');
      roomContextStr = `\n\nKNOWN ROOMS FROM FLOOR PLAN ANALYSIS:\nUse these room names when assigning roomName to windows and doors. Match schedule abbreviations (e.g., BR1, MBA, LIV, KIT, GAR) to the closest room name from this list:\n${roomList}\n`;
      console.log(`[ExtractExterior] Injecting ${roomAnalysis.length} known rooms as context`);
    }

    // Get the extraction prompt
    const system = await getPromptText('system.jsonOnly');
    const promptDoc = await getPrompt('architecture.extract.exterior_materials');
    const instruction = promptDoc.text + roomContextStr;

    // Define Zod schema for structured output
    const extractionSchema = z.object({
      roofing: z.object({
        type: z.string().nullable(),
        material: z.string().nullable(),
        areaSqFt: z.number().nullable(),
        slope: z.string().nullable(),
        underlayment: z.string().nullable(),
        estCost: z.number().nullable(),
      }).nullable(),
      cladding: z.array(z.object({
        area: z.string().nullable(),
        type: z.string().nullable(),
        material: z.string().nullable(),
        areaSqFt: z.number().nullable(),
        estCost: z.number().nullable(),
      })).nullable(),
      windows: z.array(z.object({
        label: z.string(),
        roomName: z.string().nullable(),
        level: z.union([z.number(), z.string()]).nullable(),
        openingType: z.string().nullable(),
        widthIn: z.number().nullable(),
        heightIn: z.number().nullable(),
        areaSqFt: z.number().nullable(),
        frameMaterial: z.string().nullable(),
        glazing: z.string().nullable(),
        orientation: z.string().nullable(),
        notes: z.string().nullable(),
        estCost: z.number().nullable(),
      })).nullable(),
      doors: z.array(z.object({
        label: z.string(),
        roomName: z.string().nullable(),
        level: z.union([z.number(), z.string()]).nullable(),
        doorType: z.string().nullable(),
        isExterior: z.boolean().nullable(),
        widthIn: z.number().nullable(),
        heightIn: z.number().nullable(),
        material: z.string().nullable(),
        finish: z.string().nullable(),
        notes: z.string().nullable(),
        estCost: z.number().nullable(),
      })).nullable(),
      totals: z.object({
        windowCount: z.number().nullable(),
        doorCount: z.number().nullable(),
        totalWindowsCost: z.number().nullable(),
        totalDoorsCost: z.number().nullable(),
        totalRoofingCost: z.number().nullable(),
        totalCladdingCost: z.number().nullable(),
        totalCost: z.number().nullable(),
      }).nullable(),
    });

    // Execute LLM with structured output
    const { data: result, usage } = await executeWithLangChain({
      systemPrompt: system,
      userPrompt: instruction,
      urls: [doc.url],
      model: 'gpt-4o',
      temperature: 0.1,
      supportsImages: true,
      schema: extractionSchema,
    });

    console.log('[ExtractExterior] Extraction complete:', JSON.stringify(result, null, 2));

    // Prepare data for storage
    const exteriorMaterials = {
      extractedAt: new Date(),
      extractedFromDocId: String(doc._id),
      roofing: result.roofing || null,
      cladding: Array.isArray(result.cladding) ? result.cladding : [],
      windows: Array.isArray(result.windows) ? result.windows : [],
      doors: Array.isArray(result.doors) ? result.doors : [],
      totals: result.totals || {},
    };

    // Prepare budget-level summary
    const budgetExteriorMaterials = {
      totalWindowsCost: result.totals?.totalWindowsCost || 0,
      totalDoorsCost: result.totals?.totalDoorsCost || 0,
      totalRoofingCost: result.totals?.totalRoofingCost || 0,
      totalCladdingCost: result.totals?.totalCladdingCost || 0,
      totalCost: result.totals?.totalCost || 0,
      extractedAt: new Date(),
    };

    // Update home with extracted data
    const updated = await Home.findByIdAndUpdate(
      homeId,
      {
        $set: {
          exteriorMaterials,
          'budget.exteriorMaterials': budgetExteriorMaterials,
        }
      },
      { new: true }
    );

    return res.json({
      home: updated,
      exteriorMaterials,
      budget: budgetExteriorMaterials,
    });
  } catch (e) {
    console.error('[ExtractExterior] Error:', e);
    return res.status(500).json({ message: e.message || 'Extraction failed' });
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


