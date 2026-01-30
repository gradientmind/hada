import { createClient } from '@/lib/supabase/server';
import { sendMessage, checkHealth } from '@/lib/openclaw/client';
import { getOrCreateConversation, saveMessage } from '@/lib/db/conversations';
import { detectFunctionCalls, executeFunction } from '@/lib/llm/function-calling';
import { NextRequest, NextResponse } from 'next/server';

const CONFIRM_REGEX = /^(yes|y|confirm|ok|okay|sure|go ahead|do it|please do)\b/i;
const CANCEL_REGEX = /^(no|n|cancel|stop|don'?t|do not|never mind|nevermind)\b/i;

function buildConfirmationPrompt(action: string, args: Record<string, any>) {
  const start = args.start || args.start_date;
  const end = args.end || args.end_date;
  const formattedRange = formatDateRange(start, end);

  if (action === 'create_calendar_event') {
    const summary = args.summary ? `"${args.summary}"` : 'this event';
    const timeRange = formattedRange ? ` on ${formattedRange}` : '';
    return `I can create the event ${summary}${timeRange}. Confirm or cancel?`;
  }

  if (action === 'update_calendar_event') {
    return `I can update that calendar event. Reply "confirm" to proceed or "cancel" to skip.`;
  }

  if (action === 'delete_calendar_event') {
    return `I can delete that calendar event. Reply "confirm" to proceed or "cancel" to skip.`;
  }

  return `This action needs confirmation. Confirm or cancel?`;
}

function formatDateRange(startIso?: string, endIso?: string) {
  if (!startIso || !endIso) return '';
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';

  const date = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${date}, ${startTime}-${endTime}`;
}

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
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get or create the user's conversation
    const conversation = await getOrCreateConversation(supabase, user.id);

    // Save user message to database
    const userMessage = await saveMessage(
      supabase,
      conversation.id,
      'user',
      message
    );

    // Check for pending confirmation on the last assistant message
    const { data: lastAssistant } = await supabase
      .from('messages')
      .select('id, metadata')
      .eq('conversation_id', conversation.id)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const pendingConfirmation = (lastAssistant?.metadata as any)?.confirmation;
    if (pendingConfirmation?.pending) {
      if (CONFIRM_REGEX.test(message.trim())) {
        const confirmedCall = {
          name: pendingConfirmation.function?.name,
          arguments: {
            ...(pendingConfirmation.function?.arguments || {}),
            confirmed: true,
          },
        };

        try {
          const result = await executeFunction(confirmedCall, user.id);
          const cards = result?.success && result.card ? [result.card] : [];

          if (!result?.success) {
            const errorMessage =
              result?.error?.message || 'That action could not be completed.';
            const assistantMessage = await saveMessage(
              supabase,
              conversation.id,
              'assistant',
              errorMessage
            );

            return NextResponse.json({
              id: assistantMessage.id,
              content: errorMessage,
              role: 'assistant',
              conversationId: conversation.id,
              userMessageId: userMessage.id,
            });
          }

          const successText =
            pendingConfirmation.function?.name === 'create_calendar_event'
              ? `I’ve created the event "${pendingConfirmation.function?.arguments?.summary}".`
              : 'Done.';

          const assistantMessage = await saveMessage(
            supabase,
            conversation.id,
            'assistant',
            successText,
            cards.length > 0 ? { cards } : undefined
          );

          // Mark confirmation as resolved
          const updatedMetadata = {
            ...(lastAssistant?.metadata as Record<string, any>),
            confirmation: {
              ...pendingConfirmation,
              pending: false,
              resolved_at: new Date().toISOString(),
            },
          };
          await supabase
            .from('messages')
            .update({ metadata: updatedMetadata })
            .eq('id', lastAssistant?.id);

          return NextResponse.json({
            id: assistantMessage.id,
            content: successText,
            cards,
            role: 'assistant',
            conversationId: conversation.id,
            userMessageId: userMessage.id,
          });
        } catch (error: any) {
          console.error('Confirmation execution error:', error);
          const assistantMessage = await saveMessage(
            supabase,
            conversation.id,
            'assistant',
            error.message || 'That action could not be completed.'
          );

          return NextResponse.json({
            id: assistantMessage.id,
            content: assistantMessage.content,
            role: 'assistant',
            conversationId: conversation.id,
            userMessageId: userMessage.id,
          });
        }
      }

      if (CANCEL_REGEX.test(message.trim())) {
        const cancelText = 'Okay, I won’t make that change.';
        const assistantMessage = await saveMessage(
          supabase,
          conversation.id,
          'assistant',
          cancelText
        );

        const updatedMetadata = {
          ...(lastAssistant?.metadata as Record<string, any>),
          confirmation: {
            ...pendingConfirmation,
            pending: false,
            resolved_at: new Date().toISOString(),
            cancelled: true,
          },
        };
        await supabase
          .from('messages')
          .update({ metadata: updatedMetadata })
          .eq('id', lastAssistant?.id);

        return NextResponse.json({
          id: assistantMessage.id,
          content: cancelText,
          role: 'assistant',
          conversationId: conversation.id,
          userMessageId: userMessage.id,
        });
      }

      const reminderText = buildConfirmationPrompt(
        pendingConfirmation.function?.name,
        pendingConfirmation.function?.arguments || {}
      );
      const assistantMessage = await saveMessage(
        supabase,
        conversation.id,
        'assistant',
        reminderText,
        { confirmation: pendingConfirmation }
      );

      return NextResponse.json({
        id: assistantMessage.id,
        content: reminderText,
        confirmation: pendingConfirmation,
        role: 'assistant',
        conversationId: conversation.id,
        userMessageId: userMessage.id,
      });
    }

    // Try function calling first for calendar/email operations
    console.log('[Chat API] Starting function call detection for:', message);
    const functionCallResult = await detectFunctionCalls(message, user.id);
    console.log('[Chat API] Function call result:', functionCallResult);

    if (functionCallResult.shouldUseFunctions && functionCallResult.functions) {
      console.log('[Chat API] Executing functions:', functionCallResult.functions);
      // Execute functions and format response
      try {
        const results = await Promise.all(
          functionCallResult.functions.map(fn => executeFunction(fn, user.id))
        );

        // Handle confirmation or errors
        const failedResult = results.find((r) => r && r.success === false);
        if (failedResult) {
          if (failedResult.requiresConfirmation) {
            const confirmationPayload = {
              pending: true,
              function: functionCallResult.functions[0],
              confirmationData: failedResult.confirmationData || null,
              created_at: new Date().toISOString(),
            };
            const promptText = buildConfirmationPrompt(
              functionCallResult.functions[0].name,
              functionCallResult.functions[0].arguments || {}
            );

            const assistantMessage = await saveMessage(
              supabase,
              conversation.id,
              'assistant',
              promptText,
              { confirmation: confirmationPayload }
            );

            return NextResponse.json({
              id: assistantMessage.id,
              content: promptText,
              confirmation: confirmationPayload,
              role: 'assistant',
              conversationId: conversation.id,
              userMessageId: userMessage.id,
            });
          }

          const errorText =
            failedResult?.error?.message || 'That action could not be completed.';
          const assistantMessage = await saveMessage(
            supabase,
            conversation.id,
            'assistant',
            errorText
          );

          return NextResponse.json({
            id: assistantMessage.id,
            content: errorText,
            role: 'assistant',
            conversationId: conversation.id,
            userMessageId: userMessage.id,
          });
        }

        // Extract card data from successful results
        const cards = results
          .filter(r => r.success && r.card)
          .map(r => r.card);

        // Generate a natural language response
        let responseText = '';
        if (functionCallResult.functions[0].name === 'list_calendar_events') {
          const events = results[0]?.data || [];
          if (events.length === 0) {
            responseText = "You don't have any events in that time range.";
          } else {
            responseText = `I found ${events.length} event${events.length !== 1 ? 's' : ''} on your calendar:`;
          }
        } else if (functionCallResult.functions[0].name === 'create_calendar_event') {
          responseText = `I've created the event "${functionCallResult.functions[0].arguments.summary}" on your calendar.`;
        }

        // Save assistant message with card metadata
        const assistantMessage = await saveMessage(
          supabase,
          conversation.id,
          'assistant',
          responseText,
          cards.length > 0 ? { cards } : undefined
        );

        return NextResponse.json({
          id: assistantMessage.id,
          content: responseText,
          cards,
          role: 'assistant',
          conversationId: conversation.id,
          userMessageId: userMessage.id,
        });
      } catch (error: any) {
        console.error('Function execution error:', error);
        // Fall through to OpenClaw on function error
      }
    }

    // If function calling provided a direct response (e.g., not connected), use it
    if (functionCallResult.response) {
      const assistantMessage = await saveMessage(
        supabase,
        conversation.id,
        'assistant',
        functionCallResult.response
      );

      return NextResponse.json({
        id: assistantMessage.id,
        content: functionCallResult.response,
        role: 'assistant',
        conversationId: conversation.id,
        userMessageId: userMessage.id,
      });
    }

    // Otherwise, send message to OpenClaw for general conversation
    const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email;
    const response = await sendMessage(message, user.id, user.id, userName);

    // Save assistant message to database
    const assistantMessage = await saveMessage(
      supabase,
      conversation.id,
      'assistant',
      response.content,
      {
        thinking: response.thinking,
        gatewayError: response.gatewayError,
      }
    );

    return NextResponse.json({
      id: assistantMessage.id,
      content: response.content,
      thinking: response.thinking,
      role: 'assistant',
      conversationId: conversation.id,
      error: response.error,
      gatewayError: response.gatewayError,
      userMessageId: userMessage.id,
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
