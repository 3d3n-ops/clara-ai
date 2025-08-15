# Railway Deployment Guide for Clara AI Backend

## Overview
This guide will help you deploy your Clara AI backend to Railway, a simple and cost-effective platform that works perfectly with your existing Docker setup.

## Prerequisites
- GitHub repository with your code
- Railway account (free at [railway.app](https://railway.app))
- All your API keys and environment variables ready

## Step 1: Prepare Your Repository

### 1.1 Verify Docker Configuration
Your project already has the necessary files:
- ✅ `backend/Dockerfile` - Ready for Railway
- ✅ `docker-compose.yml` - For local testing
- ✅ `backend/requirements.txt` - All dependencies listed

### 1.2 Create Railway Configuration (Optional)
Railway will auto-detect your Dockerfile, but you can create a `railway.json` for custom settings:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Deploy to Railway

### 2.1 Connect Your Repository
**IMPORTANT**: Since your repository contains both frontend (Next.js) and backend (Python), you need to deploy the backend specifically.

**Option A: Deploy Backend Directory (Recommended)**
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `clara-ai` repository
5. **In the deployment settings, set the root directory to `backend/`**
6. Railway will detect your Python backend and Dockerfile

**Option B: Use Railway CLI (Alternative)**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Run: `railway login`
3. Run: `railway init`
4. Select your repository and set root directory to `backend/`
5. Run: `railway up`

### 2.2 Configure Environment Variables
Railway will need these environment variables. Add them in the Railway dashboard:

#### Required Variables:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
FRONTEND_URL=https://your-frontend-domain.com

# Application Settings
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
MAX_UPLOAD_FILES=10
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

#### Optional Variables (if you use these features):
```bash
# Database (if using)
DATABASE_URL=your_database_url_here

# Redis (if using)
REDIS_URL=your_redis_url_here

# LiveKit (if using voice features)
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here

# Deepgram (if using voice features)
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Cartesia (if using voice features)
CARTESIA_API_KEY=your_cartesia_api_key_here

# Supabase (if using)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2.3 Deploy
1. Railway will automatically build and deploy your application
2. The first deployment may take 5-10 minutes
3. You'll get a Railway URL like: `https://your-app-name.railway.app`

## Step 3: Configure Your Frontend

### 3.1 Update Frontend API URL
Update your frontend to use the new Railway URL:

```typescript
// In your frontend code
const API_BASE_URL = 'https://your-app-name.railway.app'
```

### 3.2 Update CORS Settings
Make sure your Railway backend allows your frontend domain:

```bash
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

## Step 4: Test Your Deployment

### 4.1 Health Check
Test your deployment is working:
```bash
curl https://your-app-name.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Clara AI Backend Server",
  "timestamp": "2024-01-01T12:00:00",
  "active_voice_connections": 0,
  "features": {
    "rag_engine": "enabled",
    "file_upload": "enabled",
    "voice_agent": "enabled"
  }
}
```

### 4.2 Test Key Endpoints
```bash
# Test chat endpoint
curl -X POST https://your-app-name.railway.app/homework/chat-rag \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_id": "test"}'

# Test file upload
curl -X POST https://your-app-name.railway.app/homework/upload-rag \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.txt", "content": "Hello world", "user_id": "test"}'
```

## Step 5: Monitor and Scale

### 5.1 Railway Dashboard Features
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Deployments**: Automatic deployments on git push
- **Environment Variables**: Easy management
- **Custom Domains**: Add your own domain

### 5.2 Scaling Options
- **Free Tier**: $5 credit/month (usually enough for development)
- **Pay-as-you-go**: Only pay for what you use
- **Auto-scaling**: Railway handles scaling automatically

## Troubleshooting

### Common Issues:

#### 1. Build Failures
- Check Railway logs for build errors
- Verify all dependencies in `requirements.txt`
- Ensure Dockerfile is in the correct location

#### 1.1 Node.js Detection Error (Most Common)
**Error**: `ERR_PNPM_OUTDATED_LOCKFILE` or Railway detecting Node.js instead of Python

**Solution**:
1. **Set Root Directory**: In Railway dashboard, set the root directory to `backend/`
2. **Use Railway CLI**: `railway init` and select `backend/` as root directory
3. **Check Configuration**: Ensure `railway.json` is in the `backend/` directory
4. **Verify Dockerfile**: Make sure `backend/Dockerfile` exists and is valid

#### 2. Environment Variables
- Double-check all required variables are set
- Verify API keys are valid
- Check variable names match your code

#### 3. CORS Issues
- Verify `ALLOWED_ORIGINS` includes your frontend domain
- Check `FRONTEND_URL` is set correctly

#### 4. File Upload Issues
- Railway has ephemeral storage (files don't persist between deployments)
- Consider using external storage (AWS S3, Cloudinary) for production

### Getting Help:
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Check your application logs in the Railway dashboard

## Cost Estimation

### Free Tier ($5 credit/month):
- Usually sufficient for development and small projects
- ~$5-10/month for typical usage

### Production Usage:
- Depends on traffic and resource usage
- Typically $10-50/month for moderate usage
- Much cheaper than many alternatives

## Next Steps

1. **Deploy your backend** following this guide
2. **Update your frontend** to use the new API URL
3. **Test all features** thoroughly
4. **Set up monitoring** in Railway dashboard
5. **Configure custom domain** if needed

Your Clara AI backend will be running on Railway with all features intact!
