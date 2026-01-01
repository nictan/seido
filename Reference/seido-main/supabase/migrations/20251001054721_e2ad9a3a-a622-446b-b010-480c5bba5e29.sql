-- Create a function to insert grading application with proper grade capture
CREATE OR REPLACE FUNCTION public.insert_grading_application(
  p_student_id UUID,
  p_requested_rank_id UUID,
  p_requested_grade JSONB,
  p_indemnity JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grading_id UUID;
  v_current_grade JSONB;
  v_current_rank_id UUID;
BEGIN
  -- Get the current grade and rank from the profile
  SELECT current_grade, current_rank_id
  INTO v_current_grade, v_current_rank_id
  FROM profiles
  WHERE user_id = p_student_id;

  -- Insert the grading application with captured grade
  INSERT INTO gradings (
    student_id,
    requested_rank_id,
    requested_grade,
    grade_at_application,
    rank_at_application_id,
    indemnity
  )
  VALUES (
    p_student_id,
    p_requested_rank_id,
    p_requested_grade,
    v_current_grade,
    v_current_rank_id,
    p_indemnity
  )
  RETURNING id INTO v_grading_id;

  RETURN v_grading_id;
END;
$$;