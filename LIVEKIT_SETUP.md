# LiveKit Voice Assistant Setup Guide

This guide will help you connect your Clara.ai voice assistant backend to your frontend using LiveKit.

## Prerequisites

1. **LiveKit Cloud Account** (or self-hosted LiveKit server)
   - Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
   - Create a new project
   - Get your API Key and Secret

2. **API Keys Required:**
   - LiveKit API Key & Secret
   - OpenAI API Key (for the LLM)
   - Cartesia API Key (for TTS)
   - Deepgram API Key (for STT)

## Setup Steps

### 1. Environment Configuration

Create a `.env.local` file in your project root:

```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Clerk Authentication (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Backend Voice Agent APIs
OPENAI_API_KEY=your_openai_api_key_here
CARTESIA_API_KEY=your_cartesia_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

### 2. Install Backend Dependencies

Create a `requirements.txt` file in the `backend/` directory:

```txt
livekit
livekit-agents[openai,cartesia,deepgram,silero]
python-dotenv
```

Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### 3. Frontend Integration

The frontend has been updated to include:
- LiveKit React components
- Voice assistant room interface
- Control bar with screen sharing, chat, and voice controls
- Real-time connection management

### 4. Running the Application

#### Start the Frontend:
```bash
npm run dev
```

#### Start the Voice Agent:
```bash
cd backend
python voice_agent.py start
```

## Features Included

### Frontend Features:
- ✅ **Voice Chat Interface:** Real-time voice communication with Clara
- ✅ **Control Bar:** Microphone, screen share, chat, and leave controls
- ✅ **Text Chat:** Sidebar chat for text-based communication
- ✅ **Screen Sharing:** Share your screen for collaborative learning
- ✅ **Participant Management:** See who's in the session
- ✅ **Connection Status:** Real-time connection monitoring
- ✅ **Responsive Design:** Works on desktop and mobile

### Backend Features:
- ✅ **AI Assistant (Clara):** Intelligent study companion
- ✅ **Voice Processing:** High-quality speech-to-text and text-to-speech
- ✅ **Multi-language Support:** Works with multiple languages
- ✅ **Noise Cancellation:** Enhanced audio quality
- ✅ **Room Management:** Automatic room joining and management

## Usage

1. **Navigate to Study Session:** Go to `/chat/study`
2. **Start Session:** Click "Start Voice Session"
3. **Wait for Clara:** The AI assistant will join automatically
4. **Begin Conversation:** Start speaking - Clara will respond with voice and text
5. **Use Features:** 
   - Click microphone to mute/unmute
   - Click screen share to share your screen
   - Click chat to open text chat
   - Click participants to see who's connected

## Troubleshooting

### Common Issues:

1. **"Failed to generate token" error:**
   - Check your LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local
   - Ensure your LiveKit project is active

2. **Voice agent not joining:**
   - Make sure the backend is running (`python voice_agent.py start`)
   - Check that all API keys are configured in the backend .env

3. **Audio not working:**
   - Check microphone permissions in browser
   - Ensure you're using HTTPS (required for audio access)

4. **Connection issues:**
   - Verify NEXT_PUBLIC_LIVEKIT_URL is correct
   - Check network connectivity

### Debug Mode:

Add to your .env.local for debugging:
```env
LIVEKIT_LOG_LEVEL=debug
```

## Architecture

```
Frontend (Next.js)
├── Study Page (/chat/study)
├── LiveKit Room Component
├── Token Generation API (/api/livekit/token)
└── Voice Assistant Interface

Backend (Python)
├── Clara AI Agent
├── Speech Recognition (Deepgram)
├── Language Model (OpenAI)
├── Text-to-Speech (Cartesia)
└── LiveKit Connection
```

## Next Steps

1. **Customize Clara:** Modify the AI assistant personality in `backend/voice_agent.py`
2. **Add Features:** Extend the interface with additional study tools
3. **Deploy:** Deploy both frontend and backend for production use
4. **Monitor:** Use LiveKit dashboard to monitor usage and performance

For support, check the [LiveKit documentation](https://docs.livekit.io/) or reach out to the development team. 