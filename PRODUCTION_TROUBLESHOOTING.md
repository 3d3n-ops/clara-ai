# Production Troubleshooting Guide

## Current Issues

### 1. PostHog Initialization Error
**Error**: `PostHog was initialized without a token. This likely indicates a misconfiguration.`

**Root Cause**: The `NEXT_PUBLIC_POSTHOG_KEY` environment variable is not set in production.

**Solution**:
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to **Environment Variables**
4. Add the following variable:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
   ```
5. Redeploy your application

**To get your PostHog API key**:
1. Go to https://us.posthog.com/
2. Sign in to your account
3. Go to **Project Settings** → **API Keys**
4. Copy your **Project API Key**

### 2. 500 Internal Server Error for Folder Creation
**Error**: `POST https://try-clara.vercel.app/api/homework/folders 500 (Internal Server Error)`

**Root Cause**: Missing environment variables in the backend or Pinecone connection issues.

**Solution**:

#### Step 1: Check Backend Environment Variables
Ensure these variables are set in your Render backend:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
PINECONE_ENVIRONMENT=your_pinecone_environment
```

#### Step 2: Verify Backend Health
Test your backend health endpoint:
```bash
curl https://clara-ai-kq0a.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Clara AI Backend Server",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "active_voice_connections": 0,
  "features": {
    "rag_engine": "enabled"
  }
}
```

#### Step 3: Check Pinecone Connection
If the backend is healthy but folder creation still fails, the issue might be with Pinecone:

1. **Verify Pinecone Index**: Ensure your Pinecone index exists and is accessible
2. **Check API Key**: Verify your Pinecone API key is valid
3. **Check Environment**: Ensure `PINECONE_ENVIRONMENT` is set correctly

#### Step 4: Test Backend Directly
Test the folder creation endpoint directly:

```bash
curl -X POST https://clara-ai-kq0a.onrender.com/homework/folders \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Folder",
    "description": "Test Description",
    "user_id": "test_user_123"
  }'
```

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com`
- [ ] `PYTHON_BACKEND_URL=https://clara-ai-kq0a.onrender.com`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `LIVEKIT_API_KEY`
- [ ] `LIVEKIT_API_SECRET`

### Backend (Render)
- [ ] `OPENAI_API_KEY`
- [ ] `PINECONE_API_KEY`
- [ ] `PINECONE_INDEX_NAME`
- [ ] `PINECONE_ENVIRONMENT`
- [ ] `FRONTEND_URL=https://try-clara.vercel.app`
- [ ] `LIVEKIT_API_KEY`
- [ ] `LIVEKIT_API_SECRET`

## Debugging Steps

### 1. Check Frontend Console
Open browser developer tools and check for:
- PostHog initialization errors
- API request failures
- CORS errors

### 2. Check Backend Logs
In your Render dashboard:
1. Go to your backend service
2. Click on **Logs**
3. Look for error messages related to:
   - Pinecone connection issues
   - Missing environment variables
   - API errors

### 3. Test API Endpoints
Test these endpoints to isolate the issue:

```bash
# Health check
curl https://clara-ai-kq0a.onrender.com/health

# Test folder creation
curl -X POST https://clara-ai-kq0a.onrender.com/homework/folders \
  -H "Content-Type: application/json" \
  -d '{"name": "test", "description": "test", "user_id": "test"}'

# Test folder retrieval
curl https://clara-ai-kq0a.onrender.com/homework/folders/test_user
```

## Common Solutions

### If PostHog is not working:
1. Add the missing environment variable
2. Clear browser cache
3. Redeploy the application

### If folder creation fails:
1. Check backend environment variables
2. Verify Pinecone connection
3. Check backend logs for specific errors
4. Ensure the backend service is running

### If you get CORS errors:
1. Verify `FRONTEND_URL` is set correctly in backend
2. Check that the frontend URL matches exactly
3. Ensure the backend CORS configuration includes your frontend domain

## Monitoring

After fixing the issues, monitor:
1. **PostHog Dashboard**: Check if events are being tracked
2. **Backend Logs**: Monitor for any new errors
3. **User Reports**: Check if users can create folders successfully

## Next Steps

1. **Immediate**: Add the missing PostHog environment variable
2. **Short-term**: Test folder creation functionality
3. **Long-term**: Set up proper monitoring and alerting for these issues 