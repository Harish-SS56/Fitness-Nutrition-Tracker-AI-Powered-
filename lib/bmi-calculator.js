// BMI calculation and categorization utilities

export function calculateBMI(weight, height) {
  // BMI = weight (kg) / (height (m))^2
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)
  return Math.round(bmi * 10) / 10 // Round to 1 decimal place
}

export function categorizeBMI(bmi) {
  if (bmi < 18.5) return "Underweight"
  if (bmi >= 18.5 && bmi <= 24.9) return "Normal"
  if (bmi >= 25 && bmi <= 29.9) return "Overweight"
  return "Obese"
}

export function suggestGoalType(bmi) {
  if (bmi < 18.5) return "gain"
  if (bmi >= 25) return "loss"
  return "maintenance"
}

export function calculateCalorieGoal(weight, height, age = 25, gender = "male", goalType = "maintenance") {
  // Using Mifflin-St Jeor Equation for BMR
  let bmr
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161
  }

  // Multiply by activity factor (assuming moderate activity)
  const tdee = bmr * 1.55

  // Adjust based on goal
  switch (goalType) {
    case "loss":
      return Math.round(tdee - 500) // 500 calorie deficit
    case "gain":
      return Math.round(tdee + 500) // 500 calorie surplus
    default:
      return Math.round(tdee) // maintenance
  }
}

export function calculateProteinGoal(weight, goalType = "maintenance") {
  // Protein recommendations based on goal type
  switch (goalType) {
    case "gain":
      return Math.round(weight * 2.2) // 2.2g per kg for muscle gain
    case "loss":
      return Math.round(weight * 2.0) // 2.0g per kg for muscle preservation
    default:
      return Math.round(weight * 1.6) // 1.6g per kg for maintenance
  }
}
