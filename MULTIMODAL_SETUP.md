# Clara.ai Multimodal Setup Guide

## 🎯 Overview
Clara.ai now supports multimodal interactions with:
- **Voice conversation** (existing LiveKit integration)
- **Text chat** (fallback and simultaneous use)
- **Screen sharing** with AI visual understanding via Gemini 2.0 Flash

## 🔧 Setup Requirements

### 1. Google AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:
   ```
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   ```

### 2. Dependencies Installed
- `@google/generative-ai` for Gemini integration
- All existing LiveKit and UI dependencies

## 🚀 Features

### Text Chat Interface
- **Side-by-side with voice**: Students can type OR speak
- **Unified conversation**: Both text and voice share context
- **Real-time responses**: Powered by OpenAI GPT-4o-mini
- **Accessibility**: Full keyboard navigation support

### Screen Sharing + AI Vision
- **WebRTC capture**: Browser-native screen/tab sharing
- **Smart analysis**: Gemini 2.0 Flash processes screen content
- **Educational focus**: AI identifies study materials, code, errors
- **Rate limiting**: Processes frames every 2 seconds for cost efficiency
- **Privacy first**: No storage of screen captures

### Intelligent Responses
- **Context-aware**: AI understands what student is viewing
- **Helpful only**: Only responds when it can provide educational value
- **Error detection**: Identifies when students are stuck
- **Code assistance**: Helps with programming problems
- **Study support**: Recognizes educational content

## 🎮 Usage

### Starting a Session
1. Navigate to `/chat/study`
2. Click "Start Voice Session"
3. Clara loads with voice + chat interface

### Using Text Chat
- Type in the chat input at bottom right
- Messages appear in conversation history
- Clara responds contextually to both voice and text

### Screen Sharing
1. Click "Share Screen" button in chat interface
2. Select window/tab/screen to share
3. Clara automatically analyzes what you're working on
4. Receive proactive help when stuck

### Voice + Text + Screen
- Use all three modes simultaneously
- Clara maintains unified context
- Switch between input methods seamlessly

## 🧠 AI Routing Logic

### Text-only Messages
- Routed to **OpenAI GPT-4o-mini**
- Fast, cost-effective responses
- Educational personality and prompting

### Screen Sharing Active
- Visual content routed to **Gemini 2.0 Flash**
- Multimodal understanding (text + image)
- Smart triggering (only when helpful)
- Screen context added to responses

### Cost Optimization
- **Frame rate**: 2-3 FPS max
- **Smart sampling**: Only process changed screens
- **Response filtering**: AI only speaks when helpful
- **Caching**: Avoid duplicate analyses

## 📊 Expected Costs
- **Voice**: ~$0.10/minute (existing)
- **Text chat**: ~$0.02/message
- **Screen analysis**: ~$0.55-0.78/minute when active
- **Total**: Very reasonable for premium tutoring experience

## 🔒 Privacy & Security
- **No storage**: Screen captures not saved
- **User control**: Clear start/stop for sharing
- **Rate limiting**: Prevents abuse
- **Secure processing**: Server-side image handling

## 🐛 Troubleshooting

### Screen Sharing Not Working
- Check browser permissions for screen capture
- Try refreshing and re-granting permissions
- Ensure HTTPS (required for WebRTC)

### Gemini API Errors
- Verify `GOOGLE_AI_API_KEY` is set correctly
- Check API quota and billing in Google Cloud
- Fallback to text-only mode if needed

### Chat Not Responding
- Check network connection
- Verify OpenAI API key is valid
- Check browser console for errors

## 🎯 Next Steps
- Test all three input modes
- Try screen sharing with different content types
- Verify Clara provides contextual help
- Monitor costs and adjust frame rates if needed

The multimodal Clara.ai is now ready for comprehensive educational assistance! 🎓