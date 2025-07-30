# Production Environment Variables for Vercel

## Frontend Environment Variables

Set these environment variables in your Vercel project settings:

### Backend Configuration
```
PYTHON_BACKEND_URL=https://clara-ai-kq0a.onrender.com
```

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### PostHog Analytics
```
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com
```

### LiveKit Configuration
```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Optional: Supabase Configuration
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (`clara-ai`)
3. Go to **Settings** → **Environment Variables**
4. Add each variable above with the correct values
5. Deploy to apply the changes

## Backend Environment Variables (Render)

Set these in your Render service:

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

### Optional: Supabase Configuration
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Current Production URLs

- **Frontend**: https://try-clara.vercel.app/
- **Backend**: https://clara-ai-kq0a.onrender.com/

## Testing the Connection

After setting the environment variables:

1. **Test Backend Health**: 
   ```
   GET https://clara-ai-kq0a.onrender.com/health
   ```

2. **Test Frontend**: 
   - Visit https://try-clara.vercel.app/
   - Try uploading a file or starting a chat session

3. **Check CORS**: 
   - The backend should accept requests from the frontend domain
   - No CORS errors in browser console

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check that the frontend URL matches exactly

2. **API Connection Errors**
   - Verify `PYTHON_BACKEND_URL` is set in frontend
   - Check that the backend is running and accessible

3. **Authentication Issues**
   - Ensure Clerk keys are configured correctly
   - Check that the domain is allowed in Clerk settings

### Verification Commands

```bash
# Test backend health
curl https://clara-ai-kq0a.onrender.com/health

# Test frontend (should load without errors)
curl https://try-clara.vercel.app/
``` 