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

# Removed RAG engine import - not currently used

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
    return {
        "status": "healthy", 
        "service": "Clara AI Backend Server",
        "timestamp": datetime.now().isoformat(),
        "active_voice_connections": len(active_voice_connections),
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
            "voice_websocket": "/voice/ws/{user_id}"
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