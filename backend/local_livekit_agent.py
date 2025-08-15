#!/usr/bin/env python3
"""
Local LiveKit Agent Script for Clara AI

This script provides a local implementation of the LiveKit voice agent
that can run independently without Modal deployment.

Usage:
    python local_livekit_agent.py

Features:
- Local LiveKit agent simulation
- Text-based chat interface
- Voice command processing
- Visual content generation (diagrams, flashcards, quizzes)
- Session management
- Local file storage for generated content
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import re
from pathlib import Path
import time

# Add the backend directory to the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock LiveKit imports for local development
class MockLiveKitContext:
    """Mock LiveKit context for local development"""
    def __init__(self, room_name: str, user_id: str):
        self.room = MockRoom(room_name, user_id)
        self.connected = False
    
    async def connect(self):
        """Mock connection"""
        self.connected = True
        print(f"[Local LiveKit] Connected to room: {self.room.name}")
    
    async def disconnect(self):
        """Mock disconnection"""
        self.connected = False
        print(f"[Local LiveKit] Disconnected from room: {self.room.name}")

class MockRoom:
    """Mock LiveKit room for local development"""
    def __init__(self, name: str, user_id: str):
        self.name = name
        self.user_id = user_id
        self.metadata = json.dumps({"user_id": user_id})
        self.connection_state = "CONN_CONNECTED"

class MockAgentSession:
    """Mock LiveKit agent session for local development"""
    def __init__(self, agent, room):
        self.agent = agent
        self.room = room
        self.active = True
    
    async def start(self, room, agent, room_input_options=None):
        """Mock session start"""
        print(f"[Local LiveKit] Session started for room: {room.name}")
        print(f"[Local LiveKit] Agent: {agent.__class__.__name__}")
        if room_input_options:
            print(f"[Local LiveKit] Room input options: {room_input_options}")
    
    async def generate_reply(self, instructions: str):
        """Mock reply generation"""
        print(f"[Local LiveKit] Generating reply with instructions: {instructions}")
        # Simulate the agent's response
        response = await self.agent.process_message(instructions)
        print(f"[Local LiveKit] Agent response: {response}")
        return response
    
    async def stop(self):
        """Mock session stop"""
        self.active = False
        print(f"[Local LiveKit] Session stopped")

class VisualCommand:
    """Represents a visual generation command"""
    def __init__(self, command_type: str, topic: str, context: str = ""):
        self.command_type = command_type
        self.topic = topic
        self.context = context

class LocalClaraAssistant:
    """Local implementation of Clara Assistant for LiveKit simulation"""
    
    def __init__(self, user_id: Optional[str] = None):
        self.instructions = """You are Clara, a helpful voice AI assistant designed to help students with their studies.

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
        
        self.user_id = user_id or f"user-{int(time.time())}"
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
                r'make a diagram',
                r'show diagram',
                r'visualize this'
            ],
            'flashcard': [
                r'make flashcards',
                r'create cards',
                r'generate flashcards',
                r'study cards',
                r'flash cards'
            ],
            'quiz': [
                r'show quiz',
                r'test me',
                r'create quiz',
                r'generate quiz',
                r'quiz me'
            ],
            'mindmap': [
                r'create mindmap',
                r'make mindmap',
                r'brainstorm',
                r'mind map'
            ]
        }
        
        # Session data
        self.messages = []
        self.visual_content_generated = []
        
        # Create generated_content directory if it doesn't exist
        self.content_dir = Path("generated_content")
        self.content_dir.mkdir(exist_ok=True)
    
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
        """Extract the topic from a message after removing the command"""
        message_lower = message.lower()
        command_pattern_lower = command_pattern.lower()
        
        # Remove the command and clean up the topic
        topic = message_lower.replace(command_pattern_lower, "").strip()
        
        # If no specific topic, use a default
        if not topic:
            topic = "general study topic"
        
        return topic
    
    async def generate_visual_content(self, command: VisualCommand) -> Dict[str, Any]:
        """Generate visual content based on the command"""
        print(f"[Local LiveKit] Generating {command.command_type} for topic: {command.topic}")
        
        if command.command_type == 'diagram':
            return await self.generate_diagram(command.topic)
        elif command.command_type == 'flashcard':
            return await self.generate_flashcards(command.topic)
        elif command.command_type == 'quiz':
            return await self.generate_quiz(command.topic)
        elif command.command_type == 'mindmap':
            return await self.generate_mindmap(command.topic)
        else:
            return {"error": "Unknown visual command type"}
    
    async def generate_diagram(self, topic: str) -> Dict[str, Any]:
        """Generate a visual diagram"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"diagram_{topic.replace(' ', '_')}_{timestamp}.json"
        
        diagram_data = {
            "type": "diagram",
            "topic": topic,
            "title": f"Visual Diagram: {topic.title()}",
            "description": f"A comprehensive visual representation of {topic}",
            "elements": [
                {"type": "concept", "text": topic, "position": "center"},
                {"type": "subtopic", "text": f"Key aspect 1 of {topic}", "position": "top"},
                {"type": "subtopic", "text": f"Key aspect 2 of {topic}", "position": "bottom"},
                {"type": "connection", "from": topic, "to": f"Key aspect 1 of {topic}"},
                {"type": "connection", "from": topic, "to": f"Key aspect 2 of {topic}"}
            ],
            "generated_at": timestamp,
            "filename": filename
        }
        
        # Save to file
        filepath = self.content_dir / filename
        with open(filepath, 'w') as f:
            json.dump(diagram_data, f, indent=2)
        
        print(f"[Local LiveKit] Diagram saved to: {filepath}")
        return diagram_data
    
    async def generate_flashcards(self, topic: str) -> Dict[str, Any]:
        """Generate study flashcards"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"flashcards_{topic.replace(' ', '_')}_{timestamp}.json"
        
        flashcards_data = {
            "type": "flashcards",
            "topic": topic,
            "title": f"Study Flashcards: {topic.title()}",
            "description": f"Interactive flashcards for studying {topic}",
            "cards": [
                {
                    "front": f"What is {topic}?",
                    "back": f"A comprehensive explanation of {topic} and its key concepts.",
                    "difficulty": "medium"
                },
                {
                    "front": f"Key principles of {topic}",
                    "back": f"The fundamental principles and concepts related to {topic}.",
                    "difficulty": "easy"
                },
                {
                    "front": f"Applications of {topic}",
                    "back": f"Real-world applications and examples of {topic}.",
                    "difficulty": "hard"
                }
            ],
            "generated_at": timestamp,
            "filename": filename
        }
        
        # Save to file
        filepath = self.content_dir / filename
        with open(filepath, 'w') as f:
            json.dump(flashcards_data, f, indent=2)
        
        print(f"[Local LiveKit] Flashcards saved to: {filepath}")
        return flashcards_data
    
    async def generate_quiz(self, topic: str) -> Dict[str, Any]:
        """Generate an interactive quiz"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"quiz_{topic.replace(' ', '_')}_{timestamp}.json"
        
        quiz_data = {
            "type": "quiz",
            "topic": topic,
            "title": f"Knowledge Quiz: {topic.title()}",
            "description": f"Test your knowledge of {topic} with this interactive quiz",
            "questions": [
                {
                    "question": f"What is the main concept of {topic}?",
                    "options": [
                        f"A fundamental principle of {topic}",
                        f"An advanced technique in {topic}",
                        f"A historical aspect of {topic}",
                        f"A practical application of {topic}"
                    ],
                    "correct_answer": 0,
                    "explanation": f"This question tests your understanding of the core concept of {topic}."
                },
                {
                    "question": f"Which of the following best describes {topic}?",
                    "options": [
                        f"A simple concept",
                        f"A complex system",
                        f"A practical tool",
                        f"An abstract theory"
                    ],
                    "correct_answer": 2,
                    "explanation": f"This question evaluates your comprehension of {topic}'s practical nature."
                }
            ],
            "generated_at": timestamp,
            "filename": filename
        }
        
        # Save to file
        filepath = self.content_dir / filename
        with open(filepath, 'w') as f:
            json.dump(quiz_data, f, indent=2)
        
        print(f"[Local LiveKit] Quiz saved to: {filepath}")
        return quiz_data
    
    async def generate_mindmap(self, topic: str) -> Dict[str, Any]:
        """Generate a mind map"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"mindmap_{topic.replace(' ', '_')}_{timestamp}.json"
        
        mindmap_data = {
            "type": "mindmap",
            "topic": topic,
            "title": f"Mind Map: {topic.title()}",
            "description": f"A comprehensive mind map exploring {topic} and related concepts",
            "nodes": [
                {
                    "id": "main",
                    "text": topic,
                    "type": "central",
                    "position": {"x": 0, "y": 0}
                },
                {
                    "id": "sub1",
                    "text": f"Concept 1: {topic} basics",
                    "type": "subtopic",
                    "position": {"x": -200, "y": -100},
                    "parent": "main"
                },
                {
                    "id": "sub2",
                    "text": f"Concept 2: {topic} applications",
                    "type": "subtopic",
                    "position": {"x": 200, "y": -100},
                    "parent": "main"
                },
                {
                    "id": "sub3",
                    "text": f"Concept 3: {topic} examples",
                    "type": "subtopic",
                    "position": {"x": 0, "y": 100},
                    "parent": "main"
                }
            ],
            "connections": [
                {"from": "main", "to": "sub1"},
                {"from": "main", "to": "sub2"},
                {"from": "main", "to": "sub3"}
            ],
            "generated_at": timestamp,
            "filename": filename
        }
        
        # Save to file
        filepath = self.content_dir / filename
        with open(filepath, 'w') as f:
            json.dump(mindmap_data, f, indent=2)
        
        print(f"[Local LiveKit] Mind map saved to: {filepath}")
        return mindmap_data
    
    def generate_voice_response_for_visual(self, command: VisualCommand, visual_content: Dict[str, Any]) -> str:
        """Generate a voice response when visual content is created"""
        if command.command_type == 'diagram':
            return f"I've created a visual diagram for {command.topic}. This should help you better understand the concepts and relationships. The diagram shows the key elements and how they connect to each other."
        elif command.command_type == 'flashcard':
            return f"I've generated study flashcards for {command.topic}. These cards will help you practice active recall and test your knowledge. You can use them for spaced repetition learning."
        elif command.command_type == 'quiz':
            return f"I've created a quiz to test your knowledge of {command.topic}. This will help you identify areas where you might need more practice and reinforce what you've learned."
        elif command.command_type == 'mindmap':
            return f"I've generated a mind map for {command.topic}. This visual representation shows the main concept and how different ideas connect to it, which is great for understanding relationships and organizing information."
        else:
            return f"I've created some visual content for {command.topic}. This should help enhance your learning experience."
    
    def get_session_time_remaining(self) -> int:
        """Get the remaining time in the session"""
        if not self.session_start_time:
            return self.session_duration
        
        elapsed = (datetime.now() - self.session_start_time).total_seconds()
        remaining = self.session_duration - elapsed
        return max(0, int(remaining))
    
    def should_wind_down(self) -> bool:
        """Check if the session should start winding down"""
        remaining = self.get_session_time_remaining()
        return remaining <= 120  # 2 minutes remaining
    
    def should_request_reteaching(self) -> bool:
        """Check if the session should request reteaching"""
        remaining = self.get_session_time_remaining()
        return remaining <= 60  # 1 minute remaining
    
    def is_session_complete(self) -> bool:
        """Check if the session is complete"""
        return self.get_session_time_remaining() <= 0
    
    async def process_message(self, message: str) -> str:
        """Process a message and generate a response"""
        # Add message to history
        self.messages.append({
            "timestamp": datetime.now().isoformat(),
            "user_message": message,
            "type": "user"
        })
        
        # Check for visual commands
        visual_command = self.detect_visual_command(message)
        
        if visual_command:
            # Generate visual content
            visual_content = await self.generate_visual_content(visual_command)
            self.visual_content_generated.append(visual_content)
            
            # Generate voice response
            response = self.generate_voice_response_for_visual(visual_command, visual_content)
            
            # Add response to history
            self.messages.append({
                "timestamp": datetime.now().isoformat(),
                "agent_response": response,
                "visual_content": visual_content,
                "type": "agent"
            })
            
            return response
        
        # Check for special commands
        if message.lower() in ['help', '?']:
            response = """I'm Clara, your AI study assistant! Here are some things I can help you with:

📚 Study Help: Ask me questions about any subject
🎯 Visual Learning: Use commands like:
   - "create diagram [topic]" - Generate visual diagrams
   - "make flashcards [topic]" - Create study cards
   - "show quiz [topic]" - Test your knowledge
   - "create mindmap [topic]" - Visualize concepts

⏰ Session Info: I'll let you know when our session is winding down
🔄 Active Learning: I'll ask questions to test your understanding

What would you like to study today?"""
        
        elif message.lower() in ['bye', 'exit', 'quit', 'end']:
            response = "Thank you for studying with me today! I hope our session was helpful. Remember to review the visual content I generated for you. Good luck with your studies!"
            self.session_complete = True
        
        elif message.lower() in ['time', 'session']:
            remaining = self.get_session_time_remaining()
            minutes = remaining // 60
            seconds = remaining % 60
            response = f"We have {minutes} minutes and {seconds} seconds remaining in our study session."
            
            if self.should_wind_down():
                response += " We're winding down soon, so let me know if you have any final questions!"
        
        else:
            # Generate a general response based on the message
            response = f"That's a great question about {message}! Let me help you understand this better. "
            
            if "math" in message.lower() or "calculate" in message.lower():
                response += "For mathematical concepts, it's helpful to break them down into smaller steps and practice with examples. Would you like me to create a diagram or flashcards to help visualize this?"
            elif "science" in message.lower() or "experiment" in message.lower():
                response += "Science is all about observation and experimentation. Understanding the underlying principles helps explain why things work the way they do. Should I create a mind map to show the relationships between concepts?"
            elif "history" in message.lower() or "timeline" in message.lower():
                response += "History helps us understand how events connect and influence each other over time. Creating a timeline or diagram can make these connections clearer. Would that be helpful?"
            else:
                response += "The key to learning is understanding the fundamental concepts and then building on them. Would you like me to create some visual aids to help reinforce what we're discussing?"
        
        # Add response to history
        self.messages.append({
            "timestamp": datetime.now().isoformat(),
            "agent_response": response,
            "type": "agent"
        })
        
        return response
    
    def start_session(self):
        """Start a new study session"""
        self.session_start_time = datetime.now()
        self.session_complete = False
        self.winding_down = False
        self.messages = []
        self.visual_content_generated = []
        
        print(f"[Local LiveKit] Study session started for user: {self.user_id}")
        print(f"[Local LiveKit] Session duration: {self.session_duration // 60} minutes")
    
    def save_session(self):
        """Save the session data to a file"""
        if not self.session_start_time:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"session_{timestamp}.json"
        
        session_data = {
            "user_id": self.user_id,
            "session_start": self.session_start_time.isoformat(),
            "session_end": datetime.now().isoformat(),
            "duration_minutes": (datetime.now() - self.session_start_time).total_seconds() / 60,
            "messages": self.messages,
            "visual_content_generated": self.visual_content_generated,
            "session_complete": self.session_complete
        }
        
        filepath = self.content_dir / filename
        with open(filepath, 'w') as f:
            json.dump(session_data, f, indent=2)
        
        print(f"[Local LiveKit] Session saved to: {filepath}")

async def local_livekit_entrypoint(room_name: str, user_id: str):
    """Local LiveKit agent entrypoint simulation"""
    print(f"[Local LiveKit] Starting agent for room: {room_name}")
    
    # Create mock LiveKit context
    ctx = MockLiveKitContext(room_name, user_id)
    
    try:
        print(f"[Local LiveKit] Connecting to room: {ctx.room.name}")
        
        # Connect to the room
        await ctx.connect()
        print(f"[Local LiveKit] Connected successfully")
        
        # Wait for room to be ready
        print(f"[Local LiveKit] Waiting for room to be ready...")
        await asyncio.sleep(1)
        
        print(f"[Local LiveKit] Starting Clara AI agent for user: {user_id}")
        
        # Initialize the Clara AI agent
        agent = LocalClaraAssistant(user_id=user_id)
        
        # Start session timer
        agent.start_session()
        
        print(f"[Local LiveKit] Creating agent session...")
        
        # Create mock agent session
        session = MockAgentSession(agent, ctx.room)
        
        print(f"[Local LiveKit] Starting session with room: {ctx.room.name}")
        
        await session.start(
            room=ctx.room,
            agent=agent,
            room_input_options=None
        )
        
        print(f"[Local LiveKit] Session started successfully, sending initial greeting...")
        
        # Send initial greeting
        greeting = await session.generate_reply(
            "Greet the user as Clara and offer your assistance with their studies. Mention that you can help with homework, explain concepts, and generate visual content like diagrams, flashcards, and quizzes."
        )
        
        print(f"[Local LiveKit] Initial greeting: {greeting}")
        print("[Local LiveKit] Clara AI agent session started successfully")
        
        # Keep the session alive and monitor for completion
        session_active = True
        heartbeat_count = 0
        
        while session_active and not agent.session_complete:
            try:
                heartbeat_count += 1
                remaining = agent.get_session_time_remaining()
                minutes = remaining // 60
                seconds = remaining % 60
                
                print(f"[Local LiveKit] Heartbeat {heartbeat_count} - Time remaining: {minutes}:{seconds:02d}")
                
                # Check if session should wind down
                if agent.should_wind_down() and not agent.winding_down:
                    print("[Local LiveKit] Session winding down...")
                    agent.winding_down = True
                    await session.generate_reply("We're wrapping up our study session soon. Do you have any final questions or would you like me to create one more visual aid?")
                
                # Check if session is complete
                if agent.is_session_complete():
                    print("[Local LiveKit] Session complete, ending session")
                    session_active = False
                    break
                
                # Wait before next heartbeat
                await asyncio.sleep(10)
                
            except Exception as e:
                print(f"[Local LiveKit] Error in session loop: {e}")
                session_active = False
        
        # Save session data
        agent.save_session()
        
        print("[Local LiveKit] Session ended successfully")
        
    except Exception as e:
        print(f"[Local LiveKit] Error in local_livekit_entrypoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

async def main():
    """Main function to run the local LiveKit agent"""
    print("=" * 60)
    print("           Clara AI Local LiveKit Agent")
    print("=" * 60)
    print()
    print("This script simulates the LiveKit agent locally.")
    print("It provides the same functionality as the Modal deployment.")
    print()
    
    # Generate room name and user ID
    timestamp = int(time.time())
    room_name = f"clara-study-{timestamp}"
    user_id = f"local-user-{timestamp}"
    
    print(f"Room Name: {room_name}")
    print(f"User ID: {user_id}")
    print()
    
    try:
        # Run the local LiveKit entrypoint
        await local_livekit_entrypoint(room_name, user_id)
        
        print()
        print("=" * 60)
        print("Session completed successfully!")
        print("Check the 'generated_content/' directory for saved content.")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n[Local LiveKit] Session interrupted by user")
    except Exception as e:
        print(f"\n[Local LiveKit] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main()) 