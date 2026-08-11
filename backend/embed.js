require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const filesToEmbed = ['sample.js', 'userService.js'];

async function embedFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');

    const result = await embeddingModel.embedContent({
        content: { parts: [{ text: code }] },
        outputDimensionality: 768
    });
    const embedding = result.embedding.values;

    const { error } = await supabase
        .from('code_chunks')
        .insert({
            file_path: filePath,
            content: code,
            embedding: embedding
        });

    if (error) {
        console.error(`Error inserting ${filePath}:`, error);
    } else {
        console.log(`Stored ${filePath} in the vector database.`);
    }
}

async function main() {
    for (const file of filesToEmbed) {
        await embedFile(file);
    }
    console.log('Done embedding all files.');
}

main();