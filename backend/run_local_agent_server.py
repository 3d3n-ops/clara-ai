#!/usr/bin/env python3
"""
Simple Flask server to run the local LiveKit agent

This server provides API endpoints for the frontend to:
1. Start a local LiveKit agent
2. Send chat messages and get responses
3. Manage study sessions

Usage:
    python run_local_agent_server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add the current directory to the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the local LiveKit agent
from local_livekit_agent import LocalClaraAssistant

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Store active agents
active_agents = {}

@app.route('/api/local-livekit/start-agent', methods=['POST'])
def start_agent():
    """Start a new local LiveKit agent for a study session"""
    try:
        data = request.get_json()
        room_name = data.get('roomName')
        participant_name = data.get('participantName')
        
        if not room_name or not participant_name:
            return jsonify({'error': 'Missing roomName or participantName'}), 400
        
        print(f"[Local Agent Server] Starting agent for room: {room_name}")
        
        # Create a new Clara assistant instance
        agent = LocalClaraAssistant(user_id=participant_name)
        agent.start_session()
        
        # Store the agent
        agent_id = f"agent-{room_name}-{participant_name}"
        active_agents[agent_id] = {
            'agent': agent,
            'room_name': room_name,
            'participant_name': participant_name,
            'started_at': datetime.now(),
            'messages': []
        }
        
        print(f"[Local Agent Server] Agent {agent_id} started successfully")
        
        return jsonify({
            'success': True,
            'message': 'Local LiveKit agent started successfully',
            'roomName': room_name,
            'participantName': participant_name,
            'agentId': agent_id
        })
        
    except Exception as e:
        print(f"[Local Agent Server] Error starting agent: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/local-livekit/chat', methods=['POST'])
def chat():
    """Send a message to the local agent and get a response"""
    try:
        data = request.get_json()
        message = data.get('message')
        room_name = data.get('roomName')
        
        if not message or not room_name:
            return jsonify({'error': 'Missing message or roomName'}), 400
        
        print(f"[Local Agent Server] Processing message: '{message}' for room: {room_name}")
        
        # Find the active agent for this room
        agent_id = None
        agent_data = None
        
        for aid, data in active_agents.items():
            if data['room_name'] == room_name:
                agent_id = aid
                agent_data = data
                break
        
        if not agent_data:
            return jsonify({'error': 'No active agent found for this room'}), 404
        
        agent = agent_data['agent']
        
        # Process the message
        response = asyncio.run(agent.process_message(message))
        
        # Store the message in the agent's history
        agent_data['messages'].append({
            'timestamp': datetime.now().isoformat(),
            'user_message': message,
            'agent_response': response
        })
        
        # Check if any visual content was generated
        visual_content = None
        if hasattr(agent, 'visual_content_generated') and agent.visual_content_generated:
            latest_visual = agent.visual_content_generated[-1]
            visual_content = {
                'type': latest_visual.get('type', 'unknown'),
                'title': latest_visual.get('title', 'Visual Content'),
                'description': latest_visual.get('description', 'Generated visual content'),
                'data': latest_visual
            }
        
        print(f"[Local Agent Server] Agent response: {response}")
        
        return jsonify({
            'response': response,
            'visualContent': visual_content,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"[Local Agent Server] Error processing chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/local-livekit/end-session', methods=['POST'])
def end_session():
    """End a study session and clean up the agent"""
    try:
        data = request.get_json()
        room_name = data.get('roomName')
        
        if not room_name:
            return jsonify({'error': 'Missing roomName'}), 400
        
        print(f"[Local Agent Server] Ending session for room: {room_name}")
        
        # Find and remove the active agent for this room
        agent_id = None
        for aid, data in active_agents.items():
            if data['room_name'] == room_name:
                agent_id = aid
                break
        
        if agent_id:
            agent_data = active_agents[agent_id]
            agent = agent_data['agent']
            
            # Save the session
            agent.save_session()
            
            # Remove from active agents
            del active_agents[agent_id]
            
            print(f"[Local Agent Server] Session ended for room: {room_name}")
            
            return jsonify({
                'success': True,
                'message': 'Session ended successfully'
            })
        else:
            return jsonify({'error': 'No active session found for this room'}), 404
        
    except Exception as e:
        print(f"[Local Agent Server] Error ending session: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/local-livekit/status', methods=['GET'])
def get_status():
    """Get the status of all active agents"""
    try:
        status = {
            'active_agents': len(active_agents),
            'agents': []
        }
        
        for agent_id, agent_data in active_agents.items():
            status['agents'].append({
                'agentId': agent_id,
                'roomName': agent_data['room_name'],
                'participantName': agent_data['participant_name'],
                'startedAt': agent_data['started_at'].isoformat(),
                'messageCount': len(agent_data['messages'])
            })
        
        return jsonify(status)
        
    except Exception as e:
        print(f"[Local Agent Server] Error getting status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_agents': len(active_agents)
    })

if __name__ == '__main__':
    print("=" * 60)
    print("           Clara AI Local Agent Server")
    print("=" * 60)
    print()
    print("Starting local agent server...")
    print("This server provides API endpoints for the frontend to interact with")
    print("the local LiveKit agent for study sessions.")
    print()
    print("Available endpoints:")
    print("- POST /api/local-livekit/start-agent - Start a new agent")
    print("- POST /api/local-livekit/chat - Send chat messages")
    print("- POST /api/local-livekit/end-session - End a session")
    print("- GET /api/local-livekit/status - Get agent status")
    print("- GET /health - Health check")
    print()
    
    # Create generated_content directory if it doesn't exist
    content_dir = Path("generated_content")
    content_dir.mkdir(exist_ok=True)
    print(f"Content directory: {content_dir.absolute()}")
    print()
    
    try:
        app.run(
            host='0.0.0.0',
            port=5001,
            debug=True,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n[Local Agent Server] Server stopped by user")
    except Exception as e:
        print(f"\n[Local Agent Server] Error: {e}")
        import traceback
        traceback.print_exc() 