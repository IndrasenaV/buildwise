const { processPdfWithVision, searchSimilar } = require('../services/vectorService');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('node:path');
const pdfLib = require('pdf-lib');
const { PDFDocument } = pdfLib;
const { KnowledgeChunk } = require('../models/KnowledgeChunk'); // Fix import path
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
    console.log('Connecting to DB...');
    if (!process.env.MONGODB_URI) {
        console.warn('Skipping DB connection: MONGODB_URI not found. This test requires a DB.');
        return;
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const homeId = 'test-home-' + Date.now();
    const pdfPath = path.join(__dirname, 'test_visual.pdf');

    // Create a dummy PDF with text that implies visual content (mocking visual for logic test)
    // Note: We can't easily create a real "image" inside PDF without an input image, 
    // but we can create a PDF that `pdf-img-convert` will turn into an image, causing the VLM flow to trigger.
    console.log('Creating test PDF...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    page.drawText('This is a test PDF for Multi-Modal RAG.', { x: 50, y: 350, size: 24 });
    page.drawText('Imagine a chart here showing Sales up 50%.', { x: 50, y: 300, size: 18 });
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);

    // Check for API Key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
        console.error("ERROR: LLAMA_CLOUD_API_KEY not found in .env");
        console.log("Please add LLAMA_CLOUD_API_KEY=llx-... to your .env file.");
        // Wait for user to add it? For this script, just exit.
        process.exit(1);
    }

    const { ingestPdf, searchSimilar } = require('../services/vectorService');

    console.log('Ingesting PDF with LlamaParse...');
    try {
        const count = await ingestPdf(pdfPath, homeId);
        console.log(`Ingested ${count} chunks.`);

        // Search for "chart" or "sales" which is in the visual (rasterized text)
        // Verify DB persistence
        const dbCount = await KnowledgeChunk.countDocuments({ homeId });
        console.log(`DB Verification: Found ${dbCount} documents for homeId ${homeId}.`);

        // 4. Search
        console.log('Searching for "Multi-Modal"...');
        const results = await searchSimilar('Multi-Modal', homeId);
        console.log('Results:', results);

        if (results.length > 0) {
            console.log('SUCCESS: Found visual content via VLM description search.');
        } else {
            console.error('FAILURE: Did not find content.');
        }
    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        await mongoose.disconnect();
    }
}

run();
