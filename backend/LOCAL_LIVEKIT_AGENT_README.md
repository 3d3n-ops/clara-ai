# Local LiveKit Agent Setup Guide

## Overview

This guide helps you set up and run the Clara AI LiveKit agent locally without requiring Modal deployment. The local agent provides the same functionality as the production Modal deployment but runs entirely on your local machine.

## What is the Local LiveKit Agent?

The local LiveKit agent is a Python script that simulates the LiveKit voice agent functionality locally. It includes:

- **Mock LiveKit Components**: Simulates LiveKit rooms, sessions, and connections
- **Clara AI Assistant**: Full implementation of the Clara study assistant
- **Visual Content Generation**: Creates diagrams, flashcards, quizzes, and mind maps
- **Session Management**: 10-minute study sessions with automatic winding down
- **Local File Storage**: Saves all generated content to the `generated_content/` directory

## Prerequisites

- **Python 3.7+** (Python 3.8+ recommended)
- **No external dependencies** - all required modules are built-in Python modules

## Quick Start

### 1. Navigate to the Backend Directory

```bash
cd backend/
```

### 2. Run the Agent

**Windows:**
```cmd
run_local_livekit_agent.bat
```

**Unix/Linux/macOS:**
```bash
chmod +x run_local_livekit_agent.sh
./run_local_livekit_agent.sh
```

**Direct Python execution:**
```bash
python local_livekit_agent.py
```

## How It Works

### Architecture

```
Local LiveKit Agent Script
├── MockLiveKitContext (simulates LiveKit connection)
├── MockRoom (simulates LiveKit room)
├── MockAgentSession (simulates LiveKit session)
└── LocalClaraAssistant (Clara AI implementation)
```

### Session Flow

1. **Initialization**: Creates mock LiveKit room and user
2. **Connection**: Simulates connecting to LiveKit room
3. **Agent Start**: Initializes Clara AI assistant
4. **Session Management**: Runs 10-minute study session
5. **Content Generation**: Processes visual commands and generates content
6. **Session End**: Automatically ends after 10 minutes or user command

## Available Commands

### Visual Content Commands

- **`create diagram [topic]`** - Generate visual diagrams
- **`make flashcards [topic]`** - Create study flashcards
- **`show quiz [topic]`** - Generate interactive quizzes
- **`create mindmap [topic]`** - Create mind maps

### Session Commands

- **`help`** - Show available commands and features
- **`time`** - Check remaining session time
- **`bye`** - End session early

### Examples

```
> create diagram photosynthesis
> make flashcards math formulas
> show quiz biology
> create mindmap history timeline
> help
> time
> bye
```

## Generated Content

All generated content is saved to the `generated_content/` directory with timestamped filenames:

- **Diagrams**: `diagram_[topic]_[timestamp].json`
- **Flashcards**: `flashcards_[topic]_[timestamp].json`
- **Quizzes**: `quiz_[topic]_[timestamp].json`
- **Mind Maps**: `mindmap_[topic]_[timestamp].json`
- **Sessions**: `session_[timestamp].json`

## Session Management

### Automatic Features

- **10-minute timer**: Sessions automatically end after 10 minutes
- **Winding down**: 2 minutes before end, agent warns about session ending
- **Session saving**: All session data is automatically saved
- **Heartbeat monitoring**: Regular status updates every 10 seconds

### Session States

1. **Active**: First 8 minutes - full functionality
2. **Winding Down**: 8-10 minutes - gentle reminders
3. **Complete**: After 10 minutes - automatic termination

## Customization

### Modifying Session Duration

Edit the `session_duration` variable in `LocalClaraAssistant.__init__()`:

```python
self.session_duration = 1800  # 30 minutes instead of 10
```

### Adding New Visual Commands

Extend the `visual_commands` dictionary in `LocalClaraAssistant.__init__()`:

```python
'new_type': [
    r'create new_type',
    r'make new_type',
    r'generate new_type'
]
```

### Customizing Agent Personality

Modify the `instructions` string in `LocalClaraAssistant.__init__()` to change Clara's personality and capabilities.

## Troubleshooting

### Common Issues

**"Module not found" errors:**
- Ensure you're running from the `backend/` directory
- Check that Python 3.7+ is installed and in your PATH

**Permission errors (Unix/Linux):**
- Make the shell script executable: `chmod +x run_local_livekit_agent.sh`

**Content not saving:**
- Check that the `generated_content/` directory exists
- Ensure write permissions in the current directory

### Debug Mode

The script includes extensive logging. Look for messages starting with `[Local LiveKit]` to track the agent's behavior.

## Comparison with Production

| Feature | Local Agent | Production Modal |
|---------|-------------|------------------|
| **Deployment** | Local machine | Modal cloud |
| **LiveKit** | Mocked/simulated | Real LiveKit Cloud |
| **Voice** | Text-based | Real-time voice |
| **Performance** | Local resources | GPU-accelerated |
| **Cost** | Free | Modal usage costs |
| **Scalability** | Single user | Multiple concurrent users |
| **Development** | Instant iteration | Deploy and test |

## Development Workflow

### 1. Local Development
- Use the local agent for rapid development and testing
- Test new features without deployment delays
- Debug issues in your local environment

### 2. Production Testing
- Deploy to Modal for integration testing
- Test with real LiveKit infrastructure
- Validate performance and scalability

### 3. Iteration
- Make changes locally
- Test thoroughly
- Deploy to production when ready

## File Structure

```
backend/
├── local_livekit_agent.py          # Main agent script
├── local_livekit_requirements.txt  # Dependencies (built-in modules)
├── run_local_livekit_agent.bat    # Windows batch file
├── run_local_livekit_agent.sh     # Unix/Linux shell script
├── LOCAL_LIVEKIT_AGENT_README.md  # This file
└── generated_content/              # Generated content directory
    ├── diagrams/
    ├── flashcards/
    ├── quizzes/
    ├── mindmaps/
    └── sessions/
```

## Next Steps

1. **Run the agent** using one of the provided scripts
2. **Test visual commands** to generate different types of content
3. **Customize the agent** for your specific needs
4. **Integrate with your workflow** for development and testing

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the script logs for error messages
3. Ensure you're using the correct Python version
4. Verify file permissions and directory structure

The local LiveKit agent provides a powerful development and testing environment that mirrors the production Modal deployment while running entirely on your local machine. 