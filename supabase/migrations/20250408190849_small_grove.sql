/*
  # Create Speech History Schema

  1. New Tables
    - `speech_history`
      - `id` (uuid, primary key)
      - `text` (text, the input text)
      - `voice_name` (text, selected voice)
      - `settings` (jsonb, stores pitch, rate, volume)
      - `emotion` (text, emotional tone)
      - `ssml` (text, SSML markup if used)
      - `created_at` (timestamp)
    
  2. Security
    - Enable RLS on `speech_history` table
    - Add policies for authenticated users to manage their own data
    - Add policy for anonymous users to create records with reasonable limits
*/

CREATE TABLE speech_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  text text NOT NULL,
  voice_name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}',
  emotion text,
  ssml text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE speech_history ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own data
CREATE POLICY "Users can manage their own speech history"
  ON speech_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for anonymous users to create records with reasonable limits
CREATE POLICY "Anonymous users can create speech history"
  ON speech_history
  FOR INSERT
  TO anon
  WITH CHECK (
    char_length(text) <= 1000 AND    -- Limit text length
    char_length(voice_name) <= 50 AND -- Reasonable voice name length
    user_id IS NULL                   -- Ensure anonymous entries have no user_id
  );