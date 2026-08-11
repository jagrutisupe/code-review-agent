require('dotenv').config();
const fs = require('fs');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const code = fs.readFileSync('sample.js', 'utf-8');

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [{
                role: "system",
                content: `You are a senior software engineer doing a code review.
Respond ONLY with valid JSON in this exact format, no other text:
{
  "issues": [
    {
      "line": <line number as integer, or null if not specific to one line>,
      "severity": "high" | "medium" | "low",
      "comment": "<short description of the issue and suggested fix>"
    }
  ]
}`
            },
            {
                role: "user",
                content: `Review this code:\n\n${code}`
            }
        ]
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(JSON.stringify(result, null, 2));
}

main();