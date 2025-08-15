# LiveKit Setup Guide for Clara AI Voice Agent

## Overview

This guide helps you configure the LiveKit voice agent setup for Clara AI. The voice agent is now deployed on Modal and uses LiveKit Cloud for real-time voice communication.

## Prerequisites

1. **LiveKit Cloud Account**: You need a LiveKit Cloud account at https://cloud.livekit.io/
2. **Modal Account**: The backend is deployed on Modal
3. **Environment Variables**: Configure the required environment variables

## Step 1: Get LiveKit Credentials

1. Go to https://cloud.livekit.io/
2. Create a new project or use an existing one
3. Navigate to **Settings** → **API Keys**
4. Copy your **API Key** and **API Secret**
5. Note your **LiveKit URL** (e.g., `wss://your-project.livekit.cloud`)

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root with these variables:

```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Modal Backend Configuration
NEXT_PUBLIC_API_URL=https://your-modal-app.modal.run
```

## Step 3: Configure LiveKit Webhooks

1. Go to your **LiveKit Cloud Dashboard**
2. Navigate to **Settings** → **Webhooks**
3. Add a new webhook with these settings:
   - **URL**: `https://your-modal-app--clara-voice-agent-run-livekit-agent.modal.run`
   - **Events**: Select `room_started` and `room_finished`

## Step 4: Test the Voice Agent

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/chat/study`
3. Click "Start Voice Session"
4. Allow microphone access when prompted
5. Start talking to Clara!

## Troubleshooting

### Common Issues

1. **400 Bad Request Error**:
   - Check that your LiveKit credentials are correct
   - Ensure environment variables are loaded (restart dev server)
   - Verify the LiveKit URL is accessible

2. **Connection Failed**:
   - Check your internet connection
   - Verify LiveKit Cloud is running
   - Check browser console for detailed errors

3. **No Voice Response**:
   - Check that Modal backend is deployed and running
   - Verify webhook configuration in LiveKit Cloud
   - Check Modal logs for any errors

### Environment Variable Checklist

- [ ] `LIVEKIT_API_KEY` - Your LiveKit API key
- [ ] `LIVEKIT_API_SECRET` - Your LiveKit API secret  
- [ ] `LIVEKIT_URL` - Your LiveKit WebSocket URL
- [ ] `NEXT_PUBLIC_LIVEKIT_URL` - Same as LIVEKIT_URL
- [ ] `NEXT_PUBLIC_API_URL` - Your Modal backend URL

## Features

The LiveKit voice agent includes:

- **Real-time voice conversation** with Clara AI
- **Screen sharing** for visual context
- **Multimodal chat** interface
- **Session management** with automatic cleanup
- **Noise cancellation** and audio processing
- **Visual feedback** during conversation

## Architecture

```
Frontend (Next.js) → LiveKit Cloud → Modal Backend (Python)
```

1. **Frontend**: Connects to LiveKit room and handles UI
2. **LiveKit Cloud**: Manages real-time audio/video streams
3. **Modal Backend**: Processes voice with AI and generates responses

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Modal deployment logs
3. Verify LiveKit Cloud dashboard for room activity
4. Ensure all environment variables are correctly set 