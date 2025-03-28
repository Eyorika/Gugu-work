-- Add new columns to applications table
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS cover_letter TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS cosigner_name TEXT,
ADD COLUMN IF NOT EXISTS cosigner_email TEXT,
ADD COLUMN IF NOT EXISTS cosigner_address TEXT,
ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agreement_pdf_url TEXT;

-- Create cosigner_verifications table
CREATE TABLE IF NOT EXISTS cosigner_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  cosigner_email TEXT NOT NULL,
  verification_token TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(application_id, cosigner_email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cosigner_verifications_token ON cosigner_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_applications_cosigner_email ON applications(cosigner_email);