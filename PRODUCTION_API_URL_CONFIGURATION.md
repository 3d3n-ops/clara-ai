# Production API URL Configuration

## Overview
This document summarizes the changes made to configure the frontend to use the production backend URL instead of localhost:8000.

## Problem
The frontend was still sending requests to `localhost:8000` in production, preventing connection to the deployed backend at `https://clara-ai-kq0a.onrender.com`.

## Solution
Updated the frontend to use `NEXT_PUBLIC_API_URL` environment variable with fallback to the existing `PYTHON_BACKEND_URL` for backward compatibility.

## Changes Made

### 1. Updated API Utility File
**File:** `lib/api-utils.ts`
- Modified the `serverFetch` function to prioritize `NEXT_PUBLIC_API_URL` over `PYTHON_BACKEND_URL`
- Maintains backward compatibility with existing `PYTHON_BACKEND_URL` configuration

### 2. Updated API Route Files
The following API route files were updated to use the new environment variable:

- `app/api/homework/chat/route.ts`
- `app/api/homework/upload/route.ts`
- `app/api/homework/files/route.ts`
- `app/api/homework/folders/route.ts`
- `app/api/voice/generate-visual/route.ts`

### 3. Updated Production Environment Example
**File:** `PRODUCTION_ENV_EXAMPLE.md`
- Added `NEXT_PUBLIC_API_URL=https://clara-ai-kq0a.onrender.com`
- Updated `PYTHON_BACKEND_URL` to use the production URL

## Environment Variable Priority
The system now uses the following priority order for backend URL configuration:

1. `NEXT_PUBLIC_API_URL` (new primary variable)
2. `PYTHON_BACKEND_URL` (fallback for backward compatibility)
3. `http://localhost:8000` (development fallback)

## Deployment Instructions

### For Vercel Deployment:
1. Add the following environment variable to your Vercel project:
   ```
   NEXT_PUBLIC_API_URL=https://clara-ai-kq0a.onrender.com
   ```

2. Also add the existing variable for backward compatibility:
   ```
   PYTHON_BACKEND_URL=https://clara-ai-kq0a.onrender.com
   ```

### For Local Development:
Create a `.env.local` file in your project root with:
```env
NEXT_PUBLIC_API_URL=https://clara-ai-kq0a.onrender.com
PYTHON_BACKEND_URL=https://clara-ai-kq0a.onrender.com
```

## Verification
After deployment, verify that:
1. Frontend API calls are going to `https://clara-ai-kq0a.onrender.com`
2. No requests are being sent to `localhost:8000`
3. All features (homework chat, file upload, voice assistant) are working correctly

## Backward Compatibility
The changes maintain full backward compatibility:
- Existing `PYTHON_BACKEND_URL` configurations will continue to work
- Development environments can still use localhost URLs
- No breaking changes to existing functionality

## Files Modified
- `lib/api-utils.ts`
- `app/api/homework/chat/route.ts`
- `app/api/homework/upload/route.ts`
- `app/api/homework/files/route.ts`
- `app/api/homework/folders/route.ts`
- `app/api/voice/generate-visual/route.ts`
- `PRODUCTION_ENV_EXAMPLE.md` 