-- Add unique constraint to prevent duplicate conversations between the same users
ALTER TABLE public.conversations
ADD CONSTRAINT unique_conversation_participants
UNIQUE (employer_id, worker_id);