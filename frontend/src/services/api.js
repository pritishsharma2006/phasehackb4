import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'
const api = axios.create({
  baseURL: API_BASE_URL,
})

export const uploadResume = async (username, file) => {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('resume', file)
  const response = await api.post('/resume/upload', formData)
  return response.data
}

export const listResumes = async () => {
  const response = await api.get('/resume/resumes')
  return response.data
}

export const deleteResume = async (username) => {
  const response = await api.delete(`/resume/resume/${username}`)
  return response.data
}

export const getResume = async (username) => {
  const response = await api.get(`/resume/resume/${username}`)
  return response.data
}

export const generateCoverLetter = async (resumeFile, jobDescriptionFile) => {
  const formData = new FormData()
  formData.append('resume', resumeFile)
  if (jobDescriptionFile) {
    formData.append('job_description', jobDescriptionFile)
  }
  const response = await api.post('/resume/cover-letter', formData)
  return response.data
}

export const askAssistant = async (question) => {
  const formData = new FormData()
  formData.append('question', question)
  const response = await api.post('/resume/suggest', formData)
  return response.data
}
