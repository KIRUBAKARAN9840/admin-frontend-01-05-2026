"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function CompletedList() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interestedInProduct, setInterestedInProduct] = useState("");

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        page_size: pageSize,
      };

      if (search) params.search = search;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (interestedInProduct !== "") {
        params.interested_in_product = interestedInProduct === "true";
      }

      const response = await axios.get("/api/admin/nutritionist_completed_list/sessions", {
        params,
      });

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setSessions(data.sessions || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        setSessions([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
      setSessions([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, startDate, endDate, interestedInProduct]);

  // Fetch sessions on initial load and when filters/page change
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Handle edit button click - navigate to template assignment page
  const handleEditTemplate = (sessionId, bookingId, clientName) => {
    router.push(
      `/portal/nutritionist/completed-list/assign-template?session_id=${sessionId}&booking_id=${bookingId}&client_name=${encodeURIComponent(clientName)}`
    );
  };

  const handleDateFilter = () => {
    setPage(1);
    // useEffect will trigger fetchSessions
  };

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setInterestedInProduct("");
    setPage(1);
    // useEffect will trigger fetchSessions
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (slotTime) => {
    return slotTime || "-";
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Completed</span> List
        </h2>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          {/* Search by client name */}
          <div>
            <label
              style={{
                display: "block",
                color: "#ccc",
                fontSize: "13px",
                marginBottom: "0.5rem",
              }}
            >
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or booking ID..."
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

          {/* Start Date */}
          <div>
            <label
              style={{
                display: "block",
                color: "#ccc",
                fontSize: "13px",
                marginBottom: "0.5rem",
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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

          {/* End Date */}
          <div>
            <label
              style={{
                display: "block",
                color: "#ccc",
                fontSize: "13px",
                marginBottom: "0.5rem",
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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

          {/* Product Interest */}
          <div>
            <label
              style={{
                display: "block",
                color: "#ccc",
                fontSize: "13px",
                marginBottom: "0.5rem",
              }}
            >
              Product Interest
            </label>
            <select
              value={interestedInProduct}
              onChange={(e) => setInterestedInProduct(e.target.value)}
              style={{
                width: "100%",
                background: "#252525",
                border: "1px solid #444",
                color: "white",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Apply & Clear Buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleDateFilter}
              style={{
                background: "#FF5757",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              style={{
                background: "transparent",
                border: "1px solid #666",
                color: "#ccc",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            Loading sessions...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#f44" }}>
            {error}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Booking ID</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Client Name</th>
                    <th>Duration</th>
                    <th>Interested in Product</th>
                    <th>Diet Template</th>
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
                          <td>{(page - 1) * pageSize + index + 1}</td>
                          <td>{session.booking_id || "-"}</td>
                          <td>{formatDate(session.slot_date)}</td>
                          <td>{formatTime(session.slot_time)}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#00C853",
                                }}
                              />
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/portal/nutritionist/client/${session.client_id}`);
                                }}
                                style={{
                                  color: "#ffffffff",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                  textDecorationColor: "transparent",
                                  transition: "textDecorationColor 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.textDecorationColor = "#ffffffff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.textDecorationColor = "transparent";
                                }}
                              >
                                {session.client_name || "Client #" + session.client_id}
                              </span>
                            </div>
                          </td>
                          <td>{session.meeting_duration} min</td>
                          <td>
                            <span
                              style={{
                                color: session.interested_in_nutrition_product
                                  ? "#4CAF50"
                                  : "#999",
                                backgroundColor:
                                  session.interested_in_nutrition_product
                                    ? "rgba(76, 175, 80, 0.1)"
                                    : "rgba(153, 153, 153, 0.1)",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {session.interested_in_nutrition_product ? "Yes" : "No"}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "13px",
                                  color: session.assigned_diet_template_name ? "#fff" : "#666",
                                }}
                              >
                                {session.assigned_diet_template_name || "Not assigned"}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginTop: "4px",
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTemplate(session.id, session.booking_id, session.client_name);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "1px solid #ccc",
                                  color: "#ccc",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  transition: "all 0.2s",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#333";
                                  e.currentTarget.style.borderColor = "#fff";
                                  e.currentTarget.style.color = "#fff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.borderColor = "#ccc";
                                  e.currentTarget.style.color = "#ccc";
                                }}
                              >
                                <FaEdit size={12} />
                                <span>Edit</span>
                              </button>
                            </div>
                          </td>
                          <td>
                            {expandedRow === index ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </td>
                        </tr>
                        {expandedRow === index && session.feedback_advice && (
                          <tr>
                            <td colSpan="9">
                              <div
                                style={{
                                  background: "#252525",
                                  padding: "1rem",
                                  borderRadius: "4px",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Nutritionist Feedback
                                </div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#ccc",
                                    lineHeight: "1.6",
                                    backgroundColor: "#1e1e1e",
                                    padding: "12px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {session.feedback_advice}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-data">
                        No completed sessions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1.5rem",
                  padding: "0 1rem",
                }}
              >
                <div style={{ color: "#999", fontSize: "13px" }}>
                  Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} sessions
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      background: page === 1 ? "#333" : "#FF5757",
                      border: "none",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.25rem",
                      alignItems: "center",
                    }}
                  >
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          style={{
                            background:
                              page === pageNum ? "#FF5757" : "#333",
                            border: "none",
                            color: "white",
                            padding: "8px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            minWidth: "36px",
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      background:
                        page === totalPages ? "#333" : "#FF5757",
                      border: "none",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor:
                        page === totalPages ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      opacity: page === totalPages ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
