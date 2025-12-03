"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calculator, Target } from "lucide-react"
import { ApiClient } from "@/lib/api-client"

export function UserRegistration({ onUserCreated, onBack }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    height: "",
    weight: "",
    goal_type: "",
    calorie_goal: "",
    protein_goal: "",
  })
  const [bmiData, setBmiData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateBMI = () => {
    const height = Number.parseFloat(formData.height)
    const weight = Number.parseFloat(formData.weight)

    if (!height || !weight) {
      setError("Please enter valid height and weight")
      return
    }

    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    const roundedBmi = Math.round(bmi * 10) / 10

    let category = ""
    let suggestion = ""

    if (bmi < 18.5) {
      category = "Underweight"
      suggestion = "gain"
    } else if (bmi <= 24.9) {
      category = "Normal"
      suggestion = "maintenance"
    } else if (bmi <= 29.9) {
      category = "Overweight"
      suggestion = "loss"
    } else {
      category = "Obese"
      suggestion = "loss"
    }

    setBmiData({
      bmi: roundedBmi,
      category,
      suggestion,
    })

    setStep(2)
    setError("")
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await ApiClient.createUser({
        name: formData.name,
        email: formData.email,
        height: Number.parseFloat(formData.height),
        weight: Number.parseFloat(formData.weight),
        goal_type: formData.goal_type,
        calorie_goal: formData.calorie_goal ? Number.parseFloat(formData.calorie_goal) : null,
        protein_goal: formData.protein_goal ? Number.parseFloat(formData.protein_goal) : null,
      })

      onUserCreated(response.user)
    } catch (err) {
      setError(err.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={onBack} className="mb-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step === 1 && (
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-card-foreground">Let's Get Started</CardTitle>
              <CardDescription>Tell us about yourself to calculate your BMI and set up your goals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-card-foreground">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your name"
                  className="bg-input border-border"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-card-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-input border-border"
                />
              </div>

              <div>
                <Label htmlFor="height" className="text-card-foreground">
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  placeholder="170"
                  className="bg-input border-border"
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-card-foreground">
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="70"
                  className="bg-input border-border"
                />
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                onClick={calculateBMI}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!formData.name || !formData.email || !formData.height || !formData.weight}
              >
                Calculate BMI & Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && bmiData && (
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-card-foreground">Your BMI Results</CardTitle>
              <CardDescription>Set your fitness goals based on your BMI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* BMI Display */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">{bmiData.bmi}</div>
                <div className="text-muted-foreground">BMI</div>
                <div className="text-sm text-card-foreground mt-1">{bmiData.category}</div>
              </div>

              {/* Goal Selection */}
              <div>
                <Label className="text-card-foreground">Fitness Goal</Label>
                <Select value={formData.goal_type} onValueChange={(value) => handleInputChange("goal_type", value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder={`Suggested: ${bmiData.suggestion}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loss">Weight Loss</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="gain">Weight Gain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Goals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calorie_goal" className="text-card-foreground">
                    Daily Calories (optional)
                  </Label>
                  <Input
                    id="calorie_goal"
                    type="number"
                    value={formData.calorie_goal}
                    onChange={(e) => handleInputChange("calorie_goal", e.target.value)}
                    placeholder="2000"
                    className="bg-input border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="protein_goal" className="text-card-foreground">
                    Daily Protein (g)
                  </Label>
                  <Input
                    id="protein_goal"
                    type="number"
                    value={formData.protein_goal}
                    onChange={(e) => handleInputChange("protein_goal", e.target.value)}
                    placeholder="150"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                onClick={handleSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading || !formData.goal_type}
              >
                {loading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
