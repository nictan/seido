-- Fix infinite recursion in instructor policy by dropping and recreating it properly
DROP POLICY IF EXISTS "Instructors can view all profiles" ON public.profiles;

-- Create a new policy that checks is_instructor directly from the current user's profile
-- We'll use a function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_instructor(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_instructor FROM public.profiles WHERE user_id = user_uuid LIMIT 1),
    false
  );
$$;

-- Create the instructor policy using the function to avoid recursion
CREATE POLICY "Instructors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_instructor(auth.uid()));

-- Also ensure regular users can still view their own profiles
-- (this policy should already exist but let's make sure)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);