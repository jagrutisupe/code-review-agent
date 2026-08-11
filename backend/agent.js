require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// This is the actual function that runs when the LLM "calls" the search tool
async function searchCodebase(query) {
    const result = await embeddingModel.embedContent({
        content: { parts: [{ text: query }] },
        outputDimensionality: 768
    });
    const queryEmbedding = result.embedding.values;

    const { data, error } = await supabase.rpc('match_code_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 3
    });

    if (error) return `Error: ${error.message}`;
    if (data.length === 0) return "No matching code found.";

    return data.map(c => `File: ${c.file_path}\n${c.content}`).join('\n\n');
}

// Describe the tool to the LLM so it knows this exists and when to use it
const tools = [{
        type: "function",
        function: {
            name: "search_codebase",
            description: "Search the codebase for relevant code using a natural language query. Use this whenever you need to see actual code to answer a question.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "A natural language description of what code you're looking for" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_pr_diff",
            description: "Fetch the code diff of a GitHub pull request to review the changes.",
            parameters: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "GitHub repo owner/organization" },
                    repo: { type: "string", description: "GitHub repo name" },
                    prNumber: { type: "number", description: "The pull request number" }
                },
                required: ["owner", "repo", "prNumber"]
            }
        }
    }
];

async function runAgent(userQuestion) {
    const messages = [
        { role: "system", content: "You are a helpful coding assistant with access to a codebase search tool. Use it whenever you need to see code to answer accurately." },
        { role: "user", content: userQuestion }
    ];

    let response;
    try {
        response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            tools: tools
        });
    } catch (err) {
        console.error("Groq tool-call error:", err.message);
        return "I had trouble understanding how to answer that — could you rephrase your question? For example: 'Review pull request #1 from octocat/Hello-World' or 'Is there code that might crash if a user isn't found?'";
    }

    const message = response.choices[0].message;

    // Did the LLM decide to use the tool?
    if (message.tool_calls) {
        const toolCall = message.tool_calls[0];
        const args = JSON.parse(toolCall.function.arguments);
        let toolResult;

        if (toolCall.function.name === "search_codebase") {
            console.log(`Agent is searching codebase for: "${args.query}"\n`);
            toolResult = await searchCodebase(args.query);
        } else if (toolCall.function.name === "get_pr_diff") {
            console.log(`Agent is fetching PR #${args.prNumber} from ${args.owner}/${args.repo}\n`);
            toolResult = await getPRDiff(args.owner, args.repo, args.prNumber);
        }

        messages.push(message);
        messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult
        });

        const finalResponse = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: messages
        });

        return finalResponse.choices[0].message.content;
    } else {
        return message.content;
    }
}

module.exports = { runAgent };

async function getPRDiff(owner, repo, prNumber) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3.diff"
            }
        }
    );
    if (!response.ok) return `Error fetching PR: ${response.status}`;
    const diff = await response.text();
    return diff.slice(0, 4000); // keep it short so we don't blow past token limits
}