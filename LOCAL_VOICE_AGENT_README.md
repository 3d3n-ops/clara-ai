# Local Voice Agent Script

This is a standalone local implementation of the Clara AI voice agent that can run independently without the web application.

## Features

- **Text-based chat interface** - Interact with Clara using text commands
- **Visual content generation** - Create diagrams, flashcards, quizzes, and mindmaps
- **Session management** - Track conversation history and session time
- **Local file storage** - Save generated content and session data locally
- **Voice command processing** - Understand natural language commands

## Quick Start

1. **Run the script:**
   ```bash
   python local_voice_agent.py
   ```

2. **Start chatting:**
   ```
   💬 You: hello
   🤖 Clara: Hello! I'm Clara, your study assistant. How can I help you with your studies today?
   ```

## Available Commands

### Visual Generation Commands
- `create diagram [topic]` - Generate a process diagram
- `make flashcards [topic]` - Create study flashcards  
- `show quiz [topic]` - Generate a quiz
- `create mindmap [topic]` - Make a mindmap

### General Commands
- `help` - Show available commands
- `bye` or `quit` - End session

## Examples

### Creating a Diagram
```
💬 You: create diagram photosynthesis
🤖 Clara: I've created a process diagram for photosynthesis! This shows the key steps and flow. You can find the detailed diagram in your generated content folder.
```

### Making Flashcards
```
💬 You: make flashcards math
🤖 Clara: I've generated study flashcards for math! These cards will help you review and test your knowledge. Check the generated content folder for the complete set.
```

### Generating a Quiz
```
💬 You: show quiz history
🤖 Clara: I've created a quiz about history! This will help you test your understanding and identify areas for improvement. The quiz is saved in your generated content folder.
```

## Generated Content

All generated content is saved in the `generated_content/` directory:

- **Diagrams**: `diagram_[topic]_[timestamp].json`
- **Flashcards**: `flashcards_[topic]_[timestamp].json`
- **Quizzes**: `quiz_[topic]_[timestamp].json`
- **Mindmaps**: `mindmap_[topic]_[timestamp].json`
- **Sessions**: `session_[timestamp].json`

## Session Management

- **Session duration**: 10 minutes (configurable)
- **Auto-save**: Sessions are automatically saved when you exit
- **Time tracking**: Shows remaining session time
- **Conversation history**: All messages are logged

## File Structure

```
clara-ai/
├── local_voice_agent.py          # Main script
├── local_requirements.txt        # Dependencies
├── LOCAL_VOICE_AGENT_README.md  # This file
└── generated_content/            # Output directory (created automatically)
    ├── diagram_photosynthesis_20241201_143022.json
    ├── flashcards_math_20241201_143045.json
    ├── quiz_history_20241201_143100.json
    └── session_20241201_143022.json
```

## Customization

### Modifying Session Duration
Edit the `session_duration` variable in the `LocalClaraAssistant` class:

```python
self.session_duration = 600  # 10 minutes in seconds
```

### Adding New Visual Commands
Add new command patterns to the `visual_commands` dictionary:

```python
self.visual_commands = {
    'diagram': [...],
    'flashcard': [...],
    'quiz': [...],
    'mindmap': [...],
    'new_type': [
        r'create new_type',
        r'make new_type'
    ]
}
```

### Customizing Responses
Modify the `process_message` method to add custom response patterns.

## Troubleshooting

### Common Issues

1. **Permission denied**: Make sure you have write permissions in the current directory
2. **Import errors**: The script uses only standard library modules, so no additional installation is needed
3. **File not found**: The script will create the `generated_content` directory automatically

### Debug Mode

To enable debug output, add this line at the top of the script:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Integration with Web Application

This local script uses the same core logic as the web application's voice agent:

- **Backend**: `backend/modal_app.py` - Modal deployment
- **Frontend**: `hooks/use-voice-agent.ts` - React hook
- **Local**: `local_voice_agent.py` - Standalone script

The local script provides a simplified version for development and testing without requiring the full web stack.

## Future Enhancements

- [ ] Add voice input/output capabilities
- [ ] Integrate with actual AI models (OpenAI, etc.)
- [ ] Add more visual content types
- [ ] Implement user preferences and settings
- [ ] Add export functionality (PDF, images)
- [ ] Create a GUI interface

## Contributing

To extend the local voice agent:

1. Add new command patterns to `visual_commands`
2. Implement new content generation methods
3. Update response templates
4. Test with various input scenarios

The script is designed to be easily extensible while maintaining the core voice agent functionality. 