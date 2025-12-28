-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create a basic profile for the new user (will be completed during registration)
  INSERT INTO public.profiles (user_id, first_name, last_name, date_of_birth, gender, email, mobile, dojo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, CURRENT_DATE - INTERVAL '18 years'),
    COALESCE((NEW.raw_user_meta_data->>'gender')::gender_type, 'Other'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE((NEW.raw_user_meta_data->>'dojo')::dojo_type, 'HQ')
  );
  RETURN NEW;
END;
$function$;