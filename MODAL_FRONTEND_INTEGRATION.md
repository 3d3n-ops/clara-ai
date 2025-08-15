# Modal App Frontend Integration

This document describes the frontend changes made to integrate with the Modal app for Clara AI voice sessions.

## Overview

The frontend has been updated to handle the new connection setup with the Modal app, implementing a proper LiveKit-based voice session system that connects to Clara AI agents deployed on Modal.

## Key Components

### 1. `useClaraVoiceSession` Hook (`hooks/use-clara-voice-session.ts`)

A custom React hook that manages the entire voice session lifecycle:

- **Session Management**: Start, end, and monitor session status
- **LiveKit Integration**: Handles room connections, participant events, and audio tracks
- **Agent Communication**: Sends/receives text messages and visual content requests
- **State Management**: Tracks connection status, agent availability, and session data

#### Key Features:
- Automatic room creation with unique names
- LiveKit token generation from backend
- Real-time participant monitoring
- Audio track management
- Data message handling for agent communication

### 2. Updated Modal Voice Room Component (`components/modal-voice-room.tsx`)

The main UI component that provides:

- **Connection Interface**: Start/stop session controls
- **Voice Controls**: Microphone toggle and audio controls
- **Message System**: Text-based communication with Clara
- **Visual Content**: Quick action buttons for generating diagrams, flashcards, quizzes, and mindmaps
- **Session Status**: Real-time connection and agent status indicators
- **Participant List**: Shows connected users and agent status

### 3. Enhanced LiveKit Token API (`app/api/livekit/token/route.ts`)

Updated to return both token and WebSocket URL:

```typescript
// Response now includes:
{
  token: "livekit_jwt_token",
  wsUrl: "wss://your-livekit-instance.livekit.cloud"
}
```

## Connection Flow

### 1. Session Initialization
```
User clicks "Start Session" 
→ Frontend generates unique room name
→ Backend creates LiveKit token
→ Frontend connects to LiveKit room
→ Modal app webhook triggers agent assignment
→ Clara AI agent joins the room
```

### 2. Agent Communication
```
User speaks/types message
→ Frontend sends data message to room
→ Modal app processes message
→ Clara AI responds via audio/data
→ Frontend receives and displays response
```

### 3. Visual Content Generation
```
User requests visual content
→ Frontend sends visual command
→ Modal app generates content
→ Content sent back via data message
→ Frontend displays generated content
```

## Environment Variables

Required environment variables for the frontend:

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud

# Backend Configuration (for token generation)
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
```

## Usage Example

```typescript
import { useClaraVoiceSession } from '@/hooks/use-clara-voice-session'

function MyComponent() {
  const {
    status,
    messages,
    startSession,
    endSession,
    sendTextMessage,
    requestVisualContent
  } = useClaraVoiceSession({
    userId: 'user-123'
  })

  const handleStart = async () => {
    const result = await startSession()
    if (result.success) {
      console.log('Session started:', result.roomName)
    }
  }

  return (
    <div>
      <button onClick={handleStart}>Start Session</button>
      <button onClick={() => sendTextMessage('Hello Clara!')}>Send Message</button>
      <button onClick={() => requestVisualContent('Create a diagram', 'photosynthesis')}>
        Generate Diagram
      </button>
    </div>
  )
}
```

## Testing

### Test Page
Navigate to `/modal-test` to test the complete Modal app integration.

### Manual Testing Steps
1. Start a session
2. Verify LiveKit connection
3. Check agent assignment (should see "Clara Ready" badge)
4. Test text message sending
5. Test visual content generation
6. Verify session cleanup on end

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check LiveKit credentials in environment
   - Verify Modal app is running and accessible
   - Check browser console for error messages

2. **Agent Not Joining**
   - Verify Modal app webhook configuration
   - Check LiveKit room permissions
   - Ensure agent deployment is active

3. **Audio Issues**
   - Check microphone permissions
   - Verify LiveKit audio configuration
   - Test with different browsers

### Debug Information

The hook provides comprehensive status information:

```typescript
const { status } = useClaraVoiceSession(config)

// Status includes:
// - isConnected: LiveKit room connection status
// - agentConnected: Whether Clara agent has joined
// - roomName: Current room identifier
// - error: Any connection or session errors
```

## Future Enhancements

1. **Audio Visualization**: Add real-time audio waveform display
2. **Session Recording**: Implement session recording and playback
3. **Multi-modal Input**: Support for file uploads and screen sharing
4. **Advanced Controls**: Volume control, audio device selection
5. **Session History**: Persistent session logs and analytics

## Security Considerations

1. **Token Management**: LiveKit tokens are generated server-side with proper permissions
2. **Room Isolation**: Each session gets a unique room name
3. **Participant Validation**: Agent identity verification through naming conventions
4. **Data Encryption**: All communication goes through LiveKit's encrypted channels

## Performance Notes

1. **Connection Pooling**: LiveKit handles connection optimization
2. **Audio Quality**: Configurable audio presets for different use cases
3. **Memory Management**: Proper cleanup of audio tracks and room connections
4. **Error Recovery**: Automatic reconnection attempts on connection loss 