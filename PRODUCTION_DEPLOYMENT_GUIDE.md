# Production Deployment Guide

This guide will help you deploy Clara AI securely to production environments.

## 🚀 Quick Start

### 1. Environment Setup

1. **Create production environment file:**
   ```bash
   cp PRODUCTION_ENV_EXAMPLE.md .env.production
   ```

2. **Fill in all environment variables** (see `PRODUCTION_ENV_EXAMPLE.md`)

3. **Generate secure session secret:**
   ```bash
   # Generate session secret
   openssl rand -base64 32
   ```

### 2. Frontend Deployment (Vercel)

1. **Connect your repository to Vercel**

2. **Set environment variables in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.production`

3. **Configure build settings:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install"
   }
   ```

4. **Set up custom domain with SSL**

### 3. Backend Deployment (Render)

1. **Create new Web Service in Render**

2. **Configure build settings:**
   ```bash
   Build Command: pip install -r requirements.txt
   Start Command: python homework_server_rag.py
   ```

3. **Set environment variables:**
   - Add all backend-specific variables
   - Set `PYTHON_BACKEND_URL` to your Render service URL

4. **Configure health check:**
   ```
   Health Check Path: /health
   ```

## 🔒 Security Hardening

### 1. API Security

All endpoints now include:
- ✅ Authentication required
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS protection

### 2. Environment Variables

**Critical variables to secure:**
```env
# Clerk authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Database (if using)
DATABASE_URL=your_encrypted_database_url_here

# Third-party services
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
```

### 3. CORS Configuration

Update `backend/homework_server_rag.py` with your production domains:
```python
ALLOWED_ORIGINS = [
    "https://your-production-domain.com",
    "https://www.your-production-domain.com",
    # Remove localhost for production
]
```

### 4. Rate Limiting

Production rate limits are configured:
- **Chat API**: 50 requests/minute
- **File Upload**: 10 requests/minute
- **File/Folder API**: 30 requests/minute
- **Token Generation**: 10 requests/minute
- **Session Completion**: 5 requests/minute

## 🛠️ Backend Security Features

### 1. Rate Limiting
```python
def check_rate_limit(user_id: str) -> bool:
    """Simple rate limiting - in production use Redis"""
    now = time.time()
    user_requests = rate_limit_store[user_id]
    
    # Remove old requests
    user_requests[:] = [req_time for req_time in user_requests if now - req_time < RATE_LIMIT_WINDOW]
    
    if len(user_requests) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    
    user_requests.append(now)
    return True
```

### 2. Input Validation
```python
def sanitizeMessage(message: string): string {
  return message
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .substring(0, MAX_MESSAGE_LENGTH)
}
```

## 🔧 Frontend Security Features

### 1. Server-Side API Utilities
All API calls are now handled server-side to prevent client-side exposure:

```typescript
// lib/api-utils.ts
export async function serverFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const userId = await getAuthenticatedUser()
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(`${process.env.PYTHON_BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ServerAPIError(
      errorData.error || `HTTP ${response.status}`,
      response.status
    )
  }

  return response.json()
}
```

### 2. Protected Routes
Middleware protects all sensitive routes:
```typescript
export const config = {
  matcher: [
    '/api/(.*)',
    '/dashboard/(.*)',
    '/chat/(.*)',
    '/onboarding/(.*)',
    '/study/(.*)',
    '/homework/(.*)',
    '/voice/(.*)',
    '/admin/(.*)',
  ],
}
```

## 📊 Monitoring & Logging

### 1. Error Tracking
Set up Sentry for error monitoring:
```env
SENTRY_DSN=your_sentry_dsn_here
```

### 2. Performance Monitoring
- Vercel Analytics for frontend
- Render metrics for backend
- Database query monitoring

### 3. Security Monitoring
- Failed authentication attempts
- Rate limit violations
- Suspicious file uploads
- API usage patterns

## 🚨 Security Checklist

### Pre-Deployment
- [ ] All environment variables are set
- [ ] No hardcoded secrets in code
- [ ] CORS is configured for production domains
- [ ] Rate limiting is enabled
- [ ] File upload limits are configured
- [ ] Database connection is secure
- [ ] API keys are properly secured
- [ ] Monitoring is set up
- [ ] Backup strategies are in place
- [ ] SSL certificates are configured
- [ ] Error logging is enabled
- [ ] Performance monitoring is active

### Post-Deployment
- [ ] All authentication flows work
- [ ] File uploads are working
- [ ] Chat functionality is operational
- [ ] Rate limiting is effective
- [ ] Error monitoring is active
- [ ] Performance is acceptable
- [ ] Security scans pass
- [ ] Backup systems are tested
- [ ] Monitoring alerts are configured
- [ ] SSL certificates are valid
- [ ] CORS is properly configured
- [ ] API endpoints are secure

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify CORS configuration in backend
   - Check that frontend domain is in allowed origins

2. **Authentication Failures**
   - Verify Clerk configuration
   - Check environment variables
   - Test authentication flow

3. **File Upload Issues**
   - Check file size limits
   - Verify file type restrictions
   - Test upload endpoints

4. **Rate Limiting**
   - Monitor rate limit violations
   - Adjust limits if needed
   - Check user experience

5. **Performance Issues**
   - Monitor API response times
   - Check database performance
   - Optimize file processing

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)