-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'message', 'application', 'job_match', etc.
  related_id UUID, -- Optional reference to related entity (job_id, application_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  data JSONB -- Additional data specific to notification type
);

-- Create index for faster notification retrieval
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read);

-- RLS Policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Notifications visibility" ON public.notifications
FOR SELECT USING (
  user_id = auth.uid()
);

-- Only the system can create notifications (will be handled by triggers/functions)
CREATE POLICY "Notifications creation" ON public.notifications
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'employer')
);

-- Users can only update their own notifications (for marking as read)
CREATE POLICY "Notifications updates" ON public.notifications
FOR UPDATE USING (
  user_id = auth.uid()
) WITH CHECK (
  user_id = auth.uid() AND 
  (OLD.read IS DISTINCT FROM NEW.read) -- Only allow updating the read status
);

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type VARCHAR(50),
  p_related_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    data
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_related_id,
    p_data
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Get job details
  DECLARE
    job_title TEXT;
    employer_name TEXT;
    worker_name TEXT;
  BEGIN
    SELECT j.title, e.company_name, w.full_name
    INTO job_title, employer_name, worker_name
    FROM public.jobs j
    JOIN public.profiles e ON j.employer_id = e.id
    JOIN public.profiles w ON NEW.worker_id = w.id
    WHERE j.id = NEW.job_id;
    
    -- Notify worker when status changes (only for UPDATE operations)
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.create_notification(
        NEW.worker_id,
        CASE 
          WHEN NEW.status = 'accepted' THEN 'Application Accepted'
          WHEN NEW.status = 'rejected' THEN 'Application Rejected'
          ELSE 'Application Status Updated'
        END,
        CASE 
          WHEN NEW.status = 'accepted' THEN 'Your application for "' || job_title || '" has been accepted by ' || employer_name
          WHEN NEW.status = 'rejected' THEN 'Your application for "' || job_title || '" has been rejected by ' || employer_name
          ELSE 'Your application for "' || job_title || '" status has been updated to ' || NEW.status
        END,
        'application',
        NEW.id,
        jsonb_build_object('job_id', NEW.job_id, 'status', NEW.status)
      );
    END IF;
    
    -- Notify employer for new applications
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        PERFORM public.create_notification(
          (SELECT employer_id FROM public.jobs WHERE id = NEW.job_id),
          'New Application',
          'New application from ' || worker_name || ' for "' || job_title || '"',
          'application',
          NEW.id,
          jsonb_build_object('job_id', NEW.job_id, 'worker_id', NEW.worker_id)
        );
      END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_status_change_trigger
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_status_change();

-- Trigger for new messages
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Get conversation details
  DECLARE
    conversation_record RECORD;
    sender_name TEXT;
    recipient_id UUID;
  BEGIN
    -- Get conversation and sender details
    SELECT c.*, p.full_name INTO conversation_record, sender_name
    FROM public.conversations c
    JOIN public.profiles p ON NEW.sender_id = p.id
    WHERE c.id = NEW.conversation_id;
    
    -- Determine recipient
    IF NEW.sender_id = conversation_record.worker_id THEN
      recipient_id := conversation_record.employer_id;
    ELSE
      recipient_id := conversation_record.worker_id;
    END IF;
    
    -- Create notification for recipient
    PERFORM public.create_notification(
      recipient_id,
      'New Message',
      'You have a new message from ' || sender_name,
      'message',
      NEW.conversation_id,
      jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();