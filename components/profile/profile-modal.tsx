"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Save, X } from "lucide-react"
import {
  calculateBMI,
  categorizeBMI,
  suggestGoalType,
  calculateCalorieGoal,
  calculateProteinGoal,
} from "../../lib/bmi-calculator.js"

export function ProfileModal({ user, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: user.name || "",
    height: user.height || "",
    weight: user.weight || "",
    goal_type: user.goal_type || "",
    calorie_goal: user.calorie_goal || "",
    protein_goal: user.protein_goal || "",
  })

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      name: user.name || "",
      height: user.height || "",
      weight: user.weight || "",
      goal_type: user.goal_type || "",
      calorie_goal: user.calorie_goal || "",
      protein_goal: user.protein_goal || "",
    })
  }, [user])

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Calculate new BMI if height/weight changed
      const height = parseFloat(formData.height)
      const weight = parseFloat(formData.weight)
      
      let updatedData = { ...formData }
      
      if (height && weight) {
        const bmi = calculateBMI(weight, height)
        const bmi_category = categorizeBMI(bmi)
        
        updatedData = {
          ...updatedData,
          bmi,
          bmi_category,
        }
      }

      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      const data = await response.json()

      if (data.success) {
        onUpdate(data.user)
        setOpen(false)
      } else {
        setError(data.error || "Update failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const calculateGoals = () => {
    const height = parseFloat(formData.height)
    const weight = parseFloat(formData.weight)
    
    if (height && weight && formData.goal_type) {
      const calorie_goal = calculateCalorieGoal(weight, height, 25, "male", formData.goal_type)
      const protein_goal = calculateProteinGoal(weight, formData.goal_type)
      
      updateFormData("calorie_goal", calorie_goal)
      updateFormData("protein_goal", protein_goal)
    }
  }

  const currentBMI = formData.height && formData.weight 
    ? calculateBMI(parseFloat(formData.weight), parseFloat(formData.height))
    : user.bmi

  const currentBMICategory = formData.height && formData.weight 
    ? categorizeBMI(currentBMI)
    : user.bmi_category

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and fitness goals
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {currentBMI && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {currentBMI.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">BMI</div>
              <div className="text-sm font-medium">{currentBMICategory}</div>
            </div>
          )}

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

          <Button 
            type="button" 
            variant="outline" 
            onClick={calculateGoals}
            className="w-full"
            disabled={!formData.height || !formData.weight || !formData.goal_type}
          >
            Recalculate Goals
          </Button>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
