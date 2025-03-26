-- Script to fix duplicate conversations before adding unique constraint

-- First, identify duplicate employer_id and worker_id combinations
CREATE TEMP TABLE duplicate_conversations AS
SELECT employer_id, worker_id, COUNT(*) as count, 
       array_agg(id ORDER BY updated_at DESC) as conversation_ids
FROM public.conversations
GROUP BY employer_id, worker_id
HAVING COUNT(*) > 1;

-- For each set of duplicates, keep the most recent conversation (first in the array)
-- and move any messages from older conversations to the most recent one
DO $$
DECLARE
    duplicate RECORD;
    keep_id UUID;
    remove_ids UUID[];
BEGIN
    FOR duplicate IN SELECT * FROM duplicate_conversations LOOP
        -- Get the ID to keep (most recent conversation)
        keep_id := duplicate.conversation_ids[1];
        
        -- Get the IDs to remove (older conversations)
        remove_ids := duplicate.conversation_ids[2:array_length(duplicate.conversation_ids, 1)];
        
        -- Update messages from older conversations to point to the most recent one
        UPDATE public.messages
        SET conversation_id = keep_id
        WHERE conversation_id = ANY(remove_ids);
        
        -- Delete the older duplicate conversations
        DELETE FROM public.conversations
        WHERE id = ANY(remove_ids);
        
        RAISE NOTICE 'Merged % duplicate conversations for employer % and worker %', 
                     array_length(remove_ids, 1) + 1, 
                     duplicate.employer_id, 
                     duplicate.worker_id;
    END LOOP;
END;
$$;

-- Drop the temporary table
DROP TABLE duplicate_conversations;

-- Now that duplicates are resolved, add the unique constraint
ALTER TABLE public.conversations
ADD CONSTRAINT unique_conversation_participants
UNIQUE (employer_id, worker_id);

-- Output a success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added unique constraint after resolving duplicate conversations';
END;
$$;