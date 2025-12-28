-- Add RLS policy to allow instructors to view all profiles
CREATE POLICY "Instructors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 
  FROM profiles instructor_profile 
  WHERE instructor_profile.user_id = auth.uid() 
  AND instructor_profile.is_instructor = true
));