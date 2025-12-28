-- Create ranks table to store all available ranks
CREATE TABLE public.ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_order INTEGER NOT NULL UNIQUE,
  kyu INTEGER,
  dan INTEGER,
  belt_color TEXT NOT NULL,
  stripes INTEGER DEFAULT 0,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_rank_type CHECK (
    (kyu IS NOT NULL AND dan IS NULL) OR 
    (kyu IS NULL AND dan IS NOT NULL)
  )
);

-- Create grading configurations table to manage available grades for applications
CREATE TABLE public.grading_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank_id UUID NOT NULL REFERENCES public.ranks(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies for ranks table
CREATE POLICY "Everyone can view ranks" 
ON public.ranks 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage ranks" 
ON public.ranks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- RLS policies for grading configurations table
CREATE POLICY "Everyone can view grading configurations" 
ON public.grading_configurations 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage grading configurations" 
ON public.grading_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Insert existing ranks data - Kyu ranks
INSERT INTO public.ranks (rank_order, kyu, belt_color, stripes, display_name) VALUES
(1, 10, 'White', 0, '10th Kyu - White Belt'),
(2, 9, 'White', 1, '9th Kyu - White Belt (1 Stripe)'),
(3, 8, 'Orange', 0, '8th Kyu - Orange Belt'),
(4, 7, 'Orange', 1, '7th Kyu - Orange Belt (1 Stripe)'),
(5, 6, 'Orange', 2, '6th Kyu - Orange Belt (2 Stripes)'),
(6, 5, 'Orange', 3, '5th Kyu - Orange Belt (3 Stripes)'),
(7, 4, 'Brown', 0, '4th Kyu - Brown Belt'),
(8, 3, 'Brown', 1, '3rd Kyu - Brown Belt (1 Stripe)'),
(9, 2, 'Brown', 2, '2nd Kyu - Brown Belt (2 Stripes)'),
(10, 1, 'Brown', 3, '1st Kyu - Brown Belt (3 Stripes)');

-- Insert Dan ranks
INSERT INTO public.ranks (rank_order, dan, belt_color, stripes, display_name) VALUES
(11, 1, 'Black', 0, '1st Dan - Black Belt (Shodan)'),
(12, 2, 'Black', 0, '2nd Dan - Black Belt (Nidan)'),
(13, 3, 'Black', 0, '3rd Dan - Black Belt (Sandan)'),
(14, 4, 'Black', 0, '4th Dan - Black Belt (Yondan)'),
(15, 5, 'Black', 0, '5th Dan - Black Belt (Godan)');

-- Insert grading configurations for available ranks (initially all available except Dan ranks)
INSERT INTO public.grading_configurations (rank_id, is_available, display_order)
SELECT 
  id as rank_id,
  CASE WHEN dan IS NULL THEN true ELSE false END as is_available,
  rank_order as display_order
FROM public.ranks;

-- Add new columns to profiles table for rank reference
ALTER TABLE public.profiles 
ADD COLUMN current_rank_id UUID REFERENCES public.ranks(id),
ADD COLUMN rank_effective_date DATE;

-- Update existing profiles to reference the new ranks table
UPDATE public.profiles 
SET current_rank_id = (
  SELECT id FROM public.ranks 
  WHERE kyu = COALESCE((current_grade->>'kyu')::integer, 10)
  AND dan IS NULL
  LIMIT 1
),
rank_effective_date = COALESCE((current_grade->>'effective_date')::date, created_at::date);

-- Add new columns to gradings table for rank reference
ALTER TABLE public.gradings 
ADD COLUMN requested_rank_id UUID REFERENCES public.ranks(id),
ADD COLUMN achieved_rank_id UUID REFERENCES public.ranks(id);

-- Create triggers for updated_at
CREATE TRIGGER update_ranks_updated_at
BEFORE UPDATE ON public.ranks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grading_configurations_updated_at
BEFORE UPDATE ON public.grading_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();