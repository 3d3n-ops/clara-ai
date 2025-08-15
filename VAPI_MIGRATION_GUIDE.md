# Vapi Migration Guide

## Overview

This guide documents the migration from LiveKit to Vapi for Clara AI's voice agent functionality. Vapi provides a more streamlined approach to voice AI with better developer experience and easier deployment.

## What Was Migrated

### 1. Voice Agent Components
- **Before**: `components/livekit-voice-room.tsx`
- **After**: `components/vapi-voice-room.tsx`

### 2. API Endpoints
- **Before**: `app/api/livekit/token/route.ts`
- **After**: `app/api/vapi/token/route.ts`

### 3. Webhook Handling
- **New**: `app/api/vapi/webhook/route.ts` - Handles Vapi events and function calls

### 4. Configuration
- **New**: `lib/vapi-config.ts` - Centralized Vapi configuration
- **New**: `hooks/use-vapi-voice.ts` - Custom hook for Vapi voice sessions

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Vapi Configuration
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_PRIVATE_KEY=your_vapi_private_key_here

# Agent ID (from Vapi dashboard)
VAPI_AGENT_ID=4102aa12-fb39-4c0f-82c3-15f4f752f2f6
```

## Vapi Agent Setup

### 1. Create Agent in Vapi Dashboard
1. Go to https://vapi.ai/
2. Create a new agent called "Clara"
3. Note the agent ID: `4102aa12-fb39-4c0f-82c3-15f4f752f2f6`

### 2. Configure Agent Settings
- **Name**: Clara
- **Model**: GPT-4o-mini
- **Voice**: Custom voice (you can configure this)
- **System Prompt**: See `lib/vapi-config.ts` for the full prompt

### 3. Add Functions
The agent supports these functions for visual content generation:
- `generate_diagram` - Create visual diagrams
- `generate_flashcards` - Create study flashcards
- `generate_quiz` - Create interactive quizzes
- `generate_mindmap` - Create mindmaps

### 4. Configure Webhooks
Set the webhook URL in your Vapi dashboard:
```
https://your-domain.com/api/vapi/webhook
```

## Key Differences from LiveKit

### 1. Simplified Architecture
- **LiveKit**: Complex WebRTC setup with Modal backend
- **Vapi**: Direct SDK integration with managed infrastructure

### 2. Event Handling
- **LiveKit**: Custom WebSocket events
- **Vapi**: Standardized event system with webhooks

### 3. Function Calls
- **LiveKit**: Custom implementation for visual generation
- **Vapi**: Built-in function calling system

### 4. Deployment
- **LiveKit**: Requires Modal backend deployment
- **Vapi**: Frontend-only deployment with managed backend

## Features Maintained

✅ **Real-time voice conversation** with Clara AI
✅ **Screen sharing** for visual context
✅ **Multimodal chat** interface
✅ **Session management** with automatic cleanup
✅ **Visual content generation** (diagrams, flashcards, quizzes)
✅ **Analytics tracking** for voice sessions
✅ **Error handling** and reconnection logic

## New Features

✅ **Simplified setup** - No backend deployment required
✅ **Better error handling** - Vapi provides detailed error messages
✅ **Function calling** - Built-in support for visual content generation
✅ **Webhook integration** - Server-side event handling
✅ **Voice customization** - Easy voice configuration
✅ **Transcription options** - Multiple provider support

## Usage

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Study Session
Go to `/chat/study` and click "Start Voice Session"

### 3. Voice Commands
- "Create diagram about photosynthesis"
- "Make flashcards for math formulas"
- "Show quiz about history"
- "Generate mindmap for biology"

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check VAPI_PUBLIC_KEY and VAPI_PRIVATE_KEY are set
   - Verify agent ID is correct
   - Ensure webhook URL is accessible

2. **No Audio**
   - Check microphone permissions
   - Verify browser supports WebRTC
   - Check Vapi voice configuration

3. **Function Calls Not Working**
   - Verify webhook URL is configured in Vapi dashboard
   - Check function definitions in `lib/vapi-config.ts`
   - Ensure visual generation API is working

### Debug Mode
Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('vapi-debug', 'true')
```

## Migration Benefits

1. **Reduced Complexity**: No need for Modal backend deployment
2. **Better Developer Experience**: Simplified SDK and configuration
3. **Improved Reliability**: Managed infrastructure with better uptime
4. **Enhanced Features**: Built-in function calling and webhooks
5. **Easier Maintenance**: Less custom code to maintain

## Next Steps

1. **Test the migration** in development environment
2. **Configure production environment** variables
3. **Update deployment scripts** if needed
4. **Monitor performance** and user feedback
5. **Optimize voice settings** based on usage patterns

## Support

For Vapi-specific issues:
- Vapi Documentation: https://docs.vapi.ai/
- Vapi Discord: https://discord.gg/vapi-ai

For Clara AI integration issues:
- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Test webhook endpoints are accessible 