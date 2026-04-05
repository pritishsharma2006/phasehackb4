import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ResumeHub from './pages/ResumeHub.jsx'
import CoverLetter from './pages/CoverLetter.jsx'
import Assistant from './pages/Assistant.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import InterviewPlatform from './pages/InterviewPlatform.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="brand-logo">
              <path d="M12 2L4 12L12 22L20 12L12 2Z" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 2L12 22" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 12L20 12" stroke="#81A6C6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Job Saarthi</span>
          </div>
          <nav>
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/resume">Resume Hub</NavLink>
            <NavLink to="/cover-letter">Cover Letter</NavLink>
            <NavLink to="/assistant">AI Assistant</NavLink>
            <NavLink to="/interview">AI Interview</NavLink>
          </nav>
        </header>

        <main className="content-area">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resume" element={<ResumeHub />} />
            <Route path="/cover-letter" element={<CoverLetter />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/interview" element={<InterviewPlatform />} />
            <Route path="/:username" element={<ProfilePage />} />
          </Routes>
        </main>

        <footer className="footer">
          <span>Developed by RuntimeCompiletime team</span>
        </footer>
      </div>
    </Router>
  )
}

export default App
