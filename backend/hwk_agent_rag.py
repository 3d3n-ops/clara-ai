import os
import json
import uuid
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass
from openai import OpenAI
from dotenv import load_dotenv
from rag_engine import rag_engine

load_dotenv()

@dataclass
class FileContext:
    id: str
    filename: str
    content: str
    upload_time: datetime
    file_type: str

@dataclass
class ToolCall:
    type: str
    data: Dict[str, Any]
    id: str

class HomeworkAgentRAG:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.conversation_history: List[Dict[str, Any]] = []
        
        # In-memory storage for conversations (simplified)
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        
        # System prompt for the homework reasoning agent with RAG
        self.system_prompt = """You are Clara, an advanced AI homework assistant with strong reasoning capabilities and access to the student's uploaded learning materials. You help students understand their coursework by:

1. **Analyzing uploaded files** (PDFs, documents, images) to understand the context of their homework
2. **Providing detailed explanations** with step-by-step reasoning
3. **Using relevant context** from the student's uploaded materials to provide personalized help
4. **Creating helpful tools** when needed:
   - Mermaid diagrams for visualizing concepts, processes, or relationships
   - Flashcards for memorization and review
   - Quizzes to test understanding

**Your capabilities:**
- Deep reasoning about complex academic problems
- Multi-step problem solving with clear explanations
- Visual learning through diagrams
- Active learning through flashcards and quizzes
- Contextual help based on uploaded materials
- Semantic search through student's documents

**When using uploaded materials:**
- Reference specific parts of uploaded documents when relevant
- Cite the source document when providing information
- Use the context to provide more accurate and personalized responses
- If the uploaded materials don't contain relevant information, acknowledge this and provide general help

**IMPORTANT: Response Format**
- Provide clear, helpful explanations in your chat responses
- When creating components (diagrams, flashcards, quizzes), include the JSON code blocks for the components
- The component code will be automatically extracted and rendered as interactive components
- Your chat response should focus on explaining concepts and providing guidance, not showing the raw component code
- Always provide context and explanations alongside any components you create

**CRITICAL MERMAID DIAGRAM RULES:**
When creating Mermaid diagrams, you MUST follow these exact syntax rules:
- Use `graph TD` for top-down flowcharts
- Use `graph LR` for left-right flowcharts  
- Use `flowchart TD` for modern flowcharts
- ALWAYS put node labels in quotes: `A["Start"]` NOT `A[Start]`
- Use proper arrows: `-->` for directed, `---` for undirected
- Ensure all nodes are properly connected
- Test your syntax mentally before generating
- Use descriptive, clear node labels
- Keep diagrams focused and readable

**EXAMPLE FOR DERIVATIVES:**
For mathematical concepts like derivatives, use this format:
```json
{
  "type": "mermaid_diagram",
  "title": "Understanding Derivatives",
  "content": "graph TD\n    A[\"Function f(x)\"] --> B[\"Point x = a\"]\n    B --> C[\"Tangent Line\"]\n    C --> D[\"Slope = f'(a)\"]\n    D --> E[\"Derivative f'(x)\"]\n    E --> F[\"Rate of Change\"]",
  "description": "Visual representation of how derivatives work"
}
```

**Tool calling format:**
When you need to create educational tools, use these formats:

For **mermaid diagrams**:
```json
{
  "type": "mermaid_diagram",
  "title": "Diagram Title",
  "content": "graph TD\n    A[\"Start\"] --> B[\"Process\"]\n    B --> C[\"End\"]",
  "description": "Brief description of what the diagram shows"
}
```

For **flashcards**:
```json
{
  "type": "flashcards",
  "title": "Flashcard Set Title",
  "cards": [
    {
      "front": "Question or concept",
      "back": "Answer or explanation"
    }
  ],
  "description": "Brief description of the flashcard set"
}
```

For **quizzes**:
```json
{
  "type": "quiz",
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why this answer is correct"
    }
  ],
  "description": "Brief description of the quiz"
}
```

Always respond with helpful, educational content and use the student's uploaded materials when relevant to provide personalized assistance."""

    def filter_response_content(self, response_content: str) -> str:
        """Remove component code blocks from the response text"""
        # Remove JSON code blocks that contain component definitions
        json_pattern = r'```json\s*(\{.*?\})\s*```'
        filtered_content = re.sub(json_pattern, '', response_content, flags=re.DOTALL)
        
        # Remove any remaining code blocks that might contain component code
        code_pattern = r'```.*?```'
        filtered_content = re.sub(code_pattern, '', filtered_content, flags=re.DOTALL)
        
        # Clean up extra whitespace and newlines
        filtered_content = re.sub(r'\n\s*\n\s*\n', '\n\n', filtered_content)
        filtered_content = filtered_content.strip()
        
        return filtered_content

    def validate_component(self, component_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fix component data"""
        component_type = component_data.get('type')
        
        if component_type == 'mermaid_diagram':
            return self._validate_mermaid_diagram(component_data)
        elif component_type == 'flashcards':
            return self._validate_flashcards(component_data)
        elif component_type == 'quiz':
            return self._validate_quiz(component_data)
        else:
            return component_data

    def _validate_mermaid_diagram(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate mermaid diagram data"""
        required_fields = ['title', 'content', 'description']
        for field in required_fields:
            if field not in data or not data[field]:
                data[field] = f"Default {field}" if field != 'content' else "graph TD\n    A[\"Start\"] --> B[\"End\"]"
        
        # Validate mermaid syntax
        content = data['content']
        if not content.startswith(('graph TD', 'graph LR', 'flowchart TD')):
            data['content'] = f"graph TD\n    A[\"Start\"] --> B[\"End\"]"
        
        return data

    def _validate_flashcards(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate flashcards data"""
        if 'title' not in data or not data['title']:
            data['title'] = "Flashcard Set"
        
        if 'cards' not in data or not isinstance(data['cards'], list) or len(data['cards']) == 0:
            data['cards'] = [
                {
                    "front": "Sample Question",
                    "back": "Sample Answer"
                }
            ]
        
        # Validate each card
        for card in data['cards']:
            if 'front' not in card or not card['front']:
                card['front'] = "Question"
            if 'back' not in card or not card['back']:
                card['back'] = "Answer"
        
        return data

    def _validate_quiz(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate quiz data"""
        if 'title' not in data or not data['title']:
            data['title'] = "Quiz"
        
        if 'questions' not in data or not isinstance(data['questions'], list) or len(data['questions']) == 0:
            data['questions'] = [
                {
                    "question": "Sample Question",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "A",
                    "explanation": "Sample explanation"
                }
            ]
        
        # Validate each question
        for question in data['questions']:
            if 'question' not in question or not question['question']:
                question['question'] = "Question"
            if 'options' not in question or not isinstance(question['options'], list) or len(question['options']) == 0:
                question['options'] = ["A", "B", "C", "D"]
            if 'correct_answer' not in question or question['correct_answer'] not in question['options']:
                question['correct_answer'] = question['options'][0] if question['options'] else "A"
            if 'explanation' not in question or not question['explanation']:
                question['explanation'] = "Explanation"
        
        return data

    async def get_user_context(self, user_id: str, folder_id: Optional[str] = None) -> str:
        """Get context summary for a user"""
        try:
            files = await rag_engine.get_user_files(user_id, folder_id)
            if not files:
                return "No files uploaded yet."
            
            context_parts = []
            for file in files:
                context_parts.append(f"- {file['original_filename']} ({file['file_type']})")
            
            return f"Uploaded files:\n" + "\n".join(context_parts)
        except Exception as e:
            print(f"Error getting user context: {e}")
            return "Error retrieving file context."

    async def get_relevant_context(self, query: str, user_id: str, folder_id: Optional[str] = None) -> str:
        """Get relevant context for a specific query"""
        try:
            return await rag_engine.get_context_for_query(query, user_id, folder_id)
        except Exception as e:
            print(f"Error getting relevant context: {e}")
            return ""

    def parse_tool_calls(self, response_content: str) -> List[ToolCall]:
        """Parse tool calls from the assistant's response"""
        tool_calls = []
        
        # Look for JSON blocks in the response
        json_pattern = r'```json\s*(\{.*?\})\s*```'
        matches = re.findall(json_pattern, response_content, re.DOTALL)
        
        for match in matches:
            try:
                data = json.loads(match)
                if 'type' in data and data['type'] in ['mermaid_diagram', 'flashcards', 'quiz']:
                    # Validate the component data
                    validated_data = self.validate_component(data)
                    
                    tool_call = ToolCall(
                        type=validated_data['type'],
                        data=validated_data,
                        id=str(uuid.uuid4())
                    )
                    tool_calls.append(tool_call)
            except json.JSONDecodeError:
                continue
                
        return tool_calls

    async def process_message(self, user_message: str, user_id: str, 
                           conversation_id: Optional[str] = None,
                           folder_id: Optional[str] = None,
                           conversation_history: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Process a user message and generate a response"""
        try:
            # Get user context
            user_context = await self.get_user_context(user_id, folder_id)
            
            # Get relevant context for the query
            relevant_context = await self.get_relevant_context(user_message, user_id, folder_id)
            
            # Build the full context
            full_context = f"{user_context}\n\n"
            if relevant_context:
                full_context += f"**Relevant Information from Your Materials:**\n{relevant_context}\n\n"
            
            # Prepare conversation history
            messages = [
                {"role": "system", "content": self.system_prompt + "\n\n" + full_context}
            ]
            
            if conversation_history:
                messages.extend(conversation_history)
            
            messages.append({"role": "user", "content": user_message})
            
            # Generate response with retry mechanism for component generation
            max_retries = 2
            for attempt in range(max_retries):
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=2000
                )
                
                assistant_response = response.choices[0].message.content
                
                # Parse tool calls
                tool_calls = self.parse_tool_calls(assistant_response)
                
                # If we have tool calls and this is not the last attempt, validate them
                if tool_calls and attempt < max_retries - 1:
                    # Check if any components need validation fixes
                    needs_retry = False
                    for tool_call in tool_calls:
                        if tool_call.type == 'mermaid_diagram':
                            content = tool_call.data.get('content', '')
                            if not content.startswith(('graph TD', 'graph LR', 'flowchart TD')):
                                needs_retry = True
                                break
                        elif tool_call.type in ['flashcards', 'quiz']:
                            if not tool_call.data.get('title') or not tool_call.data.get('description'):
                                needs_retry = True
                                break
                    
                    if needs_retry:
                        # Add a correction message for the next attempt
                        correction_message = "Please ensure all components are properly formatted with complete information. For diagrams, use proper Mermaid syntax. For flashcards and quizzes, include titles and descriptions."
                        messages.append({"role": "assistant", "content": assistant_response})
                        messages.append({"role": "user", "content": correction_message})
                        continue
                
                # Filter out component code from the response text
                filtered_response = self.filter_response_content(assistant_response)
                
                # Store conversation
                if conversation_id:
                    await self._store_conversation(conversation_id, user_message, filtered_response, tool_calls)
                
                return {
                    "success": True,
                    "response": filtered_response,
                    "tool_calls": [{"type": tc.type, "data": tc.data, "id": tc.id} for tc in tool_calls],
                    "context_used": bool(relevant_context),
                    "timestamp": datetime.now().isoformat()
                }
            
            # If we get here, return the last attempt even if not perfect
            filtered_response = self.filter_response_content(assistant_response)
            
            if conversation_id:
                await self._store_conversation(conversation_id, user_message, filtered_response, tool_calls)
            
            return {
                "success": True,
                "response": filtered_response,
                "tool_calls": [{"type": tc.type, "data": tc.data, "id": tc.id} for tc in tool_calls],
                "context_used": bool(relevant_context),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error processing message: {e}")
            return {
                "success": False,
                "response": "I'm sorry, I encountered an error processing your message. Please try again.",
                "tool_calls": [],
                "context_used": False,
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }

    async def _store_conversation(self, conversation_id: str, user_message: str, 
                                 assistant_response: str, tool_calls: List[ToolCall]):
        """Store conversation in memory"""
        try:
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = []
            
            # Store user message
            self.conversations[conversation_id].append({
                "role": "user",
                "content": user_message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Store assistant response
            self.conversations[conversation_id].append({
                "role": "assistant",
                "content": assistant_response,
                "tool_calls": [{"type": tc.type, "data": tc.data, "id": tc.id} for tc in tool_calls],
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            print(f"Error storing conversation: {e}")

    async def create_conversation(self, user_id: str, folder_id: Optional[str] = None, 
                                title: Optional[str] = None) -> str:
        """Create a new conversation"""
        try:
            conversation_id = str(uuid.uuid4())
            
            # Initialize conversation in memory
            self.conversations[conversation_id] = []
            
            return conversation_id
                
        except Exception as e:
            print(f"Error creating conversation: {e}")
            # Return a fallback conversation ID
            return str(uuid.uuid4())

    async def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history from memory"""
        try:
            return self.conversations.get(conversation_id, [])
        except Exception as e:
            print(f"Error getting conversation history: {e}")
            return []

# Global RAG-enabled homework agent instance
homework_agent_rag = HomeworkAgentRAG() 