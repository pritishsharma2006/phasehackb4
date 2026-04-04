from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load the global .env from project root (parent of backend/)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'), override=True)

from routers import interview_routes
from routers import resume_routes
from services.db import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB for interview features
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Unified AI Platform API", lifespan=lifespan)

# CORS — allow the Vite dev server origin explicitly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_routes.router, prefix="/api/interview", tags=["Interview"])
app.include_router(resume_routes.router, prefix="/api/resume", tags=["Career Resume"])

@app.get("/")
def read_root():
    return {"message": "Unified AI Backend is running successfully!"}
