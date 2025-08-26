import asyncio
import os
import time
from dotenv import load_dotenv
from livekit import rtc, api
from livekit.agents import AutoSubscribe, JobContext, AgentSession, Agent, RoomInputOptions
from livekit.plugins import google, silero

# Load environment variables
load_dotenv()

class LocalLiveKitAgent:
    def __init__(self):
        self.room = None
        self.session = None
        
    async def connect_to_room(self, room_name: str):
        """Connect directly to a LiveKit room"""
        livekit_url = os.environ.get("LIVEKIT_URL")
        livekit_api_key = os.environ.get("LIVEKIT_API_KEY")
        livekit_api_secret = os.environ.get("LIVEKIT_API_SECRET")

        if not livekit_url or not livekit_api_key or not livekit_api_secret:
            raise ValueError("Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET environment variables")

        print(f"🚀 Connecting to room: {room_name}")
        print(f"📡 LiveKit URL: {livekit_url}")
        
        # Create room connection
        self.room = rtc.Room()
        
        # Generate access token for the agent
        token = api.AccessToken(livekit_api_key, livekit_api_secret)
        token.with_identity(f"local-agent-{room_name}")
        token.with_name("Clara AI Tutor (Local)")
        token.with_grants(api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        ))
        
        # Connect to room
        await self.room.connect(livekit_url, token.to_jwt())
        print(f"✅ Successfully connected to room: {room_name}")
        
        # Set up event handlers
        @self.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            print(f"👤 Participant connected: {participant.identity}")
            # Start the voice agent session
            asyncio.create_task(self.start_voice_session(participant))
        
        @self.room.on("participant_disconnected")
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            print(f"👋 Participant disconnected: {participant.identity}")
        
        return self.room

    async def start_voice_session(self, participant: rtc.RemoteParticipant):
        """Start voice session with enhanced debugging"""
        print(f"🎯 Starting voice session with participant: {participant.identity}")
        
        try:
            # Check for Google credentials
            google_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if not google_creds:
                print("❌ ERROR: GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS not found")
                return
            print("🔑 Google Application Credentials found")

            # Configure VAD with enhanced settings
            vad = silero.VAD.load()
            
            self.session = AgentSession(
                llm=google.LLM(
                    model="gemini-1.5-flash",
                    temperature=0.8,
                ),
                tts=google.TTS(gender="female", voice_name="en-US-Standard-H"),
                vad=vad,
            )

            print("🤖 Google session created successfully with enhanced VAD settings")

            # --- Enhanced Audio Processing Event Handlers ---
            @self.session.on("user_speech_committed")
            def on_user_speech_committed(event):
                print(f"🎤 [USER SPEECH DETECTED] Duration: {getattr(event, 'duration', 'N/A')}ms")
                print(f"🎤 [AUDIO LEVEL] Peak: {getattr(event, 'peak_amplitude', 'N/A')}")
                # Mark activity for timeout monitoring
                if hasattr(self, '_last_voice_activity'):
                    self._last_voice_activity = time.time()

            @self.session.on("user_started_speaking")
            def on_user_started_speaking(event):
                print(f"🗣️ [USER STARTED SPEAKING] Detected voice activity")
                self._last_voice_activity = time.time()

            @self.session.on("user_stopped_speaking")
            def on_user_stopped_speaking(event):
                print(f"🤐 [USER STOPPED SPEAKING] Voice activity ended")

            @self.session.on("transcription_completed")
            def on_transcription_completed(event):
                print(f"✅ [TRANSCRIBED] '{event.transcript}' (confidence: {getattr(event, 'confidence', 'N/A')})")

            @self.session.on("transcription_failed")
            def on_transcription_failed(event):
                print(f"❌ [TRANSCRIPTION FAILED] {event.error}")
                print(f"💡 [SUGGESTION] Try speaking louder or closer to microphone")

            @self.session.on("agent_speech_committed")
            def on_agent_speech_committed(event):
                print(f"🤖 [CLARA SPEAKING] '{event.transcript}'")

            # Audio level monitoring
            @self.session.on("audio_frame_received")
            def on_audio_frame_received(event):
                # Log audio levels every few seconds to avoid spam
                if not hasattr(on_audio_frame_received, 'last_log'):
                    on_audio_frame_received.last_log = 0
                
                current_time = time.time()
                if current_time - on_audio_frame_received.last_log > 5:  # Log every 5 seconds
                    print(f"🔊 [AUDIO MONITOR] Receiving audio frames - microphone is active")
                    on_audio_frame_received.last_log = current_time

            # Start session
            print("🚀 Starting agent session...")
            await self.session.start(
                room=self.room, 
                agent=Agent(instructions="You are Clara, a helpful AI tutor. You help students learn by explaining concepts clearly, providing examples, and encouraging their progress."),
            )
            print("✅ Agent session started successfully")

            # Add voice detection timeout and fallback
            async def check_voice_activity():
                self._last_voice_activity = time.time()
                silence_warning_sent = False
                
                while True:
                    await asyncio.sleep(10)  # Check every 10 seconds
                    current_time = time.time()
                    
                    # If no voice activity for 30 seconds, provide guidance
                    if current_time - self._last_voice_activity > 30 and not silence_warning_sent:
                        await self.session.say("I haven't heard you speak yet. Please check that your microphone is working and try speaking clearly.")
                        print("🔇 [VOICE TIMEOUT] No voice detected for 30 seconds - sent guidance message")
                        silence_warning_sent = True
                    
                    # Reset warning flag if we detect recent activity
                    if current_time - self._last_voice_activity <= 30:
                        silence_warning_sent = False
            
            # Start voice monitoring task
            asyncio.create_task(check_voice_activity())
            
            # Greet user with voice detection instructions
            await self.session.say("Hi! I'm Clara, your AI tutor running locally. Please make sure your microphone is enabled and speak clearly. What would you like to work on today?")
            
            # Keep session running
            while True:
                await asyncio.sleep(1)

        except Exception as e:
            print(f"❌ Error in voice session: {e}")
            import traceback
            print(traceback.format_exc())
            raise

    async def disconnect(self):
        """Clean up connections"""
        if self.session:
            await self.session.stop()
        if self.room:
            await self.room.disconnect()
        print("🔌 Disconnected from LiveKit")

async def main():
    """Main function to run the local agent"""
    print("🎯 Starting Local LiveKit Agent for Clara.ai")
    print("=" * 50)
    
    # Get room name from command line or use default
    import sys
    room_name = sys.argv[1] if len(sys.argv) > 1 else "test-room"
    
    agent = LocalLiveKitAgent()
    
    try:
        # Connect to room
        await agent.connect_to_room(room_name)
        
        print(f"🎉 Local agent is now running in room: {room_name}")
        print("💡 Join the room from your web app to start testing!")
        print("🛑 Press Ctrl+C to stop the agent")
        
        # Keep running until interrupted
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping local agent...")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await agent.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
