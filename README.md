# AI Code Review Agent

An AI agent that reviews code and GitHub pull requests using retrieval-augmented generation (RAG) and multi-tool reasoning. Ask it a question in plain English — it decides on its own whether to search your codebase or fetch a live GitHub PR, then gives a grounded, specific answer.

**Live demo:** https://code-review-agent-navy.vercel.app
**Backend API:** https://code-review-agent-backend-w578.onrender.com

> Note: the backend is on a free tier and spins down after inactivity — the first request may take 30-60 seconds to wake up.

## What it does

- **Semantic codebase search (RAG):** code is embedded and stored in a vector database, so you can ask questions like "where might this crash?" without knowing function names — it retrieves relevant code by meaning, not keyword matching.
- **Real GitHub PR review:** the agent can fetch a live pull request diff from any public GitHub repo and review the actual changes.
- **Agentic tool use:** the LLM decides for itself which tool to call (codebase search vs. GitHub fetch) based on the question — this isn't a hardcoded pipeline, it's a real reasoning loop.
- **Structured, readable output:** responses are rendered as clean, formatted markdown in the UI.

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

## Why this project

Most student "AI projects" stop at a single-shot chatbot wrapped around an API call. This one is a genuine agent: it decides its own next action, retrieves real data from two different sources, and reasons over the results — the same pattern used in production tools like Cursor, GitHub Copilot Workspace, and AI code review bots.

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
