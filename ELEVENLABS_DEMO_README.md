# ElevenLabs Demo Page

## Overview

The ElevenLabs Demo page (`/elevenlabs-demo`) provides a clean, focused interface for testing the ElevenLabs voice agent functionality. This demo is specifically designed to showcase the voice interaction capabilities with a simplified, user-friendly interface.

## Features

### Voice Interface
- **Large Circular Microphone Button**: Prominent voice control with visual feedback
- **Real-time Status Indicators**: Shows listening, processing, and ready states
- **Visual Voice Visualizer**: Animated circular interface with gradient background
- **Connection Status**: Real-time connection indicator in the header

### Chat Interface
- **Message History**: Displays conversation history with user and assistant messages
- **Quick Action Buttons**: Pre-configured buttons for common interactions:
  - Create Flashcards
  - Generate Quiz
  - Create Diagram
  - Explain Topic
- **Responsive Design**: Adapts to different screen sizes

### Technical Details
- **Agent ID**: Uses ElevenLabs agent ID `h31FVt7CMU4ALZLMnpe8`
- **API Integration**: Connects to `/api/elevenlabs/chat` endpoint
- **Error Handling**: Graceful error handling with user-friendly messages
- **State Management**: Proper React state management for UI interactions

## Navigation

### Access Points
1. **Dashboard**: Button in the main dashboard action area
2. **Voice Test Page**: Link from the voice test page for alternative demo
3. **Direct URL**: Navigate directly to `/elevenlabs-demo`

### Navigation Flow
```
Dashboard → ElevenLabs Demo
Voice Test → Try Simple Demo → ElevenLabs Demo
```

## Usage

### Starting a Voice Session
1. Click the large circular microphone button
2. Grant microphone permissions when prompted
3. Speak your request or question
4. Click the button again to stop recording

### Using Quick Actions
1. Click any of the quick action buttons in the chat panel
2. The system will send a pre-configured message to the agent
3. View the response in the chat history

### Testing Different Scenarios
- **Flashcards**: "Create flashcards for photosynthesis"
- **Quizzes**: "Generate a quiz about math"
- **Diagrams**: "Draw a diagram of the water cycle"
- **Explanations**: "Explain quantum physics simply"

## API Integration

The demo integrates with the existing ElevenLabs API route:

```typescript
POST /api/elevenlabs/chat
{
  "message": "string",
  "agent_id": "h31FVt7CMU4ALZLMnpe8"
}
```

## UI Components

### Main Layout
- **Header**: Navigation and connection status
- **Voice Interface**: Large circular microphone with status
- **Chat Panel**: Message history and quick actions
- **Info Section**: Technical details and documentation

### Responsive Design
- **Desktop**: 3-column layout with voice interface taking 2/3 width
- **Tablet**: Stacked layout with voice interface on top
- **Mobile**: Single column layout optimized for touch

## Development

### File Structure
```
app/elevenlabs-demo/
└── page.tsx          # Main demo page component
```

### Dependencies
- React hooks for state management
- Shadcn/ui components for consistent styling
- Lucide React for icons
- Next.js for routing and API integration

### Customization
The demo can be easily customized by:
- Modifying the quick action buttons
- Changing the voice visualizer styling
- Adding new API endpoints
- Customizing the chat interface

## Troubleshooting

### Common Issues
1. **Microphone not working**: Check browser permissions
2. **API errors**: Verify ElevenLabs API key configuration
3. **Connection issues**: Check network connectivity

### Debug Information
- Connection status is displayed in the header
- API responses are logged to browser console
- Error messages are shown in the chat interface

## Future Enhancements

Potential improvements for the demo:
- Real-time voice streaming
- Screen sharing capabilities
- Multi-language support
- Advanced voice commands
- Integration with other AI services 