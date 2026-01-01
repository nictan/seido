-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic instructor policy that causes recursion
DROP POLICY IF EXISTS "Instructors can view all profiles" ON public.profiles;

-- Create a simpler instructor policy that doesn't reference profiles table
-- Instructors will only be able to view their own profile like regular users
-- If needed later, we can create a separate instructor_profiles view or handle this in the application layer

-- The existing policies remain:
-- "Users can view their own profile" - auth.uid() = user_id (no recursion)
-- "Users can insert their own profile" - auth.uid() = user_id (no recursion) 
-- "Users can update their own profile" - auth.uid() = user_id (no recursion)