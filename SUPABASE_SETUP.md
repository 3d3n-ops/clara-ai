# Supabase Setup Guide for Clara AI

This guide will help you set up Supabase for the Clara AI application to store folders, files, and enable RAG functionality.

## 🏗️ Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Supabase Project**: Create a new project in your Supabase dashboard
3. **Environment Variables**: Configure the required environment variables

## 🔧 Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `clara-ai` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose the closest region to your users
5. Click "Create new project"

### 2. Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`)

### 3. Set Up Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=clara-ai-embeddings

# Python Backend URL (if running locally)
PYTHON_BACKEND_URL=http://localhost:8000
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database_schema.sql` into the editor
3. Click "Run" to execute the schema

### 5. Set Up Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Enter bucket details:
   - **Name**: `files`
   - **Public bucket**: ✅ (checked)
   - **File size limit**: `50MB` (or your preferred limit)
   - **Allowed MIME types**: `*/*` (or specific types like `application/pdf,image/*,text/*`)
4. Click "Create bucket"

### 6. Configure Storage Policies

In the SQL Editor, run the following to set up storage policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text IN (
  SELECT clerk_id FROM users WHERE clerk_id = auth.uid()::text
));

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (auth.uid()::text IN (
  SELECT clerk_id FROM users WHERE clerk_id = auth.uid()::text
));

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (auth.uid()::text IN (
  SELECT clerk_id FROM users WHERE clerk_id = auth.uid()::text
));

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (auth.uid()::text IN (
  SELECT clerk_id FROM users WHERE clerk_id = auth.uid()::text
));
```

### 7. Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Start your Python backend:
   ```bash
   cd backend
   python homework_server_rag.py
   ```

3. Navigate to `http://localhost:3000` and test:
   - User registration/login
   - Creating folders during onboarding
   - Uploading files
   - Chat functionality with RAG

## 🔍 Troubleshooting

### Common Issues

1. **"User not found" errors**:
   - Ensure the `users` table exists and has the correct schema
   - Check that Clerk user IDs are being properly stored

2. **File upload failures**:
   - Verify the storage bucket exists and is named `files`
   - Check storage policies are correctly configured
   - Ensure file size is within limits

3. **RAG processing errors**:
   - Verify OpenAI API key is valid
   - Check Pinecone configuration
   - Ensure Python backend is running

4. **CORS errors**:
   - Add your frontend URL to Supabase CORS settings
   - Go to **Settings** → **API** → **CORS** and add `http://localhost:3000`

### Environment Variable Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `PINECONE_API_KEY` - Your Pinecone API key
- [ ] `PINECONE_INDEX_NAME` - Your Pinecone index name
- [ ] `PYTHON_BACKEND_URL` - Your Python backend URL

## 🚀 Production Deployment

For production deployment:

1. **Update CORS settings** in Supabase to include your production domain
2. **Set up proper environment variables** in your hosting platform
3. **Configure proper security policies** for production use
4. **Set up monitoring** for the RAG system
5. **Configure backup strategies** for your data

## 📊 Monitoring

Monitor your Supabase usage in the dashboard:
- **Database**: Monitor query performance and storage usage
- **Storage**: Track file uploads and storage consumption
- **API**: Monitor API calls and response times
- **Auth**: Track user authentication and session management

## 🔐 Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use Row Level Security (RLS)** for all tables
3. **Validate file uploads** on both client and server
4. **Implement rate limiting** for API endpoints
5. **Regularly audit** your security policies
6. **Monitor for suspicious activity** in your logs