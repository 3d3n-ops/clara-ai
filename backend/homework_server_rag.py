from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import tempfile
import os
import secrets
from hwk_agent_rag import HomeworkAgentRAG
from rag_engine import rag_engine

app = FastAPI(title="Clara Homework Agent RAG API", version="1.0.0")

# Production CORS settings - only allow your frontend domain
ALLOWED_ORIGINS = [
    "https://your-production-domain.com",  # Replace with your actual domain
    "https://www.your-production-domain.com",
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
from collections import defaultdict
import time

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

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = []
    conversation_id: Optional[str] = None
    folder_id: Optional[str] = None

class FileUploadRequest(BaseModel):
    filename: str
    content: str
    folder_id: Optional[str] = None

class FolderRequest(BaseModel):
    name: str
    description: Optional[str] = None
    user_id: Optional[str] = None

# Initialize the homework agent
homework_agent = HomeworkAgentRAG()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Clara Homework Agent RAG API"}

@app.post("/homework/chat-rag")
async def chat_with_homework_agent_rag(request: ChatRequest):
    """Process a chat message with the RAG-enabled homework agent"""
    try:
        # Rate limiting check
        if not check_rate_limit(request.user_id if hasattr(request, 'user_id') else 'anonymous'):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Process the message with RAG
        response = await homework_agent.process_message(
            user_message=request.message,
            user_id=request.user_id if hasattr(request, 'user_id') else 'anonymous',
            conversation_id=request.conversation_id,
            folder_id=request.folder_id,
            conversation_history=request.conversation_history or []
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/homework/upload-rag")
async def upload_file_rag(request: FileUploadRequest):
    """Upload a file and process it with RAG"""
    try:
        # Rate limiting check
        if not check_rate_limit(request.user_id if hasattr(request, 'user_id') else 'anonymous'):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
            temp_file.write(request.content)
            temp_file_path = temp_file.name
        
        try:
            # Determine file type based on filename extension
            file_type = 'text/plain'  # Default
            if request.filename.lower().endswith('.pdf'):
                file_type = 'application/pdf'
            elif request.filename.lower().endswith(('.doc', '.docx')):
                file_type = 'application/msword'
            elif request.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                file_type = 'image/jpeg'
            
            # Process file with RAG engine
            result = await rag_engine.process_file(
                file_path=temp_file_path,
                user_id=request.user_id if hasattr(request, 'user_id') else 'anonymous',
                folder_id=request.folder_id,
                original_filename=request.filename,
                file_type=file_type
            )
            
            return result
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/files/{user_id}")
async def get_user_files(
    user_id: str, 
    class_id: Optional[str] = None
):
    """Get all files for a user from Pinecone"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        files = await rag_engine.get_user_files(user_id, class_id)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/homework/files/{file_id}/{user_id}")
async def delete_user_file(
    file_id: str, 
    user_id: str
):
    """Delete a file and its associated chunks and embeddings"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        result = await rag_engine.delete_file(file_id, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/folders/{user_id}")
async def get_user_folders(user_id: str):
    """Get all folders for a user from Pinecone"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        folders = await rag_engine.get_user_folders(user_id)
        return {"folders": folders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/homework/folders")
async def create_folder(request: FolderRequest):
    """Create a new folder for a user"""
    try:
        # Rate limiting check
        user_id = request.user_id or 'anonymous'
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        folder = await rag_engine.create_folder(
            user_id=user_id,
            name=request.name,
            description=request.description or ""
        )
        return {"folder": folder}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/conversations/{user_id}")
async def get_user_conversations(user_id: str):
    """Get all conversations for a user"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # For now, return empty conversations list since conversation storage needs to be implemented
        conversations = []
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Get messages for a specific conversation"""
    try:
        # Rate limiting check
        if not check_rate_limit('anonymous'):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # For now, return empty messages list since conversation storage needs to be implemented
        messages = []
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/context/{user_id}")
async def get_user_context(
    user_id: str, 
    class_id: Optional[str] = None
):
    """Get context summary for a user"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        context = await rag_engine.get_context_for_query("", user_id, class_id)
        return {"context": context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 