-- Create enums for the application
CREATE TYPE public.gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE public.dojo_type AS ENUM ('TP', 'SIT', 'HQ');
CREATE TYPE public.grading_status AS ENUM ('Pending', 'Pass', 'Fail');

-- Create profiles table (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  dojo dojo_type NOT NULL,
  remarks TEXT,
  profile_picture_url TEXT,
  is_student BOOLEAN NOT NULL DEFAULT true,
  is_instructor BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  current_grade JSONB DEFAULT '{"kyu": 10, "belt_color": "White", "effective_date": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT age_check CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '17 years')
);

-- Create gradings table for applications
CREATE TABLE public.gradings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  requested_grade JSONB NOT NULL,
  status grading_status NOT NULL DEFAULT 'Pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  indemnity JSONB,
  grading_notes TEXT,
  visible_remarks TEXT,
  certificate_url TEXT,
  decided_by UUID REFERENCES public.profiles(user_id),
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grading_history table for immutable log
CREATE TABLE public.grading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  grading_id UUID NOT NULL REFERENCES public.gradings(id) ON DELETE CASCADE,
  result grading_status NOT NULL,
  remarks TEXT,
  notes TEXT,
  grade_after JSONB,
  certificate_url TEXT,
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('profile-pictures', 'profile-pictures', true),
  ('signatures', 'signatures', false),
  ('indemnities', 'indemnities', false),
  ('certificates', 'certificates', true);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

-- Create RLS policies for gradings
CREATE POLICY "Students can view their own gradings" ON public.gradings
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own gradings" ON public.gradings
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Instructors can view all gradings" ON public.gradings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

CREATE POLICY "Instructors can update gradings" ON public.gradings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

-- Create RLS policies for grading_history
CREATE POLICY "Students can view their own history" ON public.grading_history
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view all history" ON public.grading_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

CREATE POLICY "Instructors can insert history" ON public.grading_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

-- Create storage policies
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'signatures' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Instructors can view signatures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signatures' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

CREATE POLICY "Instructors can manage indemnities" ON storage.objects
  FOR ALL USING (
    bucket_id = 'indemnities' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

CREATE POLICY "Certificates are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates');

CREATE POLICY "Instructors can upload certificates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificates' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_instructor = true)
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gradings_updated_at
  BEFORE UPDATE ON public.gradings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin instructor
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'contact@hayashiha.sg',
  crypt('Password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Admin", "last_name": "Instructor", "dojo": "HQ", "mobile": "+6512345678", "gender": "Other", "date_of_birth": "1980-01-01"}'::jsonb
);

-- Update the admin profile with instructor and admin flags
-- (This will be handled by the trigger, then we update the flags)
UPDATE public.profiles 
SET is_instructor = true, is_admin = true 
WHERE email = 'contact@hayashiha.sg';