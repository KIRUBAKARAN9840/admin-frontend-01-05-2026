"use client";
import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";

// Helper function to convert date to IST format (YYYY-MM-DD)
// Since the database stores dates in IST, we need to format them correctly
const toISTDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [dateCounts, setDateCounts] = useState({}); // Store session counts per date
  const [dateRescheduled, setDateRescheduled] = useState({}); // Track which dates have rescheduled sessions
  const [expandedRow, setExpandedRow] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false); // Loading state for date details
  const [error, setError] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    reason: "",
  });
  const [completionData, setCompletionData] = useState({
    duration: "",
    feedback: "",
    interestedInProduct: "",
    dietTemplateId: "",
  });
  const [dietTemplates, setDietTemplates] = useState([]);
  const [dietTemplatesLoaded, setDietTemplatesLoaded] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch session counts for calendar - extracted as reusable function
  const fetchCalendarCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range: today to 30 days ahead (using IST format)
      const startDate = toISTDateString(today);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = toISTDateString(endDate);

      const response = await axios.get("/api/admin/nutritionist_sessions/calendar/counts", {
        params: {
          start_date: startDate,
          end_date: endDateStr,
        },
      });

      if (response.data?.success && response.data?.data?.date_counts) {
        setDateCounts(response.data.data.date_counts);
        setDateRescheduled(response.data.data.date_rescheduled || {});
      } else {
        setDateCounts({});
        setDateRescheduled({});
      }
    } catch (err) {
      console.error("Error fetching calendar counts:", err);
      setError("Failed to load calendar. Please try again.");
      setDateCounts({});
      setDateRescheduled({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch session counts for calendar on initial load
  useEffect(() => {
    fetchCalendarCounts();
  }, []);

  // Fetch diet templates for the nutritionist
  const fetchDietTemplates = async () => {
    try {
      const response = await axios.get("/api/admin/nutritionist_diet_templates/list");
      if (response.data?.success && response.data?.data?.templates) {
        setDietTemplates(response.data.data.templates);
      }
    } catch (err) {
      console.error("Error fetching diet templates:", err);
    }
  };


  // Fetch sessions for a specific date when clicked
  useEffect(() => {
    const fetchSessionsForDate = async () => {
      if (!selectedDate) return;

      try {
        setSessionsLoading(true);
        const formattedDate = toISTDateString(selectedDate);

        const response = await axios.get("/api/admin/nutritionist_sessions/sessions/by-date", {
          params: {
            target_date: formattedDate,
          },
        });

        if (response.data?.success && response.data?.data?.sessions) {
          setSessions(response.data.data.sessions);
        } else {
          setSessions([]);
        }
      } catch (err) {
        console.error("Error fetching sessions for date:", err);
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessionsForDate();
  }, [selectedDate]);

  // Generate 30 days from today
  const generateCalendarDates = () => {
    const allDates = [];
    const startDate = new Date(today);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      allDates.push(date);
    }

    // Group by month
    const datesByMonth = {};
    allDates.forEach((date) => {
      const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
      if (!datesByMonth[monthKey]) {
        datesByMonth[monthKey] = {
          month: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          dates: [],
        };
      }
      datesByMonth[monthKey].dates.push(date);
    });

    return Object.values(datesByMonth);
  };

  const monthsData = generateCalendarDates();

  const getSessionCount = (date) => {
    const formattedDate = toISTDateString(date);
    return dateCounts[formattedDate] || 0;
  };

  const handleDateClick = (date) => {
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
      setSelectedDate(null);
      setSessions([]);
    } else {
      setSelectedDate(date);
    }
    setExpandedRow(null);
  };

  const isSelected = (date) => {
    return selectedDate && selectedDate.toDateString() === date.toDateString();
  };

  const handleGenerateLink = async (sessionId) => {
    try {
      // Call the backend API to generate Zoom meeting link
      const response = await axios.post("/api/admin/nutritionist_sessions/generate-meeting-link", {
        booking_id: sessionId
      });

      if (response.data?.success) {
        // Update the session with the generated meeting link (keep the same status)
        const updatedSessions = sessions.map((session) =>
          session.id === sessionId
            ? { ...session, meeting_link: response.data.data.meeting_link }
            : session
        );
        setSessions(updatedSessions);
        alert("Meeting link generated successfully!");
      }
    } catch (err) {
      console.error("Error generating link:", err);
      alert("Failed to generate meeting link. Please try again.");
    }
  };

  const handleReschedule = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time || !rescheduleData.reason) {
      alert("Please fill all fields");
      return;
    }

    try {
      // Call the reschedule API
      const response = await axios.post("/api/admin/nutritionist_sessions/reschedule", {
        booking_id: selectedSession.id,
        new_date: rescheduleData.date,
        new_time: rescheduleData.time,
        reason: rescheduleData.reason,
      });

      if (response.data?.success) {
        const responseData = response.data.data;

        // Update local state with new rescheduled info from API
        const updatedSessions = sessions.map((session) =>
          session.id === selectedSession.id
            ? {
                ...session,
                status: responseData.status,
                meeting_link: null,
                reschedule_reason: responseData.reason,
                rescheduled_at: responseData.rescheduled_at,
                // Store original and new times for display
                original_slot: responseData.original_time,
                original_date: responseData.original_date,
                slot: responseData.new_time
              }
            : session
        );
        setSessions(updatedSessions);

        setShowRescheduleModal(false);
        setRescheduleData({ date: "", time: "", reason: "" });

        alert(`Session rescheduled successfully to ${responseData.new_date} at ${responseData.new_time}`);

        // Refresh the calendar counts to show updated session counts
        await fetchCalendarCounts();

        // Refresh the sessions list for the currently selected date
        if (selectedDate) {
          // Trigger a re-fetch by temporarily setting selectedDate to null and back
          const currentDate = selectedDate;
          setSelectedDate(null);
          setTimeout(() => setSelectedDate(currentDate), 0);
        }
      } else {
        alert("Failed to reschedule session. Please try again.");
      }
    } catch (err) {
      console.error("Error rescheduling session:", err);
      alert(err.response?.data?.detail || "Failed to reschedule session. Please try again.");
    }
  };

  const handleMarkAsCompleted = async (session) => {
    setSelectedSession(session);

    // Lazy load diet templates only when opening the completion modal
    if (!dietTemplatesLoaded) {
      await fetchDietTemplates();
      setDietTemplatesLoaded(true);
    }

    setShowCompletionModal(true);
  };

  const submitCompletion = async () => {
    if (!completionData.duration || !completionData.feedback || completionData.interestedInProduct === "") {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await axios.post("/api/admin/nutritionist_sessions/complete-session", {
        booking_id: selectedSession.id,
        meeting_duration: parseInt(completionData.duration),
        feedback_advice: completionData.feedback,
        interested_in_nutrition_product: completionData.interestedInProduct === "Yes",
        diet_template_id: completionData.dietTemplateId ? parseInt(completionData.dietTemplateId) : null,
      });

      if (response.data?.success) {
        // Update the session status locally
        const updatedSessions = sessions.map((session) =>
          session.id === selectedSession.id
            ? { ...session, status: "Completed" }
            : session
        );
        setSessions(updatedSessions);
        setShowCompletionModal(false);
        setCompletionData({ duration: "", feedback: "", interestedInProduct: "", dietTemplateId: "" });
        alert("Session completed successfully!");
      }
    } catch (err) {
      console.error("Error completing session:", err);
      const errorMessage = err.response?.data?.detail || "Failed to complete session. Please try again.";
      alert(errorMessage);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { color: "#FFA500", backgroundColor: "rgba(255, 165, 0, 0.1)" };
      case "Scheduled":
        return { color: "#4CAF50", backgroundColor: "rgba(76, 175, 80, 0.1)" };
      case "Booked":
        return { color: "#4CAF50", backgroundColor: "rgba(76, 175, 80, 0.1)" };
      case "Rescheduled":
        return { color: "#2196F3", backgroundColor: "rgba(33, 150, 243, 0.1)" };
      case "Completed":
        return { color: "#00C853", backgroundColor: "rgba(0, 200, 83, 0.1)" };
      default:
        return { color: "#999", backgroundColor: "rgba(153, 153, 153, 0.1)" };
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderMonth = (monthData) => {
    const dates = monthData.dates;
    const weeks = [];
    let currentWeek = [];

    // Add empty slots for the first week
    const firstDay = dates[0].getDay();
    const emptySlots = firstDay;

    for (let i = 0; i < emptySlots; i++) {
      currentWeek.push(null);
    }

    dates.forEach((date) => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Add remaining dates
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div style={{ marginBottom: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "white",
              margin: 0,
            }}
          >
            {monthData.month}
          </h3>
        </div>

        {/* Week day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day, index) => (
              <div
                key={index}
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#999",
                  textTransform: "uppercase",
                }}
              >
                {day}
              </div>
            )
          )}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "10px",
              }}
            >
              {week.map((date, dateIndex) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${dateIndex}`}
                      style={{
                        minHeight: "70px",
                      }}
                    />
                  );
                }

                const selected = isSelected(date);
                const isToday = date.toDateString() === today.toDateString();
                const count = getSessionCount(date);

                return (
                  <div
                    key={dateIndex}
                    onClick={() => handleDateClick(date)}
                    style={{
                      background: selected
                        ? "#FF5757"
                        : isToday
                        ? "#2a2a2a"
                        : "#252525",
                      border:
                        isToday && !selected
                          ? "2px solid #FF5757"
                          : "1px solid #333",
                      borderRadius: "8px",
                      padding: "12px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      minHeight: "70px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = "#2a2a2a";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = isToday
                          ? "#2a2a2a"
                          : "#252525";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        color: selected
                          ? "white"
                          : isToday
                          ? "#FF5757"
                          : "#ccc",
                        fontWeight: "600",
                        marginBottom: count > 0 ? "4px" : "0",
                      }}
                    >
                      {date.getDate()}
                    </div>
                    {count > 0 && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: selected ? "white" : "#FF5757",
                          fontWeight: "600",
                        }}
                      >
                        {count} session{count > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="users-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div style={{ color: "#FF5757", fontSize: "18px" }}>Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div style={{ color: "#ff4444", fontSize: "16px" }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Session</span> Calendar
        </h2>
      </div>

      {/* Calendar */}
      <div
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {monthsData.map((monthData) => (
          <div key={monthData.month}>{renderMonth(monthData)}</div>
        ))}
      </div>

      {/* Sessions Table */}
      {selectedDate && (
        <div className="table-container">
          <h3
            style={{
              color: "white",
              marginBottom: "1rem",
              fontSize: "16px",
              padding: "10px",
            }}
          >
            Sessions for {formatDate(selectedDate)}
          </h3>

          {sessionsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "#999" }}>
              Loading sessions...
            </div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Slot</th>
                    <th>Client Name</th>
                    <th>Meeting Link</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length > 0 ? (
                    sessions.map((session, index) => (
                      <React.Fragment key={session.id}>
                        <tr
                          onClick={() =>
                            setExpandedRow(expandedRow === index ? null : index)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td>{index + 1}</td>
                          <td>{session.slot}</td>
                          <td>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/portal/nutritionist/client/${session.client_id}`);
                              }}
                              style={{
                                color: "#FF5757",
                                cursor: "pointer",
                                textDecoration: "underline",
                                textDecorationColor: "transparent",
                                transition: "textDecorationColor 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecorationColor = "#FF5757";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecorationColor = "transparent";
                              }}
                            >
                              {session.client_name || "Client #" + session.client_id}
                            </span>
                          </td>
                          <td>
                            {session.status === "Rescheduled" ? (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#999",
                                  fontStyle: "italic",
                                }}
                              >
                                -
                              </span>
                            ) : !session.meeting_link ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateLink(session.id);
                                }}
                                style={{
                                  background: "#FF5757",
                                  border: "none",
                                  color: "white",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                }}
                              >
                                Generate Link
                              </button>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <a
                                  href={session.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (session.status === "Completed") {
                                      e.preventDefault();
                                    } else {
                                      e.stopPropagation();
                                    }
                                  }}
                                  style={{
                                    background: session.status === "Completed" ? "#666" : "#4CAF50",
                                    border: "none",
                                    color: "white",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    textDecoration: "none",
                                    fontSize: "12px",
                                    cursor: session.status === "Completed" ? "not-allowed" : "pointer",
                                    opacity: session.status === "Completed" ? 0.5 : 1,
                                  }}
                                >
                                  Join Meeting
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReschedule(session);
                                  }}
                                  disabled={session.status === "Completed"}
                                  style={{
                                    background: "transparent",
                                    border: "1px solid #444",
                                    color: "#ccc",
                                    padding: "6px 8px",
                                    borderRadius: "4px",
                                    cursor: session.status === "Completed" ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: session.status === "Completed" ? 0.5 : 1,
                                  }}
                                >
                                  <FaEdit size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            {session.status === "Scheduled" || session.status === "Pending" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsCompleted(session);
                                }}
                                style={{
                                  ...getStatusStyle(session.status),
                                  padding: "6px 14px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  border: "2px solid #4CAF50",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  boxShadow: "0 2px 4px rgba(76, 175, 80, 0.2)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(76, 175, 80, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(76, 175, 80, 0.2)";
                                }}
                              >
                                Complete ✓
                              </button>
                            ) : session.status === "Booked" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsCompleted(session);
                                }}
                                style={{
                                  ...getStatusStyle(session.status),
                                  padding: "4px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  border: "none",
                                  cursor: "pointer",
                                  background: getStatusStyle(session.status).backgroundColor,
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.05)";
                                  e.currentTarget.style.background = "rgba(76, 175, 80, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.background = getStatusStyle(session.status).backgroundColor;
                                }}
                              >
                                {session.status}
                              </button>
                            ) : (
                              <span
                                style={{
                                  ...getStatusStyle(session.status),
                                  padding: "4px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {session.status}
                              </span>
                            )}
                          </td>
                          <td>
                            {expandedRow === index ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </td>
                        </tr>
                        {expandedRow === index && (
                          <tr>
                            <td colSpan="6">
                              <div
                                style={{
                                  background: "#252525",
                                  padding: "1rem",
                                  borderRadius: "4px",
                                  display: "grid",
                                  gridTemplateColumns: session.rescheduled_at ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
                                  gap: "1rem",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#999",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    Client ID
                                  </div>
                                  <div
                                    style={{ fontSize: "14px", color: "#ccc" }}
                                  >
                                    {session.client_id || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#999",
                                      marginBottom: "4px",
                                    }}
                                  >
                                    Booking ID
                                  </div>
                                  <div
                                    style={{ fontSize: "14px", color: "#ccc" }}
                                  >
                                    {session.id || "-"}
                                  </div>
                                </div>
                                {session.rescheduled_at ? (
                                  <>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#2196F3",
                                          marginBottom: "4px",
                                          fontWeight: "600",
                                        }}
                                      >
                                        Original Schedule
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#ccc" }}
                                      >
                                        {session.original_date || "-"}
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#ccc", marginTop: "2px" }}
                                      >
                                        {session.original_slot || "-"}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#4CAF50",
                                          marginBottom: "4px",
                                          fontWeight: "600",
                                        }}
                                      >
                                        Rescheduled To
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#ccc" }}
                                      >
                                        {session.rescheduled_at ? new Date(session.rescheduled_at).toLocaleDateString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        }) : "-"}
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#ccc", marginTop: "2px" }}
                                      >
                                        {session.slot || "-"}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#999",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        Reschedule Reason
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#ccc" }}
                                      >
                                        {session.reschedule_reason || "-"}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#999",
                                          marginBottom: "4px",
                                        }}
                                      >
                                        Meeting Link
                                      </div>
                                      <div
                                        style={{ fontSize: "14px", color: "#ccc" }}
                                      >
                                        {session.meeting_link ? (
                                          <a
                                            href={session.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "#4CAF50" }}
                                          >
                                            Link
                                          </a>
                                        ) : (
                                          "-"
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No sessions scheduled for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
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
        >
          <div
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "2rem",
              minWidth: "400px",
              maxWidth: "500px",
            }}
          >
            <h3
              style={{
                color: "white",
                marginBottom: "1.5rem",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Complete Session
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Meeting Duration
              </label>
              <input
                type="text"
                placeholder="e.g., 25:30 min"
                value={completionData.duration}
                onChange={(e) =>
                  setCompletionData({ ...completionData, duration: e.target.value })
                }
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

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Feedback/Advice
              </label>
              <textarea
                value={completionData.feedback}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    feedback: e.target.value,
                  })
                }
                rows={4}
                placeholder="Enter your feedback or advice for the client..."
                style={{
                  width: "100%",
                  background: "#252525",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Interested in Nutrition Product
              </label>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "#ccc",
                  }}
                >
                  <input
                    type="radio"
                    name="interestedInProduct"
                    value="Yes"
                    checked={completionData.interestedInProduct === "Yes"}
                    onChange={(e) =>
                      setCompletionData({
                        ...completionData,
                        interestedInProduct: e.target.value,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  Yes
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "#ccc",
                  }}
                >
                  <input
                    type="radio"
                    name="interestedInProduct"
                    value="No"
                    checked={completionData.interestedInProduct === "No"}
                    onChange={(e) =>
                      setCompletionData({
                        ...completionData,
                        interestedInProduct: e.target.value,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  No
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Assign Diet Template (Optional)
              </label>
              <select
                value={completionData.dietTemplateId}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    dietTemplateId: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  background: "#252525",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">No template selected</option>
                {dietTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletionData({ duration: "", feedback: "", interestedInProduct: "", dietTemplateId: "" });
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitCompletion}
                style={{
                  background: "#FF5757",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
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
        >
          <div
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "2rem",
              minWidth: "400px",
              maxWidth: "500px",
            }}
          >
            <h3
              style={{
                color: "white",
                marginBottom: "1.5rem",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Reschedule Meeting
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={rescheduleData.date}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, date: e.target.value })
                }
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

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Time
              </label>
              <input
                type="time"
                value={rescheduleData.time}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, time: e.target.value })
                }
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

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                Reason
              </label>
              <textarea
                value={rescheduleData.reason}
                onChange={(e) =>
                  setRescheduleData({
                    ...rescheduleData,
                    reason: e.target.value,
                  })
                }
                rows={3}
                style={{
                  width: "100%",
                  background: "#252525",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleData({ date: "", time: "", reason: "" });
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                style={{
                  background: "#FF5757",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
