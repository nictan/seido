-- Add DELETE policy for grading_periods
CREATE POLICY "Instructors can delete grading periods"
ON grading_periods
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_instructor = true
  )
);