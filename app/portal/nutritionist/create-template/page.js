"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaSave, FaTimes } from "react-icons/fa";
import axios from "@/lib/axios";

export default function CreateTemplate() {
  const [view, setView] = useState("create"); // "create" or "list"
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null); // For viewing template details

  // Template form state
  const [templateName, setTemplateName] = useState("");
  const [numberOfDays, setNumberOfDays] = useState("");
  const [description, setDescription] = useState("");
  const [dietData, setDietData] = useState([]);

  // Food search state for autocomplete
  const [foodSuggestions, setFoodSuggestions] = useState({});
  const [searchingFood, setSearchingFood] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const activeSuggestionRef = useRef({});

  // Fetch templates on list view
  useEffect(() => {
    if (view === "list") {
      fetchTemplates();
    }
  }, [view]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/admin/nutritionist_diet_templates/list");
      if (response.data?.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const initializeDietData = (days) => {
    const data = [];
    for (let i = 1; i <= days; i++) {
      data.push({
        day_number: i,
        meals: []
      });
    }
    setDietData(data);
  };

  // Migrate old format to new format for backwards compatibility
  const migrateFoodFormat = (food) => {
    if (food.name && food.quantity !== undefined) {
      return food; // Already new format
    }
    // Old format: name_quantity field
    return {
      name: food.name_quantity || "",
      quantity: "",
      nutrition: food.nutrition || {
        calories: 0, protein: 0, fat: 0, carbs: 0,
        fiber: 0, sugar: 0, sodium: 0, calcium: 0,
        iron: 0, magnesium: 0, potassium: 0
      }
    };
  };

  const migrateDietData = (dietData) => {
    return dietData.map(day => ({
      ...day,
      meals: day.meals.map(meal => ({
        ...meal,
        foods: meal.foods.map(migrateFoodFormat)
      }))
    }));
  };

  const handleDaysChange = (e) => {
    const days = parseInt(e.target.value) || 0;
    setNumberOfDays(days);
    if (days > 0) {
      initializeDietData(days);
    } else {
      setDietData([]);
    }
  };

  const addDay = () => {
    const newDayNumber = dietData.length + 1;
    const newDay = {
      day_number: newDayNumber,
      meals: []
    };
    setDietData([...dietData, newDay]);
    setNumberOfDays(newDayNumber);
  };

  const removeDay = (dayIndex) => {
    const newDietData = dietData.filter((_, index) => index !== dayIndex);
    // Recalculate day numbers
    const recalculatedData = newDietData.map((day, index) => ({
      ...day,
      day_number: index + 1
    }));
    setDietData(recalculatedData);
    setNumberOfDays(recalculatedData.length);
  };

  const addMeal = (dayIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals.push({
      title: "",
      time: "",
      foods: []
    });
    setDietData(newDietData);
  };

  const removeMeal = (dayIndex, mealIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals.splice(mealIndex, 1);
    setDietData(newDietData);
  };

  const updateMeal = (dayIndex, mealIndex, field, value) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex][field] = value;
    setDietData(newDietData);
  };

  const addFood = (dayIndex, mealIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex].foods.push({
      name: "",
      quantity: "",
      nutrition: {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        calcium: 0,
        iron: 0,
        magnesium: 0,
        potassium: 0
      }
    });
    setDietData(newDietData);
  };

  const removeFood = (dayIndex, mealIndex, foodIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex].foods.splice(foodIndex, 1);
    setDietData(newDietData);
  };

  const updateFood = (dayIndex, mealIndex, foodIndex, field, value) => {
    const newDietData = [...dietData];
    if (field === "name" || field === "quantity") {
      newDietData[dayIndex].meals[mealIndex].foods[foodIndex][field] = value;
    } else {
      newDietData[dayIndex].meals[mealIndex].foods[foodIndex].nutrition[field] = parseFloat(value) || 0;
    }
    setDietData(newDietData);
  };

  // Search foods for autocomplete
  const searchFoods = async (query, dayIndex, mealIndex, foodIndex) => {
    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
    if (!query || query.length < 1) {
      setFoodSuggestions(prev => ({ ...prev, [key]: [] }));
      setShowSuggestions(prev => ({ ...prev, [key]: false }));
      return;
    }

    setSearchingFood(prev => ({ ...prev, [key]: true }));

    try {
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/food-search?query=${encodeURIComponent(query)}`);
      if (response.data?.success) {
        setFoodSuggestions(prev => ({ ...prev, [key]: response.data.data.foods || [] }));
        setShowSuggestions(prev => ({ ...prev, [key]: true }));
      }
    } catch (err) {
      console.error("Error searching foods:", err);
      setFoodSuggestions(prev => ({ ...prev, [key]: [] }));
    } finally {
      setSearchingFood(prev => ({ ...prev, [key]: false }));
    }
  };

  // Handle suggestion selection
  const selectFoodSuggestion = (suggestion, dayIndex, mealIndex, foodIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex].foods[foodIndex] = {
      name: suggestion.name,
      quantity: suggestion.quantity || "",
      nutrition: suggestion.nutrition || {
        calories: 0, protein: 0, fat: 0, carbs: 0,
        fiber: 0, sugar: 0, sodium: 0, calcium: 0,
        iron: 0, magnesium: 0, potassium: 0
      }
    };
    setDietData(newDietData);

    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
    setShowSuggestions(prev => ({ ...prev, [key]: false }));
    setFoodSuggestions(prev => ({ ...prev, [key]: [] }));
  };

  // Handle keyboard navigation in suggestions
  const handleSuggestionKeyDown = (e, suggestions, dayIndex, mealIndex, foodIndex) => {
    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
    if (!suggestions || suggestions.length === 0) return;

    if (!activeSuggestionRef.current[key]) {
      activeSuggestionRef.current[key] = 0;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionRef.current[key] = Math.min(activeSuggestionRef.current[key] + 1, suggestions.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionRef.current[key] = Math.max(activeSuggestionRef.current[key] - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeIdx = activeSuggestionRef.current[key];
      if (suggestions[activeIdx]) {
        selectFoodSuggestion(suggestions[activeIdx], dayIndex, mealIndex, foodIndex);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    if (!numberOfDays || numberOfDays < 1) {
      alert("Please enter number of days");
      return;
    }

    // Validate diet data
    for (const day of dietData) {
      for (const meal of day.meals) {
        if (!meal.title.trim()) {
          alert(`Please enter title for all meals on Day ${day.day_number}`);
          return;
        }
        for (const food of meal.foods) {
          if (!food.name?.trim()) {
            alert(`Please enter food name for all meals on Day ${day.day_number}`);
            return;
          }
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        template_name: templateName,
        number_of_days: parseInt(numberOfDays),
        description: description,
        diet_data: dietData
      };

      let response;
      if (editingTemplate) {
        response = await axios.put(`/api/admin/nutritionist_diet_templates/template/${editingTemplate.id}`, payload);
      } else {
        response = await axios.post("/api/admin/nutritionist_diet_templates/create", payload);
      }

      if (response.data?.success) {
        alert(editingTemplate ? "Template updated successfully!" : "Template created successfully!");
        resetForm();
        setView("list");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      alert(err.response?.data?.detail || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setNumberOfDays("");
    setDescription("");
    setDietData([]);
    setEditingTemplate(null);
  };

  const handleEditTemplate = async (templateId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/template/${templateId}`);
      if (response.data?.success) {
        const template = response.data.data;
        setTemplateName(template.template_name);
        setNumberOfDays(template.number_of_days);
        setDescription(template.description || "");
        setDietData(migrateDietData(template.diet_data || []));
        setEditingTemplate(template);
        setView("create");
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      alert("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`/api/admin/nutritionist_diet_templates/template/${templateId}`);
      if (response.data?.success) {
        alert("Template deleted successfully!");
        fetchTemplates();
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemplate = async (templateId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/template/${templateId}`);
      if (response.data?.success) {
        const template = response.data.data;
        // Migrate diet data to new format for consistent display
        template.diet_data = migrateDietData(template.diet_data || []);
        setViewingTemplate(template);
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      alert("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="users-container">
      <div className="users-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Create</span> Template
        </h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => {
              setView("create");
              resetForm();
            }}
            style={{
              background: view === "create" ? "#FF5757" : "transparent",
              border: view === "create" ? "none" : "1px solid #666",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Create New
          </button>
          <button
            onClick={() => setView("list")}
            style={{
              background: view === "list" ? "#FF5757" : "transparent",
              border: view === "list" ? "none" : "1px solid #666",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            My Templates
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
              No templates found. Create your first template!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Template Name</th>
                    <th>Days</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>{template.template_name}</td>
                      <td>{template.number_of_days}</td>
                      <td>{template.description || "-"}</td>
                      <td>
                        <button
                          onClick={() => handleViewTemplate(template.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #666",
                            color: "#ccc",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "8px",
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #666",
                            color: "#ccc",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #f44",
                            color: "#f44",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#1e1e1e", border: "1px solid #333", borderRadius: "8px", padding: "1.5rem" }}>
          {/* Template Basic Info */}
          <div style={{ marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "#ccc", fontSize: "13px", marginBottom: "0.5rem" }}>
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Weight Lose, Muscle Gain"
                style={{
                  width: "100%",
                  background: "#252525",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#ccc", fontSize: "13px", marginBottom: "0.5rem" }}>
                Number of Days *
              </label>
              <input
                type="number"
                value={numberOfDays}
                onChange={handleDaysChange}
                min="1"
                placeholder="e.g., 7, 14, 30"
                style={{
                  width: "100%",
                  background: "#252525",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#ccc", fontSize: "13px", marginBottom: "0.5rem" }}>
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                style={{
                  width: "100%",
                  background: "#252525",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          {/* Diet Data Builder */}
          {dietData.length > 0 && (
            <div>
              <h3 style={{ color: "white", fontSize: "16px", marginBottom: "1rem" }}>Meal Plan</h3>
              {dietData.map((day, dayIndex) => (
                <div key={day.day_number} style={{ marginBottom: "2rem", background: "#252525", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ color: "#FF5757", fontSize: "14px", margin: 0 }}>
                      Day {day.day_number}
                    </h4>
                    <button
                      onClick={() => removeDay(dayIndex)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#f44",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>

                  {day.meals.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                      No meals added yet.
                    </div>
                  ) : (
                    day.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} style={{ marginBottom: "1rem", background: "#1e1e1e", borderRadius: "6px", padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <span style={{ color: "#ccc", fontSize: "13px", fontWeight: "600" }}>
                            Meal {mealIndex + 1}
                          </span>
                          <button
                            onClick={() => removeMeal(dayIndex, mealIndex)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#f44",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                          <div>
                            <label style={{ display: "block", color: "#999", fontSize: "12px", marginBottom: "0.25rem" }}>
                              Title *
                            </label>
                            <input
                              type="text"
                              value={meal.title}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, "title", e.target.value)}
                              placeholder="e.g., Pre workout"
                              style={{
                                width: "100%",
                                background: "#111",
                                border: "1px solid #333",
                                color: "white",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                fontSize: "13px",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", color: "#999", fontSize: "12px", marginBottom: "0.25rem" }}>
                              Time *
                            </label>
                            <input
                              type="text"
                              value={meal.time}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, "time", e.target.value)}
                              placeholder="e.g., 6:30-7:00 AM"
                              style={{
                                width: "100%",
                                background: "#111",
                                border: "1px solid #333",
                                color: "white",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                fontSize: "13px",
                              }}
                            />
                          </div>
                        </div>

                        {meal.foods.map((food, foodIndex) => (
                          <div key={foodIndex} style={{ marginBottom: "0.5rem", background: "#151515", borderRadius: "4px", padding: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                              <span style={{ color: "#999", fontSize: "11px" }}>Food {foodIndex + 1}</span>
                              <button
                                onClick={() => removeFood(dayIndex, mealIndex, foodIndex)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#f44",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                              >
                                <FaTimes />
                              </button>
                            </div>

                            <div style={{ marginBottom: "0.5rem", display: "grid", gridTemplateColumns: "1fr 80px", gap: "0.5rem" }}>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  value={food.name || food.name_quantity || ""}
                                  onChange={(e) => {
                                    updateFood(dayIndex, mealIndex, foodIndex, "name", e.target.value);
                                    searchFoods(e.target.value, dayIndex, mealIndex, foodIndex);
                                  }}
                                  onKeyDown={(e) => {
                                    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                    handleSuggestionKeyDown(e, foodSuggestions[key] || [], dayIndex, mealIndex, foodIndex);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                      setShowSuggestions(prev => ({ ...prev, [key]: false }));
                                    }, 200);
                                  }}
                                  placeholder="Food name"
                                  style={{
                                    width: "100%",
                                    background: "#111",
                                    border: "1px solid #333",
                                    color: "white",
                                    padding: "6px 10px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                  }}
                                />
                                {(() => {
                                  const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                  const suggestions = foodSuggestions[key] || [];
                                  const isOpen = showSuggestions[key] && suggestions.length > 0;
                                  if (isOpen) {
                                    return (
                                      <div style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        background: "#1e1e1e",
                                        border: "1px solid #444",
                                        borderRadius: "4px",
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                        zIndex: 1000,
                                        marginTop: "2px"
                                      }}>
                                        {suggestions.map((s, idx) => (
                                          <div
                                            key={s.id}
                                            onClick={() => selectFoodSuggestion(s, dayIndex, mealIndex, foodIndex)}
                                            style={{
                                              padding: "8px 10px",
                                              cursor: "pointer",
                                              background: activeSuggestionRef.current[key] === idx ? "#333" : "transparent",
                                              color: "#ccc",
                                              fontSize: "12px",
                                              borderBottom: "1px solid #333"
                                            }}
                                          >
                                            <div style={{ fontWeight: 500 }}>{s.name}</div>
                                            <div style={{ fontSize: "10px", color: "#888" }}>Cal: {s.nutrition?.calories || 0} | P: {s.nutrition?.protein || 0}g | C: {s.nutrition?.carbs || 0}g</div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <input
                                type="text"
                                value={food.quantity || ""}
                                onChange={(e) => updateFood(dayIndex, mealIndex, foodIndex, "quantity", e.target.value)}
                                placeholder="e.g., 2 cups"
                                style={{
                                  width: "100%",
                                  background: "#111",
                                  border: "1px solid #333",
                                  color: "white",
                                  padding: "6px 10px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                }}
                              />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "0.5rem" }}>
                              {Object.keys(food.nutrition).map((nutrient) => (
                                <div key={nutrient}>
                                  <label style={{ display: "block", color: "#666", fontSize: "10px", marginBottom: "0.25rem" }}>
                                    {nutrient}
                                  </label>
                                  <input
                                    type="text"
                                    value={food.nutrition[nutrient] === 0 ? "" : food.nutrition[nutrient]}
                                    onChange={(e) => updateFood(dayIndex, mealIndex, foodIndex, nutrient, e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: "100%",
                                      background: "#111",
                                      border: "1px solid #333",
                                      color: "white",
                                      padding: "4px 6px",
                                      borderRadius: "3px",
                                      fontSize: "11px",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => addFood(dayIndex, mealIndex)}
                          style={{
                            background: "transparent",
                            border: "1px dashed #666",
                            color: "#4CAF50",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            width: "100%",
                          }}
                        >
                          + Add Food
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    onClick={() => addMeal(dayIndex)}
                    style={{
                      background: "#FF5757",
                      border: "none",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    + Add Meal
                  </button>
                </div>
              ))}

              {/* Add Day Button */}
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button
                  onClick={addDay}
                  style={{
                    background: "#FF5757",
                    border: "none",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  + Add Day
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          {dietData.length > 0 && (
            <div style={{ marginTop: "2rem", textAlign: "right" }}>
              <button
                onClick={resetForm}
                style={{
                  background: "transparent",
                  border: "1px solid #666",
                  color: "#ccc",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginRight: "1rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                style={{
                  background: "#FF5757",
                  border: "none",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Saving..." : <><FaSave style={{ marginRight: "8px" }} /> {editingTemplate ? "Update" : "Save"} Template</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* View Template Modal */}
      {viewingTemplate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setViewingTemplate(null)}
        >
          <div
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "2rem",
              minWidth: "800px",
              maxWidth: "900px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "white", fontSize: "20px", fontWeight: "600", margin: 0 }}>
                {viewingTemplate.template_name}
              </h3>
              <button
                onClick={() => setViewingTemplate(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <span style={{ color: "#999", fontSize: "13px", marginRight: "1rem" }}>
                <strong>Days:</strong> {viewingTemplate.number_of_days}
              </span>
              {viewingTemplate.description && (
                <span style={{ color: "#999", fontSize: "13px" }}>
                  <strong>Description:</strong> {viewingTemplate.description}
                </span>
              )}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              {viewingTemplate.diet_data && viewingTemplate.diet_data.map((day) => (
                <div
                  key={day.day_number}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                  }}
                >
                  <h4 style={{ color: "white", fontSize: "15px", fontWeight: "600", marginBottom: "1rem", margin: 0 }}>
                    Day {day.day_number}
                  </h4>

                  {day.meals && day.meals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      style={{
                        marginBottom: "1rem",
                        padding: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>
                          {meal.title}
                        </span>
                        <span style={{ color: "#999", fontSize: "12px" }}>{meal.time}</span>
                      </div>

                      {meal.foods && meal.foods.map((food, foodIndex) => (
                        <div
                          key={foodIndex}
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem",
                          }}
                        >
                          <div style={{ color: "#ccc", fontSize: "13px", marginBottom: "0.5rem" }}>
                            {food.name || food.name_quantity}
                            {(food.quantity !== undefined && food.quantity !== null && food.quantity !== "") ? ` (Qty: ${food.quantity})` : ""}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "12px", color: "#999" }}>
                            <span>Cal: {food.nutrition?.calories || 0}</span>
                            <span>Protein: {food.nutrition?.protein || 0}g</span>
                            <span>Fat: {food.nutrition?.fat || 0}g</span>
                            <span>Carbs: {food.nutrition?.carbs || 0}g</span>
                            <span>Fiber: {food.nutrition?.fiber || 0}g</span>
                            <span>Sugar: {food.nutrition?.sugar || 0}g</span>
                            <span>Sodium: {food.nutrition?.sodium || 0}mg</span>
                            <span>Calcium: {food.nutrition?.calcium || 0}mg</span>
                            <span>Iron: {food.nutrition?.iron || 0}mg</span>
                            <span>Magnesium: {food.nutrition?.magnesium || 0}mg</span>
                            <span>Potassium: {food.nutrition?.potassium || 0}mg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                onClick={() => setViewingTemplate(null)}
                style={{
                  background: "#FF5757",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
