require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function search(query) {
    // Embed the search query
    const result = await embeddingModel.embedContent({
        content: { parts: [{ text: query }] },
        outputDimensionality: 768
    });
    const queryEmbedding = result.embedding.values;

    // Search Supabase using our match function
    const { data, error } = await supabase.rpc('match_code_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 3
    });

    if (error) {
        console.error("Search error:", error);
        return;
    }

    console.log(`Found ${data.length} matching code chunk(s):\n`);
    data.forEach((chunk, i) => {
        console.log(`Match ${i + 1} (similarity: ${chunk.similarity.toFixed(3)}) — ${chunk.file_path}`);
        console.log(chunk.content);
        console.log('---');
    });
}

// Try a plain English question
search("where is the total price calculated?");