# Modal Deployment Troubleshooting Guide

## Issue: Worker Not Connecting Properly

The error message indicates that the LiveKit worker is not properly establishing a connection or handling the job lifecycle correctly.

## Root Causes and Solutions

### 1. Environment Variables Not Set

**Problem**: The Modal deployment doesn't have the required environment variables configured.

**Solution**: 
1. Check your Modal secrets configuration:
   ```bash
   modal secret list
   ```

2. Ensure your `clara-voice-agent-secrets` secret contains:
   ```env
   LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   OPENAI_API_KEY=your_openai_api_key
   DEEPGRAM_API_KEY=your_deepgram_api_key
   CARTESIA_API_KEY=your_cartesia_api_key
   ```

3. Update the secret if needed:
   ```bash
   modal secret create clara-voice-agent-secrets \
     LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud \
     LIVEKIT_API_KEY=your_livekit_api_key \
     LIVEKIT_API_SECRET=your_livekit_api_secret \
     OPENAI_API_KEY=your_openai_api_key \
     DEEPGRAM_API_KEY=your_deepgram_api_key \
     CARTESIA_API_KEY=your_cartesia_api_key
   ```

### 2. LiveKit Webhook Configuration

**Problem**: The webhook URL might be incorrect or not properly configured.

**Solution**:
1. Get your Modal deployment URL:
   ```bash
   modal app list
   ```

2. Configure LiveKit webhook with the correct URL:
   - Go to LiveKit Cloud Dashboard
   - Navigate to Settings → Webhooks
   - Add webhook URL: `https://your-app--clara-voice-agent-run-livekit-agent.modal.run`
   - Select events: `room_started` and `room_finished`

### 3. Code Issues Fixed

**Problem**: The worker function had several issues that have been fixed:

1. **Removed undefined `job_ctx.connect()`** - This was causing the connection error
2. **Added proper error handling** - Better logging and exception handling
3. **Added environment variable debugging** - To help identify missing variables
4. **Added health check endpoint** - To verify deployment is working

## Testing the Fix

### 1. Deploy the Updated Code

```bash
cd backend
modal deploy modal_app.py
```

### 2. Test the Health Check

Visit the health check endpoint to verify the deployment:
```
https://your-app--clara-voice-agent-health-check.modal.run
```

### 3. Check Modal Logs

```bash
modal logs your-app
```

Look for these messages:
- `[Modal Worker] Environment variables:`
- `[Modal Worker] Connecting to LiveKit at:`
- `[Modal Agent] Connecting to room`

### 4. Test LiveKit Connection

1. Start your development server
2. Navigate to `/chat/study`
3. Click "Start Voice Session"
4. Check Modal logs for connection messages

## Debugging Steps

### Step 1: Verify Environment Variables

The updated code will log environment variable status. Look for:
```
[Modal Worker] Environment variables:
  LIVEKIT_URL: wss://your-livekit-instance.livekit.cloud
  OPENAI_API_KEY: SET
  DEEPGRAM_API_KEY: SET
  CARTESIA_API_KEY: SET
```

### Step 2: Check LiveKit Webhook

1. Go to LiveKit Cloud Dashboard
2. Check webhook delivery status
3. Verify the webhook URL is correct

### Step 3: Monitor Modal Logs

```bash
modal logs your-app --follow
```

Look for these success messages:
- `[Modal Webhook] Worker for room {room_name} spawned`
- `[Modal Agent] Connecting to room {room_name}`
- `[Modal Agent] Clara AI agent session started successfully`

## Common Error Messages and Solutions

### "LIVEKIT_URL environment variable not set"
**Solution**: Update your Modal secret with the correct LiveKit URL

### "Error in livekit_entrypoint"
**Solution**: Check the full error traceback in Modal logs for specific issues

### "Worker for room was cancelled"
**Solution**: This is normal when the room ends, but check if it's happening too early

### "Connection failed"
**Solution**: Verify LiveKit Cloud is running and accessible

## Next Steps

1. **Deploy the updated code** with the fixes
2. **Test the health check endpoint** to verify deployment
3. **Check Modal logs** for environment variable status
4. **Test voice session** from the frontend
5. **Monitor for any remaining errors**

## Files Updated

- `backend/modal_app.py` - Fixed worker function and added debugging
- `MODAL_TROUBLESHOOTING.md` - This troubleshooting guide

The main fixes address the undefined `job_ctx.connect()` call and add proper error handling and debugging to help identify the root cause of connection issues. 