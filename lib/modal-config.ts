// Modal Configuration for Clara Voice Agent
// You'll need to update this with your actual Modal deployment URL

export const MODAL_CONFIG = {
  // Replace this with your actual Modal app URL
  // You can find this in your Modal dashboard or after deployment
  WEBHOOK_URL: process.env.MODAL_WEBHOOK_URL || 'https://[your-app-id]--clara-voice-agent-run-livekit-agent.modal.run',
  
  // LiveKit room configuration for Modal agent
  ROOM_PREFIX: 'study-session-',
  AGENT_IDENTITY_PATTERN: /clara|assistant|agent/i,
  
  // Session configuration
  SESSION_TIMEOUT: 600, // 10 minutes
  WIND_DOWN_TIME: 180,  // 3 minutes
}

// Helper function to generate room names that Modal agent will recognize
export function generateRoomName(userId: string): string {
  return `${MODAL_CONFIG.ROOM_PREFIX}${userId}`
}

// Helper function to check if a participant is the AI agent
export function isAIAgent(identity: string): boolean {
  return MODAL_CONFIG.AGENT_IDENTITY_PATTERN.test(identity)
}