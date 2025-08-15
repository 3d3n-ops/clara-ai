import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[Vapi Webhook] Received event:', body.type)
    
    const { type, data } = body
    
    switch (type) {
      case 'call-start':
        console.log('[Vapi Webhook] Call started:', data)
        // Handle call start
        break
        
      case 'call-end':
        console.log('[Vapi Webhook] Call ended:', data)
        // Handle call end
        break
        
      case 'speech-start':
        console.log('[Vapi Webhook] Speech started:', data)
        // Handle speech start
        break
        
      case 'speech-end':
        console.log('[Vapi Webhook] Speech ended:', data)
        // Handle speech end
        break
        
      case 'message':
        console.log('[Vapi Webhook] Message received:', data)
        // Handle message
        break
        
      case 'function-call':
        console.log('[Vapi Webhook] Function call:', data)
        // Handle function calls (for visual content generation)
        await handleFunctionCall(data)
        break
        
      case 'error':
        console.error('[Vapi Webhook] Error:', data)
        // Handle error
        break
        
      default:
        console.log('[Vapi Webhook] Unknown event type:', type)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[Vapi Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function handleFunctionCall(data: any) {
  try {
    const { name, arguments: args } = data
    
    switch (name) {
      case 'generate_diagram':
        await generateVisualContent('diagram', args)
        break
        
      case 'generate_flashcards':
        await generateVisualContent('flashcards', args)
        break
        
      case 'generate_quiz':
        await generateVisualContent('quiz', args)
        break
        
      case 'generate_mindmap':
        await generateVisualContent('mindmap', args)
        break
        
      default:
        console.log('[Vapi Webhook] Unknown function:', name)
    }
  } catch (error) {
    console.error('[Vapi Webhook] Error handling function call:', error)
  }
}

async function generateVisualContent(type: string, args: any) {
  try {
    console.log(`[Vapi Webhook] Generating ${type}:`, args)
    
    // Call the visual generation API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/voice/generate-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        prompt: args.prompt || args.topic || 'Generate content',
        context: 'voice_command'
      }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log(`[Vapi Webhook] Generated ${type}:`, result)
    
    return result
    
  } catch (error) {
    console.error(`[Vapi Webhook] Error generating ${type}:`, error)
    throw error
  }
} 