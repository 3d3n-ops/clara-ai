from dotenv import load_dotenv
import os
import asyncio
import json
import re
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import (
    openai,
    cartesia,
    deepgram,
    silero,
)
# Removed turn_detector import for compatibility
from rag_engine import rag_engine
from supabase import create_client

load_dotenv()

class VisualCommand:
    """Represents a visual generation command"""
    def __init__(self, command_type: str, topic: str, context: str = ""):
        self.command_type = command_type
        self.topic = topic
        self.context = context

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
- Generate visual content (diagrams, flashcards, quizzes) based on voice commands

Visual Generation Commands:
- "create diagram" or "draw this" - Generate visual diagrams
- "make flashcards" or "create cards" - Generate study flashcards
- "show quiz" or "test me" - Generate interactive quizzes
- "visualize" or "show me" - Create visual representations

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
        
        # Visual command patterns
        self.visual_commands = {
            'diagram': [
                r'create diagram',
                r'draw this',
                r'visualize',
                r'show diagram',
                r'make a diagram'
            ],
            'flashcard': [
                r'make flashcards',
                r'create cards',
                r'study cards',
                r'flash cards',
                r'create flashcard'
            ],
            'quiz': [
                r'show quiz',
                r'test me',
                r'quiz me',
                r'create quiz',
                r'generate quiz'
            ],
            'mindmap': [
                r'mind map',
                r'organize ideas',
                r'connect concepts',
                r'create mindmap'
            ]
        }

    def detect_visual_command(self, message: str) -> Optional[VisualCommand]:
        """Detect if the message contains a visual generation command"""
        message_lower = message.lower()
        
        for command_type, patterns in self.visual_commands.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    # Extract topic from the message
                    topic = self.extract_topic_from_message(message, pattern)
                    return VisualCommand(command_type, topic, message)
        
        return None

    def extract_topic_from_message(self, message: str, command_pattern: str) -> str:
        """Extract the topic from a voice command message"""
        # Remove the command pattern from the message
        topic = re.sub(command_pattern, '', message, flags=re.IGNORECASE).strip()
        
        # If no specific topic mentioned, use a default
        if not topic or topic in ['this', 'that', 'it']:
            return "current topic"
        
        return topic

    async def generate_visual_content(self, command: VisualCommand, session_context: str = "") -> Dict[str, Any]:
        """Generate visual content based on the command"""
        try:
            print(f"[Voice Agent] Generating {command.command_type} for topic: {command.topic}")
            
            if command.command_type == 'diagram':
                return await self.generate_diagram(command.topic, session_context)
            elif command.command_type == 'flashcard':
                return await self.generate_flashcards(command.topic, session_context)
            elif command.command_type == 'quiz':
                return await self.generate_quiz(command.topic, session_context)
            elif command.command_type == 'mindmap':
                return await self.generate_mindmap(command.topic, session_context)
            else:
                return {"error": f"Unknown visual command type: {command.command_type}"}
                
        except Exception as e:
            print(f"[Voice Agent] Error generating visual content: {e}")
            return {"error": f"Failed to generate {command.command_type}: {str(e)}"}

    async def generate_diagram(self, topic: str, context: str = "") -> Dict[str, Any]:
        """Generate a diagram for the given topic"""
        try:
            # Use OpenAI to generate diagram description
            prompt = f"""Create a detailed diagram description for: {topic}
            
            Context: {context}
            
            Generate a clear, educational diagram that would help explain this concept.
            Include:
            - Main components and their relationships
            - Flow or structure if applicable
            - Key labels and explanations
            
            Return as JSON with:
            - title: Diagram title
            - description: Detailed diagram description
            - components: List of diagram components
            - relationships: How components connect
            """
            
            # For now, return a structured response
            # In production, you'd call OpenAI API here
            return {
                "type": "diagram",
                "title": f"Diagram: {topic}",
                "description": f"A visual representation of {topic}",
                "components": [topic],
                "relationships": [],
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[Voice Agent] Error generating diagram: {e}")
            return {"error": f"Failed to generate diagram: {str(e)}"}

    async def generate_flashcards(self, topic: str, context: str = "") -> Dict[str, Any]:
        """Generate flashcards for the given topic"""
        try:
            # Use context to generate relevant flashcards
            prompt = f"""Create flashcards for: {topic}
            
            Context: {context}
            
            Generate 5-10 flashcards that would help study this topic.
            Each flashcard should have:
            - Front: Question or concept
            - Back: Answer or explanation
            
            Return as JSON with:
            - title: Flashcard set title
            - cards: Array of {front, back} objects
            """
            
            # For now, return a structured response
            # In production, you'd call OpenAI API here
            return {
                "type": "flashcard",
                "title": f"Flashcards: {topic}",
                "cards": [
                    {"front": f"What is {topic}?", "back": f"Explanation of {topic}"},
                    {"front": f"Key concept about {topic}", "back": "Detailed explanation"}
                ],
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[Voice Agent] Error generating flashcards: {e}")
            return {"error": f"Failed to generate flashcards: {str(e)}"}

    async def generate_quiz(self, topic: str, context: str = "") -> Dict[str, Any]:
        """Generate a quiz for the given topic"""
        try:
            # Use context to generate relevant quiz questions
            prompt = f"""Create a quiz for: {topic}
            
            Context: {context}
            
            Generate 5 quiz questions that test understanding of this topic.
            Include multiple choice questions with 4 options each.
            
            Return as JSON with:
            - title: Quiz title
            - questions: Array of question objects
            """
            
            # For now, return a structured response
            # In production, you'd call OpenAI API here
            return {
                "type": "quiz",
                "title": f"Quiz: {topic}",
                "questions": [
                    {
                        "question": f"What is the main concept of {topic}?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A"
                    }
                ],
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[Voice Agent] Error generating quiz: {e}")
            return {"error": f"Failed to generate quiz: {str(e)}"}

    async def generate_mindmap(self, topic: str, context: str = "") -> Dict[str, Any]:
        """Generate a mindmap for the given topic"""
        try:
            # Use context to generate mindmap structure
            prompt = f"""Create a mindmap for: {topic}
            
            Context: {context}
            
            Generate a mindmap structure that organizes concepts around {topic}.
            Include:
            - Main topic in center
            - Related subtopics
            - Key concepts and ideas
            
            Return as JSON with:
            - title: Mindmap title
            - central_topic: Main topic
            - branches: Array of subtopics and concepts
            """
            
            # For now, return a structured response
            # In production, you'd call OpenAI API here
            return {
                "type": "mindmap",
                "title": f"Mindmap: {topic}",
                "central_topic": topic,
                "branches": [
                    {"topic": "Concept 1", "subtopics": ["Detail 1", "Detail 2"]},
                    {"topic": "Concept 2", "subtopics": ["Detail 3", "Detail 4"]}
                ],
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"[Voice Agent] Error generating mindmap: {e}")
            return {"error": f"Failed to generate mindmap: {str(e)}"}

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

    async def process_with_context(self, message: str) -> Dict[str, Any]:
        """Process a message with RAG context and visual generation"""
        if not self.user_id:
            return {"text": message, "visual_content": None}
        
        try:
            # First, check for visual commands
            visual_command = self.detect_visual_command(message)
            
            if visual_command:
                print(f"[Voice Agent] Detected visual command: {visual_command.command_type}")
                
                # Get context for visual generation
                context = await self.get_context_for_query(message)
                
                # Generate visual content
                visual_content = await self.generate_visual_content(visual_command, context)
                
                # Generate voice response for the visual content
                voice_response = self.generate_voice_response_for_visual(visual_command, visual_content)
                
                return {
                    "text": voice_response,
                    "visual_content": visual_content,
                    "command_type": visual_command.command_type
                }
            
            # Regular text processing with RAG context
            context = await self.get_context_for_query(message)
            
            if context:
                enhanced_message = f"{message}\n\nContext: {context}"
            else:
                enhanced_message = message
            
            # For now, return a simple response
            # In production, you'd call OpenAI API here
            response = f"I understand you said: {message}. Let me help you with that."
            
            return {
                "text": response,
                "visual_content": None,
                "command_type": None
            }
            
        except Exception as e:
            print(f"Error processing message with context: {e}")
            return {
                "text": "I'm having trouble processing that right now. Could you try again?",
                "visual_content": None,
                "command_type": None
            }

    def generate_voice_response_for_visual(self, command: VisualCommand, visual_content: Dict[str, Any]) -> str:
        """Generate a voice response for visual content generation"""
        if "error" in visual_content:
            return f"I'm sorry, I couldn't generate the {command.command_type}. {visual_content['error']}"
        
        responses = {
            'diagram': f"I've created a diagram for {command.topic}. This visual representation should help you understand the concept better.",
            'flashcard': f"I've generated flashcards for {command.topic}. These will help you study and review the key concepts.",
            'quiz': f"I've created a quiz for {command.topic}. This will help test your understanding of the material.",
            'mindmap': f"I've organized the concepts around {command.topic} into a mindmap. This should help you see the relationships between ideas."
        }
        
        return responses.get(command.command_type, f"I've generated {command.command_type} content for {command.topic}.")

    def get_session_time_remaining(self) -> int:
        """Get the remaining time in the session"""
        if not self.session_start_time:
            return self.session_duration
        
        elapsed = (datetime.now() - self.session_start_time).total_seconds()
        remaining = self.session_duration - elapsed
        return max(0, int(remaining))

    def should_wind_down(self) -> bool:
        """Check if the session should start winding down"""
        return self.get_session_time_remaining() <= 180  # 3 minutes

    def should_request_reteaching(self) -> bool:
        """Check if the session should request reteaching"""
        return self.get_session_time_remaining() <= 60  # 1 minute

    def is_session_complete(self) -> bool:
        """Check if the session is complete"""
        return self.get_session_time_remaining() <= 0

    async def get_session_management_prompt(self, message: str) -> str:
        """Get session management prompt based on remaining time"""
        remaining = self.get_session_time_remaining()
        
        if self.is_session_complete():
            return f"{message}\n\nSession complete! Great work today. Please summarize what you learned."
        elif self.should_request_reteaching():
            return f"{message}\n\nWe have about 1 minute left. Can you reteach me the key concepts we covered?"
        elif self.should_wind_down():
            return f"{message}\n\nWe're winding down the session. Let's review what we've covered."
        else:
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
            # Removed noise cancellation for compatibility
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