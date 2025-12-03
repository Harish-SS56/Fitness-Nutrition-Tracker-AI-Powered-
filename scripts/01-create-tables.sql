-- Fitness & Nutrition Tracker Database Schema
-- Create all required tables for the application

-- Users table for storing user profiles and goals
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  height DOUBLE PRECISION NOT NULL,
  weight DOUBLE PRECISION NOT NULL,
  bmi DOUBLE PRECISION,
  bmi_category TEXT,
  goal_type TEXT CHECK (goal_type IN ('maintenance', 'gain', 'loss')),
  calorie_goal DOUBLE PRECISION,
  protein_goal DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nutrition database table for food items
CREATE TABLE IF NOT EXISTS nutrition (
  food_id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  enerc DOUBLE PRECISION DEFAULT 0, -- kcal per 100g
  protcnt DOUBLE PRECISION DEFAULT 0, -- g protein per 100g
  fatce DOUBLE PRECISION DEFAULT 0, -- g fat per 100g
  choavldf DOUBLE PRECISION DEFAULT 0, -- g available carbs per 100g
  fibtg DOUBLE PRECISION DEFAULT 0, -- g fiber per 100g
  water DOUBLE PRECISION DEFAULT 0 -- g water per 100g
);

-- Meals table for logging user meals
CREATE TABLE IF NOT EXISTS meals (
  meal_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  meal_text TEXT NOT NULL,
  calories DOUBLE PRECISION,
  protein DOUBLE PRECISION,
  fat DOUBLE PRECISION,
  carbs DOUBLE PRECISION,
  fiber DOUBLE PRECISION,
  meal_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations table for AI-generated suggestions
CREATE TABLE IF NOT EXISTS recommendations (
  recommendation_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  recommendation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_date ON recommendations(user_id, recommendation_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_name ON nutrition(name);
