# Local LiveKit Agent for Clara.ai

This is a carbon copy clone of your Modal-based LiveKit agent that runs locally for faster testing and iteration.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r local_requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp env.local.example .env
   # Edit .env with your LiveKit and Google Cloud credentials
   ```

3. **Run the agent:**
   ```bash
   python run_local_agent.py [room_name]
   ```
   
   Example:
   ```bash
   python run_local_agent.py my-test-room
   ```

## Features

### ✅ Identical to Modal Version
- Same Google Gemini LLM integration
- Same Google TTS (Text-to-Speech)
- Same Silero VAD (Voice Activity Detection)
- Same enhanced debugging and logging
- Same voice timeout detection (30-second warnings)

### 🚀 Local Development Benefits
- **Instant startup** - No Modal deployment wait time
- **Real-time logs** - See all debugging output immediately
- **Quick iterations** - Modify code and restart instantly
- **No deployment costs** - Run locally for free

### 🔍 Enhanced Debugging
The local agent includes all the voice detection debugging:
- `🎤 [USER SPEECH DETECTED]` - Voice captured successfully
- `🗣️ [USER STARTED SPEAKING]` - Voice activity detected
- `✅ [TRANSCRIBED]` - Speech-to-text successful
- `❌ [TRANSCRIPTION FAILED]` - Transcription errors with suggestions
- `🔊 [AUDIO MONITOR]` - Microphone activity confirmation
- `🔇 [VOICE TIMEOUT]` - 30-second silence warnings

## Usage Examples

### Basic Testing
```bash
python run_local_agent.py test-room
```

### Custom Room Name
```bash
python run_local_agent.py "clara-session-123"
```

### Direct Script Usage
```bash
python local_livekit_agent.py my-room
```

## Environment Variables

Required in your `.env` file:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here

# Google Cloud (choose one method)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
# OR
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

## Testing Workflow

1. **Start local agent:**
   ```bash
   python run_local_agent.py test-room
   ```

2. **Open your web app** and join the same room name

3. **Test voice interaction** - watch the detailed logs

4. **Make changes** to `local_livekit_agent.py`

5. **Restart agent** (Ctrl+C, then run again)

6. **Repeat** - much faster than Modal deployments!

## Differences from Modal Version

- **No Modal decorators** - Pure Python classes and functions
- **Direct room connection** - No webhook handling needed
- **Local environment** - Uses `.env` file instead of Modal secrets
- **Immediate feedback** - All logs visible in terminal

## Troubleshooting

### Agent won't start
- Check `.env` file has all required variables
- Verify Google credentials are valid
- Ensure LiveKit server is accessible

### Voice not detected
- Look for `🔊 [AUDIO MONITOR]` messages - confirms microphone access
- Check browser microphone permissions
- Wait for 30-second timeout message with guidance

### Connection issues
- Verify `LIVEKIT_URL` is correct and accessible
- Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are valid
- Ensure room name matches between agent and web app
