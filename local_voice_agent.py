#!/usr/bin/env python3
"""
Local Voice Agent Script for Clara AI

This script provides a local implementation of the Clara voice agent
that can run independently without the web application.

Usage:
    python local_voice_agent.py

Features:
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

# Mock imports for local development
class MockAgent:
    """Mock agent class for local development"""
    def __init__(self, instructions: str):
        self.instructions = instructions
        self.session_start_time = None
        self.session_duration = 600  # 10 minutes
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

class VisualCommand:
    """Represents a visual generation command"""
    def __init__(self, command_type: str, topic: str, context: str = ""):
        self.command_type = command_type
        self.topic = topic
        self.context = context

class LocalClaraAssistant(MockAgent):
    """Local implementation of Clara Assistant"""
    
    def __init__(self):
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
        
        # Create output directory for generated content
        self.output_dir = Path("generated_content")
        self.output_dir.mkdir(exist_ok=True)
        
        # Session tracking
        self.session_start_time = None
        self.conversation_history = []
        
    def detect_visual_command(self, message: str) -> Optional[VisualCommand]:
        """Detect if message contains a visual generation command"""
        message_lower = message.lower()
        
        for command_type, patterns in self.visual_commands.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    topic = self.extract_topic_from_message(message, pattern)
                    return VisualCommand(command_type, topic, message)
        
        return None
    
    def extract_topic_from_message(self, message: str, command_pattern: str) -> str:
        """Extract the topic from a message containing a visual command"""
        # Remove the command pattern from the message
        topic = re.sub(command_pattern, '', message.lower()).strip()
        
        # Clean up the topic
        topic = re.sub(r'^(about|for|on|regarding)\s+', '', topic)
        topic = topic.strip()
        
        # If no topic found, use a default
        if not topic:
            topic = "current topic"
        
        return topic
    
    async def generate_visual_content(self, command: VisualCommand) -> Dict[str, Any]:
        """Generate visual content based on command type"""
        if command.command_type == 'diagram':
            return await self.generate_diagram(command.topic)
        elif command.command_type == 'flashcard':
            return await self.generate_flashcards(command.topic)
        elif command.command_type == 'quiz':
            return await self.generate_quiz(command.topic)
        elif command.command_type == 'mindmap':
            return await self.generate_mindmap(command.topic)
        else:
            return {"type": "unknown", "message": "Unknown command type"}
    
    async def generate_diagram(self, topic: str) -> Dict[str, Any]:
        """Generate a diagram for the given topic"""
        diagram = {
            "type": "diagram",
            "title": f"{topic.title()} Process",
            "elements": ["Start", "Research", "Analyze", "Implement", "Review", "Complete"],
            "connections": [
                {"from": "Start", "to": "Research"},
                {"from": "Research", "to": "Analyze"},
                {"from": "Analyze", "to": "Implement"},
                {"from": "Implement", "to": "Review"},
                {"from": "Review", "to": "Complete"}
            ],
            "description": f"A process diagram showing the steps for {topic}"
        }
        
        # Save to file
        filename = f"diagram_{topic.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(diagram, f, indent=2)
        
        return diagram
    
    async def generate_flashcards(self, topic: str) -> Dict[str, Any]:
        """Generate flashcards for the given topic"""
        flashcards = {
            "type": "flashcard",
            "topic": topic,
            "cards": [
                {
                    "front": f"What is {topic}?",
                    "back": f"{topic} is a concept that helps us understand and organize information related to this subject."
                },
                {
                    "front": f"How does {topic} work?",
                    "back": f"The process involves understanding the fundamentals, applying principles, and practicing regularly."
                },
                {
                    "front": f"Why is {topic} important?",
                    "back": f"Understanding {topic} is crucial because it provides a foundation for more advanced concepts and real-world applications."
                },
                {
                    "front": f"What are the key components of {topic}?",
                    "back": f"The main components include basic principles, practical applications, and evaluation methods."
                },
                {
                    "front": f"How can I improve my understanding of {topic}?",
                    "back": f"Practice regularly, ask questions, seek examples, and apply the concepts to real situations."
                }
            ]
        }
        
        # Save to file
        filename = f"flashcards_{topic.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(flashcards, f, indent=2)
        
        return flashcards
    
    async def generate_quiz(self, topic: str) -> Dict[str, Any]:
        """Generate a quiz for the given topic"""
        quiz = {
            "type": "quiz",
            "topic": topic,
            "questions": [
                {
                    "question": f"What is the primary purpose of {topic}?",
                    "options": [
                        f"To understand {topic} concepts",
                        f"To memorize {topic} facts",
                        f"To apply {topic} in practice",
                        f"To research {topic} history"
                    ],
                    "correct_answer": f"To understand {topic} concepts",
                    "explanation": f"The primary purpose is to develop a deep understanding of {topic} concepts."
                },
                {
                    "question": f"Which of the following best describes {topic}?",
                    "options": [
                        f"A simple memorization technique",
                        f"A complex theoretical framework",
                        f"A practical learning approach",
                        f"An outdated methodology"
                    ],
                    "correct_answer": f"A practical learning approach",
                    "explanation": f"{topic} is designed to be practical and applicable to real-world situations."
                },
                {
                    "question": f"How should you approach learning {topic}?",
                    "options": [
                        f"Memorize everything",
                        f"Understand the concepts",
                        f"Skip the basics",
                        f"Focus only on examples"
                    ],
                    "correct_answer": f"Understand the concepts",
                    "explanation": f"Focus on understanding the underlying concepts rather than just memorizing facts."
                }
            ]
        }
        
        # Save to file
        filename = f"quiz_{topic.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(quiz, f, indent=2)
        
        return quiz
    
    async def generate_mindmap(self, topic: str) -> Dict[str, Any]:
        """Generate a mindmap for the given topic"""
        mindmap = {
            "type": "mindmap",
            "topic": topic,
            "central_idea": topic,
            "branches": [
                {
                    "main": "Definition",
                    "subtopics": ["What it is", "Key characteristics", "Core principles"]
                },
                {
                    "main": "Applications",
                    "subtopics": ["Real-world uses", "Practical examples", "Case studies"]
                },
                {
                    "main": "Learning Methods",
                    "subtopics": ["Study techniques", "Practice exercises", "Assessment methods"]
                },
                {
                    "main": "Related Concepts",
                    "subtopics": ["Prerequisites", "Advanced topics", "Connections"]
                }
            ]
        }
        
        # Save to file
        filename = f"mindmap_{topic.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        with open(filepath, 'w') as f:
            json.dump(mindmap, f, indent=2)
        
        return mindmap
    
    def generate_voice_response_for_visual(self, command: VisualCommand, visual_content: Dict[str, Any]) -> str:
        """Generate a voice response for visual content generation"""
        command_type = command.command_type
        topic = command.topic
        
        responses = {
            'diagram': f"I've created a process diagram for {topic}! This shows the key steps and flow. You can find the detailed diagram in your generated content folder.",
            'flashcard': f"I've generated study flashcards for {topic}! These cards will help you review and test your knowledge. Check the generated content folder for the complete set.",
            'quiz': f"I've created a quiz about {topic}! This will help you test your understanding and identify areas for improvement. The quiz is saved in your generated content folder.",
            'mindmap': f"I've created a mindmap for {topic}! This visual representation shows the main concepts and their relationships. You can find the detailed mindmap in your generated content folder."
        }
        
        return responses.get(command_type, f"I've generated some visual content for {topic}!")
    
    def get_session_time_remaining(self) -> int:
        """Get remaining session time in seconds"""
        if not self.session_start_time:
            return self.session_duration
        
        elapsed = (datetime.now() - self.session_start_time).total_seconds()
        remaining = self.session_duration - elapsed
        return max(0, int(remaining))
    
    def should_wind_down(self) -> bool:
        """Check if session should start winding down"""
        remaining = self.get_session_time_remaining()
        return remaining <= 120  # 2 minutes remaining
    
    def should_request_reteaching(self) -> bool:
        """Check if should request reteaching"""
        remaining = self.get_session_time_remaining()
        return remaining <= 60  # 1 minute remaining
    
    def is_session_complete(self) -> bool:
        """Check if session is complete"""
        return self.get_session_time_remaining() <= 0
    
    async def process_message(self, message: str) -> str:
        """Process a user message and generate a response"""
        # Add to conversation history
        self.conversation_history.append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Check for visual commands first
        visual_command = self.detect_visual_command(message)
        if visual_command:
            # Generate visual content
            visual_content = await self.generate_visual_content(visual_command)
            response = self.generate_voice_response_for_visual(visual_command, visual_content)
            
            # Add response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": response,
                "visual_content": visual_content,
                "timestamp": datetime.now().isoformat()
            })
            
            return response
        
        # Regular conversation response
        if "hello" in message.lower() or "hi" in message.lower():
            response = "Hello! I'm Clara, your study assistant. How can I help you with your studies today?"
        elif "help" in message.lower():
            response = "I can help you with:\n- Explaining concepts\n- Creating diagrams\n- Making flashcards\n- Generating quizzes\n- Study tips and strategies\n\nJust ask me anything or say 'create diagram', 'make flashcards', or 'show quiz' followed by a topic!"
        elif "bye" in message.lower() or "goodbye" in message.lower():
            response = "Goodbye! Keep up the great work with your studies. Remember to review what we covered today!"
        elif "?" in message:
            response = f"That's a great question about '{message}'. Let me help you understand this concept better. What specific aspect would you like to focus on?"
        else:
            response = f"I understand you're asking about '{message}'. This is an interesting topic! Let me help you explore this further. What would you like to know specifically?"
        
        # Add response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def start_session(self):
        """Start a new session"""
        self.session_start_time = datetime.now()
        print("🎓 Clara AI Study Assistant - Session Started!")
        print("=" * 50)
        print("I'm here to help with your studies!")
        print("Commands you can try:")
        print("- 'create diagram [topic]' - Generate a process diagram")
        print("- 'make flashcards [topic]' - Create study flashcards")
        print("- 'show quiz [topic]' - Generate a quiz")
        print("- 'create mindmap [topic]' - Make a mindmap")
        print("- 'help' - Show available commands")
        print("- 'bye' - End session")
        print("=" * 50)
    
    def save_session(self):
        """Save the current session to a file"""
        if not self.conversation_history:
            return
        
        filename = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.output_dir / filename
        
        session_data = {
            "session_start": self.session_start_time.isoformat() if self.session_start_time else None,
            "session_duration": self.session_duration,
            "conversation_history": self.conversation_history
        }
        
        with open(filepath, 'w') as f:
            json.dump(session_data, f, indent=2)
        
        print(f"\n📁 Session saved to: {filepath}")

async def main():
    """Main function to run the local voice agent"""
    assistant = LocalClaraAssistant()
    assistant.start_session()
    
    try:
        while True:
            # Check session time
            if assistant.is_session_complete():
                print("\n⏰ Session time is up! Great work today!")
                break
            
            if assistant.should_wind_down():
                print("\n⚠️  Session ending soon. Let's wrap up!")
            
            # Get user input
            try:
                user_input = input("\n💬 You: ").strip()
            except KeyboardInterrupt:
                print("\n\n👋 Session interrupted. Goodbye!")
                break
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'bye', 'goodbye']:
                print("\n👋 Goodbye! Keep up the great work with your studies!")
                break
            
            # Process the message
            print("🤖 Clara: ", end="", flush=True)
            response = await assistant.process_message(user_input)
            print(response)
            
            # Show session time remaining
            remaining = assistant.get_session_time_remaining()
            if remaining > 0:
                minutes = remaining // 60
                seconds = remaining % 60
                print(f"⏱️  Session time remaining: {minutes}m {seconds}s")
    
    finally:
        # Save session
        assistant.save_session()
        print("\n📊 Session summary:")
        print(f"- Total messages: {len(assistant.conversation_history)}")
        print(f"- Session duration: {assistant.session_duration} seconds")
        print(f"- Generated content saved in: {assistant.output_dir}")

if __name__ == "__main__":
    print("🎓 Starting Clara AI Local Voice Agent...")
    print("This is a text-based interface for the Clara voice agent.")
    print("You can interact with me just like you would with voice commands!")
    print()
    
    # Run the main function
    asyncio.run(main()) 