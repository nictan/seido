-- Add RLS policy to allow instructors to update student profiles
CREATE POLICY "Instructors can update student profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS instructor_profile
    WHERE instructor_profile.user_id = auth.uid()
    AND instructor_profile.is_instructor = true
  )
);