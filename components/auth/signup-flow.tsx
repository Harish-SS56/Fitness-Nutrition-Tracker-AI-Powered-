"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, User, Scale, Target, Eye, EyeOff } from "lucide-react"
import {
  calculateBMI,
  categorizeBMI,
  suggestGoalType,
  calculateCalorieGoal,
  calculateProteinGoal,
} from "../../lib/bmi-calculator.js"

export function SignupFlow({ onSignupComplete, onSwitchToLogin }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    email: "",
    password: "",
    // Step 2: Physical Info
    height: "",
    weight: "",
    // Step 3: Goals (calculated)
    bmi: 0,
    bmi_category: "",
    goal_type: "",
    calorie_goal: "",
    protein_goal: "",
  })

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep === 2) {
      // Calculate BMI and goals when moving from step 2 to 3
      const height = parseFloat(formData.height)
      const weight = parseFloat(formData.weight)
      
      if (height && weight) {
        const bmi = calculateBMI(weight, height)
        const bmi_category = categorizeBMI(bmi)
        const suggested_goal = suggestGoalType(bmi)
        const calorie_goal = calculateCalorieGoal(weight, height, 25, "male", suggested_goal)
        const protein_goal = calculateProteinGoal(weight, suggested_goal)
        
        setFormData(prev => ({
          ...prev,
          bmi,
          bmi_category,
          goal_type: suggested_goal,
          calorie_goal,
          protein_goal,
        }))
      }
    }
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Show success message and redirect to login
        alert("Account created successfully! Please sign in with your credentials.")
        onSignupComplete()
      } else {
        setError(data.error || "Signup failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isStep1Valid = formData.name && formData.email && formData.password
  const isStep2Valid = formData.height && formData.weight

  return (
    <Card className="w-full max-w-md bg-card border-border">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          {currentStep === 1 && <User className="w-6 h-6 text-primary" />}
          {currentStep === 2 && <Scale className="w-6 h-6 text-primary" />}
          {currentStep === 3 && <Target className="w-6 h-6 text-primary" />}
        </div>
        
        {currentStep === 1 && (
          <>
            <CardTitle className="text-card-foreground">Let's Get Started</CardTitle>
            <CardDescription>Create your fitness tracker account</CardDescription>
          </>
        )}
        
        {currentStep === 2 && (
          <>
            <CardTitle className="text-card-foreground">Tell us about yourself</CardTitle>
            <CardDescription>We need your measurements to calculate your BMI</CardDescription>
          </>
        )}
        
        {currentStep === 3 && (
          <>
            <CardTitle className="text-card-foreground">Your BMI Results</CardTitle>
            <CardDescription>Set your fitness goals based on your BMI</CardDescription>
          </>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleNext} 
              className="w-full" 
              disabled={!isStep1Valid}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Physical Info */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => updateFormData("height", e.target.value)}
                placeholder="170"
                required
              />
            </div>

            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => updateFormData("weight", e.target.value)}
                placeholder="70"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleBack} 
                variant="outline" 
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleNext} 
                className="flex-1" 
                disabled={!isStep2Valid}
              >
                Calculate BMI
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {formData.bmi.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">BMI</div>
              <div className="text-sm font-medium">{formData.bmi_category}</div>
            </div>

            <div>
              <Label htmlFor="goal_type">Fitness Goal</Label>
              <Select 
                value={formData.goal_type} 
                onValueChange={(value) => updateFormData("goal_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loss">Weight Loss</SelectItem>
                  <SelectItem value="maintenance">Maintain Weight</SelectItem>
                  <SelectItem value="gain">Weight Gain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calorie_goal">Daily Calories</Label>
                <Input
                  id="calorie_goal"
                  type="number"
                  value={formData.calorie_goal}
                  onChange={(e) => updateFormData("calorie_goal", e.target.value)}
                  placeholder="2000"
                />
              </div>

              <div>
                <Label htmlFor="protein_goal">Daily Protein (g)</Label>
                <Input
                  id="protein_goal"
                  type="number"
                  value={formData.protein_goal}
                  onChange={(e) => updateFormData("protein_goal", e.target.value)}
                  placeholder="150"
                />
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex gap-2">
              <Button 
                onClick={handleBack} 
                variant="outline" 
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}

        <div className="text-center mt-4 space-y-2">
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToLogin}
            className="text-sm"
          >
            Already have an account? Sign in
          </Button>
          <br />
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="text-sm"
          >
            ← Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
