import { createClient } from '@/lib/supabase/server';
import { sendMessage, checkHealth } from '@/lib/moltbot/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate session ID from user + conversation
    const sessionId = conversationId || `${user.id}-default`;

    // Send message (tries Gateway first, falls back to direct LLM)
    const response = await sendMessage(message, sessionId, user.id);

    // Store message in database (optional, for persistence)
    // TODO: Implement conversation storage

    return NextResponse.json({
      content: response.content,
      thinking: response.thinking,
      role: 'assistant',
      sessionId,
      source: response.source,
      error: response.error,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const gatewayHealthy = await checkHealth();
  const llmConfigured = !!process.env.LLM_API_KEY;

  return NextResponse.json({
    status: gatewayHealthy || llmConfigured ? 'healthy' : 'degraded',
    gateway: gatewayHealthy ? 'connected' : 'disconnected',
    llmFallback: llmConfigured ? 'available' : 'not configured',
    timestamp: new Date().toISOString(),
  });
}
