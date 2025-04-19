/*
  # Add Anonymous Access to Speech History

  1. Changes
    - Add policy for anonymous users to create speech history entries
    - Add safety checks for existing objects
  
  2. Security
    - Limit text length for anonymous users to 1000 characters
    - Limit voice name length to 50 characters
    - Ensure anonymous entries have no user_id
*/

DO $$ 
BEGIN
  -- Create policy for anonymous users to create records with reasonable limits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'speech_history' 
    AND policyname = 'Anonymous users can create speech history'
  ) THEN
    CREATE POLICY "Anonymous users can create speech history"
      ON speech_history
      FOR INSERT
      TO anon
      WITH CHECK (
        char_length(text) <= 1000 AND    -- Limit text length
        char_length(voice_name) <= 50 AND -- Reasonable voice name length
        user_id IS NULL                   -- Ensure anonymous entries have no user_id
      );
  END IF;
END $$;