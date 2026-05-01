"use client";
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCheck, FaSpinner, FaTimes } from "react-icons/fa";
import axios from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function AssignTemplate() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const clientName = searchParams.get("client_name");

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);

  // Fetch templates and current assignment in a single API call
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/nutritionist_completed_list/assign-template-data/${sessionId}`);

        if (response.data?.success && response.data?.data) {
          const { templates, current_assignment } = response.data.data;
          setTemplates(templates || []);

          // Set current assignment if exists
          if (current_assignment?.assigned_diet_template_id) {
            setSelectedTemplateId(current_assignment.assigned_diet_template_id.toString());
          }
        } else {
          setTemplates([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId) {
      alert("Please select a template to assign");
      return;
    }

    try {
      setAssigning(true);

      const response = await axios.post("/api/admin/nutritionist_completed_list/assign-diet-template", {
        booking_id: parseInt(bookingId),
        diet_template_id: parseInt(selectedTemplateId),
      });

      if (response.data?.success) {
        alert("Diet template assigned successfully!");
        router.back();
      }
    } catch (err) {
      console.error("Error assigning template:", err);
      alert(err.response?.data?.detail || "Failed to assign template. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTemplate = async () => {
    try {
      setAssigning(true);

      const response = await axios.post("/api/admin/nutritionist_completed_list/assign-diet-template", {
        booking_id: parseInt(bookingId),
        diet_template_id: null,
      });

      if (response.data?.success) {
        alert("Diet template removed successfully!");
        router.back();
      }
    } catch (err) {
      console.error("Error removing template:", err);
      alert(err.response?.data?.detail || "Failed to remove template. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleViewTemplate = async (templateId, e) => {
    e.stopPropagation(); // Prevent row selection when clicking view
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

  // Migrate old format to new format for backwards compatibility
  const migrateFoodFormat = (food) => {
    if (food.name && food.quantity !== undefined) {
      return food;
    }
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

  return (
    <div className="users-container">
      {/* Header */}
      <div className="users-header" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "1px solid #666",
            color: "#ccc",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#333";
            e.target.style.borderColor = "#FF5757";
            e.target.style.color = "#FF5757";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.borderColor = "#666";
            e.target.style.color = "#ccc";
          }}
        >
          <FaArrowLeft />
          Back
        </button>
        <h2 className="users-title">
          Assign Diet Template
        </h2>
      </div>

      {/* Client Info */}
      <div
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ color: "#999", fontSize: "13px", marginBottom: "4px" }}>Client</div>
        <div style={{ color: "#fff", fontSize: "18px", fontWeight: "600" }}>
          {decodeURIComponent(clientName || "Unknown")}
        </div>
      </div>

      {/* Templates Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            <FaSpinner className="fa-spin" style={{ fontSize: "24px", marginBottom: "1rem" }} />
            <div>Loading templates...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#f44" }}>
            {error}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            No templates found. Create templates first.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}></th>
                    <th>Template Name</th>
                    <th>Days</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr
                      key={template.id}
                      onClick={() => setSelectedTemplateId(selectedTemplateId === template.id.toString() ? null : template.id.toString())}
                      style={{
                        cursor: "pointer",
                        background: selectedTemplateId === template.id.toString() ? "#2a2a2a" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTemplateId !== template.id.toString()) {
                          e.target.style.background = "#252525";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTemplateId !== template.id.toString()) {
                          e.target.style.background = "transparent";
                        }
                      }}
                    >
                      <td>
                        {selectedTemplateId === template.id.toString() && (
                          <div
                            style={{
                              background: "#FF5757",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <FaCheck size={12} color="#fff" />
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            color: selectedTemplateId === template.id.toString() ? "#FF5757" : "#fff",
                            fontWeight: selectedTemplateId === template.id.toString() ? "600" : "400",
                          }}
                        >
                          {template.template_name}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: "#FF5757",
                            fontWeight: "500",
                          }}
                        >
                          {template.number_of_days}
                        </span>
                      </td>
                      <td style={{ color: "#ccc", fontSize: "13px" }}>
                        {template.description || "-"}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleViewTemplate(template.id, e)}
                          style={{
                            background: "transparent",
                            border: "1px solid #666",
                            color: "#ccc",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#333";
                            e.target.style.borderColor = "#FF5757";
                            e.target.style.color = "#FF5757";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "transparent";
                            e.target.style.borderColor = "#666";
                            e.target.style.color = "#ccc";
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "2rem",
                justifyContent: "flex-end",
              }}
            >
              {/* Remove Template Button */}
              <button
                onClick={handleRemoveTemplate}
                disabled={assigning}
                style={{
                  background: "transparent",
                  border: "1px solid #666",
                  color: "#ccc",
                  padding: "12px 24px",
                  borderRadius: "4px",
                  cursor: assigning ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: assigning ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!assigning) {
                    e.target.style.background = "#333";
                    e.target.style.borderColor = "#f44";
                    e.target.style.color = "#f44";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = "#666";
                  e.target.style.color = "#ccc";
                }}
              >
                Remove Template
              </button>

              {/* Assign Button */}
              <button
                onClick={handleAssignTemplate}
                disabled={assigning || !selectedTemplateId}
                style={{
                  background: assigning || !selectedTemplateId ? "#666" : "#FF5757",
                  border: "none",
                  color: "white",
                  padding: "12px 32px",
                  borderRadius: "4px",
                  cursor: assigning || !selectedTemplateId ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: assigning || !selectedTemplateId ? 0.5 : 1,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!assigning && selectedTemplateId) {
                    e.target.style.background = "#ff4444";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#FF5757";
                }}
              >
                {assigning ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Assign Template
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

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
