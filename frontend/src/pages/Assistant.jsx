import { useState } from 'react'
import { askAssistant } from '../services/api.js'

function Assistant() {
  const [question, setQuestion] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAsk = async () => {
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }
    setLoading(true)
    setError('')
    setSuggestion('')

    try {
      const data = await askAssistant(question)
      setSuggestion(data.suggestion)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to get suggestion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-card">
      <h1>AI Resume Assistant</h1>
      <p className="small-text">
        Ask a question about the resume and let Gemini provide a direct, career-focused answer.
      </p>

      <div className="section-card">
        <div className="input-row">
          <label>
            Your question
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What strengths should I highlight for a product manager role?"
            />
          </label>
          <button className="button" onClick={handleAsk} disabled={loading}>
            {loading ? 'Asking...' : 'Ask AI'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </div>

      {suggestion && (
        <div className="section-card">
          <h2>AI Suggestion</h2>
          <pre>{suggestion}</pre>
        </div>
      )}
    </div>
  )
}

export default Assistant
