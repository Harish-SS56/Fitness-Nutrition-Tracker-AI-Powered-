// Client-side API utilities for the frontend

const API_BASE = "/api"

export class ApiClient {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "API request failed")
    }

    return data
  }

  // User management
  static async createUser(userData) {
    return this.request("/users", {
      method: "POST",
      body: userData,
    })
  }

  static async getUser(userId) {
    return this.request(`/users/${userId}`)
  }

  // Nutrition search
  static async searchNutrition(query) {
    return this.request(`/nutrition/search?q=${encodeURIComponent(query)}`)
  }

  // Meal logging
  static async logMeal(mealData) {
    console.log("[v0] API Client - logMeal called with:", mealData)

    try {
      const response = await this.request("/meals", {
        method: "POST",
        body: mealData,
      })

      console.log("[v0] API Client - logMeal response:", response)
      return response
    } catch (error) {
      console.error("[v0] API Client - logMeal error:", error)
      throw error
    }
  }

  static async getMeals(userId, date) {
    return this.request(`/meals?user_id=${userId}&date=${date}`)
  }

  static async parseMeal(mealText) {
    return this.request("/meals/parse", {
      method: "POST",
      body: { meal_text: mealText },
    })
  }

  // Progress tracking
  static async getProgress(userId, date) {
    return this.request(`/progress?user_id=${userId}&date=${date}`)
  }

  // Recommendations
  static async generateRecommendations(userId) {
    return this.request("/recommendations", {
      method: "POST",
      body: { user_id: userId },
    })
  }

  static async getRecommendations(userId, date) {
    return this.request(`/recommendations?user_id=${userId}&date=${date}`)
  }

  // AI chat
  static async sendChatMessage(message, userId) {
    return this.request("/ai/chat", {
      method: "POST",
      body: { message, user_id: userId },
    })
  }
}
