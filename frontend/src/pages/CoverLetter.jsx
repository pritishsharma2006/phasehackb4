import { useState } from 'react'
import { generateCoverLetter } from '../services/api.js'

function CoverLetter() {
  const [resumeFile, setResumeFile] = useState(null)
  const [jobFile, setJobFile] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [candidateName, setCandidateName] = useState('Candidate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!resumeFile) {
      setError('Please select a resume JSON file')
      return
    }

    setLoading(true)
    setError('')
    setCoverLetter('')

    try {
      const data = await generateCoverLetter(resumeFile, jobFile)
      setCoverLetter(data.cover_letter)
      setCandidateName(data.candidate_name)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate cover letter')
    } finally {
      setLoading(false)
    }
  }

  const downloadLetter = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover_letter.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-card">
      <h1>Cover Letter Generator</h1>
      <p className="small-text">
        Upload a resume JSON and optional job description, then use Gemini to create a polished cover letter.
      </p>

      <div className="section-card">
        <div className="input-row">
          <label>
            Resume JSON
            <input
              type="file"
              accept="application/json"
              onChange={(e) => setResumeFile(e.target.files[0])}
            />
          </label>
          <label>
            Job Description (optional)
            <input
              type="file"
              accept=".txt,.md"
              onChange={(e) => setJobFile(e.target.files[0])}
            />
          </label>
          <button className="button" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </div>

      {coverLetter && (
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Cover Letter for {candidateName}</h2>
            <button className="button" onClick={downloadLetter}>
              Download
            </button>
          </div>
          <pre>{coverLetter}</pre>
        </div>
      )}
    </div>
  )
}

export default CoverLetter
