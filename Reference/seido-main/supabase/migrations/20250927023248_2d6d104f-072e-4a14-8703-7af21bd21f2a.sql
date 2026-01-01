-- Create grading periods table
CREATE TABLE public.grading_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  grading_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'In Progress', 'Completed', 'Cancelled')),
  max_applications INTEGER DEFAULT 20,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grading_periods ENABLE ROW LEVEL SECURITY;

-- Add grading_period_id to gradings table
ALTER TABLE public.gradings 
ADD COLUMN grading_period_id UUID REFERENCES public.grading_periods(id) ON DELETE SET NULL;

-- Create policies for grading periods
CREATE POLICY "Instructors can view all grading periods" 
ON public.grading_periods 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_instructor = true
));

CREATE POLICY "Instructors can create grading periods" 
ON public.grading_periods 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_instructor = true
) AND auth.uid() = created_by);

CREATE POLICY "Instructors can update grading periods" 
ON public.grading_periods 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_instructor = true
));

-- Add trigger for updated_at
CREATE TRIGGER update_grading_periods_updated_at
BEFORE UPDATE ON public.grading_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();