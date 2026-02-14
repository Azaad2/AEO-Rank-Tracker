
-- Drop overly permissive policy and replace with role-based one
DROP POLICY "Service can insert chat messages" ON public.chat_messages;

-- Allow the edge function (using service role) to insert assistant messages
-- The existing user insert policy handles user messages
-- For assistant messages from the edge function, we need service role access
-- which bypasses RLS anyway, so we don't need this extra policy
