# Vercel CLI Deployment Guide

This guide will help you deploy Clara AI to Vercel using the command line interface (CLI) instead of the dashboard.

## 🚀 Prerequisites

### 1. Install Vercel CLI
```bash
# Using npm
npm install -g vercel

# Using yarn
yarn global add vercel

# Using pnpm
pnpm add -g vercel
```

### 2. Verify Installation
```bash
vercel --version
```

## 🔧 Step 1: Prepare Your Project

### 1.1 Ensure Project Structure
Make sure your project has the correct structure:
```
clara-ai/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility functions
├── public/                 # Static assets
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
├── next.config.mjs        # Next.js config
└── tailwind.config.ts     # Tailwind config
```

### 1.2 Check Configuration Files
Ensure these files exist and are properly configured:
- `vercel.json` - Vercel deployment configuration
- `package.json` - Dependencies and scripts
- `next.config.mjs` - Next.js configuration

## 🔑 Step 2: Set Up Environment Variables

### 2.1 Create Environment File
Create a `.env.local` file in your project root:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here

# Backend Configuration
PYTHON_BACKEND_URL=https://your-render-backend-url.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here
```

### 2.2 Add to .gitignore
Ensure `.env.local` is in your `.gitignore`:
```gitignore
# Environment variables
.env.local
.env.production.local
.env.development.local
```

## 🚀 Step 3: Deploy Using Vercel CLI

### 3.1 Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate with your Vercel account.

### 3.2 Initialize Project (First Time)
```bash
# Navigate to your project directory
cd clara-ai

# Initialize Vercel project
vercel
```

When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N` (for new project)
- **Project name?** → `clara-ai` (or your preferred name)
- **In which directory is your code located?** → `./` (current directory)
- **Want to override the settings?** → `N` (use defaults)

### 3.3 Deploy with Environment Variables
```bash
# Deploy with environment variables from .env.local
vercel --env-file .env.local
```

### 3.4 Deploy to Production
```bash
# Deploy to production
vercel --prod --env-file .env.local
```

## 🔧 Step 4: Advanced CLI Commands

### 4.1 Set Environment Variables via CLI
```bash
# Set individual environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add NEXT_PUBLIC_LIVEKIT_URL
vercel env add LIVEKIT_API_KEY
vercel env add LIVEKIT_API_SECRET
vercel env add PYTHON_BACKEND_URL
vercel env add OPENAI_API_KEY
vercel env add PINECONE_API_KEY
vercel env add PINECONE_ENVIRONMENT
vercel env add PINECONE_INDEX_NAME

# Set for production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
# ... repeat for all variables
```

### 4.2 List Environment Variables
```bash
# List all environment variables
vercel env ls

# List for specific environment
vercel env ls production
```

### 4.3 Remove Environment Variables
```bash
# Remove environment variable
vercel env rm VARIABLE_NAME

# Remove from specific environment
vercel env rm VARIABLE_NAME production
```

### 4.4 Pull Environment Variables
```bash
# Pull environment variables to local .env file
vercel env pull .env.local
```

## 🔍 Step 5: Troubleshooting CLI Issues

### 5.1 Common CLI Problems

#### Issue: "Command not found: vercel"
```bash
# Reinstall Vercel CLI
npm uninstall -g vercel
npm install -g vercel

# Or use npx
npx vercel
```

#### Issue: Authentication Problems
```bash
# Logout and login again
vercel logout
vercel login
```

#### Issue: Project Not Found
```bash
# List your projects
vercel projects ls

# Link to existing project
vercel link
```

#### Issue: Build Failures
```bash
# Check build logs
vercel logs

# Deploy with debug info
vercel --debug
```

### 5.2 Debug Deployment
```bash
# Deploy with verbose output
vercel --debug

# Check deployment status
vercel ls

# View deployment details
vercel inspect [deployment-url]
```

## 📊 Step 6: Monitoring and Management

### 6.1 View Deployments
```bash
# List all deployments
vercel ls

# View specific deployment
vercel inspect [deployment-url]
```

### 6.2 Rollback Deployment
```bash
# List deployments with IDs
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-id]
```

### 6.3 Remove Project
```bash
# Remove project from Vercel
vercel remove
```

## 🔒 Step 7: Security Best Practices

### 7.1 Environment Variables Security
- Never commit `.env.local` to version control
- Use different environment variables for development and production
- Rotate API keys regularly

### 7.2 CLI Security
```bash
# Use secure token instead of login
vercel --token $VERCEL_TOKEN

# Set token as environment variable
export VERCEL_TOKEN=your_vercel_token_here
```

## 🚀 Step 8: Automated Deployment Script

Create a deployment script for easier management:

```bash
#!/bin/bash
# deploy-vercel.sh

echo "🚀 Deploying Clara AI to Vercel..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found. Please create it with your environment variables."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --env-file .env.local

echo "✅ Deployment completed!"
```

Make it executable:
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

## 📋 Step 9: Post-Deployment Checklist

After successful deployment:

- [ ] Verify the deployment URL works
- [ ] Test authentication flow
- [ ] Check environment variables are set correctly
- [ ] Test file upload functionality
- [ ] Verify LiveKit integration
- [ ] Test chat functionality
- [ ] Check error monitoring
- [ ] Verify SSL certificate
- [ ] Test on different devices/browsers

## 🔧 Step 10: Useful CLI Commands Reference

```bash
# Basic commands
vercel login                    # Login to Vercel
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
vercel ls                      # List deployments
vercel inspect [url]           # Inspect deployment
vercel logs                    # View logs
vercel rollback [id]           # Rollback deployment

# Environment variables
vercel env add [name]          # Add environment variable
vercel env ls                  # List environment variables
vercel env pull [file]         # Pull env vars to file
vercel env rm [name]           # Remove environment variable

# Project management
vercel link                    # Link to existing project
vercel remove                  # Remove project
vercel projects ls             # List projects
vercel domains ls              # List domains

# Debugging
vercel --debug                 # Debug mode
vercel --force                 # Force deployment
```

## 🆘 Getting Help

### Vercel CLI Help
```bash
vercel --help
vercel [command] --help
```

### Useful Resources
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel CLI GitHub](https://github.com/vercel/vercel)
- [Vercel Support](https://vercel.com/support)

### Common Issues and Solutions

1. **Build Timeout**: Increase build timeout in `vercel.json`
2. **Memory Issues**: Optimize bundle size or upgrade plan
3. **Environment Variables**: Ensure all required variables are set
4. **CORS Issues**: Check backend CORS configuration
5. **Authentication**: Verify Clerk configuration

Your Clara AI application should now be successfully deployed to Vercel using the CLI! 🎉 