#!/usr/bin/env python3
"""
Voice Pipeline Backend Integration
Integrates STT → LLM → TTS with the existing backend websocket system
"""

import asyncio
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any
from openai import OpenAI
import deepgram
from voice_agent_rag import ClaraAssistantRAG

class VoicePipelineBackend:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.agent = ClaraAssistantRAG(user_id=user_id)
        
        # Initialize APIs
        self.setup_apis()
        
    def setup_apis(self):
        """Setup API clients"""
        # OpenAI for LLM and TTS
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Deepgram for STT
        self.deepgram_client = deepgram.Deepgram(os.getenv('DEEPGRAM_API_KEY'))
        
    async def speech_to_text(self, audio_data: bytes) -> str:
        """Convert speech to text using Deepgram"""
        try:
            # Send audio to Deepgram
            response = await self.deepgram_client.transcription.prerecorded(
                {"buffer": audio_data, "mimetype": "audio/wav"},
                {
                    "smart_format": True,
                    "model": "nova-2",
                    "language": "en-US",
                }
            )
            
            # Extract transcript
            transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
            print(f"[Voice Pipeline] STT Result: {transcript}")
            return transcript
            
        except Exception as e:
            print(f"[Voice Pipeline] STT Error: {e}")
            return ""
    
    async def text_to_speech(self, text: str) -> bytes:
        """Convert text to speech using OpenAI TTS"""
        try:
            # Use OpenAI TTS
            response = self.openai_client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text
            )
            
            # Get audio data
            audio_data = response.content
            print(f"[Voice Pipeline] TTS Generated for: {text[:50]}...")
            return audio_data
            
        except Exception as e:
            print(f"[Voice Pipeline] TTS Error: {e}")
            return b""
    
    async def process_with_llm(self, text: str) -> Dict[str, Any]:
        """Process text with Clara AI agent"""
        try:
            # Use the existing Clara AI agent
            response = await self.agent.process_with_context(text)
            return response
        except Exception as e:
            print(f"[Voice Pipeline] LLM Error: {e}")
            return {
                "text": "I'm having trouble processing that right now. Could you try again?",
                "visual_content": None,
                "command_type": None
            }
    
    async def process_voice_input(self, audio_data: bytes) -> Dict[str, Any]:
        """Process voice input through the full pipeline"""
        try:
            # Step 1: Speech to Text
            transcript = await self.speech_to_text(audio_data)
            if not transcript:
                return {"error": "Could not understand audio input"}
            
            # Step 2: Process with LLM
            llm_response = await self.process_with_llm(transcript)
            
            # Step 3: Text to Speech
            tts_audio = await self.text_to_speech(llm_response["text"])
            
            return {
                "transcript": transcript,
                "response_text": llm_response["text"],
                "response_audio": tts_audio,
                "visual_content": llm_response.get("visual_content"),
                "command_type": llm_response.get("command_type")
            }
            
        except Exception as e:
            print(f"[Voice Pipeline] Pipeline Error: {e}")
            return {"error": f"Pipeline error: {str(e)}"}

# Global instance for the voice pipeline
voice_pipeline = None

async def initialize_voice_pipeline(user_id: str):
    """Initialize the voice pipeline for a user"""
    global voice_pipeline
    voice_pipeline = VoicePipelineBackend(user_id)
    await voice_pipeline.agent.initialize_rag_engine()
    print(f"[Voice Pipeline] Initialized for user: {user_id}")

async def get_voice_pipeline() -> Optional[VoicePipelineBackend]:
    """Get the global voice pipeline instance"""
    return voice_pipeline

# Test function
async def test_voice_pipeline():
    """Test the voice pipeline with a sample audio file"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Voice Pipeline")
    parser.add_argument("--audio-file", required=True, help="Path to audio file to test")
    parser.add_argument("--user-id", default="test-user", help="User ID for testing")
    
    args = parser.parse_args()
    
    # Initialize pipeline
    await initialize_voice_pipeline(args.user_id)
    
    # Read audio file
    with open(args.audio_file, 'rb') as f:
        audio_data = f.read()
    
    # Process through pipeline
    result = await voice_pipeline.process_voice_input(audio_data)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Transcript: {result['transcript']}")
        print(f"Response: {result['response_text']}")
        print(f"Audio generated: {len(result['response_audio'])} bytes")
        
        # Save response audio
        with open("response_audio.mp3", "wb") as f:
            f.write(result['response_audio'])
        print("Response audio saved to response_audio.mp3")

if __name__ == "__main__":
    asyncio.run(test_voice_pipeline()) 