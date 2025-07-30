# Unified Backend Server Deployment Guide

## 🎯 Overview

This guide covers deploying the unified `backend_server.py` that combines all Clara AI functionality into a single, production-ready server.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  LiveKit Cloud   │    │  Unified Backend│
│   (Next.js)     │◄──►│   (Voice Agent)  │◄──►│   (Render)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Unified Backend Features

- **RAG Engine**: Document processing and retrieval
- **Homework Agent**: Text-based homework assistance
- **Voice Agent**: Real-time voice interactions
- **File Management**: Upload, organize, and process files
- **WebSocket Support**: Real-time communication
- **Rate Limiting**: Production-ready request limiting
- **Health Monitoring**: Comprehensive health checks

## 📋 Deployment Options

### Option 1: Render Web Service (Recommended)

#### Step 1: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
```
Name: clara-ai-backend
Environment: Python
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: python backend_server.py
```

**Environment Variables:**
```env
OPENAI_API_KEY=your_openai_api_key
RAG_ENGINE_URL=https://clara-ai-backend.onrender.com
USER_ID=
CLASS_ID=
LOG_LEVEL=info
ENVIRONMENT=production
PORT=8000
```

#### Step 2: Update LiveKit Cloud Configuration

Update your LiveKit Cloud agent to use the unified backend:

```env
RAG_ENGINE_URL=https://clara-ai-backend.onrender.com
```

### Option 2: LiveKit Cloud Agent (Voice Only)

For voice-only deployment, use the LiveKit Cloud agent with the unified backend:

1. Deploy `backend_server.py` to Render (as above)
2. Configure LiveKit Cloud agent to use the unified backend URL
3. The voice agent will connect to the unified backend for RAG functionality

## 🔧 Configuration

### Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Backend Configuration
RAG_ENGINE_URL=https://your-backend-url.com
USER_ID=
CLASS_ID=
LOG_LEVEL=info

# Server Configuration
ENVIRONMENT=production
PORT=8000
```

### CORS Configuration

Update the `ALLOWED_ORIGINS` in `backend_server.py`:

```python
ALLOWED_ORIGINS = [
    "https://your-production-domain.com",
    "https://www.your-production-domain.com",
    "http://localhost:3000",  # Development only
    "http://localhost:3001",  # Development only
]
```

## 📡 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /` - Service information

### Homework Agent
- `POST /homework/chat-rag` - Chat with homework agent
- `POST /homework/upload-rag` - Upload files
- `GET /homework/files/{user_id}` - Get user files
- `DELETE /homework/files/{file_id}/{user_id}` - Delete file
- `GET /homework/folders/{user_id}` - Get user folders
- `POST /homework/folders` - Create folder
- `GET /homework/conversations/{user_id}` - Get conversations
- `GET /homework/conversations/{conversation_id}/messages` - Get messages
- `GET /homework/context/{user_id}` - Get user context

### Voice Agent
- `WebSocket /voice/ws/{user_id}` - Real-time voice chat
- `POST /voice/chat/{user_id}` - Text chat for voice agent
- `GET /voice/status/{user_id}` - Voice agent status
- `GET /voice/stats` - Voice agent statistics

### Shared RAG Utilities
- `GET /rag/context/{user_id}` - Get RAG context
- `GET /rag/search/{user_id}` - Search RAG documents

## 🚀 Quick Deployment Script

Create a deployment script for the unified backend:

```powershell
# deploy-unified-backend.ps1
param(
    [string]$OpenAIApiKey,
    [string]$BackendUrl,
    [string]$Environment = "production"
)

Write-Host "🚀 Deploying Unified Clara AI Backend..." -ForegroundColor Green

# Update environment variables
$envConfig = @"
# Unified Backend Environment Variables
OPENAI_API_KEY=$OpenAIApiKey
RAG_ENGINE_URL=$BackendUrl
USER_ID=
CLASS_ID=
LOG_LEVEL=info
ENVIRONMENT=$Environment
PORT=8000
"@

$envConfig | Out-File -FilePath ".env.unified-backend" -Encoding UTF8

Write-Host "✅ Environment configuration created!" -ForegroundColor Green
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend_server.py to Render" -ForegroundColor White
Write-Host "2. Update LiveKit Cloud agent configuration" -ForegroundColor White
Write-Host "3. Test all endpoints" -ForegroundColor White
```

## 🧪 Testing

### Health Check
```bash
curl -X GET "https://your-backend-url.com/health"
```

### Homework Agent Test
```bash
curl -X POST "https://your-backend-url.com/homework/chat-rag" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, can you help me with my homework?",
    "user_id": "test-user"
  }'
```

### Voice Agent Test
```bash
curl -X POST "https://your-backend-url.com/voice/chat/test-user" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Clara",
    "user_id": "test-user"
  }'
```

### WebSocket Test
```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://your-backend-url.com/voice/ws/test-user');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'text',
    text: 'Hello Clara'
  }));
};
```

## 📊 Monitoring

### Health Monitoring
- Monitor `/health` endpoint
- Check response times
- Monitor error rates

### Performance Metrics
- Active WebSocket connections
- Request rate per user
- RAG engine response times
- File upload success rates

### Logging
The unified backend includes comprehensive logging:
- Request/response logging
- Error tracking
- Performance metrics
- WebSocket connection events

## 🔒 Security Considerations

### Rate Limiting
- Built-in rate limiting per user
- Configurable limits and windows
- Production: Use Redis for distributed rate limiting

### Input Validation
- All inputs are validated
- File upload restrictions
- SQL injection prevention

### CORS Configuration
- Restrict to your frontend domains
- Secure WebSocket connections
- Production: Remove localhost origins

## 🎯 Benefits of Unified Backend

### Production Benefits
1. **Reduced Complexity**: Single service to manage
2. **Resource Efficiency**: Shared connections and memory
3. **Cost Effective**: One deployment instead of multiple
4. **Easier Monitoring**: Single point of monitoring
5. **Simplified Scaling**: Scale one service instead of many

### Development Benefits
1. **Unified Codebase**: All functionality in one place
2. **Shared Dependencies**: Common libraries and utilities
3. **Consistent API**: Standardized endpoints and responses
4. **Easier Testing**: Test all functionality together
5. **Simplified Deployment**: One deployment process

## 🔄 Migration from Separate Services

### Step 1: Deploy Unified Backend
1. Deploy `backend_server.py` to Render
2. Test all endpoints
3. Verify WebSocket functionality

### Step 2: Update Frontend
1. Update API endpoints to use unified backend
2. Test all functionality
3. Update WebSocket connections

### Step 3: Update LiveKit Cloud
1. Update agent configuration
2. Point to unified backend URL
3. Test voice interactions

### Step 4: Monitor and Scale
1. Monitor performance
2. Scale as needed
3. Set up alerts

## ✅ Checklist

- [ ] Unified backend deployed to Render
- [ ] All endpoints tested and working
- [ ] WebSocket connections functional
- [ ] Frontend updated to use unified backend
- [ ] LiveKit Cloud agent configured
- [ ] Environment variables set correctly
- [ ] CORS configured for production
- [ ] Monitoring and alerts set up
- [ ] Rate limiting configured
- [ ] Security measures in place

## 🎉 Success!

Your unified Clara AI backend is now deployed and ready for production use!

**Next Steps:**
1. Monitor performance and usage
2. Scale based on demand
3. Set up comprehensive monitoring
4. Implement advanced security measures
5. Optimize for your specific use case 