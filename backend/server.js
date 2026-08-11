require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { runAgent } = require('./agent');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.send('Code Review Agent API is running.');
});

// Main endpoint the frontend will call
app.post('/api/review', async(req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Missing "question" in request body.' });
    }

    try {
        const answer = await runAgent(question);
        res.json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});