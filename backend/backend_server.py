from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header, WebSocket, WebSocketDisconnect
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

# Import our agents
from hwk_agent_rag import HomeworkAgentRAG
from voice_agent_rag import ClaraAssistantRAG
from rag_engine import rag_engine

app = FastAPI(title="Clara AI Backend Server", version="1.0.0")

# Production CORS settings - only allow your frontend domain
ALLOWED_ORIGINS = [
    os.getenv('FRONTEND_URL', 'https://try-clara.vercel.app'),  # Production frontend
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
    folder_id: Optional[str] = None
    user_id: Optional[str] = None

class FolderRequest(BaseModel):
    name: str
    description: Optional[str] = None
    user_id: Optional[str] = None

class VoiceChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: Optional[str] = None

# Initialize agents
homework_agent = HomeworkAgentRAG()

# Store active voice connections and agents
active_voice_connections: Dict[str, WebSocket] = {}
active_voice_agents: Dict[str, ClaraAssistantRAG] = {}

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
        "active_voice_connections": len(active_voice_connections),
        "features": {
            "rag_engine": "enabled",
            "homework_agent": "enabled", 
            "voice_agent": "enabled",
            "file_upload": "enabled"
        }
    }

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Clara AI Backend Server",
        "version": "1.0.0",
        "description": "Unified backend for RAG engine, homework agent, and voice agent",
        "endpoints": {
            "health": "/health",
            "homework_chat": "/homework/chat-rag",
            "file_upload": "/homework/upload-rag",
            "voice_websocket": "/voice/ws/{user_id}",
            "voice_chat": "/voice/chat/{user_id}",
            "files": "/homework/files/{user_id}",
            "folders": "/homework/folders/{user_id}"
        }
    }

# ============================================================================
# HOMEWORK AGENT ENDPOINTS
# ============================================================================

@app.post("/homework/chat-rag")
async def chat_with_homework_agent_rag(request: ChatRequest):
    """Process a chat message with the RAG-enabled homework agent"""
    try:
        # Rate limiting check
        user_id = request.user_id or 'anonymous'
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Process the message with RAG
        response = await homework_agent.process_message(
            user_message=request.message,
            user_id=user_id,
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
        # Validate user_id is provided
        if not request.user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"Processing upload request for user: {request.user_id}, file: {request.filename}")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
            temp_file.write(request.content)
            temp_file_path = temp_file.name
        
        try:
            # Process file with RAG engine
            result = await rag_engine.process_file(
                file_path=temp_file_path,
                filename=request.filename,
                user_id=request.user_id,
                folder_id=request.folder_id
            )
            
            if not result.get("success", False):
                error_msg = result.get("error", "Unknown error")
                print(f"RAG engine processing failed: {error_msg}")
                raise HTTPException(status_code=500, detail=error_msg)
            
            print(f"Successfully processed file: {request.filename}")
            
            return {
                "status": "success",
                "message": f"File '{request.filename}' uploaded and processed successfully",
                "filename": request.filename,
                "file_id": result.get("file_id"),
                "chunks_processed": result.get("chunks_processed", 0)
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Unexpected error in upload_file_rag: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/homework/files/{user_id}")
async def get_user_files(
    user_id: str, 
    class_id: Optional[str] = None
):
    """Get all files for a user"""
    try:
        files = await rag_engine.get_user_files(user_id, class_id)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/homework/files/{file_id}/{user_id}")
async def delete_user_file(
    file_id: str, 
    user_id: str
):
    """Delete a file for a user"""
    try:
        success = await rag_engine.delete_file(file_id, user_id)
        if success:
            return {"status": "success", "message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/folders/{user_id}")
async def get_user_folders(user_id: str):
    """Get all folders for a user"""
    try:
        folders = await rag_engine.get_user_folders(user_id)
        return {"folders": folders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/homework/folders")
async def create_folder(request: FolderRequest):
    """Create a new folder"""
    try:
        folder = await rag_engine.create_folder(
            name=request.name,
            description=request.description,
            user_id=request.user_id
        )
        return {"status": "success", "folder": folder}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/conversations/{user_id}")
async def get_user_conversations(user_id: str):
    """Get all conversations for a user"""
    try:
        conversations = await rag_engine.get_user_conversations(user_id)
        return {"conversations": conversations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    """Get messages for a specific conversation"""
    try:
        messages = await rag_engine.get_conversation_messages(conversation_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/homework/context/{user_id}")
async def get_user_context(
    user_id: str, 
    class_id: Optional[str] = None
):
    """Get context for a user"""
    try:
        context = await rag_engine.get_user_context(user_id, class_id)
        return {"context": context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# VOICE AGENT ENDPOINTS
# ============================================================================

@app.websocket("/voice/ws/{user_id}")
async def voice_websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time voice/text chat"""
    await websocket.accept()
    active_voice_connections[user_id] = websocket
    
    # Initialize voice agent for this user
    agent = ClaraAssistantRAG(user_id=user_id)
    active_voice_agents[user_id] = agent
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type", "text")
            text_content = message.get("text", "")
            
            if message_type == "text":
                # Process text message
                response = await agent.process_with_context(text_content)
                
                # Send response back
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": response,
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "audio":
                # Handle audio data (base64 encoded)
                audio_data = message.get("audio", "")
                # For now, we'll process as text
                # In a full implementation, you'd decode and process audio
                response = await agent.process_with_context("Audio message received")
                
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": response,
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "session_start":
                # Initialize session
                await agent.initialize_rag_engine()
                await websocket.send_text(json.dumps({
                    "type": "session_started",
                    "message": "Session started. Ready to help with your studies!",
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "session_end":
                # End session
                await websocket.send_text(json.dumps({
                    "type": "session_ended",
                    "message": "Session ended. Great work!",
                    "timestamp": datetime.now().isoformat()
                }))
                
    except WebSocketDisconnect:
        # Clean up when connection is closed
        if user_id in active_voice_connections:
            del active_voice_connections[user_id]
        if user_id in active_voice_agents:
            del active_voice_agents[user_id]
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        # Clean up on error
        if user_id in active_voice_connections:
            del active_voice_connections[user_id]
        if user_id in active_voice_agents:
            del active_voice_agents[user_id]

@app.post("/voice/chat/{user_id}")
async def voice_text_chat(user_id: str, request: VoiceChatRequest):
    """Text chat endpoint for voice agent (for non-WebSocket clients)"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Get or create agent for this user
        if user_id not in active_voice_agents:
            agent = ClaraAssistantRAG(user_id=user_id)
            active_voice_agents[user_id] = agent
        else:
            agent = active_voice_agents[user_id]
        
        # Process the message
        response = await agent.process_with_context(request.message)
        
        return {
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voice/status/{user_id}")
async def get_voice_user_status(user_id: str):
    """Get status of voice agent for a user"""
    try:
        is_connected = user_id in active_voice_connections
        has_agent = user_id in active_voice_agents
        
        return {
            "user_id": user_id,
            "is_connected": is_connected,
            "has_agent": has_agent,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voice/stats")
async def get_voice_stats():
    """Get voice agent statistics"""
    try:
        return {
            "active_connections": len(active_voice_connections),
            "active_agents": len(active_voice_agents),
            "connected_users": list(active_voice_connections.keys()),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SHARED UTILITY ENDPOINTS
# ============================================================================

@app.get("/rag/context/{user_id}")
async def get_rag_context(
    user_id: str, 
    query: str,
    class_id: Optional[str] = None,
    max_tokens: int = 1000
):
    """Get RAG context for a query (shared by both agents)"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        context = await rag_engine.get_context_for_query(
            query=query,
            user_id=user_id,
            class_id=class_id,
            max_tokens=max_tokens
        )
        
        return {
            "context": context,
            "query": query,
            "user_id": user_id,
            "class_id": class_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rag/search/{user_id}")
async def search_rag_documents(
    user_id: str,
    query: str,
    class_id: Optional[str] = None,
    limit: int = 5
):
    """Search RAG documents (shared by both agents)"""
    try:
        # Rate limiting check
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        results = await rag_engine.search_documents(
            query=query,
            user_id=user_id,
            class_id=class_id,
            limit=limit
        )
        
        return {
            "results": results,
            "query": query,
            "user_id": user_id,
            "class_id": class_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# STARTUP AND SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 Starting Clara AI Backend Server...")
    print("📋 Services:")
    print("   - RAG Engine: Enabled")
    print("   - Homework Agent: Enabled")
    print("   - Voice Agent: Enabled")
    print("   - File Upload: Enabled")
    print("   - WebSocket Support: Enabled")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    print("🛑 Shutting down Clara AI Backend Server...")
    # Close all WebSocket connections
    for user_id, websocket in active_voice_connections.items():
        try:
            await websocket.close()
        except:
            pass
    active_voice_connections.clear()
    active_voice_agents.clear()

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend_server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    ) 