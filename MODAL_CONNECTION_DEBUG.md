# Modal Connection Debugging Guide

## Current Issue

The Modal worker is starting but immediately completing without establishing a proper connection to LiveKit. The error message indicates:

```
The job task completed without establishing a connection or performing a proper shutdown. 
Ensure that job_ctx.connect()/job_ctx.shutdown() is called and the job is correctly finalized.
```

## Root Cause Analysis

The issue appears to be with the LiveKit worker lifecycle management. The worker is not properly connecting to the LiveKit room or handling the job context correctly.

## Fixes Applied

### 1. **Enhanced Connection Retry Logic**
- Added retry logic for `ctx.connect()` with up to 5 attempts
- Added retry logic for session start with up to 3 attempts
- Increased room initialization wait time from 2 to 3 seconds

### 2. **Improved Worker Function**
- Better error handling and debugging information
- Proper worker cleanup with drain and close operations
- Enhanced logging for worker creation and connection process

### 3. **New Test Endpoints**
- `test_livekit_connection` - Tests basic LiveKit connectivity without full agent setup
- Enhanced health check endpoint
- Better error reporting and debugging information

## Testing Steps

### Step 1: Deploy Updated Code
```bash
cd backend
modal deploy modal_app.py
```

### Step 2: Test Health Check
Visit: `https://d3n-ops--clara-voice-agent-health-check.modal.run`

Expected response: Environment variables status

### Step 3: Test LiveKit Connection
```bash
curl -X POST https://d3n-ops--clara-voice-agent-test-livekit-connection.modal.run \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response: `{"status": "success", "message": "LiveKit connection test successful"}`

### Step 4: Check LiveKit Webhook Configuration

1. **Go to LiveKit Cloud Dashboard**
2. **Navigate to Settings → Webhooks**
3. **Verify webhook URL**: `https://d3n-ops--clara-voice-agent-run-livekit-agent.modal.run`
4. **Check webhook events**: `room_started` and `room_finished`
5. **Test webhook delivery**

### Step 5: Test Voice Session

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to** `/chat/study`

3. **Click "Start Voice Session"**

4. **Check Modal logs** for these messages:
   ```
   [Modal Webhook] Worker for room {room_name} spawned
   [Modal Worker] Running worker for room: {room_name}
   [Modal Worker] Environment variables:
   [Modal Worker] Connecting to LiveKit at: {url}
   [Modal Worker] Creating worker for room: {room_name}
   [Modal Worker] Worker created successfully, starting for room: {room_name}
   [Modal Agent] Job context connect starting for room: {room_name}
   [Modal Agent] Connection attempt 1/5
   [Modal Agent] Job context connected successfully on attempt 1
   [Modal Agent] Waiting for room to be ready...
   [Modal Agent] Starting Clara AI agent for user: {user_id}
   [Modal Agent] Creating agent session...
   [Modal Agent] Starting session with room: {room_name}
   [Modal Agent] Session start attempt 1/3
   [Modal Agent] Session started successfully on attempt 1
   [Modal Agent] Session started successfully, sending initial greeting...
   [Modal Agent] Clara AI agent session started successfully
   ```

## Debugging Commands

### Check Modal Logs
```bash
# List your apps
modal app list

# Check app logs (replace with your app name)
modal app logs d3n-ops--clara-voice-agent

# Check function logs
modal function logs d3n-ops--clara-voice-agent-run-agent-worker
```

### Check LiveKit Dashboard
1. Go to https://cloud.livekit.io/
2. Navigate to your project
3. Check **Rooms** tab for active sessions
4. Check **Webhooks** tab for delivery status

## Expected Behavior

### Successful Connection Flow
1. **Frontend** connects to LiveKit room
2. **LiveKit** sends `room_started` webhook to Modal
3. **Modal** spawns worker function
4. **Worker** creates LiveKit worker instance
5. **Worker** connects to LiveKit and starts agent session
6. **Agent** sends initial greeting
7. **Session** remains active until room ends

### Error Indicators
- Worker starts but immediately completes
- No agent session messages in logs
- Webhook not being delivered
- Environment variables not set
- Connection retry failures

## Environment Variables Checklist

Verify these are set in your Modal secret:
- [ ] `LIVEKIT_URL`
- [ ] `LIVEKIT_API_KEY`
- [ ] `LIVEKIT_API_SECRET`
- [ ] `OPENAI_API_KEY`
- [ ] `DEEPGRAM_API_KEY`
- [ ] `CARTESIA_API_KEY`

## Troubleshooting Steps

### If Connection Test Fails
1. **Check LiveKit credentials** - Verify API key and secret are correct
2. **Check LiveKit URL** - Ensure the WebSocket URL is accessible
3. **Check Modal secrets** - Verify the secret is properly configured

### If Worker Spawns But Doesn't Connect
1. **Check Modal logs** for connection attempt messages
2. **Verify room exists** - Check if the room was created in LiveKit
3. **Check timing** - Ensure there's no race condition between room creation and worker start

### If Session Start Fails
1. **Check agent initialization** - Verify the ClaraAssistant class loads
2. **Check plugin configuration** - Ensure all required plugins are available
3. **Check API keys** - Verify OpenAI, Deepgram, and Cartesia keys are valid

## Next Steps

1. **Deploy the updated code**
2. **Test the LiveKit connection endpoint**
3. **Verify LiveKit webhook configuration**
4. **Test voice session from frontend**
5. **Monitor Modal logs for connection messages**

If the issue persists, check:
- LiveKit Cloud connectivity
- Webhook URL configuration
- Environment variable setup
- Modal function timeout settings
- LiveKit room creation timing 