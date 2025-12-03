"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Award, Medal, Star, Target, Zap, Calendar, Crown, Flame, Sparkles, Gem, Dumbbell, Calculator } from "lucide-react"

const ICON_MAP = {
  Trophy: Trophy,
  Award: Award,
  Medal: Medal,
  Star: Star,
  Target: Target,
  Zap: Zap,
  Calendar: Calendar,
  Crown: Crown,
  Flame: Flame,
  Sparkles: Sparkles,
  Gem: Gem,
  Dumbbell: Dumbbell,
  Calculator: Calculator
}

export function AchievementNotification({ achievements, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (achievements && achievements.length > 0) {
      setCurrentIndex(0)
      setIsOpen(true)
    }
  }, [achievements])

  const handleClose = () => {
    setIsOpen(false)
    if (onClose) onClose()
  }

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleClose()
    }
  }

  if (!achievements || achievements.length === 0) return null

  const currentAchievement = achievements[currentIndex]
  const IconComponent = ICON_MAP[currentAchievement.badge_icon] || Trophy

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="text-center max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-2">
            🎉 Achievement Unlocked!
          </DialogTitle>
          <DialogDescription>
            Congratulations! You've earned a new badge.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"
            style={{ backgroundColor: currentAchievement.badge_color + '20' }}
          >
            <IconComponent 
              className="w-12 h-12"
              style={{ color: currentAchievement.badge_color }}
            />
          </div>
          
          <h3 className="text-xl font-bold mb-2">{currentAchievement.name}</h3>
          <p className="text-muted-foreground mb-4">{currentAchievement.description}</p>
          
          {achievements.length > 1 && (
            <p className="text-sm text-muted-foreground mb-4">
              {currentIndex + 1} of {achievements.length} new achievements
            </p>
          )}
          
          <Button onClick={handleNext} className="bg-yellow-500 hover:bg-yellow-600 text-white">
            {currentIndex < achievements.length - 1 ? "Next Achievement" : "Awesome!"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
