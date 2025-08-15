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
from rag_engine import rag_engine

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

# Store active voice connections
active_voice_connections: Dict[str, WebSocket] = {}

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





# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Simple health check that doesn't depend on external services
        return {
            "status": "healthy", 
            "service": "Clara AI Backend Server",
            "timestamp": datetime.now().isoformat(),
            "active_voice_connections": len(active_voice_connections),
            "features": {
                "rag_engine": "enabled" if rag_engine._initialized else "initializing",
                "file_upload": "enabled",
                "voice_agent": "enabled"
            }
        }
    except Exception as e:
        print(f"Health check error: {e}")
        return {
            "status": "healthy", 
            "service": "Clara AI Backend Server",
            "timestamp": datetime.now().isoformat(),
            "note": "Basic service running"
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
            "files": "/homework/files/{user_id}",
            "folders": "/homework/folders/{user_id}",
            "voice_websocket": "/voice/ws/{user_id}"
        }
    }

# ============================================================================
# HOMEWORK AGENT ENDPOINTS
# ============================================================================

@app.post("/homework/chat-rag")
async def chat_with_rag(request: ChatRequest):
    """Process a chat message using RAG engine"""
    try:
        # Rate limiting check
        user_id = request.user_id or 'anonymous'
        if not check_rate_limit(user_id):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Get context from RAG engine
        context = await rag_engine.get_context_for_query(
            query=request.message,
            user_id=user_id,
            folder_id=request.folder_id,
            max_tokens=1000
        )
        
        # For now, return a simple response with context
        # In a full implementation, you would use an LLM to generate a response
        response_text = f"I understand your question: '{request.message}'. "
        if context:
            response_text += f"I found some relevant information in your uploaded files."
        else:
            response_text += "I don't have specific information about this in your uploaded files, but I'm here to help!"
        
        return {
            "response": response_text,
            "context_used": bool(context),
            "conversation_id": request.conversation_id,
            "tool_calls": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/homework/upload-rag")
async def upload_file_rag(request: FileUploadRequest):
    """Upload a file and process it with RAG"""
    try:
        # Validate user_id is provided
        if not request.user_id:
            print("[Backend] Error: user_id is required")
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"[Backend] Processing upload request for user: {request.user_id}, file: {request.filename}")
        print(f"[Backend] File size: {len(request.content)} characters")
        print(f"[Backend] Content type: {request.content_type}")
        print(f"[Backend] Folder ID: {request.folder_id or 'none'}")
        
        # Create temporary file with proper encoding handling
        print(f"[Backend] Creating temporary file...")
        
        # Determine file extension based on filename
        file_extension = os.path.splitext(request.filename)[1].lower()
        
        # Handle content based on content_type
        if request.content_type == "binary":
            # For binary content, decode from base64
            import base64
            try:
                binary_content = base64.b64decode(request.content)
                with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=file_extension) as temp_file:
                    temp_file.write(binary_content)
                    temp_file_path = temp_file.name
            except Exception as e:
                print(f"[Backend] Error decoding base64 content: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid binary content: {str(e)}")
        else:
            # For text content, handle encoding properly
            try:
                # Try UTF-8 first
                decoded_content = request.content.encode('utf-8')
                with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=file_extension) as temp_file:
                    temp_file.write(decoded_content)
                    temp_file_path = temp_file.name
            except UnicodeEncodeError:
                # Fallback to latin-1
                binary_content = request.content.encode('latin-1')
                with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix=file_extension) as temp_file:
                    temp_file.write(binary_content)
                    temp_file_path = temp_file.name
                
        print(f"[Backend] Temporary file created: {temp_file_path}")
        
        try:
            # Process file with RAG engine
            print(f"[Backend] Calling RAG engine to process file...")
            print(f"[Backend] File path: {temp_file_path}")
            print(f"[Backend] File exists: {os.path.exists(temp_file_path)}")
            print(f"[Backend] File size: {os.path.getsize(temp_file_path) if os.path.exists(temp_file_path) else 'N/A'} bytes")
            
            result = await rag_engine.process_file(
                file_path=temp_file_path,
                filename=request.filename,
                user_id=request.user_id,
                folder_id=request.folder_id
            )
            
            print(f"[Backend] RAG engine result: {result}")
            
            if not result.get("success", False):
                error_msg = result.get("error", "Unknown error")
                print(f"[Backend] RAG engine processing failed: {error_msg}")
                raise HTTPException(status_code=500, detail=error_msg)
            
            print(f"[Backend] Successfully processed file: {request.filename}")
            
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
                print(f"[Backend] Cleaned up temporary file: {temp_file_path}")
                
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"[Backend] Unexpected error in upload_file_rag: {e}")
        print(f"[Backend] Error type: {type(e).__name__}")
        import traceback
        print(f"[Backend] Traceback: {traceback.format_exc()}")
        
        # Provide more specific error messages
        if "charmap" in str(e).lower() or "codec" in str(e).lower():
            error_msg = "File encoding error. Please ensure the file is not corrupted."
        elif "base64" in str(e).lower():
            error_msg = "Invalid file format. Please try uploading the file again."
        else:
            error_msg = f"File processing error: {str(e)}"
            
        raise HTTPException(status_code=500, detail=error_msg)

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
        print(f"[Backend] Creating folder for user {request.user_id}")
        print(f"[Backend] Folder data: name='{request.name}', description='{request.description}'")
        
        # Validate required fields
        if not request.user_id:
            print("[Backend] Error: user_id is required")
            raise HTTPException(status_code=400, detail="user_id is required")
        
        if not request.name or not request.name.strip():
            print("[Backend] Error: folder name is required")
            raise HTTPException(status_code=400, detail="folder name is required")
        
        folder = await rag_engine.create_folder(
            name=request.name,
            description=request.description,
            user_id=request.user_id
        )
        
        print(f"[Backend] Successfully created folder: {folder}")
        return {"status": "success", "folder": folder}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"[Backend] Error creating folder: {str(e)}")
        print(f"[Backend] Error type: {type(e).__name__}")
        import traceback
        print(f"[Backend] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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
    """WebSocket endpoint for real-time voice/text chat with visual generation"""
    await websocket.accept()
    active_voice_connections[user_id] = websocket
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type", "text")
            text_content = message.get("text", "")
            
            print(f"[Voice WebSocket] Received {message_type} message from user {user_id}: {text_content[:100]}...")
            
            if message_type == "text":
                # Process text message with simple response
                response_text = f"I understand your message: '{text_content}'. How can I help with your studies?"
                
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": response_text,
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "audio":
                # Handle audio data (simplified for demo)
                audio_data_b64 = message.get("audio", "")
                if not audio_data_b64:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "text": "No audio data received",
                        "timestamp": datetime.now().isoformat()
                    }))
                    continue
                
                # For demo purposes, just acknowledge the audio
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": "I heard your voice! How can I help with your studies today?",
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "session_start":
                # Initialize session
                await websocket.send_text(json.dumps({
                    "type": "session_started",
                    "message": "Session started. Ready to help with your studies! You can speak commands like 'create diagram', 'make flashcards', or 'show quiz' to generate visual content.",
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "visual_command":
                # Handle direct visual generation commands
                command = message.get("command", "")
                topic = message.get("topic", "current topic")
                
                print(f"[Voice WebSocket] Direct visual command: {command} for topic: {topic}")
                
                # Generate mock visual content based on command
                visual_content = generate_mock_visual_content(command, topic)
                
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": f"I've generated a {command} for you about {topic}!",
                    "visual_content": visual_content,
                    "command_type": command,
                    "timestamp": datetime.now().isoformat()
                }))
                
    except WebSocketDisconnect:
        # Clean up when connection is closed
        if user_id in active_voice_connections:
            del active_voice_connections[user_id]
        print(f"[Voice WebSocket] User {user_id} disconnected")
    except Exception as e:
        print(f"[Voice WebSocket] Error for user {user_id}: {e}")
        import traceback
        print(f"[Voice WebSocket] Traceback: {traceback.format_exc()}")

def generate_mock_visual_content(command: str, topic: str) -> dict:
    """Generate mock visual content based on command type"""
    if "flashcard" in command.lower():
        return {
            "type": "flashcard",
            "cards": [
                {"front": f"What is {topic}?", "back": f"Answer about {topic}"},
                {"front": f"How does {topic} work?", "back": f"Explanation of {topic}"},
                {"front": f"Why is {topic} important?", "back": f"Importance of {topic}"}
            ]
        }
    elif "quiz" in command.lower():
        return {
            "type": "quiz",
            "questions": [
                {
                    "question": f"What is {topic}?",
                    "options": [f"Option A about {topic}", f"Option B about {topic}", f"Option C about {topic}", f"Option D about {topic}"],
                    "correct_answer": f"Option A about {topic}"
                },
                {
                    "question": f"How does {topic} work?",
                    "options": [f"Method 1 for {topic}", f"Method 2 for {topic}", f"Method 3 for {topic}", f"Method 4 for {topic}"],
                    "correct_answer": f"Method 1 for {topic}"
                }
            ]
        }
    else:  # diagram
        return {
            "type": "diagram",
            "title": f"{topic} Process",
            "elements": ["Start", "Process", "Analyze", "Review", "Complete"],
            "connections": [
                {"from": "Start", "to": "Process"},
                {"from": "Process", "to": "Analyze"},
                {"from": "Analyze", "to": "Review"},
                {"from": "Review", "to": "Complete"}
            ]
        }









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
    print("   - File Upload: Enabled")
    print("   - Voice Agent: Enabled")
    
    # Initialize RAG engine asynchronously with timeout
    try:
        print("🔧 Initializing RAG engine...")
        await asyncio.wait_for(rag_engine.initialize(), timeout=30.0)
        print("✅ RAG engine initialized successfully")
    except asyncio.TimeoutError:
        print("⚠️ RAG engine initialization timed out, continuing without full initialization")
    except Exception as e:
        print(f"⚠️ RAG engine initialization failed: {e}, continuing with limited functionality")

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