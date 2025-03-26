-- 1. Update profiles table with new columns and constraints
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE 
  CHECK (username ~ '\.GUGU$'),
ADD COLUMN phone VARCHAR(13) 
  CHECK (phone ~ '^\+251\d{9}$'),
ADD COLUMN national_id CHAR(12) UNIQUE 
  CHECK (national_id ~ '^\d{12}$'),
ADD COLUMN address TEXT,
ADD COLUMN photo_url TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN completion_percent INT DEFAULT 0 
  CHECK (completion_percent BETWEEN 0 AND 100),
ADD COLUMN cosigner_email TEXT 
  CHECK (role = 'worker' OR cosigner_email IS NULL),
ADD COLUMN skills JSONB,
ADD COLUMN hourly_rate NUMERIC,
ADD COLUMN company_name TEXT 
  CHECK (role = 'employer' OR company_name IS NULL),
ADD COLUMN tin_number CHAR(10) 
  CHECK (role = 'employer' OR tin_number IS NULL),
ADD COLUMN trade_license TEXT,
ADD COLUMN last_active TIMESTAMPTZ DEFAULT NOW();

-- 2. Update jobs table foreign key constraint
ALTER TABLE public.jobs
DROP CONSTRAINT IF EXISTS jobs_employer_id_fkey,
ADD CONSTRAINT jobs_employer_id_fkey
FOREIGN KEY (employer_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Add new RLS policies
CREATE POLICY "Public profile read access" ON public.profiles
FOR SELECT USING (true);

-- 4. Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    role,
    username,
    national_id,
    phone,
    address,
    completion_percent
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'worker'::public.user_role
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      CONCAT(SPLIT_PART(NEW.email, '@', 1), '.GUGU')
    ),
    NEW.raw_user_meta_data->>'national_id',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Add profile completion trigger
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_fields INT := 7;
  filled_fields INT := 0;
BEGIN
  IF NEW.full_name IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.username IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.national_id IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.phone IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.address IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  
  IF NEW.role = 'employer' THEN
    total_fields := total_fields + 2;
    IF NEW.company_name IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.tin_number IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  ELSE
    total_fields := total_fields + 1;
    IF NEW.cosigner_email IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  END IF;

  NEW.completion_percent := ROUND((filled_fields::FLOAT / total_fields) * 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_completion_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion();

-- 6. Update jobs policy with completion requirement
CREATE POLICY "Employers can create jobs"
ON public.jobs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'employer'::public.user_role
    AND completion_percent >= 80
  )
);


ALTER TABLE public.jobs
DROP CONSTRAINT IF EXISTS jobs_employer_id_fkey,
ADD CONSTRAINT jobs_employer_id_fkey
FOREIGN KEY (employer_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;
-- Add missing NOT NULL constraints
ALTER TABLE public.jobs
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN description SET NOT NULL,
ALTER COLUMN location SET NOT NULL;

-- Create proper RLS policy for job creation
CREATE POLICY "Employers can update applications" 
ON public.applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = applications.job_id
    AND employer_id = auth.uid()
  )
);


-- Enable storage if not already enabled
create extension if not exists "storage" schema "storage";

-- Create avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public access to view avatars
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatar files
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar files
create policy "Users can update their own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar files
create policy "Users can delete their own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own profile
CREATE POLICY "User profile visibility" 
ON public.profiles
FOR SELECT USING (
  id = auth.uid()
);

-- Allow users to create their profile
CREATE POLICY "User profile creation"
ON public.profiles
FOR INSERT WITH CHECK (
  id = auth.uid()
);

-- Allow users to update their own profile
CREATE POLICY "User profile updates"
ON public.profiles
FOR UPDATE USING (
  id = auth.uid()
) WITH CHECK (
  id = auth.uid()
);

