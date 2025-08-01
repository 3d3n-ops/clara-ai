# Modal Production Setup Guide

## ✅ What's Already Configured

1. **Modal Deployment**: Your Clara voice agent is deployed to Modal
2. **Secrets**: Modal secrets are configured with your API keys  
3. **Frontend Updates**: Frontend is configured to use proper room naming and Modal integration

## 🔧 Required Configuration Steps

### Step 1: Configure LiveKit Webhooks

1. Go to your **LiveKit Cloud Dashboard**: https://cloud.livekit.io/
2. Navigate to your project: `rzn-ai-demo-jjqfllvw`
3. Go to **Settings** → **Webhooks**
4. Add a new webhook with these settings:
   - **URL**: `https://d3n-ops--clara-voice-agent-run-livekit-agent.modal.run`
   - **Events**: Select these events:
     - ✅ `room_started` 
     - ✅ `room_finished`
   - **Method**: POST
   - **Headers**: Leave default (Modal will handle authentication)

### Step 2: Test the Connection

Once the webhook is configured:

1. **Start your frontend**: 
   ```bash
   npm run dev
   ```

2. **Navigate to the voice assistant**: Go to `/voice-test` or `/dashboard` and start a voice session

3. **Check the flow**:
   - Frontend connects to LiveKit room with name: `study-session-{userId}`
   - LiveKit triggers `room_started` webhook to Modal
   - Modal spins up Clara agent and joins the room
   - You should see "Clara has joined the session" message

### Step 3: Monitor and Debug

**Modal Logs**:
```bash
cd backend
modal app logs clara-voice-agent
```

**LiveKit Dashboard**:
- Check **Rooms** tab to see active sessions
- Check **Webhooks** tab to see webhook delivery status

**Frontend Console**:
- Check browser developer tools for connection status
- Look for "Connected to LiveKit room" messages

## 🐛 Troubleshooting

### Clara Doesn't Join the Room

1. **Check webhook delivery** in LiveKit dashboard
2. **Verify Modal secrets** are correct:
   ```bash
   modal secret list
   ```
3. **Check Modal logs** for errors:
   ```bash
   modal app logs clara-voice-agent
   ```

### Connection Issues

1. **Verify environment variables** in `.env`:
   - `LIVEKIT_URL` matches your LiveKit instance
   - `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are correct

2. **Check room naming**: Frontend should create rooms with `study-session-` prefix

### Audio/Voice Issues

1. **Microphone permissions**: Browser needs microphone access
2. **LiveKit connection**: Check network connectivity to LiveKit Cloud
3. **API keys**: Verify Deepgram and Cartesia keys in Modal secrets

## 🚀 Production Checklist

- [ ] LiveKit webhook configured and responding
- [ ] Modal app deployed and running  
- [ ] Frontend connecting to correct LiveKit instance
- [ ] Clara agent joining rooms automatically
- [ ] Voice conversation working end-to-end
- [ ] Visual content generation working
- [ ] Session completion/summary working

## 📊 Performance Monitoring

**Modal Dashboard**: Monitor function execution and costs
**LiveKit Analytics**: Track room usage and connection quality  
**Frontend Analytics**: PostHog events for user interactions

## 💰 Cost Management

**Modal Costs**:
- A100 GPU: ~$4/hour when active
- Automatic scale-down when rooms end
- Monitor usage in Modal dashboard

**LiveKit Costs**:
- Based on participant minutes
- Monitor in LiveKit dashboard

## 🔄 Updates and Maintenance

**Updating the Agent**:
```bash
cd backend
modal deploy modal_app.py
```

**Updating Frontend**:
```bash
npm run build
# Deploy to your hosting platform
```

---

**Next Step**: Configure the LiveKit webhook with the URL above, then test your voice session!