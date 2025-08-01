# Modal Deployment Guide for Clara Voice Agent

This guide will walk you through deploying your Clara AI voice agent to Modal using LiveKit Agents.

## 🚀 Prerequisites

1. **Modal Account**: Sign up at [modal.com](https://modal.com)
2. **LiveKit Account**: Sign up at [livekit.io](https://livekit.io)
3. **API Keys**: You'll need API keys for:
   - OpenAI (for GPT-4o-mini)
   - Deepgram (for speech-to-text)
   - Cartesia (for text-to-speech)

## 📋 Step 1: Install Modal CLI

```bash
pip install modal
modal setup
```

## 🔐 Step 2: Set Up Modal Secrets

Navigate to the **Secrets** section in your Modal dashboard and add the following secrets:

### Required Secrets:
- `LIVEKIT_URL` - Your LiveKit WebRTC server URL
- `LIVEKIT_API_KEY` - API key for authenticating LiveKit requests
- `LIVEKIT_API_SECRET` - API secret for LiveKit authentication
- `OPENAI_API_KEY` - API key for OpenAI's GPT-based processing
- `CARTESIA_API_KEY` - API key for Cartesia's TTS services
- `DEEPGRAM_API_KEY` - API key for Deepgram's STT services

### Optional Secrets:
- `RAG_ENGINE_URL` - Backend URL for RAG functionality (if using)

## 🏗️ Step 3: Deploy to Modal

Navigate to the `backend` directory and run:

```bash
cd backend
modal deploy modal_app.py
```

This will:
1. Build the container image with all dependencies
2. Deploy the FastAPI endpoint for webhook handling
3. Set up the worker function with GPU support

## 🔗 Step 4: Configure LiveKit Webhooks

After deployment, Modal will provide you with a FastAPI endpoint URL. Copy this URL and add it to your LiveKit dashboard:

1. Go to your **LiveKit dashboard**
2. Navigate to **Settings** > **Webhooks**
3. Add the Modal endpoint URL as a webhook
4. Configure the webhook to trigger on:
   - `room_started` events
   - `room_finished` events

## 🧪 Step 5: Test Your Agent

### Option 1: LiveKit Sandbox
1. Go to your **LiveKit dashboard**
2. Navigate to **Sandbox** > **Voice assistant**
3. Start a voice assistant session
4. Your Clara agent should automatically join the room

### Option 2: Custom Frontend
Use your existing frontend application to connect to LiveKit rooms. The agent will automatically join when users connect.

## 📊 Step 6: Monitor and Scale

### Monitoring
- **Modal Dashboard**: Monitor function execution, logs, and costs
- **LiveKit Dashboard**: Monitor room activity and agent performance
- **Logs**: Check Modal logs for debugging and optimization

### Autoscaling
Modal automatically scales based on demand:
- **Scale Up**: New workers spawn when rooms are created
- **Scale Down**: Workers are cancelled when rooms finish
- **GPU Usage**: A100 GPUs are used for optimal performance

## 🔧 Configuration Options

### GPU Configuration
The agent is configured to use NVIDIA A100 GPUs for optimal performance. You can modify this in `modal_app.py`:

```python
@app.function(
    gpu="A100",  # Change to "T4" for cost optimization or "H100" for maximum performance
    timeout=3000,
    secrets=[Secret.from_name("clara-voice-agent-secrets")]
)
```

### Timeout Configuration
The default timeout is 3000 seconds (50 minutes). Adjust based on your session requirements:

```python
@app.function(
    gpu="A100",
    timeout=3600,  # 1 hour
    secrets=[Secret.from_name("clara-voice-agent-secrets")]
)
```

## 💰 Cost Optimization

### GPU Selection
- **A100**: Best performance, higher cost
- **T4**: Good performance, lower cost
- **CPU**: Basic performance, lowest cost

### Timeout Management
- Shorter timeouts reduce costs
- Longer timeouts provide better user experience
- Balance based on your use case

## 🐛 Troubleshooting

### Common Issues

1. **Agent Not Joining Rooms**
   - Check LiveKit webhook configuration
   - Verify Modal secrets are correctly set
   - Check Modal logs for errors

2. **Audio Quality Issues**
   - Verify Deepgram API key is valid
   - Check Cartesia API key configuration
   - Ensure proper noise cancellation settings

3. **High Latency**
   - Consider using Modal's GPU instances
   - Check network connectivity to LiveKit
   - Optimize agent response times

### Debug Commands

```bash
# Check Modal app status
modal app status clara-voice-agent

# View logs
modal logs clara-voice-agent

# Redeploy with changes
modal deploy modal_app.py
```

## 🔄 Updates and Maintenance

### Updating the Agent
1. Modify `modal_app.py` with your changes
2. Run `modal deploy modal_app.py`
3. Modal will automatically update the deployment

### Environment Variables
To update secrets:
1. Go to Modal dashboard > Secrets
2. Update the required values
3. Redeploy: `modal deploy modal_app.py`

## 📈 Performance Optimization

### Best Practices
1. **Session Management**: Implement proper session cleanup
2. **Error Handling**: Add comprehensive error handling
3. **Logging**: Use structured logging for debugging
4. **Monitoring**: Set up alerts for critical issues

### Scaling Considerations
- **Concurrent Sessions**: Modal handles multiple concurrent sessions
- **Memory Usage**: Monitor memory usage in Modal dashboard
- **Cost Management**: Set up billing alerts

## 🎯 Next Steps

1. **Customize Agent**: Modify the `ClaraAssistant` class for your specific needs
2. **Add Features**: Implement additional visual generation capabilities
3. **Integration**: Connect with your existing frontend application
4. **Analytics**: Add usage tracking and analytics

## 📞 Support

- **Modal Documentation**: [docs.modal.com](https://docs.modal.com)
- **LiveKit Documentation**: [docs.livekit.io](https://docs.livekit.io)
- **Community**: Join Modal and LiveKit Slack communities

---

**Happy Deploying! 🚀** 