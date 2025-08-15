# Local LiveKit Agent Setup Guide

## Overview

This guide explains how to set up and use the local LiveKit agent with your Clara AI frontend. The local agent provides a fully functional voice study assistant that runs locally without requiring cloud services.

## Architecture

```
Frontend (Next.js) → Local Agent Server (Flask) → Local LiveKit Agent (Python)
```

1. **Frontend**: Study page with voice interface
2. **Local Agent Server**: Flask server handling agent requests (port 5001)
3. **Local LiveKit Agent**: Python script simulating LiveKit agent behavior

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or pnpm package manager

## Setup Instructions

### 1. Backend Setup

Navigate to the `backend` directory and set up the local agent server:

```bash
cd backend

# Windows
start_local_agent_server.bat

# Unix/Linux/macOS
chmod +x start_local_agent_server.sh
./start_local_agent_server.sh
```

The server will:
- Create a virtual environment if it doesn't exist
- Install required dependencies
- Start the Flask server on `http://localhost:5001`

### 2. Frontend Setup

The frontend is already configured to use the local agent server. The study page (`/chat/study`) will automatically connect to the local agent when you start a voice session.

### 3. Testing the Setup

Before starting your frontend, test that the local agent server is working:

```bash
cd backend
python test_local_agent.py
```

This will test all the API endpoints and verify the server is working correctly.

### 4. Environment Variables

For local development, no special environment variables are needed. The frontend will connect directly to the local agent server on port 5001.

If you want to use LiveKit later, you can add these to your `.env.local` file:

```env
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

## Usage

### Starting a Study Session

1. Start the local agent server (see Backend Setup above)
2. Test the server with `python test_local_agent.py`
3. Start your frontend with `npm run dev` or `pnpm dev`
4. Navigate to `/chat/study` in your browser
5. Click "Start Voice Session"
6. The frontend will connect to the local agent server
7. Use the voice interface to interact with Clara

### Voice Commands

The local agent supports the following voice commands:

- **"create diagram [topic]"** - Generate visual diagrams
- **"make flashcards [topic]"** - Create study cards
- **"show quiz [topic]"** - Test your knowledge
- **"create mindmap [topic]"** - Visualize concepts
- **"help"** - Show available commands
- **"bye"** - End the session

### Text Chat

You can also type messages in the chat interface on the right side of the screen.

## Features

### ✅ Voice Interface
- Real-time voice recording and playback
- Visual feedback during conversation
- Screen sharing support

### ✅ AI Assistant
- Natural language processing
- Context-aware responses
- Study session management

### ✅ Visual Content Generation
- Diagrams and flowcharts
- Interactive flashcards
- Knowledge quizzes
- Mind maps

### ✅ Session Management
- Automatic session timing
- Progress tracking
- Content saving

## API Endpoints

The local agent server provides the following endpoints:

- `POST /api/local-livekit/start-agent` - Start a new agent session
- `POST /api/local-livekit/chat` - Send messages and get responses
- `POST /api/local-livekit/end-session` - End a session
- `GET /api/local-livekit/status` - Get agent status
- `GET /health` - Health check

## Troubleshooting

### Common Issues

1. **Agent won't start**
   - Check if the Flask server is running on port 5001
   - Verify Python dependencies are installed
   - Check console for error messages

2. **Voice recording issues**
   - Ensure microphone permissions are granted
   - Check browser console for errors
   - Verify audio devices are working

3. **Connection errors**
   - Check if LiveKit server is accessible
   - Verify environment variables are set
   - Check network connectivity

### Debug Mode

The local agent server runs in debug mode by default. Check the terminal output for detailed logging and error messages.

## Development

### Modifying the Agent

The local agent behavior is defined in `backend/local_livekit_agent.py`. You can modify:

- Agent personality and responses
- Visual content generation
- Session management logic
- Command processing

### Adding New Features

1. Update the agent logic in `local_livekit_agent.py`
2. Add new API endpoints in `run_local_agent_server.py`
3. Update the frontend component in `local-livekit-voice-room.tsx`

## Performance

The local agent is designed for development and testing. For production use, consider:

- Using the cloud-based LiveKit agent
- Implementing proper speech-to-text services
- Adding authentication and user management
- Scaling the backend infrastructure

## Security Notes

- The local agent server runs without authentication
- All data is stored locally
- No external API calls are made
- Suitable for development and testing only

## Next Steps

Once you're comfortable with the local agent:

1. Test all voice commands and features
2. Customize the agent's personality and responses
3. Integrate with your existing study materials
4. Consider deploying the cloud-based version for production

## Support

If you encounter issues:

1. Check the terminal output for error messages
2. Verify all dependencies are installed
3. Ensure the Flask server is running
4. Check browser console for frontend errors

The local agent provides a solid foundation for testing and developing Clara AI's voice capabilities before moving to production deployment. 