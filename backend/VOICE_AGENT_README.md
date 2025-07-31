# Clara AI Voice Agent

This directory contains the Clara AI voice agent implementation using LiveKit's agents framework.

## Overview

The voice agent provides two implementations:

1. **Simple Voice Agent** (`simple_voice_agent.py`) - Basic implementation following LiveKit's standard pattern
2. **Advanced Voice Agent** (`advanced_voice_agent.py`) - Enhanced implementation with visual content generation capabilities

## Features

### Simple Voice Agent
- Basic voice conversation using LiveKit
- Speech-to-text using Deepgram
- Text-to-speech using Cartesia
- Voice activity detection using Silero
- Turn detection for natural conversation flow

### Advanced Voice Agent
- All features from simple agent
- Visual content generation (diagrams, flashcards, quizzes, mindmaps)
- Session management with time limits
- Educational focus with study assistance
- Voice command detection for visual content

## Prerequisites

1. **LiveKit Account**: You need a LiveKit account and API keys
2. **OpenAI API Key**: For the language model
3. **Deepgram API Key**: For speech-to-text
4. **Cartesia API Key**: For text-to-speech

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# LiveKit Configuration
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key

# Cartesia Configuration
CARTESIA_API_KEY=your_cartesia_api_key
```

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your environment variables in the `.env` file

## Usage

### Starting the Voice Agent

Use the startup script to choose between simple and advanced modes:

```bash
# Start advanced voice agent (default)
python start_voice_agent.py

# Start simple voice agent
python start_voice_agent.py --mode simple

# Start on a specific port
python start_voice_agent.py --port 8766
```

### Direct Execution

You can also run the agents directly:

```bash
# Simple agent
python simple_voice_agent.py

# Advanced agent
python advanced_voice_agent.py
```

## Voice Commands (Advanced Agent)

The advanced voice agent supports the following voice commands for visual content generation:

### Diagrams
- "Create diagram for [topic]"
- "Draw this [concept]"
- "Visualize [topic]"
- "Show diagram of [concept]"

### Flashcards
- "Make flashcards for [topic]"
- "Create cards for [concept]"
- "Study cards for [topic]"

### Quizzes
- "Show quiz for [topic]"
- "Test me on [concept]"
- "Quiz me about [topic]"

### Mindmaps
- "Mind map for [topic]"
- "Organize ideas about [concept]"
- "Connect concepts for [topic]"

## Architecture

### Simple Voice Agent
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Speech   │───▶│  Deepgram STT   │───▶│  OpenAI LLM     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cartesia TTS   │◀───│  Agent Logic    │◀───│  Response Text  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Advanced Voice Agent
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Speech   │───▶│  Deepgram STT   │───▶│  Command Detect  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Visual Content │◀───│  Content Gen    │◀───│  Visual Command │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cartesia TTS   │◀───│  Agent Logic    │◀───│  OpenAI LLM     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Session Management

The advanced agent includes session management features:

- **Session Duration**: 10-minute study sessions
- **Wind Down**: 3 minutes before end, starts reviewing
- **Re-teaching**: 1 minute before end, asks student to reteach concepts
- **Session Summary**: Ends with learning summary request

## Integration with Frontend

The voice agent can be integrated with the frontend through:

1. **LiveKit Rooms**: Connect to voice rooms via LiveKit
2. **Data Channels**: Send visual content via WebRTC data channels
3. **WebSocket**: For additional communication if needed

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all dependencies are installed
   ```bash
   pip install livekit-agents livekit-plugins
   ```

2. **API Key Errors**: Verify all API keys are set in `.env`

3. **Port Conflicts**: Use `--port` flag to specify different port

4. **LiveKit Connection**: Ensure LiveKit URL and credentials are correct

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=DEBUG
```

## Development

### Adding New Visual Commands

1. Add command patterns to `visual_commands` dictionary
2. Implement generation method in the agent class
3. Add voice response template

### Customizing the Agent

1. Modify the `instructions` in the agent constructor
2. Adjust session management parameters
3. Add new plugins as needed

## API Reference

### AgentSession
- `session.start()`: Start the agent session
- `session.speak(text)`: Convert text to speech
- `session.generate_reply(instructions)`: Generate LLM response
- `session.send_data(data)`: Send data via WebRTC

### VisualCommand
- `command_type`: Type of visual content (diagram, flashcard, quiz, mindmap)
- `topic`: The topic for visual content generation
- `context`: Additional context from the user's message

## License

This implementation is part of the Clara AI project. 