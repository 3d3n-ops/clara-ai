# Production Environment Configuration

Copy this configuration to your `.env.production` file and fill in your actual values.

## Frontend Configuration
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

## Backend Configuration
```env
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_API_URL=https://clara-ai-kq0a.onrender.com
PYTHON_BACKEND_URL=https://clara-ai-kq0a.onrender.com
```

## LiveKit Configuration
```env
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com
```

## Database Configuration
```env
DATABASE_URL=your_database_connection_string_here
```

## OpenAI Configuration
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Pinecone Configuration
```env
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here
```

## Supabase Configuration (if using)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Security Configuration
```env
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.com
```

## Rate Limiting (Redis for production)
```env
REDIS_URL=your_redis_url_here
```

## Monitoring and Logging
```env
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info
```

## CORS Configuration
```env
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## File Upload Limits
```env
MAX_FILE_SIZE=10485760
MAX_UPLOAD_FILES=10
```

## API Rate Limits
```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

## Security Checklist

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