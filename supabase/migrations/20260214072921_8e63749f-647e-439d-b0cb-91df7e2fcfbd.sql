
-- Add chat_messages_used to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN chat_messages_used integer DEFAULT 0;

-- Add chat_limit to plans
ALTER TABLE public.plans ADD COLUMN chat_limit integer DEFAULT 10;

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own messages
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Service role insert for edge function
CREATE POLICY "Service can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);
