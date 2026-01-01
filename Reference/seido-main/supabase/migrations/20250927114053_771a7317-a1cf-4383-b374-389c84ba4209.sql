-- First, let's create a new enum for application status (separate from grading results)
CREATE TYPE public.application_status AS ENUM ('Submitted', 'Approved', 'Rejected');

-- Add application status and approval fields to gradings table
ALTER TABLE public.gradings 
ADD COLUMN application_status application_status DEFAULT 'Submitted',
ADD COLUMN application_decided_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN application_decided_by UUID,
ADD COLUMN application_remarks TEXT;

-- Update existing records to have 'Approved' status if they were previously approved
UPDATE public.gradings 
SET application_status = 'Approved', 
    application_decided_at = decided_at,
    application_decided_by = decided_by,
    application_remarks = visible_remarks
WHERE status = 'Pass' OR status = 'Fail';

-- Reset status to 'Pending' for all records since status should now only be for grading results
UPDATE public.gradings SET status = 'Pending' WHERE application_status = 'Approved';

-- Add foreign key constraint for application_decided_by
ALTER TABLE public.gradings 
ADD CONSTRAINT gradings_application_decided_by_fkey 
FOREIGN KEY (application_decided_by) REFERENCES profiles(user_id);

-- Create index for better performance
CREATE INDEX idx_gradings_application_status ON public.gradings(application_status);
CREATE INDEX idx_gradings_application_decided_by ON public.gradings(application_decided_by);