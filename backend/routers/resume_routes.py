import base64
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import google.generativeai as genai

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_FILE = BASE_DIR / "resumes.json"

def get_genai_model(model_name="gemini-2.5-flash"):
    api_key = os.getenv("CAREER_GEMINI_API_KEY")
    if not api_key:
        raise ValueError("CAREER_GEMINI_API_KEY environment variable is required")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)

def read_database() -> Dict[str, Any]:
    if not DATABASE_FILE.exists():
        return {}
    try:
        return json.loads(DATABASE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

def write_database(data: Dict[str, Any]) -> None:
    DATABASE_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

def normalize_username(username: str) -> str:
    return username.strip().lower()

def build_cover_letter_prompt(resume_data: Dict[str, Any], job_desc: Optional[str] = None) -> str:
    prompt = f"""
You are an expert career coach and professional cover letter writer.
Given the following resume data in JSON format, write a polished, professional cover letter.

Resume Data:
{json.dumps(resume_data, indent=2)}

"""
    if job_desc:
        prompt += f"""
Target Job Description:
{job_desc}

Tailor the cover letter specifically to this job description. Highlight the candidate's most relevant skills and experiences.
"""
    else:
        prompt += """
No specific job description was provided. Write a strong general-purpose cover letter that showcases the candidate's top skills and achievements.
"""

    prompt += f"""
Guidelines:
- Use a professional but warm tone.
- Keep it to about 350-450 words.
- Include a clear opening, 2-3 body paragraphs, and a strong closing.
- Reference achievements and metrics when available.
- Use today's date: {datetime.now().strftime('%B %d, %Y')}.
- Address the letter to "Dear Hiring Manager" unless the job description specifies a name.
- Return the letter as plain text only, with no markdown formatting.
"""
    return prompt

def build_resume_parse_prompt() -> str:
    return """
You are an expert resume parser. Read the attached PDF resume and extract the candidate information carefully.
Return strictly valid JSON matching this schema:
{
  "name": "Full Name",
  "email": "Email Address or null",
  "phone": "Phone Number or null",
  "linkedin": "LinkedIn URL or null",
  "summary": "A brief professional summary",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "duration": "Dates worked",
      "details": ["Bullet point 1", "Bullet point 2"]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "duration": "Dates of project",
      "details": "Brief description of the project"
    }
  ],
  "education": [
    {
      "degree": "Degree and Major",
      "institution": "University/School Name",
      "year": "Graduation Year"
    }
  ]
}
If any field is missing, return null or an empty array. Do not return markdown or code fences. Return only the JSON object.
"""

@router.post("/upload")
async def upload_resume(username: str = Form(...), resume: UploadFile = File(...)):
    username = normalize_username(username)
    if not username or not username.isalnum():
        raise HTTPException(status_code=400, detail="Username must be alphanumeric")
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await resume.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    prompt = build_resume_parse_prompt()
    model = get_genai_model("gemini-2.5-flash")

    try:
        response = model.generate_content([
            prompt,
            {"mime_type": "application/pdf", "data": base64.b64encode(content).decode("utf-8")}
        ])
        output_text = response.text.strip()
        if output_text.startswith("```json"):
            output_text = output_text.replace("```json", "").replace("```", "").strip()
        elif output_text.startswith("```"):
            output_text = output_text.replace("```", "").strip()

        parsed_resume = json.loads(output_text)
        db = read_database()
        db[username] = parsed_resume
        write_database(db)

        return {"success": True, "username": username, "resume": parsed_resume}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Resume parser returned invalid JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/resumes")
async def list_resumes():
    db = read_database()
    return {"resumes": [{
        "username": username,
        "name": resume.get("name", "Unknown"),
        "email": resume.get("email"),
        "skills": resume.get("skills", [])[:6]
    } for username, resume in db.items()]}

@router.get("/resume/{username}")
async def get_resume(username: str):
    username = normalize_username(username)
    db = read_database()
    if username not in db:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"username": username, "resume": db[username]}

@router.delete("/resume/{username}")
async def delete_resume(username: str):
    username = normalize_username(username)
    db = read_database()
    if username not in db:
        raise HTTPException(status_code=404, detail="Resume not found")
    del db[username]
    write_database(db)
    return {"success": True, "message": f"Deleted resume for {username}"}

@router.post("/resume/{username}/update")
async def update_resume(username: str, resume: UploadFile = File(...)):
    username = normalize_username(username)
    db = read_database()
    if username not in db:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await resume.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    prompt = build_resume_parse_prompt()
    model = get_genai_model("gemini-2.5-flash")

    try:
        response = model.generate_content([
            prompt,
            {"mime_type": "application/pdf", "data": base64.b64encode(content).decode("utf-8")}
        ])
        output_text = response.text.strip()
        if output_text.startswith("```json"):
            output_text = output_text.replace("```json", "").replace("```", "").strip()
        elif output_text.startswith("```"):
            output_text = output_text.replace("```", "").strip()

        parsed_resume = json.loads(output_text)
        db[username] = parsed_resume
        write_database(db)
        return {"success": True, "username": username, "resume": parsed_resume}
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Resume parser returned invalid JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/cover-letter")
async def generate_cover_letter(resume: UploadFile = File(...), job_description: Optional[UploadFile] = File(None)):
    if resume.content_type not in ["application/json", "application/octet-stream"]:
        raise HTTPException(status_code=400, detail="Resume file must be a JSON file")

    try:
        resume_text = await resume.read()
        resume_data = json.loads(resume_text.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid resume JSON: {exc}")

    job_description_text = None
    if job_description:
        job_description_text = (await job_description.read()).decode("utf-8")

    prompt = build_cover_letter_prompt(resume_data, job_description_text)
    model = get_genai_model("gemini-2.5-flash-lite")

    try:
        response = model.generate_content(prompt)
        cover_letter = response.text.strip()
        return {
            "success": True,
            "cover_letter": cover_letter,
            "candidate_name": resume_data.get("basics", {}).get("name") or resume_data.get("name") or "Candidate"
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/suggest")
async def suggest_answer(question: str = Form(...)):
    try:
        with open(BASE_DIR / "resume.json", "r") as f:
            resume_data = json.load(f)
    except Exception:
        resume_data = {}

    prompt = f"""
You are an intelligent assistant. Based strictly on the provided resume data below, answer or address the following user-selected text prompt. If the text is a question, answer it concisely. If it's a form field label, provide the correct input.

=== RESUME DATA ===
{json.dumps(resume_data, indent=2)}

=== SELECTED TEXT ===
{question}

Provide only the final text result. Do not add conversational padding.
"""

    model = get_genai_model("gemini-2.5-flash-lite")
    try:
        response = model.generate_content(prompt)
        return {"suggestion": response.text.strip()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
