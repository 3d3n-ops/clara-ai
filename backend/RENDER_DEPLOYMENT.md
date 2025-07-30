# Clara AI Backend - Render Deployment Guide

## Overview
This guide helps you deploy the Clara AI backend to Render.com

## Prerequisites
- Render.com account
- All environment variables configured
- Python 3.11+ support

## Environment Variables Required

Set these in your Render service environment variables:

### Core API Keys
```
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
```

### LiveKit Configuration
```
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Frontend Configuration
```
FRONTEND_URL=https://try-clara.vercel.app
```

### Optional (for Supabase integration)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Render Service Configuration

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
uvicorn backend_server:app --host 0.0.0.0 --port $PORT
```

### Environment
- **Python Version**: 3.11
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend_server:app --host 0.0.0.0 --port $PORT`

## Deployment Steps

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure the service**:
   - **Name**: `clara-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend_server:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend` (if your backend is in a subdirectory)

4. **Add Environment Variables** (see list above)

5. **Deploy**

## Troubleshooting

### Common Issues

1. **Import Error: noise_cancellation and turn_detector**
   - ✅ **FIXED**: Removed noise_cancellation and turn_detector imports from voice_agent_rag.py
   - These imports were causing compatibility issues with newer LiveKit versions

2. **Missing Dependencies**
   - ✅ **FIXED**: Added `supabase` to requirements.txt
   - All required packages are now listed

3. **Port Configuration**
   - Render automatically sets the `$PORT` environment variable
   - The start command uses this: `--port $PORT`

4. **CORS Issues**
   - The backend is configured to accept requests from your frontend domain
   - Update `ALLOWED_ORIGINS` in `backend_server.py` with your actual domain

### Testing Deployment

Run the test script locally to verify everything works:
```bash
cd backend
python test_backend.py
```

## Health Check

Once deployed, test the health endpoint:
```
GET https://your-render-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Clara AI Backend Server",
  "timestamp": "2024-01-01T00:00:00",
  "active_voice_connections": 0
}
```

## Update Frontend Configuration

After successful deployment, update your frontend environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-render-service.onrender.com
```

## Monitoring

- Check Render logs for any startup errors
- Monitor the `/health` endpoint for service status
- Use Render's built-in monitoring tools

## Support

If you encounter issues:
1. Check Render deployment logs
2. Run `python test_backend.py` locally
3. Verify all environment variables are set correctly
4. Ensure your LiveKit instance is accessible 