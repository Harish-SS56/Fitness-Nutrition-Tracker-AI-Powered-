"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Trash2, Database, Sparkles, AlertCircle, CheckCircle } from "lucide-react"
import { ApiClient } from "@/lib/api-client"

export function NutritionTable({ userId }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [nutritionData, setNutritionData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newFood, setNewFood] = useState({
    name: "",
    enerc: "",
    protcnt: "",
    fat: "",
    chocdf: "",
    fibtg: ""
  })

  useEffect(() => {
    loadNutritionData()
  }, [])

  useEffect(() => {
    // Filter data based on search query
    if (searchQuery.trim()) {
      const filtered = nutritionData.filter(food => 
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredData(filtered)
    } else {
      setFilteredData(nutritionData.slice(0, 50)) // Show first 50 items when no search
    }
  }, [searchQuery, nutritionData])

  const loadNutritionData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/nutrition/all")
      const data = await response.json()
      if (data.success) {
        setNutritionData(data.nutrition)
        setFilteredData(data.nutrition.slice(0, 50))
      }
    } catch (error) {
      console.error("Failed to load nutrition data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      // Use the AI-enhanced search
      const response = await fetch(`/api/test-nutrition-ai?food=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.success && data.result.found) {
        setFilteredData(data.result.data)
      } else {
        setFilteredData([])
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFood = async () => {
    // Validate required fields
    if (!newFood.name.trim()) {
      alert("Please enter a food name")
      return
    }

    try {
      console.log("Adding food:", newFood)
      const response = await fetch("/api/nutrition/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFood)
      })
      
      const data = await response.json()
      console.log("Add food response:", data)
      
      if (data.success) {
        alert("Food item added successfully!")
        setIsAddDialogOpen(false)
        setNewFood({ name: "", enerc: "", protcnt: "", fat: "", chocdf: "", fibtg: "" })
        loadNutritionData()
      } else {
        alert(`Failed to add food: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to add food:", error)
  }

  const handleSaveFood = async () => {
    console.log("🔥 BRAND NEW SAVE FUNCTION CALLED!")
    alert("🔥 NEW FUNCTION IS RUNNING!")
    
    if (!selectedFood) {
      alert("No food selected")
      return
    }

    // Force check - if no food_id, it's AI food
    const hasNoId = !selectedFood.food_id || selectedFood.food_id === undefined
    const isMarkedAsAI = selectedFood.calculated_by_ai === true
    const isAIFood = hasNoId || isMarkedAsAI
    
    console.log("=== FOOD ANALYSIS ===")
    console.log("Selected food:", selectedFood)
    console.log("Has food_id:", selectedFood.food_id)
    console.log("Calculated by AI:", selectedFood.calculated_by_ai)
    console.log("Is AI food (final):", isAIFood)
    console.log("====================")
    
    try {
      if (isAIFood) {
        // AI FOOD - ADD TO DATABASE
        console.log("🤖 ADDING AI FOOD TO DATABASE:", selectedFood.name)
        
        const foodData = {
          name: selectedFood.name,
          enerc: selectedFood.enerc || 0,
          protcnt: selectedFood.protcnt || 0,
          fat: selectedFood.fat || 0,
          chocdf: selectedFood.chocdf || 0,
          fibtg: selectedFood.fibtg || 0
        }
        
        console.log("📤 Sending to ADD API:", foodData)
        
        const response = await fetch("/api/nutrition/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(foodData)
        })
        
        const data = await response.json()
        console.log("📥 ADD API Response:", data)
        
        if (data.success) {
          alert(`🎉 SUCCESS! "${selectedFood.name}" added to your database!`)
          setIsEditDialogOpen(false)
          setSelectedFood(null)
          loadNutritionData()
        } else {
          alert(`❌ Failed to add food: ${data.error}`)
        }
      } else {
        // DATABASE FOOD - UPDATE EXISTING
        console.log("💾 UPDATING DATABASE FOOD:", selectedFood.name)
        
        const response = await fetch(`/api/nutrition/update/${selectedFood.food_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedFood)
        })
        
        const data = await response.json()
        console.log("📥 UPDATE API Response:", data)
        
        if (data.success) {
          alert(`✅ "${selectedFood.name}" updated successfully!`)
          setIsEditDialogOpen(false)
          setSelectedFood(null)
          loadNutritionData()
        } else {
          alert(`❌ Failed to update food: ${data.error}`)
        }
      }
    } catch (error: any) {
      console.error("💥 Error saving food:", error)
      alert(`💥 Error: ${error.message}`)
    }
  }

  const handleDeleteFood = async (foodId) => {
    if (!confirm("Are you sure you want to delete this food item?")) return

    try {
      const response = await fetch(`/api/nutrition/delete/${foodId}`, {
        method: "DELETE"
      })
      
      const data = await response.json()
      if (data.success) {
        loadNutritionData()
      }
    } catch (error) {
      console.error("Failed to delete food:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Database className="w-5 h-5 text-primary" />
            Nutrition Database
          </CardTitle>
          <CardDescription>
            Search, view, and manage nutrition information for foods. AI-powered calculations for unknown foods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for foods (e.g., chapathi, chicken breast, apple...)"
                className="bg-input border-border"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Food
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Food Item</DialogTitle>
                  <DialogDescription>
                    Add a new food item to the nutrition database
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Food Name</Label>
                    <Input
                      id="name"
                      value={newFood.name}
                      onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                      placeholder="e.g., Chapathi"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="enerc">Calories (per 100g)</Label>
                      <Input
                        id="enerc"
                        type="number"
                        value={newFood.enerc}
                        onChange={(e) => setNewFood({...newFood, enerc: e.target.value})}
                        placeholder="297"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protcnt">Protein (g per 100g)</Label>
                      <Input
                        id="protcnt"
                        type="number"
                        value={newFood.protcnt}
                        onChange={(e) => setNewFood({...newFood, protcnt: e.target.value})}
                        placeholder="8.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat">Fat (g per 100g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={newFood.fat}
                        onChange={(e) => setNewFood({...newFood, fat: e.target.value})}
                        placeholder="7.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chocdf">Carbs (g per 100g)</Label>
                      <Input
                        id="chocdf"
                        type="number"
                        value={newFood.chocdf}
                        onChange={(e) => setNewFood({...newFood, chocdf: e.target.value})}
                        placeholder="43.2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fibtg">Fiber (g per 100g)</Label>
                      <Input
                        id="fibtg"
                        type="number"
                        value={newFood.fibtg}
                        onChange={(e) => setNewFood({...newFood, fibtg: e.target.value})}
                        placeholder="3.9"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddFood} className="w-full">
                    Add Food Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Results Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food Name</TableHead>
                  <TableHead className="text-right">Calories</TableHead>
                  <TableHead className="text-right">Protein (g)</TableHead>
                  <TableHead className="text-right">Fat (g)</TableHead>
                  <TableHead className="text-right">Carbs (g)</TableHead>
                  <TableHead className="text-right">Fiber (g)</TableHead>
                  <TableHead className="text-center">Source</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((food, index) => (
                    <TableRow key={food.food_id || index}>
                      <TableCell className="font-medium">{food.name}</TableCell>
                      <TableCell className="text-right">{(food.enerc || 0).toFixed(0)}</TableCell>
                      <TableCell className="text-right">{(food.protcnt || 0).toFixed(1)}</TableCell>
                      <TableCell className="text-right">{(food.fat || 0).toFixed(1)}</TableCell>
                      <TableCell className="text-right">{(food.chocdf || 0).toFixed(1)}</TableCell>
                      <TableCell className="text-right">{(food.fibtg || 0).toFixed(1)}</TableCell>
                      <TableCell className="text-center">
                        {food.calculated_by_ai ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            DB
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              console.log("Edit button clicked for food:", food)
                              console.log("Food has food_id:", food.food_id)
                              console.log("Food calculated_by_ai:", food.calculated_by_ai)
                              setSelectedFood(food)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          {!food.calculated_by_ai && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFood(food.food_id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          Searching nutrition data...
                        </div>
                      ) : searchQuery ? (
                        <div className="text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          No results found for "{searchQuery}"
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          <Database className="w-8 h-8 mx-auto mb-2" />
                          Search for foods to view nutrition information
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-medium">Database Foods</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Foods from your comprehensive nutrition database with verified values
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <span className="font-medium">AI Calculated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Foods calculated by AI when not found in database - accurate estimates
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
            <DialogDescription>
              Update nutrition information for {selectedFood?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedFood && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Food Name</Label>
                <Input
                  id="edit-name"
                  value={selectedFood.name}
                  onChange={(e) => setSelectedFood({...selectedFood, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-enerc">Calories (per 100g)</Label>
                  <Input
                    id="edit-enerc"
                    type="number"
                    value={selectedFood.enerc || ""}
                    onChange={(e) => setSelectedFood({...selectedFood, enerc: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-protcnt">Protein (g per 100g)</Label>
                  <Input
                    id="edit-protcnt"
                    type="number"
                    value={selectedFood.protcnt || ""}
                    onChange={(e) => setSelectedFood({...selectedFood, protcnt: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fat">Fat (g per 100g)</Label>
                  <Input
                    id="edit-fat"
                    type="number"
                    value={selectedFood.fat || ""}
                    onChange={(e) => setSelectedFood({...selectedFood, fat: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-chocdf">Carbs (g per 100g)</Label>
                  <Input
                    id="edit-chocdf"
                    type="number"
                    value={selectedFood.chocdf || ""}
                    onChange={(e) => setSelectedFood({...selectedFood, chocdf: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fibtg">Fiber (g per 100g)</Label>
                  <Input
                    id="edit-fibtg"
                    type="number"
                    value={selectedFood.fibtg || ""}
                    onChange={(e) => setSelectedFood({...selectedFood, fibtg: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <Button onClick={handleSaveFood} className="w-full bg-red-600 hover:bg-red-700">
                🚀 SAVE FOOD (NEW FUNCTION)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
