-- Add column to capture student's grade at time of application
ALTER TABLE public.gradings 
ADD COLUMN grade_at_application jsonb;

-- Add column to capture student's rank at time of application  
ALTER TABLE public.gradings 
ADD COLUMN rank_at_application_id uuid REFERENCES public.ranks(id);