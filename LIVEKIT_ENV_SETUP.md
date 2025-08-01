# LiveKit Environment Setup

## 🔧 Fix for 400 Bad Request Error

The error you're seeing is because your local Next.js app doesn't have the LiveKit environment variables configured.

## 📝 Required Steps

### 1. Create `.env.local` file

Create a `.env.local` file in your project root with these variables:

```env
# LiveKit Configuration
# Get these from your LiveKit Cloud dashboard: https://cloud.livekit.io/
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://rzn-ai-demo-jjqfllvw.livekit.cloud
NEXT_PUBLIC_LIVEKIT_URL=wss://rzn-ai-demo-jjqfllvw.livekit.cloud

# Other environment variables (if needed)
NEXT_PUBLIC_API_URL=http://localhost:8000
PYTHON_BACKEND_URL=http://localhost:8000
```

### 2. Get LiveKit Credentials

1. Go to https://cloud.livekit.io/
2. Navigate to your project: `rzn-ai-demo-jjqfllvw`
3. Go to **Settings** → **API Keys**
4. Copy your **API Key** and **API Secret**
5. Replace the placeholder values in `.env.local`

### 3. Restart Development Server

After updating the credentials:

```bash
npm run dev
```

## 🔍 What Was Fixed

1. **API Compatibility**: Updated `/api/livekit/token` to handle both `userId` and `participantName` fields
2. **Environment Variables**: Added proper LiveKit credentials configuration
3. **Error Handling**: Better error messages for missing credentials

## 🚀 Expected Result

After setting up the environment variables, the LiveKit token generation should work and you should be able to connect to voice sessions without the 400 error.

## 🐛 Troubleshooting

If you still get errors:

1. **Check credentials**: Verify API key and secret are correct
2. **Restart server**: Make sure to restart after adding environment variables
3. **Check network**: Ensure you can reach the LiveKit instance
4. **Browser console**: Check for any additional error messages 