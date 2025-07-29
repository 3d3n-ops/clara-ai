# Clara Homework Agent Setup Guide

A comprehensive AI homework assistant with reasoning capabilities, file context understanding, and interactive educational tools.

## ✨ Features

### 🎯 **Core Capabilities**
- **Advanced Reasoning**: Uses OpenAI's latest reasoning models for complex problem solving
- **File Context Understanding**: Upload and analyze PDFs, documents, and text files
- **Multi-step Problem Solving**: Breaks down complex homework problems step-by-step

### 🛠️ **Interactive Tools**
- **📊 Mermaid Diagrams**: Visual representations of concepts, processes, and relationships
- **🃏 Flashcards**: Interactive study cards with flip animations and study modes
- **📝 Quizzes**: Multiple choice quizzes with explanations and scoring

### 💡 **Smart Features**
- **Contextual Responses**: References uploaded files in explanations
- **Tool Auto-Generation**: Automatically creates appropriate educational tools
- **Export Capabilities**: Download flashcards, quiz results, and diagrams

## 🚀 Setup Instructions

### 1. Backend Dependencies

Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `openai` - For AI reasoning capabilities
- `fastapi` - API server framework
- `uvicorn` - ASGI server
- `python-multipart` - File upload support

### 2. Frontend Dependencies

Install Node.js dependencies:
```bash
npm install
# or
yarn install
```

New packages added:
- `mermaid` - For diagram rendering

### 3. Environment Configuration

Add to your `.env.local`:
```env
# OpenAI API (required for homework agent)
OPENAI_API_KEY=your_openai_api_key_here

# Python Backend URL (optional, defaults to localhost:8000)
PYTHON_BACKEND_URL=http://localhost:8000

# Existing environment variables...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
# ... other keys
```

## 🎮 Running the System

### 1. Start the Homework Agent Backend
```bash
cd backend
python homework_server.py
```

The FastAPI server will start on `http://localhost:8000`

### 2. Start the Frontend
```bash
npm run dev
```

The Next.js app will run on `http://localhost:3001` (or 3000)

### 3. Access the Homework Assistant
Navigate to: `http://localhost:3001/chat/homework`

## 📋 Usage Guide

### 📁 **Uploading Files**
1. Click the "Upload File" button in the sidebar
2. Select supported files: `.txt`, `.pdf`, `.doc`, `.docx`, `.md`
3. Clara will confirm the upload and gain context about your materials

### 💬 **Asking Questions**
- **General Help**: "Can you help me understand this concept?"
- **Request Tools**: "Create flashcards for this topic"
- **Visual Learning**: "Make a diagram showing this process"
- **Testing**: "Generate a quiz to test my understanding"

### 🎯 **Interactive Tools**

#### **Diagrams**
- **Features**: Mermaid.js powered visualizations
- **Actions**: Copy code, download SVG
- **Use Cases**: Process flows, concept maps, relationships

#### **Flashcards**
- **Features**: 3D flip animations, study mode, shuffle
- **Actions**: Navigate, track progress, export JSON
- **Study Mode**: Mark correct/incorrect, see final score

#### **Quizzes**
- **Features**: Multiple choice, instant feedback, explanations
- **Actions**: Progress tracking, review incorrect answers
- **Export**: Download results as JSON

## 🔧 API Endpoints

### Homework Chat
```
POST /api/homework/chat
Body: { message: string, conversation_history: array }
Response: { success: boolean, response: string, tool_calls: array }
```

### File Upload
```
POST /api/homework/upload
Body: FormData with file
Response: { success: boolean, file_id: string, filename: string }
```

### Context Management
```
GET /homework/context - Get uploaded files summary
DELETE /homework/context - Clear all context
DELETE /homework/context/{file_id} - Remove specific file
```

## 🎨 Tool Call Examples

### Mermaid Diagram
```json
{
  "type": "mermaid_diagram",
  "title": "Photosynthesis Process",
  "content": "graph TD\n    A[Sunlight] --> B[Chloroplasts]\n    C[CO2] --> B\n    D[Water] --> B\n    B --> E[Glucose]\n    B --> F[Oxygen]",
  "description": "Shows how plants convert sunlight into energy"
}
```

### Flashcards
```json
{
  "type": "flashcards",
  "title": "Chemistry Basics",
  "cards": [
    {"front": "What is an atom?", "back": "The smallest unit of matter"},
    {"front": "H2O represents?", "back": "Water molecule"}
  ]
}
```

### Quiz
```json
{
  "type": "quiz",
  "title": "Math Quiz",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "type": "multiple_choice",
      "options": ["A) 3", "B) 4", "C) 5", "D) 6"],
      "correct_answer": "B) 4",
      "explanation": "Basic addition: 2 + 2 equals 4"
    }
  ]
}
```

## 🔍 Troubleshooting

### Common Issues

1. **"Backend connection failed"**
   - Ensure homework server is running on port 8000
   - Check PYTHON_BACKEND_URL in .env.local

2. **"File upload failed"**
   - Verify file size and format
   - Check server logs for errors

3. **"Diagram not rendering"**
   - Mermaid syntax error - check diagram code
   - Browser compatibility - try refreshing

4. **"No AI responses"**
   - Verify OPENAI_API_KEY is set correctly
   - Check API quota and billing

### Debug Mode

Enable debug logging in the backend:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🎓 Educational Use Cases

### **For Students**
- **Homework Help**: Upload assignments and get step-by-step explanations
- **Study Sessions**: Generate flashcards and quizzes from notes
- **Visual Learning**: Create diagrams for complex concepts
- **Self-Assessment**: Test understanding with generated quizzes

### **For Teachers**
- **Material Creation**: Generate educational tools from curriculum
- **Assessment Tools**: Create quizzes and study materials
- **Visual Aids**: Generate diagrams for lesson plans

## 🔒 Security Notes

- File contents are processed but not permanently stored
- API keys should be kept secure and not committed to repositories
- File uploads are limited to supported text-based formats
- Context is cleared when the server restarts

## 🚀 Next Steps

1. **Test the Integration**: Try uploading a file and asking questions
2. **Experiment with Tools**: Request diagrams, flashcards, and quizzes
3. **Explore Context**: See how Clara references your uploaded materials
4. **Export Features**: Download created educational tools

The homework agent is now ready to provide intelligent, contextual assistance with your studies! 🎉 