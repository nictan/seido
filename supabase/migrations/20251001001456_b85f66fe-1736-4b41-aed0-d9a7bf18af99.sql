-- Migrate existing gradings to populate grade_at_application and rank_at_application_id
-- For records where these fields are null, we'll use the rank one level below the requested rank

UPDATE gradings g
SET 
  rank_at_application_id = prev_rank.id,
  grade_at_application = jsonb_build_object(
    'kyu', prev_rank.kyu,
    'dan', prev_rank.dan,
    'belt_color', prev_rank.belt_color
  )
FROM ranks requested_rank
LEFT JOIN ranks prev_rank ON prev_rank.rank_order = requested_rank.rank_order - 1
WHERE g.requested_rank_id = requested_rank.id
  AND g.grade_at_application IS NULL
  AND g.rank_at_application_id IS NULL
  AND prev_rank.id IS NOT NULL;