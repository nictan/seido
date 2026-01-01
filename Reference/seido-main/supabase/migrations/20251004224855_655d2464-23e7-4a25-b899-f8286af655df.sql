-- Add emergency contact fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_relationship TEXT,
ADD COLUMN emergency_contact_phone TEXT,
ADD COLUMN emergency_contact_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.emergency_contact_name IS 'Name of emergency contact person';
COMMENT ON COLUMN public.profiles.emergency_contact_relationship IS 'Relationship to the student (e.g., Parent, Spouse, Sibling)';
COMMENT ON COLUMN public.profiles.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN public.profiles.emergency_contact_email IS 'Emergency contact email address (optional)';