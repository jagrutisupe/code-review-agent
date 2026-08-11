require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Connect to Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Connect to Gemini (for embeddings)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function main() {
    // 1. Read the code file
    const code = fs.readFileSync('sample.js', 'utf-8');

    // 2. Turn it into an embedding (a list of 768 numbers representing its meaning)
    const result = await embeddingModel.embedContent({
        content: { parts: [{ text: code }] },
        outputDimensionality: 768
    });
    const embedding = result.embedding.values;

    console.log(`Generated embedding with ${embedding.length} numbers.`);

    // 3. Store it in Supabase
    const { data, error } = await supabase
        .from('code_chunks')
        .insert({
            file_path: 'sample.js',
            content: code,
            embedding: embedding
        });

    if (error) {
        console.error("Error inserting into Supabase:", error);
    } else {
        console.log("Successfully stored sample.js in the vector database!");
    }
}

main();