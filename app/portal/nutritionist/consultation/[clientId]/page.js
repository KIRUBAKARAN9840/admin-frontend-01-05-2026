"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineSave } from "react-icons/hi";
import axios from "@/lib/axios";

export default function ConsultationForm() {
  const { clientId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    client_id: clientId,
    full_name: "",
    age: "",
    gender: "",
    occupation: "",
    main_health_goal: "",
    
    anthropometric_table: {
      weight: { current: "", goal: "" },
      height: { current: "", goal: "" },
      bmi: { current: "", goal: "" },
      waist: { current: "", goal: "" },
      hip: { current: "", goal: "" },
      whr: { current: "", goal: "" },
      muscle_mass: { current: "", goal: "" },
      body_fat: { current: "", goal: "" },
      ibw: { current: "", goal: "" },
    },
    recent_changes: {
      weight_gain: false,
      weight_loss: false,
      no_major_change: false,
    },
    fat_distribution: {
      abdomen: false,
      hips: false,
      thighs: false,
      overall: false,
    },
    nutritionist_notes: "",
    
    vitamin_deficiencies: "",
    biochemical_issues: "",
    ongoing_medications: "",
    
    clinical_concerns: {
      low_energy: "Never",
      bloating_acidity: "Never",
      poor_sleep: "Never",
      stress: "Never",
      constipation: "Never",
      hair_fall: "Never",
      cravings: "Never",
    },
    edema_swelling: "",
    joint_pain: "",
    weakness_dizziness: "",
    other_symptoms: "",
    
    meals_daily: "",
    skip_breakfast: "",
    dinner_timing: "",
    late_night_eating: "",
    diet_preference: "",
    water_intake: "",
    eat_outside_frequency: "",
    food_allergies: "",
    cooking_time: "",
    stay_arrangement: "",
    eating_pattern_desc: "",
    
    daily_routine: {
      work_schedule: "",
      wake_up_time: "",
      sleep_time: "",
      screen_time: "",
      sitting_hours: "",
    },
    lifestyle_habits: {
      water_intake: "",
      smoking_alcohol: "",
      eating_outside: "",
      travel_frequency: "",
      cooking_time: "",
    },
    exercise_routine: "",
    step_count: "",
    activity_level: "Sedentary",
    work_mode: "WFH",
    
    main_goals: "",
    consistency_challenges: "",
    expected_support: "",
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/nutritionist_consultation/${clientId}`);
        if (response.data?.success && response.data?.data) {
          // Merge existing data into initial state to handle missing fields
          const existingData = response.data.data;
          setFormData(prev => ({
            ...prev,
            ...existingData,
            // Ensure nested objects are handled
            anthropometric_table: existingData.anthropometric_table || prev.anthropometric_table,
            recent_changes: existingData.recent_changes || prev.recent_changes,
            fat_distribution: existingData.fat_distribution || prev.fat_distribution,
            clinical_concerns: existingData.clinical_concerns || prev.clinical_concerns,
            daily_routine: existingData.daily_routine || prev.daily_routine,
            lifestyle_habits: existingData.lifestyle_habits || prev.lifestyle_habits,
          }));
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [clientId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleAnthroChange = (field, type, value) => {
    setFormData((prev) => ({
      ...prev,
      anthropometric_table: {
        ...prev.anthropometric_table,
        [field]: {
          ...prev.anthropometric_table[field],
          [type]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      const response = await axios.post("/api/admin/nutritionist_consultation/save", formData);
      if (response.data?.success) {
        setMessage({ type: "success", text: response.data.message });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("Error saving form:", err);
      setMessage({ type: "error", text: "Failed to save form. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#111827", color: "white" }}>
        Loading Form...
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "6px",
    color: "white",
    padding: "10px 12px",
    width: "100%",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.2s",
  };

  const sectionStyle = {
    backgroundColor: "#1a1f26",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #333",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#9ca3af",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto", color: "white", backgroundColor: "#111827", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <button 
          onClick={() => router.back()} 
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px" }}
        >
          <HiOutlineArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
          <span style={{ color: "#FF5757" }}>Nutrition</span> Consultation Form
        </h1>
        <button 
          onClick={handleSubmit} 
          disabled={saving}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            backgroundColor: "#FF5757", 
            color: "white", 
            border: "none", 
            padding: "10px 20px", 
            borderRadius: "8px", 
            cursor: "pointer", 
            fontWeight: "600",
            transition: "opacity 0.2s"
          }}
        >
          {saving ? "Saving..." : <><HiOutlineSave size={18} /> Save Form</>}
        </button>
      </div>

      {message.text && (
        <div style={{ 
          padding: "12px 16px", 
          borderRadius: "8px", 
          marginBottom: "1.5rem", 
          backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: message.type === "success" ? "#10b981" : "#ef4444",
          border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
          textAlign: "center"
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Client Information */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            1. Client Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input 
                style={inputStyle} 
                name="full_name" 
                value={formData.full_name || ""} 
                onChange={handleInputChange} 
                placeholder="Name"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label style={labelStyle}>Age</label>
                <input style={inputStyle} name="age" value={formData.age || ""} onChange={handleInputChange} placeholder="Age" />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select style={inputStyle} name="gender" value={formData.gender || ""} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Occupation</label>
              <input style={inputStyle} name="occupation" value={formData.occupation || ""} onChange={handleInputChange} placeholder="Occupation" />
            </div>
            <div>
              <label style={labelStyle}>Main Health Goal</label>
              <input style={inputStyle} name="main_health_goal" value={formData.main_health_goal || ""} onChange={handleInputChange} placeholder="Goal" />
            </div>
          </div>
        </div>

        {/* Section 2: Anthropometric Assessment */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            2. Anthropometric Assessment
          </h2>
          
          <div style={{ overflowX: "auto", marginBottom: "24px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#ccc" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "14px" }}>Measurement</th>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "14px" }}>Current</th>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "14px" }}>Goal / Ideal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Weight (kg)", field: "weight" },
                  { label: "Height (cm)", field: "height" },
                  { label: "BMI", field: "bmi" },
                  { label: "Waist (cm)", field: "waist" },
                  { label: "Hip (cm)", field: "hip" },
                  { label: "WHR", field: "whr" },
                  { label: "Muscle Mass", field: "muscle_mass" },
                  { label: "Body fat %", field: "body_fat" },
                  { label: "IBW (Ideal)", field: "ibw" },
                ].map((item) => (
                  <tr key={item.field} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "10px 12px", fontSize: "14px" }}>{item.label}</td>
                    <td style={{ padding: "8px" }}>
                      <input 
                        style={{ ...inputStyle, padding: "6px 10px" }} 
                        value={formData.anthropometric_table?.[item.field]?.current || ""} 
                        onChange={(e) => handleAnthroChange(item.field, "current", e.target.value)}
                      />
                    </td>
                    <td style={{ padding: "8px" }}>
                      <input 
                        style={{ ...inputStyle, padding: "6px 10px" }} 
                        value={formData.anthropometric_table?.[item.field]?.goal || ""} 
                        onChange={(e) => handleAnthroChange(item.field, "goal", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "24px" }}>
            <div>
              <label style={labelStyle}>Recent Changes</label>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {Object.keys(formData.recent_changes).map((key) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={formData.recent_changes[key]} 
                      onChange={(e) => handleNestedChange("recent_changes", key, e.target.checked)} 
                    />
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Fat Distribution</label>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {Object.keys(formData.fat_distribution).map((key) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={formData.fat_distribution[key]} 
                      onChange={(e) => handleNestedChange("fat_distribution", key, e.target.checked)} 
                    />
                    {key.replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nutritionist Observations / Notes</label>
            <textarea 
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} 
              name="nutritionist_notes" 
              value={formData.nutritionist_notes || ""} 
              onChange={handleInputChange} 
            />
          </div>
        </div>

        {/* Section 3: Biochemical Assessment */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            3. Biochemical Assessment
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Any vitamin deficiencies diagnosed?</label>
              <input style={inputStyle} name="vitamin_deficiencies" value={formData.vitamin_deficiencies || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Any issues with blood sugar, thyroid, cholesterol, liver or hormones?</label>
              <textarea style={inputStyle} name="biochemical_issues" value={formData.biochemical_issues || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Ongoing medications / supplements:</label>
              <input style={inputStyle} name="ongoing_medications" value={formData.ongoing_medications || ""} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Section 4: Clinical Assessment */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            4. Clinical Assessment
          </h2>
          
          <div style={{ overflowX: "auto", marginBottom: "24px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "14px", color: "#9ca3af" }}>Concern</th>
                  {["Never", "Sometimes", "Often", "Severe"].map(opt => (
                    <th key={opt} style={{ textAlign: "center", padding: "12px", fontSize: "14px", color: "#9ca3af" }}>{opt}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Low Energy", field: "low_energy" },
                  { label: "Bloating / Acidity", field: "bloating_acidity" },
                  { label: "Poor Sleep", field: "poor_sleep" },
                  { label: "Stress", field: "stress" },
                  { label: "Constipation", field: "constipation" },
                  { label: "Hair Fall", field: "hair_fall" },
                  { label: "Cravings", field: "cravings" },
                ].map((item) => (
                  <tr key={item.field} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "12px", fontSize: "14px" }}>{item.label}</td>
                    {["Never", "Sometimes", "Often", "Severe"].map(opt => (
                      <td key={opt} style={{ textAlign: "center", padding: "12px" }}>
                        <input 
                          type="radio" 
                          name={item.field} 
                          checked={formData.clinical_concerns[item.field] === opt} 
                          onChange={() => handleNestedChange("clinical_concerns", item.field, opt)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Edema / Swelling</label>
              <input style={inputStyle} name="edema_swelling" value={formData.edema_swelling || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Joint Pain</label>
              <input style={inputStyle} name="joint_pain" value={formData.joint_pain || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Weakness / Dizziness</label>
              <input style={inputStyle} name="weakness_dizziness" value={formData.weakness_dizziness || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Other symptoms or concerns</label>
              <input style={inputStyle} name="other_symptoms" value={formData.other_symptoms || ""} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Section 5: Dietary Assessment */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            5. Dietary Assessment
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={labelStyle}>How many meals do you usually eat daily?</label>
              <input style={inputStyle} name="meals_daily" value={formData.meals_daily || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Do you skip breakfast often?</label>
              <input style={inputStyle} name="skip_breakfast" value={formData.skip_breakfast || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Usual dinner timing</label>
              <input style={inputStyle} name="dinner_timing" value={formData.dinner_timing || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Late-night eating habits</label>
              <input style={inputStyle} name="late_night_eating" value={formData.late_night_eating || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Diet Preference</label>
              <select style={inputStyle} name="diet_preference" value={formData.diet_preference || ""} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Eggetarian">Eggetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Daily water intake</label>
              <input style={inputStyle} name="water_intake" value={formData.water_intake || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>How often do you eat outside?</label>
              <input style={inputStyle} name="eat_outside_frequency" value={formData.eat_outside_frequency || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Any food allergies or dislikes?</label>
              <input style={inputStyle} name="food_allergies" value={formData.food_allergies || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>How much time do you get to cook daily?</label>
              <input style={inputStyle} name="cooking_time" value={formData.cooking_time || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Where do you stay currently?</label>
              <select style={inputStyle} name="stay_arrangement" value={formData.stay_arrangement || ""} onChange={handleInputChange}>
                <option value="">Select</option>
                <option value="Home">Home</option>
                <option value="PG">PG</option>
                <option value="Hostel">Hostel</option>
                <option value="Alone">Alone</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Briefly describe your typical eating pattern:</label>
              <textarea style={inputStyle} name="eating_pattern_desc" value={formData.eating_pattern_desc || ""} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Section 6: Lifestyle Assessment */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            6. Lifestyle Assessment
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "30px" }}>
            <div>
              <h3 style={{ fontSize: "15px", color: "#ccc", marginBottom: "15px" }}>Daily Routine</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Work Schedule", field: "work_schedule" },
                  { label: "Wake-up Time", field: "wake_up_time" },
                  { label: "Sleep Time", field: "sleep_time" },
                  { label: "Screen Time", field: "screen_time" },
                  { label: "Sitting Hours", field: "sitting_hours" },
                ].map(item => (
                  <div key={item.field} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
                    <label style={{ fontSize: "13px", color: "#9ca3af" }}>{item.label}:</label>
                    <input 
                      style={{ ...inputStyle, padding: "6px 10px" }} 
                      value={formData.daily_routine[item.field]} 
                      onChange={(e) => handleNestedChange("daily_routine", item.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: "15px", color: "#ccc", marginBottom: "15px" }}>Lifestyle Habits</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Water Intake", field: "water_intake" },
                  { label: "Smoking/Alcohol", field: "smoking_alcohol" },
                  { label: "Eating Outside", field: "eating_outside" },
                  { label: "Travel Frequency", field: "travel_frequency" },
                  { label: "Cooking Time", field: "cooking_time" },
                ].map(item => (
                  <div key={item.field} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center" }}>
                    <label style={{ fontSize: "13px", color: "#9ca3af" }}>{item.label}:</label>
                    <input 
                      style={{ ...inputStyle, padding: "6px 10px" }} 
                      value={formData.lifestyle_habits[item.field]} 
                      onChange={(e) => handleNestedChange("lifestyle_habits", item.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Exercise Routine</label>
              <input style={inputStyle} name="exercise_routine" value={formData.exercise_routine || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Step Count</label>
              <input style={inputStyle} name="step_count" value={formData.step_count || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>Activity Level</label>
              <div style={{ display: "flex", gap: "20px" }}>
                {["Sedentary", "Moderate", "Active"].map(opt => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="activity_level" 
                      checked={formData.activity_level === opt} 
                      onChange={() => setFormData(p => ({ ...p, activity_level: opt }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Work Mode</label>
              <div style={{ display: "flex", gap: "20px" }}>
                {["WFH", "Office", "Hybrid"].map(opt => (
                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="work_mode" 
                      checked={formData.work_mode === opt} 
                      onChange={() => setFormData(p => ({ ...p, work_mode: opt }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Goals & Expectations */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", color: "#FF5757", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            7. Goals & Expectations
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>What are your main health or fitness goals?</label>
              <textarea style={inputStyle} name="main_goals" value={formData.main_goals || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>What challenges make it difficult to stay consistent?</label>
              <textarea style={inputStyle} name="consistency_challenges" value={formData.consistency_challenges || ""} onChange={handleInputChange} />
            </div>
            <div>
              <label style={labelStyle}>What kind of support are you expecting from your nutritionist?</label>
              <textarea style={inputStyle} name="expected_support" value={formData.expected_support || ""} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginBottom: "4rem" }}>
          <button 
            type="button" 
            onClick={() => router.back()} 
            style={{ 
              backgroundColor: "transparent", 
              color: "#9ca3af", 
              border: "1px solid #374151", 
              padding: "12px 24px", 
              borderRadius: "8px", 
              cursor: "pointer", 
              fontWeight: "600" 
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              backgroundColor: "#FF5757", 
              color: "white", 
              border: "none", 
              padding: "12px 32px", 
              borderRadius: "8px", 
              cursor: "pointer", 
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(255, 87, 87, 0.3)"
            }}
          >
            {saving ? "Saving Changes..." : "Save All Information"}
          </button>
        </div>
      </form>
    </div>
  );
}
