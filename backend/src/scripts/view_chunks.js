const mongoose = require('mongoose');
const { KnowledgeChunk } = require('../models/KnowledgeChunk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
    console.log('Connecting...');
    if (!process.env.MONGODB_URI) {
        console.error("Missing MONGODB_URI");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Fetching last 5 chunks...');
    const chunks = await KnowledgeChunk.find().sort({ createdAt: -1 }).limit(5);

    console.log(`Found ${chunks.length} chunks.`);
    chunks.forEach((c, i) => {
        console.log(`\n--- Chunk ${i + 1} (Home: ${c.homeId}) ---`);
        console.log(c.content.slice(0, 300) + '...');
    });

    await mongoose.disconnect();
}

run().catch(console.error);
