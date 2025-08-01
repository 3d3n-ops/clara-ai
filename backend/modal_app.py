from modal import App, Image, Secret, fastapi_endpoint, FunctionCall, Dict
import asyncio

# Create a lightweight Debian-based container image
image = Image.debian_slim().pip_install(
    "livekit>=0.19.1",
    "livekit-agents>=0.12.11",
    "livekit-plugins-openai>=0.10.17",
    "livekit-plugins-silero>=0.7.4",
    "livekit-plugins-cartesia==0.4.7",
    "livekit-plugins-deepgram==0.6.19",
    "python-dotenv~=1.0",
    "cartesia==2.0.0a0",
    "fastapi[standard]",
    "aiohttp",
    "websockets",
    "asyncio",
    "openai",
    "fastapi",
    "uvicorn[standard]",
    "python-multipart",
    "pinecone>=7.0.0",
    "tiktoken",
    "PyPDF2",
    "python-docx",
    "Pillow",
    "pytesseract",
    "aiofiles",
    "python-jose[cryptography]",
    "passlib[bcrypt]",
    "supabase",
)

app = App("clara-voice-agent", image=image)

# Create a persisted dict to track active rooms
room_dict = Dict.from_name("clara-room-dict", create_if_missing=True)

# Import standard libraries outside of image.imports()
import json
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta


class VisualCommand:
    """Represents a visual generation command"""
    def __init__(self, command_type: str, topic: str, context: str = ""):
        self.command_type = command_type
        self.topic = topic
        self.context = context


def create_clara_assistant(user_id: Optional[str] = None):
    """Factory function to create ClaraAssistant instance"""
    with image.imports():
        from livekit.agents import Agent
        
        class ClaraAssistant(Agent):
            def __init__(self, user_id: Optional[str] = None) -> None:
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
- Generate visual content (diagrams, flashcards, quizzes) based on voice commands

Visual Generation Commands:
- "create diagram" or "draw this" - Generate visual diagrams
- "make flashcards" or "create cards" - Generate study flashcards
- "show quiz" or "test me" - Generate interactive quizzes
- "visualize" or "show me" - Create visual representations

Keep responses conversational and engaging. Always encourage the student and celebrate their progress."""
                )
                
                self.user_id = user_id
                self.session_start_time = None
                self.session_duration = 600  # 10 minutes in seconds
                self.winding_down = False
                self.session_complete = False
                self.multimodal_enabled = False
                self.screen_sharing_active = False
                
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
                """Detect if a message contains a visual generation command"""
                message_lower = message.lower()
                
                for command_type, patterns in self.visual_commands.items():
                    for pattern in patterns:
                        if re.search(pattern, message_lower):
                            topic = self.extract_topic_from_message(message, pattern)
                            return VisualCommand(command_type, topic, message)
                
                return None

            def extract_topic_from_message(self, message: str, command_pattern: str) -> str:
                """Extract the topic from a message containing a visual command"""
                # Remove the command pattern and clean up
                topic = message.lower().replace(command_pattern, '').strip()
                
                # Remove common words and clean up
                topic = re.sub(r'\b(for|about|on|the|a|an)\b', '', topic).strip()
                
                return topic if topic else "current topic"

            async def generate_visual_content(self, command: VisualCommand) -> Dict[str, Any]:
                """Generate visual content based on the command"""
                try:
                    if command.command_type == 'diagram':
                        return await self.generate_diagram(command.topic)
                    elif command.command_type == 'flashcard':
                        return await self.generate_flashcards(command.topic)
                    elif command.command_type == 'quiz':
                        return await self.generate_quiz(command.topic)
                    elif command.command_type == 'mindmap':
                        return await self.generate_mindmap(command.topic)
                    else:
                        return {"error": f"Unknown command type: {command.command_type}"}
                except Exception as e:
                    return {"error": f"Failed to generate {command.command_type}: {str(e)}"}

            async def generate_diagram(self, topic: str) -> Dict[str, Any]:
                """Generate a diagram for the given topic"""
                try:
                    diagram_data = {
                        "type": "diagram",
                        "title": f"Diagram: {topic.title()}",
                        "description": f"A visual representation of {topic}",
                        "components": [
                            f"Main concept: {topic}",
                            "Key elements",
                            "Relationships",
                            "Process flow"
                        ],
                        "relationships": [
                            f"Connection between {topic} and related concepts",
                            "Hierarchical structure",
                            "Cause and effect relationships"
                        ],
                        "generated_at": datetime.now().isoformat()
                    }
                    
                    return diagram_data
                except Exception as e:
                    return {"error": f"Failed to generate diagram: {str(e)}"}

            async def generate_flashcards(self, topic: str) -> Dict[str, Any]:
                """Generate flashcards for the given topic"""
                try:
                    flashcard_data = {
                        "type": "flashcard",
                        "title": f"Flashcards: {topic.title()}",
                        "description": f"Study cards for {topic}",
                        "cards": [
                            {
                                "front": f"What is {topic}?",
                                "back": f"Definition and explanation of {topic}"
                            },
                            {
                                "front": f"Key concepts in {topic}",
                                "back": "Important principles and ideas"
                            },
                            {
                                "front": f"Examples of {topic}",
                                "back": "Real-world applications and examples"
                            },
                            {
                                "front": f"Common questions about {topic}",
                                "back": "Frequently asked questions and answers"
                            }
                        ],
                        "generated_at": datetime.now().isoformat()
                    }
                    
                    return flashcard_data
                except Exception as e:
                    return {"error": f"Failed to generate flashcards: {str(e)}"}

            async def generate_quiz(self, topic: str) -> Dict[str, Any]:
                """Generate a quiz for the given topic"""
                try:
                    quiz_data = {
                        "type": "quiz",
                        "title": f"Quiz: {topic.title()}",
                        "description": f"Test your knowledge of {topic}",
                        "questions": [
                            {
                                "question": f"What is the main concept of {topic}?",
                                "options": [
                                    "Option A",
                                    "Option B", 
                                    "Option C",
                                    "Option D"
                                ],
                                "correct_answer": "Option A"
                            },
                            {
                                "question": f"Which of the following relates to {topic}?",
                                "options": [
                                    "Related concept 1",
                                    "Related concept 2",
                                    "Related concept 3",
                                    "Related concept 4"
                                ],
                                "correct_answer": "Related concept 1"
                            },
                            {
                                "question": f"How would you apply {topic} in practice?",
                                "options": [
                                    "Practical application 1",
                                    "Practical application 2",
                                    "Practical application 3",
                                    "Practical application 4"
                                ],
                                "correct_answer": "Practical application 1"
                            }
                        ],
                        "generated_at": datetime.now().isoformat()
                    }
                    
                    return quiz_data
                except Exception as e:
                    return {"error": f"Failed to generate quiz: {str(e)}"}

            async def generate_mindmap(self, topic: str) -> Dict[str, Any]:
                """Generate a mindmap for the given topic"""
                try:
                    mindmap_data = {
                        "type": "mindmap",
                        "title": f"Mindmap: {topic.title()}",
                        "description": f"Organized thoughts about {topic}",
                        "central_topic": topic,
                        "branches": [
                            {
                                "topic": "Key Concepts",
                                "subtopics": ["Concept 1", "Concept 2", "Concept 3"]
                            },
                            {
                                "topic": "Applications",
                                "subtopics": ["Use case 1", "Use case 2", "Use case 3"]
                            },
                            {
                                "topic": "Related Topics",
                                "subtopics": ["Related 1", "Related 2", "Related 3"]
                            }
                        ],
                        "generated_at": datetime.now().isoformat()
                    }
                    
                    return mindmap_data
                except Exception as e:
                    return {"error": f"Failed to generate mindmap: {str(e)}"}

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

            async def handle_multimodal_context(self, message: str, has_screen_context: bool = False) -> str:
                """Handle messages with potential multimodal context"""
                if has_screen_context and self.screen_sharing_active:
                    # Enhance the message with screen context awareness
                    enhanced_message = f"[Screen sharing active] {message}"
                    return enhanced_message
                return message

            def set_multimodal_mode(self, enabled: bool):
                """Enable or disable multimodal processing"""
                self.multimodal_enabled = enabled
                print(f"[Voice Agent] Multimodal mode {'enabled' if enabled else 'disabled'}")

            def set_screen_sharing(self, active: bool):
                """Set screen sharing status"""
                self.screen_sharing_active = active
                print(f"[Voice Agent] Screen sharing {'started' if active else 'stopped'}")

            async def process_screen_context(self, screen_analysis: str) -> str:
                """Process screen analysis and generate appropriate response"""
                if not self.screen_sharing_active:
                    return ""
                
                # Generate contextual response based on screen content
                if "error" in screen_analysis.lower() or "stuck" in screen_analysis.lower():
                    return "I can see you might be having some trouble. Let me help you with that!"
                elif "code" in screen_analysis.lower() or "programming" in screen_analysis.lower():
                    return "I can see you're working on some code. Would you like me to help explain anything or review it with you?"
                elif "study" in screen_analysis.lower() or "homework" in screen_analysis.lower():
                    return "I can see you're studying! I'm here to help if you have any questions."
                
                return ""
        
        return ClaraAssistant(user_id)


async def livekit_entrypoint(ctx):
    """LiveKit agent entrypoint for Modal deployment"""
    with image.imports():
        from livekit import rtc
        from livekit.agents import AutoSubscribe, JobContext
        from livekit.agents.worker import Worker, WorkerOptions
        from livekit.agents import llm
        from livekit.agents.pipeline import VoicePipelineAgent
        from livekit.plugins import openai, deepgram, silero, cartesia, noise_cancellation, turn_detector
        from livekit.agents.pipeline import AgentSession
        from livekit.agents import RoomInputOptions
    
        print(f"[Modal Agent] Connecting to room {ctx.room.name}")
        
        # Extract user_id from room metadata or name
        room_name = ctx.room.name
        user_id = None
        
        # Try to extract user_id from room metadata
        if ctx.room.metadata:
            try:
                metadata = json.loads(ctx.room.metadata)
                user_id = metadata.get('user_id')
            except:
                pass
        
        # If not in metadata, try to extract from room name
        if not user_id:
            # Room name format: "study-session-{user_id}" or "voice-{user_id}"
            if 'study-session-' in room_name:
                user_id = room_name.replace('study-session-', '')
            elif 'voice-' in room_name:
                user_id = room_name.replace('voice-', '')
            else:
                # Generate a default user_id
                user_id = f"user-{datetime.now().timestamp()}"
        
        print(f"[Modal Agent] Starting Clara AI agent for user: {user_id}")
        
        # Initialize the Clara AI agent using the factory function
        agent = create_clara_assistant(user_id=user_id)
        
        # Start session timer
        agent.session_start_time = datetime.now()
        
        # Create agent session with LiveKit
        session = AgentSession(
            stt=deepgram.STT(model="nova-3", language="multi"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=cartesia.TTS(model="sonic-2", voice="f786b574-daa5-4673-aa0c-cbe3e8534c02"),
            vad=None,  # We'll use a different VAD approach
            turn_detection=turn_detector.EOUPlugin(),
        )

        await session.start(
            room=ctx.room,
            agent=agent,
            room_input_options=RoomInputOptions(
                # LiveKit Cloud enhanced noise cancellation
                noise_cancellation=noise_cancellation.BVC(), 
            ),
        )

        # Send initial greeting
        await session.generate_reply(
            instructions="Greet the user as Clara and offer your assistance with their studies. Mention that you can help with homework, explain concepts, and generate visual content like diagrams, flashcards, and quizzes."
        )

        print("[Modal Agent] Clara AI agent session started successfully")


@app.function(
    gpu="A100", 
    timeout=3000, 
    secrets=[Secret.from_name("clara-voice-agent-secrets")]
)
async def run_agent_worker(room_name: str):
    """Run the LiveKit worker in Modal"""
    with image.imports():
        from livekit.agents.worker import Worker, WorkerOptions
    
    import os
    print(f"[Modal Worker] Running worker for room: {room_name}")

    worker = Worker(
        WorkerOptions(
            entrypoint_fnc=livekit_entrypoint,
            ws_url=os.environ.get("LIVEKIT_URL"),
        )
    )

    try:
        await worker.run()  # Wait for the worker to finish
    except asyncio.CancelledError:
        print(f"[Modal Worker] Worker for room {room_name} was cancelled. Cleaning up...")
        # Perform cleanup before termination
        await worker.drain()
        await worker.aclose()
        print(f"[Modal Worker] Worker for room {room_name} shutdown complete.")
        raise  # Re-raise to propagate the cancellation
    finally:
        await worker.drain()
        await worker.aclose()


@app.function(image=image)
@fastapi_endpoint(method="POST")
async def run_livekit_agent(request: dict):
    """Handle LiveKit webhook events for room creation and deletion"""
    from aiohttp import web

    room_name = request["room"]["sid"]

    # Check whether the room is already in the room_dict
    if room_name in room_dict and request["event"] == "room_started":
        print(f"[Modal Webhook] Received web event for room {room_name} that already has a worker running")
        return web.Response(status=200)

    if request["event"] == "room_started":
        call = run_agent_worker.spawn(room_name)
        room_dict[room_name] = call.object_id
        print(f"[Modal Webhook] Worker for room {room_name} spawned")

    elif request["event"] == "room_finished":
        if room_name in room_dict:
            function_call = FunctionCall.from_id(room_dict[room_name])
            # Spin down the Modal function
            function_call.cancel()
            # Delete the room from the room_dict
            del room_dict[room_name]
            print(f"[Modal Webhook] Worker for room {room_name} spun down")

    return web.Response(status=200)


if __name__ == "__main__":
    app.run()