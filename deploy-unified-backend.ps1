# Unified Backend Server Deployment Script
param(
    [string]$OpenAIApiKey,
    [string]$BackendUrl,
    [string]$Environment = "production"
)

Write-Host "🚀 Deploying Unified Clara AI Backend Server..." -ForegroundColor Green

# Check if required parameters are provided
if (-not $OpenAIApiKey) {
    Write-Host "❌ Error: OpenAI API Key is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-unified-backend.ps1 -OpenAIApiKey 'your-key' -BackendUrl 'your-url'" -ForegroundColor Yellow
    exit 1
}

if (-not $BackendUrl) {
    Write-Host "❌ Error: Backend URL is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-unified-backend.ps1 -OpenAIApiKey 'your-key' -BackendUrl 'your-url'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Step 1: Creating unified backend configuration..." -ForegroundColor Blue

# Create environment configuration
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

# Create Render configuration
$renderConfig = @"
services:
  - type: web
    name: clara-ai-backend
    env: python
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: python backend_server.py
    envVars:
      - key: OPENAI_API_KEY
        value: $OpenAIApiKey
      - key: RAG_ENGINE_URL
        value: $BackendUrl
      - key: ENVIRONMENT
        value: $Environment
      - key: PORT
        value: 8000
"@

$renderConfig | Out-File -FilePath "render.yaml" -Encoding UTF8

Write-Host "📋 Step 2: Creating deployment instructions..." -ForegroundColor Blue

$deploymentInstructions = @"
# Unified Backend Server Deployment Instructions

## Prerequisites
- Render account: https://dashboard.render.com
- OpenAI API Key: $OpenAIApiKey
- Backend URL: $BackendUrl

## Deployment Steps

### 1. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- Name: clara-ai-backend
- Environment: Python
- Root Directory: backend
- Build Command: pip install -r requirements.txt
- Start Command: python backend_server.py

**Environment Variables:**
- OPENAI_API_KEY: $OpenAIApiKey
- RAG_ENGINE_URL: $BackendUrl
- ENVIRONMENT: $Environment
- PORT: 8000

### 2. Test the Deployment

**Health Check:**
```bash
curl -X GET "https://clara-ai-backend.onrender.com/health"
```

**Homework Agent Test:**
```bash
curl -X POST "https://clara-ai-backend.onrender.com/homework/chat-rag" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, can you help me with my homework?",
    "user_id": "test-user"
  }'
```

**Voice Agent Test:**
```bash
curl -X POST "https://clara-ai-backend.onrender.com/voice/chat/test-user" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Clara",
    "user_id": "test-user"
  }'
```

### 3. Update LiveKit Cloud Configuration

Update your LiveKit Cloud agent to use the unified backend:

```env
RAG_ENGINE_URL=https://clara-ai-backend.onrender.com
```

### 4. Update Frontend Configuration

Update your frontend to use the unified backend:

```env
NEXT_PUBLIC_BACKEND_URL=https://clara-ai-backend.onrender.com
```

## API Endpoints

### Health & Status
- GET /health - Health check
- GET / - Service information

### Homework Agent
- POST /homework/chat-rag - Chat with homework agent
- POST /homework/upload-rag - Upload files
- GET /homework/files/{user_id} - Get user files
- DELETE /homework/files/{file_id}/{user_id} - Delete file
- GET /homework/folders/{user_id} - Get user folders
- POST /homework/folders - Create folder
- GET /homework/conversations/{user_id} - Get conversations
- GET /homework/conversations/{conversation_id}/messages - Get messages
- GET /homework/context/{user_id} - Get user context

### Voice Agent
- WebSocket /voice/ws/{user_id} - Real-time voice chat
- POST /voice/chat/{user_id} - Text chat for voice agent
- GET /voice/status/{user_id} - Voice agent status
- GET /voice/stats - Voice agent statistics

### Shared RAG Utilities
- GET /rag/context/{user_id} - Get RAG context
- GET /rag/search/{user_id} - Search RAG documents

## Benefits of Unified Backend

1. **Reduced Complexity**: Single service to manage
2. **Resource Efficiency**: Shared connections and memory
3. **Cost Effective**: One deployment instead of multiple
4. **Easier Monitoring**: Single point of monitoring
5. **Simplified Scaling**: Scale one service instead of many

## Troubleshooting

### Common Issues:
1. **Service not starting**: Check environment variables and logs
2. **WebSocket not working**: Verify CORS configuration
3. **RAG integration issues**: Ensure RAG_ENGINE_URL is accessible
4. **Rate limiting**: Check request limits and user quotas

### Useful Commands:
- Check service status: Render dashboard
- View logs: Render dashboard > Logs
- Test endpoints: Use curl commands above

## Next Steps
1. Monitor performance and usage
2. Scale based on demand
3. Set up comprehensive monitoring
4. Implement advanced security measures
"@

$deploymentInstructions | Out-File -FilePath "UNIFIED_BACKEND_DEPLOYMENT.md" -Encoding UTF8

Write-Host "✅ Unified backend configuration created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend_server.py to Render using the instructions above" -ForegroundColor White
Write-Host "2. Test all endpoints using the provided curl commands" -ForegroundColor White
Write-Host "3. Update LiveKit Cloud agent to use the unified backend" -ForegroundColor White
Write-Host "4. Update frontend to use the unified backend" -ForegroundColor White
Write-Host ""
Write-Host "📁 Files created:" -ForegroundColor Cyan
Write-Host "- .env.unified-backend (environment configuration)" -ForegroundColor White
Write-Host "- render.yaml (Render deployment configuration)" -ForegroundColor White
Write-Host "- UNIFIED_BACKEND_DEPLOYMENT.md (deployment instructions)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Benefits of Unified Backend:" -ForegroundColor Green
Write-Host "- Single service to manage and monitor" -ForegroundColor White
Write-Host "- Shared resources and connections" -ForegroundColor White
Write-Host "- Cost effective deployment" -ForegroundColor White
Write-Host "- Simplified scaling and maintenance" -ForegroundColor White 