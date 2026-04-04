import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getResume, deleteResume } from '../services/api'
import './ProfilePage.css'

function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const data = await getResume(username)
        setResume(data.resume)
        setError('')
      } catch (err) {
        setError(`Resume for user "${username}" not found`)
        setResume(null)
      } finally {
        setLoading(false)
      }
    }

    fetchResume()
  }, [username])

  const handlePrint = () => {
    window.print()
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteResume(username)
      setShowDeleteConfirm(false)
      navigate('/')
    } catch (err) {
      setError('Failed to delete resume')
      setDeleting(false)
    }
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setShowShareMenu(false)
    alert('Profile link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading resume...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error-page">
          <h2>404 - Resume Not Found</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-home">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="profile-container">
        <div className="error-page">
          <h2>Resume Not Found</h2>
          <p>We couldn't find a resume for: <strong>{username}</strong></p>
          <button onClick={() => navigate('/')} className="btn-home">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-toolbar">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Dashboard
        </button>
        <div className="toolbar-actions">
          <div className="share-menu-wrapper">
            <button
              className="btn-share"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              Share Profile
            </button>
            {showShareMenu && (
              <div className="share-menu">
                <button className="share-option" onClick={handleCopyLink}>
                  Copy Profile Link
                </button>
              </div>
            )}
          </div>
          <button className="btn-print" onClick={handlePrint}>
            Print Resume
          </button>
          <button
            className="btn-delete"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Resume
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Delete Resume</h3>
            <p>Are you sure you want to delete this resume? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="resume-content">
        <div className="resume-header">
          <h1>{resume.name || 'Unknown'}</h1>
          <div className="contact-row">
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.linkedin && (
              <span>
                <a
                  href={resume.linkedin.startsWith('http') ? resume.linkedin : `https://${resume.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </span>
            )}
          </div>
        </div>

        {resume.summary && (
          <section className="resume-section">
            <h2>Professional Summary</h2>
            <p>{resume.summary}</p>
          </section>
        )}

        {resume.experience && resume.experience.length > 0 && (
          <section className="resume-section">
            <h2>Experience</h2>
            {resume.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="item-header">
                  <h3>{exp.role} | {exp.company}</h3>
                  <span className="duration">{exp.duration}</span>
                </div>
                {exp.details && (
                  <ul>
                    {exp.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {resume.projects && resume.projects.length > 0 && (
          <section className="resume-section">
            <h2>Projects</h2>
            {resume.projects.map((proj, index) => (
              <div key={index} className="project-item">
                <div className="item-header">
                  <h3>{proj.title}</h3>
                  <span className="duration">{proj.duration}</span>
                </div>
                <p>{proj.details}</p>
              </div>
            ))}
          </section>
        )}

        {resume.education && resume.education.length > 0 && (
          <section className="resume-section">
            <h2>Education</h2>
            {resume.education.map((edu, index) => (
              <div key={index} className="education-item">
                <div className="item-header">
                  <h3>{edu.degree}</h3>
                  <span className="year">{edu.year}</span>
                </div>
                <p>{edu.institution}</p>
              </div>
            ))}
          </section>
        )}

        {resume.skills && resume.skills.length > 0 && (
          <section className="resume-section">
            <h2>Skills</h2>
            <div className="skills-grid">
              {resume.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ProfilePage