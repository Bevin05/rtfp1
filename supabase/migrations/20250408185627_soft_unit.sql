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

CREATE POLICY "Users can manage their own speech history"
  ON speech_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);