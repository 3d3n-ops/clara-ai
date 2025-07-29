# Clara AI Deployment Guide

This guide will help you deploy Clara AI to production with LiveKit Cloud for voice agents and Render for the backend server.

## 🚀 Quick Deployment Overview

### Architecture
- **Frontend**: Next.js app deployed on Vercel
- **Backend**: Python FastAPI server deployed on Render
- **Voice Agent**: LiveKit Cloud deployment
- **Database**: Supabase (PostgreSQL)
- **Vector Database**: Pinecone
- **Authentication**: Clerk

## 📋 Prerequisites

1. **Accounts Required**:
   - [Vercel](https://vercel.com) - Frontend hosting
   - [Render](https://render.com) - Backend hosting
   - [LiveKit Cloud](https://livekit.io) - Voice agent hosting
   - [Clerk](https://clerk.com) - Authentication
   - [Pinecone](https://pinecone.io) - Vector database
   - [Supabase](https://supabase.com) - Database (optional)

2. **API Keys Needed**:
   - OpenAI API key
   - Clerk API keys
   - Pinecone API key
   - LiveKit API keys

## 🔧 Step 1: Backend Deployment (Render)

### 1.1 Prepare Backend for Deployment

The backend is already configured with:
- `render.yaml` - Render deployment configuration
- `Dockerfile` - Container configuration
- `start.sh` - Startup script
- `requirements.txt` - Python dependencies

### 1.2 Deploy to Render

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   ```
   Name: clara-homework-server
   Environment: Python
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn homework_server_rag:app --host 0.0.0.0 --port $PORT
   ```

3. **Set Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_pinecone_index_name
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=your_database_url (if using)
   REDIS_URL=your_redis_url (if using)
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   LOG_LEVEL=info
   MAX_FILE_SIZE=10485760
   MAX_UPLOAD_FILES=10
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_SECONDS=60
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://clara-homework-server.onrender.com`)

## 🎤 Step 2: Voice Agent Deployment (LiveKit Cloud)

### 2.1 Configure LiveKit Cloud

1. **Create LiveKit Cloud Account**:
   - Go to [LiveKit Cloud](https://livekit.io)
   - Sign up and create a new project

2. **Get API Keys**:
   - Navigate to API Keys section
   - Copy your API Key and Secret

3. **Configure Voice Agent**:
   - Update `livekit.yaml` with your API keys
   - Set the `RAG_ENGINE_URL` to your Render backend URL

### 2.2 Deploy Voice Agent

1. **Using LiveKit CLI**:
   ```bash
   # Install LiveKit CLI
   npm install -g @livekit/cli

   # Login to LiveKit Cloud
   livekit login

   # Deploy the agent
   livekit deploy livekit.yaml
   ```

2. **Alternative: Manual Deployment**:
   - Use the LiveKit Cloud dashboard
   - Upload your `voice_agent_rag.py` file
   - Configure environment variables
   - Deploy the agent

### 2.3 Update Frontend Configuration

Update your frontend environment variables:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

## 🌐 Step 3: Frontend Deployment (Vercel)

### 3.1 Prepare Frontend

The frontend is already configured with:
- `vercel.json` - Vercel deployment configuration
- Security headers
- Environment variable mapping

### 3.2 Deploy to Vercel (Dashboard Method)

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   PYTHON_BACKEND_URL=https://your-render-backend-url.com
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_pinecone_index_name
   ```

3. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://your-project.vercel.app`

### 3.3 Deploy to Vercel (CLI Method) - Recommended

If you're having issues with the dashboard, use the CLI method:

#### Option A: Automated Script (Recommended)
```bash
# For Unix/Linux/macOS
chmod +x deploy-vercel.sh
./deploy-vercel.sh

# For Windows PowerShell
.\deploy-vercel.ps1
```

#### Option B: Manual CLI Steps
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Create .env.local file with your environment variables
# (See VERCEL_CLI_DEPLOYMENT.md for template)

# 4. Deploy to production
vercel --prod --env-file .env.local
```

#### Option C: Step-by-step CLI
```bash
# 1. Install dependencies
npm install

# 2. Build project
npm run build

# 3. Initialize Vercel project (first time only)
vercel

# 4. Deploy to production
vercel --prod --env-file .env.local
```

For detailed CLI instructions, see `VERCEL_CLI_DEPLOYMENT.md`.

## 🔒 Step 4: Security Configuration

### 4.1 CORS Configuration

Update your backend CORS settings in `homework_server_rag.py`:
```python
ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
    "https://www.your-frontend-domain.com",
    # Remove localhost for production
]
```

### 4.2 Environment Variables Security

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor API usage

### 4.3 SSL/TLS Configuration

- Vercel provides automatic SSL certificates
- Render provides automatic SSL certificates
- LiveKit Cloud provides secure WebSocket connections

## 📊 Step 5: Monitoring and Maintenance

### 5.1 Health Checks

- Backend: `https://your-backend-url.com/health`
- Frontend: Vercel provides automatic monitoring
- Voice Agent: LiveKit Cloud provides monitoring

### 5.2 Logs and Debugging

- **Render**: View logs in the dashboard
- **Vercel**: View logs in the dashboard
- **LiveKit**: View logs in the LiveKit Cloud dashboard

### 5.3 Performance Monitoring

- Set up alerts for high error rates
- Monitor API response times
- Track user engagement metrics

## 🧹 Step 6: Clean Up Unnecessary Files

The following files have been removed or are no longer needed:

### Removed Files:
- `test_imports.py` - Development testing file
- `test_response_filtering.py` - Development testing file
- `voice_agent_minimal.py` - Simplified version
- `voice_agent_simple.py` - Simplified version
- `__pycache__/` directories
- `.venv/` directories

### Kept Files:
- `homework_server_rag.py` - Main backend server
- `voice_agent_rag.py` - Main voice agent
- `rag_engine.py` - RAG system
- `hwk_agent_rag.py` - Homework agent
- `requirements.txt` - Python dependencies

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Verify CORS configuration in backend
   - Check that frontend domain is in allowed origins

2. **Authentication Failures**:
   - Verify Clerk configuration
   - Check environment variables
   - Test authentication flow

3. **Voice Agent Issues**:
   - Check LiveKit Cloud configuration
   - Verify WebSocket connections
   - Test microphone permissions

4. **Backend Connection Issues**:
   - Verify Render service is running
   - Check environment variables
   - Test API endpoints

5. **File Upload Issues**:
   - Check file size limits
   - Verify file type restrictions
   - Test upload endpoints

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [LiveKit Cloud Documentation](https://docs.livekit.io)
- [Vercel Documentation](https://vercel.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io)

## ✅ Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Voice agent deployed to LiveKit Cloud
- [ ] Frontend deployed to Vercel
- [ ] All environment variables configured
- [ ] CORS settings updated
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Authentication working
- [ ] File uploads working
- [ ] Voice chat working
- [ ] Monitoring configured
- [ ] Error logging active
- [ ] Performance acceptable
- [ ] Security measures in place

## 🚀 Post-Deployment

After successful deployment:

1. **Test all features**:
   - User registration/login
   - File uploads
   - Chat functionality
   - Voice interactions
   - Homework help

2. **Monitor performance**:
   - Response times
   - Error rates
   - User engagement

3. **Set up alerts**:
   - High error rates
   - Service downtime
   - Performance degradation

4. **Plan for scaling**:
   - Monitor resource usage
   - Plan for increased traffic
   - Consider additional services

Your Clara AI application is now ready for production use! 🎉