# Folder and File Storage Implementation for Clara AI

This document outlines the complete implementation of folder and file storage in Supabase and Pinecone for RAG retrieval in the Clara AI application.

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

## 📁 Database Schema

### Tables Created

1. **users** - User information linked to Clerk authentication
2. **classes** - Folders/classes created by users
3. **files** - File metadata and storage information
4. **file_chunks** - Text chunks for RAG processing
5. **conversations** - Chat conversations
6. **messages** - Individual messages in conversations
7. **user_embeddings** - Metadata about user's vector embeddings

### Key Relationships

- Users can have multiple classes (folders)
- Classes can contain multiple files
- Files are chunked and embedded for RAG
- All data is isolated by user_id for security

## 🔄 Implementation Flow

### 1. User Onboarding

**Frontend (`app/onboarding/page.tsx`)**:
- User creates folders during onboarding
- Files are uploaded for each folder
- Data is sent to Supabase via API endpoints

**API (`app/api/homework/folders/route.ts`)**:
- Creates folders in Supabase `classes` table
- Handles user creation if needed
- Returns folder data to frontend

**API (`app/api/homework/upload/route.ts`)**:
- Uploads files to Supabase Storage
- Sends file content to Python backend for RAG processing
- Stores file metadata in Supabase `files` table

### 2. File Processing

**Python Backend (`backend/rag_engine.py`)**:
- Extracts text content from various file types (PDF, DOC, TXT, Images)
- Chunks text into smaller pieces for better retrieval
- Generates embeddings using OpenAI
- Stores embeddings in Pinecone with metadata
- Stores chunks in Supabase `file_chunks` table

### 3. RAG Retrieval

**Python Backend (`backend/hwk_agent_rag.py`)**:
- Searches Pinecone for relevant chunks based on user query
- Retrieves context from user's uploaded files
- Provides context-aware responses to homework questions

### 4. Dashboard Management

**Frontend (`app/dashboard/page.tsx`)**:
- Fetches folders from Supabase
- Shows file counts for each folder
- Allows file uploads to existing folders
- Displays learning statistics

## 🔧 Key Features Implemented

### 1. Multi-User Support
- Each user has isolated data in Supabase
- User-specific namespaces in Pinecone
- Row-level security policies

### 2. File Type Support
- **PDF**: Text extraction from all pages
- **DOC/DOCX**: Word document processing
- **TXT**: Plain text files
- **Images**: OCR for text extraction
- **Other**: Fallback to plain text

### 3. Smart Chunking
- Overlapping chunks for better context
- Token-aware splitting using tiktoken
- Metadata preservation for source tracking

### 4. Semantic Search
- OpenAI embeddings for semantic similarity
- Cosine similarity in Pinecone
- Filtered by user and class

### 5. Real-time Updates
- File upload progress indicators
- Toast notifications for success/error
- Automatic folder refresh after uploads

## 📊 API Endpoints

### Folder Management
- `GET /api/homework/folders` - Get user's folders
- `POST /api/homework/folders` - Create new folder

### File Management
- `POST /api/homework/upload` - Upload and process file
- `GET /api/homework/files` - Get user's files

### Backend RAG Endpoints
- `POST /homework/upload-rag` - Process file with RAG
- `POST /homework/chat-rag` - Chat with RAG context
- `GET /homework/files/{user_id}` - Get user files
- `DELETE /homework/files/{file_id}` - Delete file

## 🔐 Security Features

### 1. Authentication
- Clerk authentication for user management
- JWT tokens for API access
- User ID validation on all endpoints

### 2. Data Isolation
- Row-level security in Supabase
- User-specific namespaces in Pinecone
- No cross-user data access

### 3. File Security
- Supabase Storage with access policies
- File type validation
- Size limits and content scanning

## 🚀 Performance Optimizations

### 1. Efficient Queries
- Indexed database columns
- Optimized Supabase queries
- Batch operations for file processing

### 2. Caching
- Client-side caching of folder data
- Optimistic updates for better UX
- Background refresh of file counts

### 3. Error Handling
- Graceful degradation on failures
- User-friendly error messages
- Automatic retry mechanisms

## 📈 Monitoring and Analytics

### 1. User Activity
- Folder creation tracking
- File upload statistics
- RAG usage metrics

### 2. System Performance
- API response times
- File processing speeds
- Embedding generation metrics

### 3. Storage Usage
- Supabase storage consumption
- Pinecone vector count
- Database growth tracking

## 🔄 Migration from localStorage

The implementation includes backward compatibility:
- Onboarding data stored in localStorage for existing users
- Gradual migration to Supabase
- Fallback mechanisms for offline scenarios

## 🧪 Testing Strategy

### 1. Unit Tests
- API endpoint testing
- File processing validation
- RAG functionality verification

### 2. Integration Tests
- End-to-end file upload flow
- Chat with RAG context
- Multi-user isolation testing

### 3. Performance Tests
- Large file processing
- Concurrent user scenarios
- Memory usage optimization

## 🚀 Deployment Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `PINECONE_API_KEY`
- [ ] `PINECONE_INDEX_NAME`

### Database Setup
- [ ] Execute `database_schema.sql` in Supabase
- [ ] Create storage bucket named `files`
- [ ] Configure storage policies
- [ ] Set up RLS policies

### Backend Services
- [ ] Start Python RAG server
- [ ] Configure CORS settings
- [ ] Set up monitoring
- [ ] Test all endpoints

## 🔮 Future Enhancements

### 1. Advanced Features
- File versioning
- Collaborative folders
- Advanced search filters
- File sharing between users

### 2. Performance Improvements
- Streaming file uploads
- Background processing
- CDN integration
- Caching strategies

### 3. Analytics
- Learning progress tracking
- File usage analytics
- RAG effectiveness metrics
- User engagement insights

## 📚 Documentation

- `SUPABASE_SETUP.md` - Complete Supabase setup guide
- `RAG_SETUP_GUIDE.md` - RAG system configuration
- `database_schema.sql` - Database schema definition
- API documentation in code comments

This implementation provides a robust, scalable foundation for storing and retrieving user folders and files with full RAG capabilities for the Clara AI application.