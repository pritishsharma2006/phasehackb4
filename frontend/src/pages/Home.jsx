import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="page-card">
      <h1>Career AI Suite</h1>
      <p className="small-text">
        A unified React + Vite frontend with a FastAPI backend powered by Gemini LLM.
        Upload resumes, parse PDFs, generate cover letters, practice AI-powered interviews,
        and ask AI assistant questions about your career data.
      </p>

      <div className="grid">
        <Link to="/resume" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="section-card">
            <h2>Resume Hub</h2>
            <p>Upload your PDF resume and store parsed career details for later use.</p>
          </div>
        </Link>
        <Link to="/cover-letter" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="section-card">
            <h2>Cover Letter Generator</h2>
            <p>Generate polished cover letters from your resume JSON and optional job details.</p>
          </div>
        </Link>
        <Link to="/assistant" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="section-card">
            <h2>AI Assistant</h2>
            <p>Ask the assistant questions based on your stored resume and get direct answers.</p>
          </div>
        </Link>
        <Link to="/interview" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="section-card">
            <h2>🎙️ AI Interview Platform</h2>
            <p>Practice real-time voice-powered mock interviews with an AI interviewer. Supports DSA, Behavioral, System Design, and Full-Fledged modes with live code editor and performance reports.</p>
          </div>
        </Link>
      </div>
    </section>
  )
}

export default Home
