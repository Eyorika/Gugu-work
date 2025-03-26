-- Function to update user's last_active timestamp
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the last_active timestamp for the user
  UPDATE public.profiles
  SET last_active = NOW()
  WHERE id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update last_active on various user actions

-- When user sends a message
CREATE TRIGGER update_last_active_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_last_active();

-- When user views messages (updates read status)
CREATE TRIGGER update_last_active_on_read
AFTER UPDATE OF read ON public.messages
FOR EACH ROW
WHEN (NEW.read = true)
EXECUTE FUNCTION public.update_last_active();

-- Add unique constraint to prevent duplicate conversations between the same users
ALTER TABLE public.conversations
ADD CONSTRAINT unique_conversation_participants
UNIQUE (employer_id, worker_id);