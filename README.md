# AI Code Review Agent

An AI agent that reviews code and GitHub pull requests using retrieval-augmented generation (RAG) and multi-tool reasoning. Ask it a question in plain English — it decides on its own whether to search an indexed codebase or fetch a live GitHub PR, then gives a grounded, specific answer.

**Live demo:** https://code-review-agent-navy.vercel.app
**Backend API:** https://code-review-agent-backend-w578.onrender.com

> Note: the backend is on a free tier and spins down after inactivity — the first request may take 30-60 seconds to wake up.

## What it does

- **Semantic codebase search (RAG):** code is embedded and stored in a vector database, so you can ask questions like "where might this crash?" without knowing function names — it retrieves relevant code by meaning, not keyword matching.
- **Real GitHub PR review:** the agent can fetch a live pull request diff from any public GitHub repo and review the actual changes.
- **Agentic tool use:** the LLM decides for itself which tool to call (codebase search vs. GitHub fetch) based on the question — this isn't a hardcoded pipeline, it's a real reasoning loop.
- **Structured, readable output:** responses are rendered as clean, formatted markdown in the UI.
- **Graceful failure handling:** the underlying model occasionally malforms a function call; the backend catches this and returns a clear message instead of crashing.

## Architecture

```
React (Vercel) → Express API (Render) → Agent loop (Groq/Llama 3.3)
                                              ├── Tool: search_codebase → Supabase (pgvector) semantic search
                                              └── Tool: get_pr_diff → GitHub REST API
```

**Flow:** a user question hits the Express backend → the LLM (via Groq) inspects the question and decides which tool it needs → the tool runs (vector similarity search in Postgres, or a live GitHub API call) → the result is fed back to the LLM → it produces a final, grounded answer.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite), react-markdown |
| Backend | Node.js, Express |
| LLM | Groq (Llama 3.3 70B) — function calling / tool use |
| Embeddings | Google Gemini (`gemini-embedding-001`) |
| Vector DB | Supabase (Postgres + pgvector) |
| External data | GitHub REST API |
| Hosting | Vercel (frontend), Render (backend) |

## How to ask it questions

The agent has exactly two capabilities, so the most useful questions map clearly to one of them. It does **not** browse arbitrary GitHub repositories or answer general "what's in this repo?" questions — it will say so and ask for a more specific request instead of guessing.

**Codebase search** (searches the embedded files — currently the agent's own source, `agent.js` and `server.js`, plus two sample files):
- "Is there any code that might crash if a user isn't found?"
- "Is there a security issue with how passwords are handled?"
- "Is there a hardcoded secret anywhere in the code?"
- "Does the agent handle it gracefully if the Groq API fails?"
- "Is there a null check before accessing tool_calls?"

**GitHub PR review** (needs a real, existing PR — owner, repo, and PR number):
- "Review pull request #1 from octocat/Hello-World"
- "Review PR #3 from facebook/react and tell me if there are issues"

**What it will decline, and why:** general questions about a whole repository, or about code that was never embedded. This scope was deliberately tightened after the model was observed making repeated failed tool calls in response to vague prompts — explicit boundaries proved more reliable than trying to make it guess at intent.

## Why this project

Most student "AI projects" stop at a single-shot chatbot wrapped around an API call. This one is a genuine agent: it decides its own next action, retrieves real data from two different sources, and reasons over the results — the same pattern used in production tools like Cursor, GitHub Copilot Workspace, and AI code review bots.

## Engineering challenges & fixes

- **Environment variables on deployment:** `.env` is intentionally gitignored, so Render and Vercel needed the same keys added manually as platform environment variables — easy to miss, worth double-checking via deploy logs.
- **Embedding model deprecation:** the originally used embedding model was retired mid-project; fixed by switching to `gemini-embedding-001` with an explicit output dimensionality to match the existing vector column.
- **Frontend pointing at localhost:** after deploying the backend, the deployed frontend still called `localhost:3001` until the API base URL was updated in code and redeployed.
- **Unreliable tool-call generation:** the free-tier LLM occasionally emits a malformed function call and Groq rejects it with a 400 error. Fixed with a try/catch around the tool-calling request that returns a clear fallback message instead of a server crash.
- **Tool scope confusion:** vague prompts caused the model to call the wrong tool repeatedly. Tightening the system prompt and each tool's description to state its exact scope fixed this — the agent now explains what it can do rather than guessing.

## Running it locally

**Backend:**
```bash
cd backend
npm install
# add a .env file with GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, GITHUB_TOKEN
node server.js
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Possible extensions

- Add a "leave comment on PR" tool so the agent can actually post reviews via the GitHub API
- Support private repos with OAuth
- Add a third tool for running the test suite and reporting failures
- Stream responses token-by-token instead of waiting for the full answer
- Containerize the backend and add a CI/CD pipeline with automated tests
