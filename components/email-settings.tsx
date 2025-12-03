"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Clock, Bell, Save, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmailPreferencesClient } from "@/lib/email-preferences-client"

export function EmailSettings({ userId }: { userId: number }) {
  const [preferences, setPreferences] = useState({
    daily_reminders_enabled: true,
    achievement_notifications_enabled: true,
    marketing_emails_enabled: false,
    reminder_time: '09:00:00',
    timezone: 'UTC'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [userId])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const result = await EmailPreferencesClient.getPreferences(userId)

      if (result.success) {
        setPreferences(result.preferences)
        setError('')
      } else {
        setError(result.error || 'Failed to load preferences')
      }
    } catch (err) {
      setError('Network error loading preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setMessage('')
      setError('')

      const result = await EmailPreferencesClient.updatePreferences(userId, preferences)

      if (result.success) {
        setMessage('Email preferences saved and synced with email system!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(result.error || 'Failed to save preferences')
      }
    } catch (err) {
      setError('Network error saving preferences')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }


  const timeOptions = [
    { value: '06:00:00', label: '6:00 AM' },
    { value: '07:00:00', label: '7:00 AM' },
    { value: '08:00:00', label: '8:00 AM' },
    { value: '09:00:00', label: '9:00 AM' },
    { value: '10:00:00', label: '10:00 AM' },
    { value: '11:00:00', label: '11:00 AM' },
    { value: '12:00:00', label: '12:00 PM' },
    { value: '18:00:00', label: '6:00 PM' },
    { value: '19:00:00', label: '7:00 PM' },
    { value: '20:00:00', label: '8:00 PM' }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading preferences...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Settings
        </CardTitle>
        <CardDescription>
          Manage your email notifications and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Reminders */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Daily Reminders</Label>
            <div className="text-sm text-muted-foreground">
              Get daily fitness reminders with your calorie and protein goals
            </div>
          </div>
          <Switch
            checked={preferences.daily_reminders_enabled}
            onCheckedChange={(checked) => updatePreference('daily_reminders_enabled', checked)}
          />
        </div>

        {/* Reminder Time */}
        {preferences.daily_reminders_enabled && (
          <div className="ml-4 space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Reminder Time
            </Label>
            <Select 
              value={preferences.reminder_time} 
              onValueChange={(value) => updatePreference('reminder_time', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Achievement Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Achievement Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Get notified when you unlock new achievements
            </div>
          </div>
          <Switch
            checked={preferences.achievement_notifications_enabled}
            onCheckedChange={(checked) => updatePreference('achievement_notifications_enabled', checked)}
          />
        </div>

        {/* Marketing Emails */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Marketing Emails</Label>
            <div className="text-sm text-muted-foreground">
              Receive tips, updates, and promotional content
            </div>
          </div>
          <Switch
            checked={preferences.marketing_emails_enabled}
            onCheckedChange={(checked) => updatePreference('marketing_emails_enabled', checked)}
          />
        </div>

        {/* Messages */}
        {message && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>

        {/* Email Status Info */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="text-sm font-medium">Current Email Settings:</div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>• Daily Reminders: {preferences.daily_reminders_enabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>• Achievement Alerts: {preferences.achievement_notifications_enabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>• Marketing Emails: {preferences.marketing_emails_enabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div>• Reminder Time: {timeOptions.find(t => t.value === preferences.reminder_time)?.label || preferences.reminder_time}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
