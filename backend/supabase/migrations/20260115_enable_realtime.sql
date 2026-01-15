-- Enable Realtime for chat_logs table
-- This allows all clients to receive real-time updates when new messages are inserted

-- Add chat_logs to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_logs;

-- Ensure RLS is enabled (should already be from initial setup)
-- ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anyone to read chat_logs (for global chat)
-- DROP POLICY IF EXISTS "Allow public read" ON chat_logs;
-- CREATE POLICY "Allow public read" ON chat_logs FOR SELECT USING (true);
