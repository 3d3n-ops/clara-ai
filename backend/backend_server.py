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
from voice_agent_rag import ClaraAssistantRAG, VisualCommand
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

# Add this new model for visual generation requests
class VisualGenerationRequest(BaseModel):
    command_type: str
    topic: str
    context: str = ""
    user_id: str

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
            print("[Backend] Error: user_id is required")
            raise HTTPException(status_code=400, detail="user_id is required")
        
        print(f"[Backend] Processing upload request for user: {request.user_id}, file: {request.filename}")
        print(f"[Backend] File size: {len(request.content)} characters")
        print(f"[Backend] Folder ID: {request.folder_id or 'none'}")
        
        # Create temporary file
        print(f"[Backend] Creating temporary file...")
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
            temp_file.write(request.content)
            temp_file_path = temp_file.name
        print(f"[Backend] Temporary file created: {temp_file_path}")
        
        try:
            # Process file with RAG engine
            print(f"[Backend] Calling RAG engine to process file...")
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
            
            print(f"[Voice WebSocket] Received {message_type} message from user {user_id}: {text_content[:100]}...")
            
            if message_type == "text":
                # Process text message with visual generation capabilities
                response = await agent.process_with_context(text_content)
                
                # Send response back with visual content if generated
                response_data = {
                    "type": "response",
                    "text": response.get("text", "I understand your message."),
                    "timestamp": datetime.now().isoformat()
                }
                
                # Add visual content if generated
                if response.get("visual_content"):
                    response_data["visual_content"] = response["visual_content"]
                    response_data["command_type"] = response.get("command_type")
                    print(f"[Voice WebSocket] Generated visual content: {response['command_type']}")
                
                await websocket.send_text(json.dumps(response_data))
                
            elif message_type == "audio":
                # Handle audio data (base64 encoded)
                audio_data = message.get("audio", "")
                # For now, we'll process as text
                # In a full implementation, you'd decode and process audio
                response = await agent.process_with_context("Audio message received")
                
                response_data = {
                    "type": "response",
                    "text": response.get("text", "I received your audio message."),
                    "timestamp": datetime.now().isoformat()
                }
                
                # Add visual content if generated
                if response.get("visual_content"):
                    response_data["visual_content"] = response["visual_content"]
                    response_data["command_type"] = response.get("command_type")
                
                await websocket.send_text(json.dumps(response_data))
                
            elif message_type == "session_start":
                # Initialize session
                await agent.initialize_rag_engine()
                await websocket.send_text(json.dumps({
                    "type": "session_started",
                    "message": "Session started. Ready to help with your studies! You can say commands like 'create diagram', 'make flashcards', or 'show quiz' to generate visual content.",
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "session_end":
                # End session
                await websocket.send_text(json.dumps({
                    "type": "session_ended",
                    "message": "Session ended. Great work!",
                    "timestamp": datetime.now().isoformat()
                }))
                
            elif message_type == "visual_command":
                # Handle direct visual generation commands
                command = message.get("command", "")
                topic = message.get("topic", "current topic")
                
                print(f"[Voice WebSocket] Direct visual command: {command} for topic: {topic}")
                
                # Create visual command object
                visual_command = VisualCommand(command, topic, text_content)
                
                # Generate visual content
                visual_content = await agent.generate_visual_content(visual_command, text_content)
                voice_response = agent.generate_voice_response_for_visual(visual_command, visual_content)
                
                await websocket.send_text(json.dumps({
                    "type": "response",
                    "text": voice_response,
                    "visual_content": visual_content,
                    "command_type": command,
                    "timestamp": datetime.now().isoformat()
                }))
                
    except WebSocketDisconnect:
        # Clean up when connection is closed
        if user_id in active_voice_connections:
            del active_voice_connections[user_id]
        if user_id in active_voice_agents:
            del active_voice_agents[user_id]
        print(f"[Voice WebSocket] User {user_id} disconnected")
    except Exception as e:
        print(f"[Voice WebSocket] Error for user {user_id}: {e}")
        import traceback
        print(f"[Voice WebSocket] Traceback: {traceback.format_exc()}")

@app.post("/voice/chat/{user_id}")
async def voice_text_chat(user_id: str, request: VoiceChatRequest):
    """Text-based voice chat endpoint"""
    try:
        # Create voice agent for this user
        agent = ClaraAssistantRAG(user_id=user_id)
        
        # Process the message
        response = await agent.process_with_context(request.message)
        
        return {
            "success": True,
            "response": response.get("text", "I understand your message."),
            "visual_content": response.get("visual_content"),
            "command_type": response.get("command_type"),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error in voice text chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice/generate-visual")
async def generate_visual_content(request: VisualGenerationRequest):
    """Generate visual content based on voice commands"""
    try:
        print(f"[Visual API] Generating {request.command_type} for user {request.user_id}")
        print(f"[Visual API] Topic: {request.topic}")
        
        # Create voice agent for this user
        agent = ClaraAssistantRAG(user_id=request.user_id)
        
        # Create visual command
        visual_command = VisualCommand(request.command_type, request.topic, request.context)
        
        # Generate visual content
        visual_content = await agent.generate_visual_content(visual_command, request.context)
        
        # Generate voice response
        voice_response = agent.generate_voice_response_for_visual(visual_command, visual_content)
        
        print(f"[Visual API] Successfully generated {request.command_type}")
        
        return {
            "success": True,
            "text": voice_response,
            "visual_content": visual_content,
            "command_type": request.command_type,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[Visual API] Error generating visual content: {e}")
        import traceback
        print(f"[Visual API] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to generate visual content: {str(e)}")

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