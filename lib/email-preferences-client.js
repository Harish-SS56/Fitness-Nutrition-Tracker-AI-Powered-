// Email Preferences Client - Handle automatic database updates
export class EmailPreferencesClient {
  static async getPreferences(userId) {
    try {
      // Try main route first
      let response = await fetch(`/api/email/preferences?userId=${userId}`)
      let data = await response.json()
      
      if (data.success) {
        return {
          success: true,
          preferences: data.preferences
        }
      }
      
      // If main route fails, try backup route
      console.log('📧 Main route failed, trying backup route...')
      response = await fetch(`/api/email/preferences-backup?userId=${userId}`)
      data = await response.json()
      
      if (data.success) {
        return {
          success: true,
          preferences: data.preferences
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch preferences'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error fetching preferences: ' + error.message
      }
    }
  }

  static async updatePreferences(userId, preferences) {
    try {
      // Try main route first
      let response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...preferences
        })
      })

      let data = await response.json()
      
      if (!data.success) {
        // If main route fails, try backup route
        console.log('📧 Main update route failed, trying backup route...')
        response = await fetch('/api/email/preferences-backup', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            ...preferences
          })
        })
        data = await response.json()
      }
      
      if (data.success) {
        // Trigger automatic email system update
        await this.syncEmailSystem(userId)
        
        return {
          success: true,
          preferences: data.preferences,
          message: 'Email preferences updated successfully'
        }
      } else {
        return {
          success: false,
          error: data.error || 'Failed to update preferences'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error updating preferences: ' + error.message
      }
    }
  }

  static async syncEmailSystem(userId) {
    try {
      // Notify email system of preference changes
      const response = await fetch('/api/email/sync-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()
      console.log('📧 Email system sync result:', data)
      
      return data
    } catch (error) {
      console.error('❌ Email system sync failed:', error)
      return { success: false, error: error.message }
    }
  }

  static async testEmailSending(userId, emailType = 'daily_reminder') {
    try {
      const response = await fetch('/api/email/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          emailType
        })
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: 'Failed to test email sending'
      }
    }
  }
}
