-- Add default rank indicator to ranks table
ALTER TABLE public.ranks ADD COLUMN is_default_rank boolean DEFAULT false;

-- Set 9th Kyu as the default rank (assuming it exists)
UPDATE public.ranks 
SET is_default_rank = true 
WHERE kyu = 9 AND belt_color = 'White';

-- Update the handle_new_user function to use the default rank
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_rank_info RECORD;
BEGIN
  -- Get the default rank information
  SELECT id, kyu, belt_color INTO default_rank_info
  FROM public.ranks 
  WHERE is_default_rank = true 
  LIMIT 1;

  -- Create a profile for the new user with default rank
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    date_of_birth, 
    gender, 
    email, 
    mobile, 
    dojo,
    current_rank_id,
    current_grade,
    rank_effective_date
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, CURRENT_DATE - INTERVAL '18 years'),
    COALESCE((NEW.raw_user_meta_data->>'gender')::gender_type, 'Other'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE((NEW.raw_user_meta_data->>'dojo')::dojo_type, 'HQ'),
    default_rank_info.id,
    jsonb_build_object(
      'kyu', default_rank_info.kyu,
      'belt_color', default_rank_info.belt_color,
      'effective_date', CURRENT_DATE
    ),
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$function$;