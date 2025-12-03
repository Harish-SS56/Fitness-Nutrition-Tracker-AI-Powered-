-- Create exercises database table
CREATE TABLE IF NOT EXISTS exercises (
  exercise_id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- cardio, strength, flexibility, sports
  calories_per_minute DOUBLE PRECISION DEFAULT 0, -- average calories burned per minute
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create workouts table for logging user workouts
CREATE TABLE IF NOT EXISTS workouts (
  workout_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  exercise_id INT REFERENCES exercises(exercise_id),
  duration_minutes INT NOT NULL, -- duration in minutes
  calories_burned DOUBLE PRECISION NOT NULL, -- calculated calories burned
  workout_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_workouts_exercise ON workouts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);

-- Insert common exercises with calorie burn rates (calories per minute for average 70kg person)
INSERT INTO exercises (name, category, calories_per_minute, description) VALUES
-- Cardio exercises
('Running (6 mph)', 'cardio', 10.0, 'Moderate pace running'),
('Walking (3.5 mph)', 'cardio', 4.0, 'Brisk walking'),
('Cycling (moderate)', 'cardio', 8.0, 'Moderate cycling'),
('Swimming', 'cardio', 11.0, 'General swimming'),
('Jumping Jacks', 'cardio', 8.0, 'High-intensity jumping jacks'),
('Treadmill', 'cardio', 9.0, 'Treadmill running/walking'),
('Elliptical', 'cardio', 7.0, 'Elliptical machine'),
('Rowing', 'cardio', 12.0, 'Rowing machine'),

-- Strength training
('Weight Lifting', 'strength', 6.0, 'General weight lifting'),
('Push-ups', 'strength', 7.0, 'Bodyweight push-ups'),
('Pull-ups', 'strength', 8.0, 'Bodyweight pull-ups'),
('Squats', 'strength', 5.0, 'Bodyweight squats'),
('Deadlifts', 'strength', 6.0, 'Barbell deadlifts'),
('Bench Press', 'strength', 5.0, 'Barbell bench press'),
('Planks', 'strength', 3.0, 'Core strengthening planks'),

-- Sports
('Basketball', 'sports', 8.0, 'Playing basketball'),
('Football', 'sports', 9.0, 'Playing football'),
('Tennis', 'sports', 7.0, 'Playing tennis'),
('Badminton', 'sports', 6.0, 'Playing badminton'),
('Cricket', 'sports', 5.0, 'Playing cricket'),

-- Flexibility & Others
('Yoga', 'flexibility', 3.0, 'Hatha yoga'),
('Stretching', 'flexibility', 2.0, 'General stretching'),
('Pilates', 'flexibility', 4.0, 'Pilates exercises')

ON CONFLICT (name) DO NOTHING;
