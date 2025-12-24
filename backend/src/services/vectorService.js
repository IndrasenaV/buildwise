const { parsePdfWithLlama } = require('./langchainService');
const { SentenceSplitter } = require("llamaindex");
const { OpenAIEmbeddings } = require('@langchain/openai');
const { KnowledgeChunk } = require('../models/KnowledgeChunk');

/**
 * Generate embedding for text
 */
async function getEmbedding(text) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_TOKEN;
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: apiKey,
        modelName: 'text-embedding-3-small',
    });

    return await embeddings.embedQuery(text);
}

/**
 * Store a chunk with embedding
 */
async function storeChunk({ homeId, content, originalContent, imageUrl, metadata = {} }) {
    if (!content || !content.trim()) return;

    const embedding = await getEmbedding(content);

    await KnowledgeChunk.create({
        homeId,
        content,
        originalContent,
        imageUrl,
        embedding,
        metadata
    });
}

/**
 * Ingest PDF using LlamaParse for Multi-modal RAG
 * @param {string|Buffer} pdfSource - Path or Buffer
 * @param {string} homeId
 * @returns {Promise<number>} - Count of chunks created
 */
async function ingestPdf(pdfSource, homeId) {
    console.log(`[Vector] Ingesting PDF via LlamaParse (Home: ${homeId})`);

    // 1. Parse with LlamaCloud to get Markdown (including image descriptions)
    const markdown = await parsePdfWithLlama(pdfSource);

    if (!markdown || !markdown.trim()) {
        console.warn("[Vector] LlamaParse returned empty content.");
        return 0;
    }

    // 2. Split text into chunks
    const splitter = new SentenceSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(markdown);

    console.log(`[Vector] Split into ${chunks.length} chunks. Storing...`);

    // 3. Store chunks
    let processedCount = 0;
    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i]; // chunks is string[]
        await storeChunk({
            homeId,
            content: chunkText,
            metadata: {
                source: 'llamaparse_pdf',
                // page info is lost with simple splitText unless we process nodes, but acceptable for now
            }
        });
        processedCount++;
    }
    return processedCount;
}

/**
 * Search for similar chunks using Vector Search
 * Note: Requires an Atlas Vector Search index on 'embedding' field.
 */
async function searchSimilar(query, homeId, limit = 5) {
    if (!query || !query.trim()) return [];
    const queryVector = await getEmbedding(query);
    console.log(`[Vector] Generated embedding for query: "${query}" (length: ${queryVector.length})`);

    const pipeline = [
        {
            $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector: queryVector,
                numCandidates: limit * 10,
                limit: limit,
                filter: { homeId: { $eq: homeId } } // Tenant isolation
            }
        },
        {
            $project: {
                _id: 0,
                content: 1,
                imageUrl: 1,
                metadata: 1,
                score: { $meta: "vectorSearchScore" }
            }
        }
    ];

    try {
        console.log(`[VectorSearch] Searching for: "${query}" (homeId: ${homeId})`);
        const results = await KnowledgeChunk.aggregate(pipeline);
        console.log(`[VectorSearch] Found ${results.length} chunks. Scores: ${results.map(r => r.score).join(', ')}`);
        return results;
    } catch (e) {
        console.warn("Vector search failed (index might be missing?). Falling back to empty.", e.message);
        return [];
    }
}

module.exports = { storeChunk, searchSimilar, ingestPdf };
