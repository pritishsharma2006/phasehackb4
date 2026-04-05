import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-container">
      <header className="hero-split">
        <div className="hero-content">
          <h1>Craft your <br /><em>Professional</em> <br />Narrative.</h1>
          <p>
            An elegant, all-in-one suite designed to elevate your career. 
            From AI-driven resumes to immersive mock interviews, we provide the tools to master your professional journey.
          </p>
          <div className="hero-actions">
            <Link to="/resume" className="button">Get Started</Link>
            <Link to="/assistant" className="button button-outline" style={{ marginLeft: '12px' }}>Talk to AI</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="featured-card">
            <img 
              src="/assets/hero.png" 
              alt="Job Saarthi" 
              style={{ width: '100%', borderRadius: '4px', marginBottom: '24px' }}
            />
            <h3>Ready for your next move?</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Our AI Assistant is waiting to help you refine your profile.</p>
          </div>
        </div>
      </header>

      <section className="editorial-grid">
        <Link to="/interview" className="feature-link grid-item-wide">
          <article className="section-card">
            <div className="feature-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-icon">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="#81A6C6" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="featured-badge">Featured System</div>
            </div>
            <h2>Immersive AI Interview Platform</h2>
            <p>Practice real-time, voice-powered mock interviews across DSA, Behavioral, and System Design tracks. Get instant feedback and detailed performance reports to sharpen your skills.</p>
          </article>
        </Link>

        <Link to="/resume" className="feature-link">
          <article className="section-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-icon" style={{ marginBottom: '16px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Resume Hub</h2>
            <p>Convert your experience into a structured digital profile with our intelligent PDF parser.</p>
          </article>
        </Link>

        <Link to="/cover-letter" className="feature-link">
          <article className="section-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-icon" style={{ marginBottom: '16px' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 6l-10 7L2 6" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Cover Letter</h2>
            <p>Elegant, high-impact documents tailored to your targets in seconds.</p>
          </article>
        </Link>
        
        <Link to="/assistant" className="feature-link grid-item-wide">
          <article className="section-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="feature-icon" style={{ marginBottom: '16px' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2>Job Saarthi AI Assistant</h2>
            <p>Your personal career coach, available 24/7. Ask questions about your resume, market trends, or interview preparation strategies.</p>
          </article>
        </Link>
      </section>
    </div>

  )
}

export default Home
