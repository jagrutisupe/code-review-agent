import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');

    try {
      const res = await fetch('http://localhost:3001/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAnswer(data.answer || data.error || 'Something went wrong.');
    } catch (err) {
      setAnswer('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>AI Code Review Agent</h1>
      <p>Ask a question about your codebase, or ask it to review a GitHub PR.</p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='e.g. "Review pull request #1 from octocat/Hello-World"'
        rows={4}
        style={{ width: '100%', padding: '10px', fontSize: '16px' }}
      />

      <button
        onClick={handleAsk}
        disabled={loading}
        style={{ marginTop: '10px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        {loading ? 'Thinking...' : 'Ask Agent'}
      </button>

      {answer && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f4f4f4', borderRadius: '8px' }}>
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;