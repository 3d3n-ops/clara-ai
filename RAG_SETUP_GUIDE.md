# RAG Implementation Setup Guide for Clara AI

This guide will help you implement the RAG (Retrieval-Augmented Generation) system using Pinecone and Supabase for better memory across both your voice agent and homework helper.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   RAG Engine    │    │   Vector DB     │
                       │   (Pinecone)    │    │   (Pinecone)    │
                       └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Pinecone Account**: Create an account at [pinecone.io](https://pinecone.io)
3. **OpenAI API Key**: Get from [platform.openai.com](https://platform.openai.com)
4. **Python 3.8+**: For backend processing
5. **Node.js 18+**: For frontend

## 🔧 Step-by-Step Setup

### 1. Environment Variables

Create a `.env` file in your project root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=clara-ai-embeddings

# Supabase Configuration


# Backend Configuration
PYTHON_BACKEND_URL=http://localhost:8000

# Clerk Configuration (for authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# LiveKit Configuration (for voice agent)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=your_livekit_url
```

### 2. Database Setup

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Run the database schema** (copy from `database_schema.sql`)

```sql
-- Copy and paste the entire content from database_schema.sql
-- This will create all necessary tables and indexes
```

### 3. Pinecone Setup

1. **Create a Pinecone index**:
   - Go to [pinecone.io](https://pinecone.io)
   - Create a new index with these settings:
     - Name: `clara-ai-embeddings`
     - Dimension: `1536` (for OpenAI text-embedding-3-small)
     - Metric: `cosine`
     - Cloud: `AWS`
     - Region: `us-east-1`

2. **Get your API key** from the Pinecone dashboard

### 4. Backend Setup

1. **Install Python dependencies**:

```bash
cd backend
pip install -r requirements.txt
```

2. **Install system dependencies for OCR** (optional, for image processing):

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

**Windows:**
- Download from [https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki)
- Add to PATH

3. **Start the backend server**:

```bash
cd backend
python homework_server_rag.py
```

### 5. Frontend Setup

1. **Install dependencies**:

```bash
npm install
# or
pnpm install
```

2. **Start the development server**:

```bash
npm run dev
# or
pnpm dev
```

## 🚀 Usage

### File Upload Process

1. **User uploads file** during onboarding or in homework chat
2. **File is processed** by the RAG engine:
   - Content is extracted (PDF, DOC, TXT, images with OCR)
   - Text is chunked into smaller pieces
   - Embeddings are generated using OpenAI
   - Chunks and embeddings are stored in Supabase and Pinecone

### Chat with Context

1. **User asks a question**
2. **RAG system searches** for relevant chunks in Pinecone
3. **Context is retrieved** and included in the prompt
4. **AI responds** with context-aware answers

### Voice Agent Integration

1. **Voice agent** receives user queries
2. **RAG context** is retrieved for the user
3. **Contextual responses** are generated
4. **Conversations are stored** in Supabase

## 📊 Key Features

### Multi-User Support
- Each user has their own namespace in Pinecone
- Row-level security in Supabase
- Isolated file storage and retrieval

### File Type Support
- **PDF**: Text extraction from all pages
- **DOC/DOCX**: Word document processing
- **TXT**: Plain text files
- **Images**: OCR for text extraction
- **Other**: Fallback to plain text

### Smart Chunking
- Overlapping chunks for better context
- Token-aware splitting
- Metadata preservation

### Semantic Search
- OpenAI embeddings for semantic similarity
- Cosine similarity in Pinecone
- Filtered by user and class

## 🔍 API Endpoints

### File Management
- `POST /homework/upload-rag` - Upload and process file
- `GET /homework/files/{user_id}` - Get user's files
- `DELETE /homework/files/{file_id}` - Delete file

### Chat
- `POST /homework/chat-rag` - Chat with RAG context
- `GET /homework/conversations/{user_id}` - Get conversations
- `GET /homework/conversations/{conversation_id}/messages` - Get messages

### Context
- `GET /homework/context/{user_id}` - Get user context

## 🧪 Testing

### Test File Upload
```bash
curl -X POST http://localhost:8000/homework/upload-rag \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.txt",
    "content": "This is a test document about machine learning.",
    "file_type": "text/plain",
    "user_id": "test-user-123",
    "class_id": "test-class-456"
  }'
```

### Test Chat
```bash
curl -X POST http://localhost:8000/homework/chat-rag \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "user_id": "test-user-123",
    "class_id": "test-class-456"
  }'
```

## 🔧 Troubleshooting

### Common Issues

1. **Pinecone Index Not Found**
   - Ensure index name matches in environment variables
   - Check Pinecone API key is correct

2. **Supabase Connection Issues**
   - Verify URL and API keys
   - Check Row Level Security policies

3. **OCR Not Working**
   - Install tesseract-ocr
   - Add to system PATH

4. **File Processing Errors**
   - Check file permissions
   - Verify file format support

### Debug Mode

Enable debug logging in the backend:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance Optimization

### Chunking Strategy
- Adjust chunk size based on your use case
- Overlap helps maintain context across chunks
- Consider document structure for better chunking

### Embedding Strategy
- Use `text-embedding-3-small` for cost efficiency
- Batch embedding generation for multiple chunks
- Cache embeddings when possible

### Database Optimization
- Index frequently queried columns
- Use connection pooling
- Monitor query performance

## 🔒 Security Considerations

1. **API Key Management**
   - Use environment variables
   - Never commit keys to version control
   - Rotate keys regularly

2. **Data Privacy**
   - Row-level security in Supabase
   - User isolation in Pinecone
   - Secure file upload handling

3. **Input Validation**
   - Validate file types and sizes
   - Sanitize user inputs
   - Rate limiting for API endpoints

## 🚀 Deployment

### Backend Deployment
1. **Docker** (recommended):
   ```dockerfile
   FROM python:3.9-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "homework_server_rag:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Environment Variables**: Set all required environment variables in your deployment platform

3. **Database**: Ensure Supabase and Pinecone are accessible from your deployment

### Frontend Deployment
1. **Vercel** (recommended for Next.js)
2. **Environment Variables**: Set in Vercel dashboard
3. **Build Command**: `npm run build`

## 📚 Additional Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Test with minimal examples
4. Consult the documentation links above 