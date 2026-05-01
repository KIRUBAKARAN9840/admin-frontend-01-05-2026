"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";

export default function AllPurchases() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [distinctClients, setDistinctClients] = useState(new Set());
  const [distinctGyms, setDistinctGyms] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [distinctClientsFilter, setDistinctClientsFilter] = useState(false);
  const [distinctGymsFilter, setDistinctGymsFilter] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [todayBookings, setTodayBookings] = useState(0);

  const isFetchingRef = useRef(false);

  const fetchPurchases = useCallback(async (pageNum, searchQuery, type, start, end, distinctClients, distinctGyms) => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: 10,
      };

      if (searchQuery) params.search = searchQuery;
      if (type && type !== "all") params.type = type;
      if (start) params.start_date = start;
      if (end) params.end_date = end;
      if (distinctClients) params.distinct_clients = true;
      if (distinctGyms) params.distinct_gyms = true;

      const response = await axiosInstance.get("/api/admin/purchases/all-purchases", {
        params,
      });

      if (response.data.success) {
        setPurchases(response.data.data.purchases);
        setPagination(response.data.data.pagination);
        setTodayBookings(response.data.data.todayBookings || 0);
        // Store distinct clients and gyms from backend response
        if (response.data.data.distinctClients) {
          setDistinctClients(new Set(response.data.data.distinctClients));
        }
        if (response.data.data.distinctGyms) {
          setDistinctGyms(new Set(response.data.data.distinctGyms));
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch purchases");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch purchases";
      setError(errorMsg);
      setPurchases([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPurchases(page, search, typeFilter, startDate, endDate, distinctClientsFilter, distinctGymsFilter);
  }, [page, search, typeFilter, startDate, endDate, distinctClientsFilter, distinctGymsFilter, fetchPurchases]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const params = {};
      if (search) params.search = search;
      if (typeFilter && typeFilter !== "all") params.type = typeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (distinctClientsFilter) params.distinct_clients = true;
      if (distinctGymsFilter) params.distinct_gyms = true;

      const response = await axiosInstance.get("/api/admin/purchases/export-purchases", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or generate default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "purchases_export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/"/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export purchases. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatScheduleDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount?.toFixed(2) || "0.00"}`;
  };

  // Check if client has exactly 1 booking (using backend data)
  const getClientDistinctStatus = (clientName) => {
    return distinctClients.has(clientName);
  };

  // Check if gym has exactly 1 booking (using backend data)
  const getGymDistinctStatus = (gymName) => {
    return distinctGyms.has(gymName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#FFA500";
      case "attended":
        return "#4ade80";
      case "missed":
        return "#ef4444";
      case "rescheduled":
        return "#3b82f6";
      case "canceled":
        return "#888";
      default:
        return "#ccc";
    }
  };

  const getDisplayValue = (purchase) => {
    if (purchase.type === "Daily Pass") {
      return purchase.days_total || "N/A";
    } else {
      return purchase.session_display || "N/A";
    }
  };

  return (
    <div>
      {/* Filters Card */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
          }
        `}</style>

        {/* First Row: Search, Type, Export */}
        <div className="d-flex gap-3 align-items-center" style={{ marginBottom: "15px" }}>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-grow-1" style={{ maxWidth: "320px" }}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, contact, or gym..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  backgroundColor: "#222",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <button
                className="btn"
                type="submit"
                style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              backgroundColor: "#222",
              border: "1px solid #333",
              color: "#fff",
              minWidth: "135px",
              width: "135px",
            }}
          >
            <option value="all">All Types</option>
            <option value="Session">Fitness Class</option>
            <option value="Daily Pass">Daily Pass</option>
          </select>

          {/* Spacer */}
          <div style={{ flex: 1 }}></div>

          {/* Today Bookings Card */}
          <div
            style={{
              minWidth: "170px",
              background: "linear-gradient(135deg, #ffffff 0%, #d9d9d9 100%)",
              border: "1px solid #ffffff",
              borderRadius: "8px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              boxShadow: "0 8px 22px rgba(255, 255, 255, 0.12)",
            }}
          >
            <div>
              <div
                style={{
                  color: "#111",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                Today Bookings
              </div>
            </div>
            <div
              style={{
                color: "#000",
                fontSize: "24px",
                fontWeight: 800,
                lineHeight: 1,
                minWidth: "32px",
                textAlign: "right",
              }}
            >
              {loading ? "..." : todayBookings.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Export Button */}
          <button
            className="btn"
            onClick={handleExport}
            disabled={exporting || loading}
            style={{
              backgroundColor: exporting || loading ? "#444" : "#28a745",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: exporting || loading ? "not-allowed" : "pointer",
            }}
          >
            <FaDownload />
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>

        {/* Second Row: Date Filters, Distinct Filters */}
        <div className="d-flex gap-3 align-items-center flex-wrap">
          {/* Date Filters */}
          <div className="d-flex gap-2 align-items-center">
            <span style={{ color: "#888", fontSize: "14px" }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
                width: "140px",
              }}
            />
            <span style={{ color: "#888", fontSize: "14px", marginLeft: "8px" }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
                width: "140px",
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "30px", backgroundColor: "#333", margin: "0 10px" }}></div>

          {/* Distinct Filters */}
          <div className="d-flex gap-4">
            {/* Distinct Clients */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="distinctClients"
                checked={distinctClientsFilter}
                onChange={(e) => {
                  setDistinctClientsFilter(e.target.checked);
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#28a745",
                }}
              />
              <label
                htmlFor="distinctClients"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                New Clients
              </label>
            </div>

            {/* Distinct Gyms */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="distinctGyms"
                checked={distinctGymsFilter}
                onChange={(e) => {
                  setDistinctGymsFilter(e.target.checked);
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#ffc107",
                }}
              />
              <label
                htmlFor="distinctGyms"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                New Gyms
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      {loading ? (
        <div className="text-center py-5">
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #3a3a3a",
              borderTop: "4px solid #FF5757",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading purchases...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchPurchases(page, search)}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No purchases found</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto" }}>
          <table className="table purchases-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th>Client Name</th>
                <th>Contact</th>
                <th>Gym Name</th>
                <th>Type</th>
                <th>Days / Classes</th>
                <th>Amount</th>
                <th>Purchased At</th>
                <th>Status</th>
                <th>Platform</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const isSession = purchase.type === "Session";
                const hasSchedule = isSession
                  ? purchase.session_schedule?.length > 0
                  : purchase.scheduled_date?.length > 0;
                const hasContacts = !!(purchase.gym_contact || purchase.owner_contact || purchase.client_contact || purchase.gym_area || purchase.owner_name);
                const isExpandable = hasSchedule || hasContacts;
                const isExpanded = expandedRows.has(purchase.id);

                return (
                  <React.Fragment key={purchase.id}>
                    <tr>
                      <td style={{ padding: "8px !important" }}>
                        {isExpandable && (
                          <button
                            onClick={() => toggleRow(purchase.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#FF5757",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: "16px",
                              transition: "transform 0.2s",
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          >
                            ▶
                          </button>
                        )}
                      </td>
                      <td className="client-name">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getClientDistinctStatus(purchase.client_name) && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#28a745",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                              title="Distinct: Single booking type"
                            />
                          )}
                          {purchase.client_name || "N/A"}
                        </span>
                      </td>
                      <td className="client-contact">{purchase.client_contact || "N/A"}</td>
                      <td className="gym-name">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getGymDistinctStatus(purchase.gym_name) && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#28a745",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                              title="Distinct: Single booking type"
                            />
                          )}
                          {purchase.gym_name || "N/A"}
                        </span>
                      </td>
                      <td className="type">{purchase.type === "Session" ? "Fitness Class" : purchase.type}</td>
                      <td className="days-total">{getDisplayValue(purchase)}</td>
                      <td className="amount">{formatAmount(purchase.amount)}</td>
                      <td className="purchased-at">{formatDate(purchase.purchased_at)}</td>
                      <td className="status">
                        {purchase.status ? (
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: getStatusColor(purchase.status),
                            }}
                          >
                            {purchase.status}
                          </span>
                        ) : (
                          <span style={{ color: "#666", fontSize: "12px" }}>N/A</span>
                        )}
                      </td>
                      <td className="platform">
                        <span
                          style={{
                            color: purchase.platform === "android" ? "#a8d5a2" : purchase.platform === "ios" ? "#a2c4d5" : "#888",
                            backgroundColor: purchase.platform === "android" ? "rgba(100, 200, 80, 0.1)" : purchase.platform === "ios" ? "rgba(80, 150, 200, 0.1)" : "rgba(128,128,128,0.1)",
                            border: `1px solid ${purchase.platform === "android" ? "#4caf50" : purchase.platform === "ios" ? "#5097c8" : "#555"}`,
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 500,
                            textTransform: "capitalize",
                            display: "inline-block"
                          }}
                        >
                          {purchase.platform || "N/A"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="schedule-row">
                        <td colSpan="10" style={{ padding: "0 !important" }}>
                          <div
                            style={{
                              backgroundColor: "#151515",
                              padding: "16px",

                              borderBottom: "1px solid #333",
                            }}
                          >
                            {hasSchedule && (
                              <>
                                <p
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#FF5757",
                                    marginBottom: "12px",
                                  }}
                                >
                                  {isSession ? "Class Schedule" : "Scheduled Dates"}
                                </p>
                                {isSession && purchase.session_name && (
                                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
                                    Fitness Class: <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.session_name}</span>
                                  </div>
                                )}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                  {isSession
                                    ? purchase.session_schedule.map((schedule, idx) => (
                                      <div
                                        key={`${purchase.id}-schedule-${idx}`}
                                        style={{
                                          backgroundColor: "#1a1a1a",
                                          border: "1px solid #333",
                                          borderRadius: "6px",
                                          padding: "10px 14px",
                                          fontSize: "13px",
                                        }}
                                      >
                                        <div style={{ color: "#fff", fontWeight: "500" }}>
                                          {formatScheduleDate(schedule.date)}
                                        </div>
                                        <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
                                          {schedule.start_time}
                                        </div>
                                      </div>
                                    ))
                                    : purchase.scheduled_date.map((date, idx) => (
                                      <div
                                        key={`${purchase.id}-date-${idx}`}
                                        style={{
                                          backgroundColor: "#1a1a1a",
                                          border: "1px solid #333",
                                          borderRadius: "6px",
                                          padding: "10px 14px",
                                          fontSize: "13px",
                                          color: "#fff",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {formatScheduleDate(date)}
                                      </div>
                                    ))}
                                </div>
                              </>
                            )}
                            {(purchase.gym_contact || purchase.owner_contact || purchase.client_contact || purchase.gym_area || purchase.owner_name) && (
                              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                {purchase.owner_name && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Owner Name: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.owner_name}</span>
                                  </div>
                                )}
                                {purchase.gym_contact && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Gym Contact: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.gym_contact}</span>
                                  </div>
                                )}
                                {purchase.owner_contact && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Owner Contact: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.owner_contact}</span>
                                  </div>
                                )}
                                {purchase.gym_area && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Gym Area: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.gym_area}</span>
                                  </div>
                                )}



                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && purchases.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div style={{ color: "#888", fontSize: "14px" }}>
            Showing {((page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} purchases
          </div>
          <div className="btn-group">
            <button
              className="btn btn-sm"
              disabled={!pagination.hasPrev || loading}
              onClick={() => setPage(page - 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: pagination.hasPrev && !loading ? "#fff" : "#555",
                cursor: pagination.hasPrev && !loading ? "pointer" : "not-allowed",
              }}
            >
              Previous
            </button>
            <button
              className="btn btn-sm"
              disabled={!pagination.hasNext || loading}
              onClick={() => setPage(page + 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: pagination.hasNext && !loading ? "#fff" : "#555",
                cursor: pagination.hasNext && !loading ? "pointer" : "not-allowed",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .table-responsive {
          overflow-x: auto !important;
          position: relative !important;
        }

        table.purchases-table {
          width: 100% !important;
          min-width: 1200px !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          background-color: #1a1a1a !important;
          color: #fff !important;
          border-radius: 8px !important;
          overflow: visible !important;
        }

        /* Sticky columns */
        table.purchases-table > thead > tr > th:nth-child(1),
        table.purchases-table > tbody > tr > td:nth-child(1) {
          position: sticky !important;
          left: 0 !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 1px solid #333 !important;
        }

        table.purchases-table > thead > tr > th:nth-child(2),
        table.purchases-table > tbody > tr > td:nth-child(2) {
          position: sticky !important;
          left: 40px !important;
          width: 140px !important;
          min-width: 140px !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 1px solid #333 !important;
        }

        table.purchases-table > thead > tr > th:nth-child(3),
        table.purchases-table > tbody > tr > td:nth-child(3) {
          position: sticky !important;
          left: 180px !important;
          width: 140px !important;
          min-width: 140px !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 1px solid #333 !important;
        }

        table.purchases-table > thead > tr > th:nth-child(4),
        table.purchases-table > tbody > tr > td:nth-child(4) {
          position: sticky !important;
          left: 320px !important;
          width: 160px !important;
          min-width: 160px !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 2px solid #333 !important;
          box-shadow: 4px 0 8px rgba(0,0,0,0.3) !important;
        }

        /* Header cells need higher z-index */
        table.purchases-table > thead > tr > th:nth-child(1),
        table.purchases-table > thead > tr > th:nth-child(2),
        table.purchases-table > thead > tr > th:nth-child(3),
        table.purchases-table > thead > tr > th:nth-child(4) {
          z-index: 12 !important;
        }

        /* Body sticky cells need body background */
        table.purchases-table > tbody > tr > td:nth-child(1),
        table.purchases-table > tbody > tr > td:nth-child(2),
        table.purchases-table > tbody > tr > td:nth-child(3),
        table.purchases-table > tbody > tr > td:nth-child(4) {
          background-color: #1a1a1a !important;
        }

        table.purchases-table > tbody > tr:hover > td:nth-child(1),
        table.purchases-table > tbody > tr:hover > td:nth-child(2),
        table.purchases-table > tbody > tr:hover > td:nth-child(3),
        table.purchases-table > tbody > tr:hover > td:nth-child(4) {
          background-color: #222 !important;
        }

        table.purchases-table > thead {
          background-color: #222 !important;
          border-bottom: 2px solid #FF5757 !important;
        }

        table.purchases-table > thead > tr > th {
          padding: 12px !important;
          font-weight: 600 !important;
          text-align: left !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.purchases-table > tbody > tr {
          border-bottom: 1px solid #333 !important;
          transition: background-color 0.2s ease !important;
          background-color: transparent !important;
        }

        table.purchases-table > tbody > tr:hover {
          background-color: #222 !important;
        }

        table.purchases-table > tbody > tr:last-child {
          border-bottom: none !important;
        }

        table.purchases-table > tbody > tr > td {
          padding: 12px !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.purchases-table .client-name {
          font-weight: 500 !important;
        }

        table.purchases-table .gym-name {
          color: #ccc !important;
        }

        table.purchases-table .type {
          font-weight: 500 !important;
          min-width: 120px !important;
        }

        table.purchases-table .amount {
          font-weight: 600 !important;
          color: #4ade80 !important;
        }

        table.purchases-table .purchased-at {
          font-size: 14px !important;
          color: #888 !important;
        }

        table.purchases-table .status {
          text-align: center !important;
        }

        table.purchases-table .schedule-row {
          background-color: #151515 !important;
        }

        table.purchases-table .schedule-row:hover {
          background-color: #151515 !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
