from dotenv import load_dotenv
import os
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    openai,
    cartesia,
    deepgram,
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from rag_engine import rag_engine

load_dotenv()

class ClaraAssistantRAG(Agent):
    def __init__(self, user_id: Optional[str] = None, class_id: Optional[str] = None) -> None:
        super().__init__(
            instructions="""You are Clara, a helpful voice AI assistant designed to help students with their studies.

Your personality:
- Friendly, encouraging, and patient
- Use evidence-based learning techniques
- Ask probing questions to test understanding
- Provide clear explanations with examples
- Adapt to the student's learning pace

Your capabilities:
- Help with homework and study sessions
- Explain complex concepts in simple terms
- Use active recall and spaced repetition techniques
- Provide study tips and learning strategies
- Answer questions across various subjects
- Access to student's uploaded learning materials for personalized help

Session Management:
- Study sessions are limited to 10 minutes
- When 3 minutes remain, start winding down the session
- When 1 minute remains, ask the student to reteach key concepts
- End each session by asking the student to summarize what they learned

Keep responses conversational and engaging. Always encourage the student and celebrate their progress."""
        )
        
        self.user_id = user_id
        self.class_id = class_id
        self.session_start_time = None
        self.session_duration = 600  # 10 minutes in seconds
        self.winding_down = False
        self.session_complete = False
        
        # In-memory storage for conversations (simplified)
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        
        # Initialize RAG engine (will be initialized async later)
        self.rag_engine = rag_engine

    async def initialize_rag_engine(self):
        """Initialize the RAG engine asynchronously"""
        try:
            # Add timeout to prevent blocking
            await asyncio.wait_for(self.rag_engine.initialize(), timeout=5.0)
        except asyncio.TimeoutError:
            print("Warning: RAG engine initialization timed out, continuing without RAG features")
        except Exception as e:
            print(f"Error initializing RAG engine: {e}")

    async def get_context_for_query(self, query: str) -> str:
        """Get relevant context from RAG system for voice queries"""
        if not self.user_id:
            return ""
        
        try:
            # Ensure RAG engine is initialized
            await self.initialize_rag_engine()
            
            context = await self.rag_engine.get_context_for_query(query, self.user_id, self.class_id, max_tokens=1000)
            if context:
                return f"\nRelevant information from your materials: {context}\n"
            return ""
        except Exception as e:
            print(f"Error getting context for voice query: {e}")
            # Return empty context to allow the agent to continue working
            return ""

    async def process_with_context(self, message: str) -> str:
        """Process a message with RAG context"""
        if not self.user_id:
            return message
        
        try:
            # Get relevant context
            context = await self.get_context_for_query(message)
            
            if context:
                # Modify the message to include context
                contextual_message = f"{context}\n\nStudent's question: {message}"
                return contextual_message
            else:
                return message
                
        except Exception as e:
            print(f"Error processing message with context: {e}")
            return message

    def get_session_time_remaining(self) -> int:
        """Get remaining time in seconds"""
        if not self.session_start_time:
            return self.session_duration
        
        elapsed = (datetime.now() - self.session_start_time).total_seconds()
        remaining = max(0, self.session_duration - elapsed)
        return int(remaining)

    def should_wind_down(self) -> bool:
        """Check if session should start winding down (3 minutes remaining)"""
        remaining = self.get_session_time_remaining()
        return remaining <= 180 and not self.winding_down

    def should_request_reteaching(self) -> bool:
        """Check if should request reteaching (1 minute remaining)"""
        remaining = self.get_session_time_remaining()
        return remaining <= 60

    def is_session_complete(self) -> bool:
        """Check if session is complete"""
        remaining = self.get_session_time_remaining()
        return remaining <= 0

    async def get_session_management_prompt(self, message: str) -> str:
        """Add session management instructions to the message"""
        remaining = self.get_session_time_remaining()
        
        if self.is_session_complete():
            return f"""
Session time is up! Please end the session by:
1. Congratulating the student on completing their study session
2. Asking them to summarize the key concepts they learned today
3. Providing a brief summary of what was covered
4. Encouraging them to review the material later

Student's message: {message}
"""
        
        elif self.should_request_reteaching():
            return f"""
Only 1 minute remaining in the session! Please:
1. Ask the student to reteach the key concepts they learned today
2. Listen to their explanation and provide gentle corrections if needed
3. Praise their understanding and effort
4. Prepare to wrap up the session

Student's message: {message}
"""
        
        elif self.should_wind_down():
            self.winding_down = True
            return f"""
3 minutes remaining in the session. Start winding down by:
1. Summarizing the main topics covered so far
2. Asking if the student has any final questions
3. Preparing to ask them to reteach key concepts
4. Keep responses shorter and more focused

Student's message: {message}
"""
        
        return message

async def entrypoint(ctx: agents.JobContext):
    # Extract user_id and class_id from room metadata or name
    room_name = ctx.room.name
    user_id = None
    class_id = None
    
    # Parse room metadata for user and class info
    if hasattr(ctx.room, 'metadata') and ctx.room.metadata:
        try:
            metadata = ctx.room.metadata
            user_id = metadata.get('user_id')
            class_id = metadata.get('class_id')
        except:
            pass
    
    # Fallback: try to extract from room name
    if not user_id and 'user-' in room_name:
        parts = room_name.split('-')
        for i, part in enumerate(parts):
            if part == 'user' and i + 1 < len(parts):
                user_id = parts[i + 1]
                break
    
    # Create agent instance
    agent = ClaraAssistantRAG(user_id=user_id, class_id=class_id)
    
    # Initialize RAG engine asynchronously before session creation
    try:
        await asyncio.wait_for(agent.initialize_rag_engine(), timeout=5.0)
    except asyncio.TimeoutError:
        print("Warning: RAG engine initialization timed out in entrypoint, continuing")
    except Exception as e:
        print(f"Error initializing RAG engine in entrypoint: {e}")
    
    # Create a session with enhanced configuration
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-2",  # Use older model for stability
            language="en",
            smart_format=False,  # Disable smart formatting
            interim_results=False
        ),
        llm=openai.LLM(
            model="gpt-3.5-turbo",  # Use simpler model for stability
            temperature=0.7,
            max_tokens=1000
        ),
        tts=cartesia.TTS(
            model="sonic-1",  # Use older model for stability
            voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",  # Pleasant female voice
            sample_rate=24000
        ),
        # Remove VAD and turn detection to prevent timeouts
    )

    # Connect to the room with Clara identity
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    # Start session timer
    agent.session_start_time = datetime.now()
    print(f"Study session started at {agent.session_start_time}")

    # Greet the user based on room context
    if "study-session" in room_name:
        greeting = "Hi there! I'm Clara, your AI study assistant. I'm excited to help you with your learning today. We have 10 minutes for our study session. What would you like to work on?"
    else:
        greeting = "Hello! I'm Clara, your voice AI assistant. How can I help you today?"
    
    await session.generate_reply(instructions=greeting)

    # Store conversation in database if user_id is available
    conversation_id = None
    if user_id:
        try:
            # Create conversation record
            supabase = create_client(
                os.getenv('SUPABASE_URL'),
                os.getenv('SUPABASE_ANON_KEY')
            )
            
            conversation_result = supabase.table('conversations').insert({
                "user_id": user_id,
                "class_id": class_id,
                "title": f"Voice Study Session - {room_name}",
                "agent_type": "voice"
            }).execute()
            
            conversation_id = conversation_result.data[0]['id']
            
            # Store initial greeting
            supabase.table('messages').insert({
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": greeting
            }).execute()
            
        except Exception as e:
            print(f"Error storing voice conversation: {e}")

    # Session monitoring loop
    async def monitor_session():
        while not agent.session_complete:
            await asyncio.sleep(30)  # Check every 30 seconds
            
            if agent.is_session_complete():
                agent.session_complete = True
                print("Session time limit reached")
                break
            elif agent.should_wind_down() and not agent.winding_down:
                print("Session winding down - 3 minutes remaining")
            elif agent.should_request_reteaching():
                print("Requesting reteaching - 1 minute remaining")

    # Start session monitoring in background
    asyncio.create_task(monitor_session())


if __name__ == "__main__":
    # Enhanced worker options for better performance
    worker_options = agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        # Set agent identity for easier identification
        agent_name="clara-assistant-rag",
        # Explicitly set LiveKit URL to ensure connection to cloud service
        ws_url=os.getenv('LIVEKIT_URL', 'wss://rzn-ai-demo-jjqfllvw.livekit.cloud')
    )
    
    agents.cli.run_app(worker_options) 