-- Add UPDATE RLS policy for messages table
-- Required for feedback (thumbs up/down) and other message metadata updates

create policy "Users can update messages in own conversations" on public.messages
  for update using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );
