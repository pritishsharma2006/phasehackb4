import { useEffect, useState } from 'react'
import { uploadResume, listResumes, deleteResume, getResume } from '../services/api.js'

function ResumeHub() {
  const [username, setUsername] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumes, setResumes] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      setLoading(true)
      const data = await listResumes()
      setResumes(data.resumes)
      setError('')
    } catch (err) {
      setError('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!username.trim() || !resumeFile) {
      setError('Please provide a username and select a PDF resume file')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      await uploadResume(username, resumeFile)
      setMessage('Resume uploaded successfully!')
      setUsername('')
      setResumeFile(null)
      fetchResumes()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (username) => {
    setLoading(true)
    setError('')
    try {
      const data = await getResume(username)
      setSelected(data.resume)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load resume')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (usernameToDelete) => {
    setLoading(true)
    setError('')
    try {
      await deleteResume(usernameToDelete)
      setMessage(`Deleted resume for ${usernameToDelete}`)
      setSelected(null)
      fetchResumes()
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-card">
      <h1>Resume Hub</h1>
      <p className="small-text">
        Upload a PDF resume to parse it automatically with Gemini, then preview or manage saved profiles.
      </p>

      <div className="section-card">
        <h2>Upload Resume</h2>
        <div className="input-row">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. janedoe"
            />
          </label>
          <label>
            Resume PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResumeFile(e.target.files[0])}
            />
          </label>
          <button className="button" onClick={handleUpload} disabled={loading}>
            {loading ? 'Uploading...' : 'Upload and Parse'}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className={error ? 'error' : 'status-box'}>{error || message}</div>
      )}

      <div className="section-card">
        <h2>Saved Resumes</h2>
        {loading ? (
          <div className="status-box">Loading stored resumes...</div>
        ) : resumes.length === 0 ? (
          <div className="status-box">No resumes saved yet. Upload one to get started.</div>
        ) : (
          <div className="card-grid">
            {resumes.map((resume) => (
              <div key={resume.username} className="card-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <strong>{resume.name || 'Unknown'}</strong>
                    <div className="small-text">@{resume.username}</div>
                  </div>
                  <div className="badge">
                    {resume.skills.map((skill, index) => (
                      <span key={index}>{skill}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <button className="button" onClick={() => handleSelect(resume.username)}>
                    View Details
                  </button>
                  <button
                    className="button"
                    style={{ marginLeft: 12, background: '#dc2626' }}
                    onClick={() => handleDelete(resume.username)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="section-card">
          <h2>Resume JSON Preview</h2>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default ResumeHub
