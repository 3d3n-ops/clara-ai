from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import tempfile
import os
import secrets
import asyncio
import json
from datetime import datetime
from collections import defaultdict
import time
import base64
from dotenv import load_dotenv
import redis

# Load environment variables from .env file first
load_dotenv()

# Initialize Redis client with proper error handling
REDIS_URL = os.getenv('REDIS_URL')
redis_client = None
if REDIS_URL:
    try:
        redis_client = redis.from_url(REDIS_URL, ssl_cert_reqs=None)
        # Test the connection
        redis_client.ping()
        print("Successfully connected to Redis")
    except Exception as e:
        print(f"Warning: Could not connect to Redis: {e}")
        redis_client = None

from groq import Groq

app = FastAPI(title="Clara AI Backend Server", version="1.0.0")

# Production CORS settings - only allow your frontend domain
ALLOWED_ORIGINS = [
    os.getenv('FRONTEND_URL', 'https://try-clara.vercel.app'),  # Production frontend
    "https://www.clara-ai.org",  # Production frontend alternative
    "http://localhost:3000",  # Development only
    "http://localhost:3001",  # Development only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Rate limiting (in production, use Redis)
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100

def check_rate_limit(user_id: str) -> bool:
    """Simple rate limiting - in production use Redis"""
    now = time.time()
    user_requests = rate_limit_store[user_id]
    
    # Remove old requests
    user_requests[:] = [req_time for req_time in user_requests if now - req_time < RATE_LIMIT_WINDOW]
    
    if len(user_requests) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    
    user_requests.append(now)
    return True

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = []
    conversation_id: Optional[str] = None
    folder_id: Optional[str] = None
    user_id: Optional[str] = None

class FileUploadRequest(BaseModel):
    filename: str
    content: str
    content_type: Optional[str] = "text"  # "text" or "binary"
    folder_id: Optional[str] = None
    user_id: Optional[str] = None

class FolderRequest(BaseModel):
    name: str
    description: Optional[str] = None
    user_id: Optional[str] = None

class LectureMaterialRequest(BaseModel):
    file_content: str  # Base64 encoded file content
    file_name: str
    file_type: str  # pdf, docx, txt, etc.
    user_id: str

class ProcessedContent(BaseModel):
    title: str
    notes: str
    diagrams: List[Dict[str, str]]  # List of {type: "mermaid|image", content: "..."}
    flashcards: List[Dict[str, str]]  # List of {question: "...", answer: "..."}

# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "Clara AI Backend Server",
        "timestamp": datetime.now().isoformat(),
        "features": {
            "voice_agent": "enabled",
            "basic_api": "enabled"
        }
    }

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Clara AI Backend Server",
        "version": "1.0.0",
        "description": "Simplified backend for voice agent and basic API endpoints",
        "endpoints": {
            "health": "/health",
        }
    }

# ============================================================================
# SIMPLE API ENDPOINTS (RAG functionality removed)
# ============================================================================

@app.post("/api/simple-chat")
async def simple_chat(request: ChatRequest):
    """Simple chat endpoint without RAG"""
    try:
        # Rate limiting check
        user_id = request.user_id or 'anonymous'
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Simple response without RAG
        response_text = f"I received your message: '{request.message}'. This is a simple response without RAG functionality."
        
        return {
            "response": response_text,
            "conversation_id": request.conversation_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def call_groq_title(content: str) -> str:
    """Synchronous function to call Groq API for a title."""
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates a concise and engaging title for a study session based on the provided content. The title should be no more than 10 words."
                },
                {
                    "role": "user",
                    "content": f"Please generate a title for a study session based on the following content:\n\n{content}"
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating title: {e}")
        return "Study Session"

async def process_title(content: str) -> str:
    """Process content to generate a title using Groq."""
    return await asyncio.to_thread(call_groq_title, content)

def call_groq_notes(content: str) -> str:
    """Synchronous function to call Groq API for notes."""
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that summarizes educational content into clear and concise study notes in Markdown format. Use appropriate Markdown formatting for headers, lists, and code snippets. For code snippets, use triple backticks with the language specified, for example: ```python\nprint('Hello, World!')\n```."
                },
                {
                    "role": "user",
                    "content": f"Please generate study notes for the following content:\n\n{content}"
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating notes: {e}")
        return "# Error Generating Notes\n\nCould not generate notes at this time."

async def process_notes(content: str) -> str:
    """Process content to generate study notes using Groq."""
    return await asyncio.to_thread(call_groq_notes, content)

def call_groq_diagrams(content: str) -> List[Dict[str, str]]:
    """Synchronous function to call Groq API for diagrams."""
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates Mermaid.js diagrams to explain key concepts in educational content. Respond with only the Mermaid.js syntax inside a single code block. For example: ```mermaid\ngraph TD...```. If you have multiple diagrams, separate them with '---'. Do not include any other text or explanations outside the code blocks."
                },
                {
                    "role": "user",
                    "content": f"Please generate Mermaid.js diagrams for the key concepts in the following content:\n\n{content}"
                }
            ]
        )
        diagram_syntax = response.choices[0].message.content
        # Clean up the response to get only the Mermaid syntax
        diagrams = []
        for block in diagram_syntax.split("---"):
            cleaned_block = block.strip()
            if cleaned_block.startswith("```mermaid"):
                cleaned_block = cleaned_block[len("```mermaid"):
].strip()
            if cleaned_block.endswith("```"):
                cleaned_block = cleaned_block[:-len("```")].strip()
            if cleaned_block:
                diagrams.append({"type": "mermaid", "content": cleaned_block})
        return diagrams
    except Exception as e:
        print(f"Error generating diagrams: {e}")
        return []


async def process_diagrams(content: str) -> List[Dict[str, str]]:
    """Process content to generate Mermaid.js diagrams using Groq."""
    return await asyncio.to_thread(call_groq_diagrams, content)


async def process_flashcards(content: str) -> List[Dict[str, str]]:
    """Process content to generate flashcards"""
    # TODO: Implement actual flashcard generation logic
    await asyncio.sleep(2.5)  # Simulate processing time
    return [
        {"question": "What is the main topic of the lecture?", "answer": "The main topic is..."},
        {"question": "What are the key points discussed?", "answer": "The key points are..."}
    ]

def call_groq_lesson_plan_summary(content: str) -> str:
    """Synchronous function to call Groq API for a lesson plan summary."""
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that generates a concise lesson plan summary from educational content. Focus on key topics, learning objectives, and a brief outline of the material. The summary should be in Markdown format."
                },
                {
                    "role": "user",
                    "content": f"Please generate a lesson plan summary for the following content:\n\n{content}"
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating lesson plan summary: {e}")
        return "# Error Generating Lesson Plan Summary\n\nCould not generate summary at this time."

async def process_lesson_plan_summary(content: str) -> str:
    """Process content to generate a lesson plan summary using Groq."""
    return await asyncio.to_thread(call_groq_lesson_plan_summary, content)

@app.post("/api/process-lecture", response_model=ProcessedContent)
async def process_lecture_material(user_id: str = Form(...), file: UploadFile = File(...)):
    """
    Process uploaded lecture material and generate notes, diagrams, and flashcards in parallel.
    Caches the result in Redis to avoid reprocessing the same file.
    """
    print(f"--- Processing lecture material for user_id: {user_id}, file: {file.filename} ---")
    
    # Create a unique cache key for the file and user
    cache_key = f"lecture_content:{user_id}:{file.filename}"
    
    try:
        # Check if the content is already cached in Redis
        cached_content = redis_client.get(cache_key)
        if cached_content:
            print(f"--- Found cached content for key: {cache_key} ---")
            return json.loads(cached_content)
            
        print(f"--- No cached content found for key: {cache_key}. Processing file. ---")

        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        print(f"[1/5] Saving uploaded file to a temporary location...")
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name
        print(f"--- Saved file to temporary path: {temp_file_path} ---")

        # Extract text from the file
        print(f"[2/5] Extracting text from file...")
        extracted_text = ""
        file_type = file.filename.split(".").pop() or ""
        if file_type == "pdf":
            import pypdf
            with open(temp_file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    extracted_text += page.extract_text()
        elif file_type == "docx":
            import docx2txt
            extracted_text = docx2txt.process(temp_file_path)
        else:
            with open(temp_file_path, "r") as f:
                extracted_text = f.read()
        print(f"--- Extracted text snippet: {extracted_text[:200]}... ---")

        # Clean up the temporary file
        os.unlink(temp_file_path)
        print(f"--- Deleted temporary file: {temp_file_path} ---")

        # Process content in parallel
        print("[3/5] Calling Groq API to generate title, notes, diagrams, and lesson plan summary...")
        title_task = asyncio.create_task(process_title(extracted_text))
        notes_task = asyncio.create_task(process_notes(extracted_text))
        diagrams_task = asyncio.create_task(process_diagrams(extracted_text))
        lesson_plan_summary_task = asyncio.create_task(process_lesson_plan_summary(extracted_text))
        
        # Wait for all tasks to complete
        title, notes, diagrams, lesson_plan_summary = await asyncio.gather(
            title_task, notes_task, diagrams_task, lesson_plan_summary_task
        )
        print(f"--- Groq response for title: {title} ---")
        print(f"--- Groq response for notes: {notes[:100]}... ---")
        print(f"--- Groq response for diagrams: {diagrams} ---")
        print(f"--- Groq response for lesson plan summary: {lesson_plan_summary[:100]}... ---")

        # Store lesson plan summary in Redis
        redis_key = f"lesson_summary:{user_id}:{file.filename}"
        redis_client.set(redis_key, lesson_plan_summary)
        print(f"--- Stored lesson plan summary in Redis with key: {redis_key} ---")
        
        processed_content = {
            "title": title,
            "notes": notes,
            "diagrams": diagrams,
            "flashcards": [] # Return empty list for now
        }
        
        # Cache the processed content in Redis for 1 hour (3600 seconds)
        redis_client.set(cache_key, json.dumps(processed_content), ex=3600)
        print(f"--- Cached processed content in Redis with key: {cache_key} ---")

        print("[5/5] Returning processed content to the frontend.")
        return processed_content
        
    except Exception as e:
        print(f"--- ERROR processing lecture material: {e} ---")
        raise HTTPException(status_code=500, detail=f"Error processing lecture material: {str(e)}")

# ============================================================================
# STARTUP AND SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting Clara AI Backend Server...")
    print("📋 Services:")
    print("   - Voice Agent: Enabled")
    print("   - Basic API: Enabled")
    print("✅ Server started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    print("🛑 Shutting down Clara AI Backend Server...") 