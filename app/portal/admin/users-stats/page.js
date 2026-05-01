"use client";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";

export default function UsersStatsPage() {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [payingUsers, setPayingUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [repeatUsers, setRepeatUsers] = useState(0);
  const [usersByCity, setUsersByCity] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Single common filter state for all three cards
  const [filter, setFilter] = useState("overall");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination states
  const [offset, setOffset] = useState(30);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCities, setTotalCities] = useState(0);
  const scrollContainerRef = useRef(null);

  // Fetch users stats data
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/users-stats/data");

      if (response.data.success) {
        setTotalUsers(response.data.data.total_users);
        setActiveUsers(response.data.data.active_users);
        setPayingUsers(response.data.data.paying_users);
        setTotalBookings(response.data.data.total_bookings || 0);
        setRepeatUsers(response.data.data.repeat_users);
        const cityData = response.data.data.users_by_city || [];
        setUsersByCity(cityData);
        setTotalCities(response.data.data.total_cities || 0);

        // Set initial offset for pagination
        setOffset(cityData.length);
        setHasMore(cityData.length >= 30);
      }
    } catch (err) {
      console.error("Error fetching users data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch more cities (pagination)
  const fetchMoreCities = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await axiosInstance.get("/api/admin/users-stats/cities", {
        params: { offset: offset, limit: 30 }
      });

      if (response.data.success) {
        const newCities = response.data.data || [];
        setUsersByCity((prev) => [...prev, ...newCities]);
        setOffset(response.data.next_offset);
        setHasMore(response.data.has_more);
      }
    } catch (err) {
      console.error("Error fetching more cities:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite scroll
  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    // Load more when scrolled to 90% of the content
    if (scrollPercentage >= 0.9) {
      fetchMoreCities();
    }
  };

  // Handle shared filter changes
  useEffect(() => {
    const fetchFilteredData = async () => {
      const params = {};

      if (filter === "overall") {
        setStartDate("");
        setEndDate("");
      } else if (filter === "custom") {
        if (!startDate || !endDate) return;
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        const today = new Date();
        const formatDate = (date) => date.toISOString().split('T')[0];
        let start, end;

        if (filter === "today") {
          start = end = formatDate(today);
        } else if (filter === "last_7") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          start = formatDate(sevenDaysAgo);
          end = formatDate(today);
        } else if (filter === "last_30") {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          start = formatDate(thirtyDaysAgo);
          end = formatDate(today);
        } else if (filter === "last_month") {
          const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
          const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
          start = formatDate(firstDayOfLastMonth);
          end = formatDate(lastDayOfLastMonth);
        } else if (filter === "current_month") {
          const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          start = formatDate(firstDayOfCurrentMonth);
          end = formatDate(today);
        }

        setStartDate(start);
        setEndDate(end);
        params.start_date = start;
        params.end_date = end;
      }

      try {
        const response = await axiosInstance.get("/api/admin/users-stats/data", { params });
        if (response.data.success) {
          setTotalUsers(response.data.data.total_users || 0);
          setPayingUsers(response.data.data.paying_users || 0);
          setTotalBookings(response.data.data.total_bookings || 0);
          setRepeatUsers(response.data.data.repeat_users || 0);
          setActiveUsers(response.data.data.active_users || 0);
        }
      } catch (err) {
        console.error("Error fetching filtered data:", err);
      }
    };

    fetchFilteredData();
  }, [filter, startDate, endDate]);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const handleFilterChange = (value) => {
    setFilter(value);
    if (value === "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="section-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <h3 className="section-heading" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>Users</span> Analytics
          </h3>
          {/* Common Filter Row - right aligned */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px solid #333" }}>
            <span style={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>Filter:</span>
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "#ccc",
                fontSize: "11px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="today">Today</option>
              <option value="last_7">Last 7 Days</option>
              <option value="last_30">Last 30 Days</option>
              <option value="last_month">Last Month</option>
              <option value="current_month">MTD</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom</option>
            </select>
            {filter === "custom" && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ fontSize: "11px", padding: "4px 6px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", width: "110px" }}
                />
                <span style={{ color: "#666", fontSize: "11px" }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ fontSize: "11px", padding: "4px 6px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", width: "110px" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #333",
            borderTop: "3px solid #FF5757",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginRight: "15px"
          }} />
          <div style={{ color: "#888" }}>Loading analytics...</div>
        </div>
      ) : (
        <div className="section-container">
          <div className="row g-3">
            {/* Total Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#ff5757" }}>
                    {totalUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Registered {filter !== "overall" && <span style={{ color: "#ff5757", fontSize: "10px" }}>({filter})</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Paying Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Paying Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fcad10ff" }}>
                    {payingUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Paying {filter !== "overall" && <span style={{ color: "#fcad10ff", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {totalUsers > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((payingUsers / totalUsers) * 100).toFixed(1)}% of total users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Bookings Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Bookings</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>
                    {totalBookings.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Bookings {filter !== "overall" && <span style={{ color: "#ff5757", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {totalUsers > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((totalBookings / totalUsers) * 100).toFixed(1)}% of total users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Repeat Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Repeat Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#a950dcff" }}>
                    {repeatUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Customers with 1+ payments {filter !== "overall" && <span style={{ color: "#a950dcff", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {payingUsers > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((repeatUsers / payingUsers) * 100).toFixed(1)}% Repeat rate
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Active Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#15cc25ff" }}>
                    {activeUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Active {filter !== "overall" && <span style={{ color: "#15cc25ff", fontSize: "10px" }}>({filter})</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users per City Bar Chart */}
          {usersByCity.length > 0 && (
            <div className="row" style={{ marginTop: "1.5rem" }}>
              <div className="col-12">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Users per City ({totalCities} cities)</h6>
                  </div>
                  <div className="card-body-custom">
                    <div
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      style={{ overflowX: "auto", overflowY: "hidden" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "1rem", height: "250px", paddingTop: "2rem", minWidth: "max-content" }}>
                        {usersByCity.map((city, index) => {
                          const maxUsers = Math.max(...usersByCity.map(c => c.users_count));
                          const barHeight = maxUsers > 0 ? (city.users_count / maxUsers) * 180 : 0;

                          return (
                            <div
                              key={`${city.city}-${index}`}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0 }}
                            >
                              <div style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#fff",
                                marginBottom: "6px",
                                height: "16px"
                              }}>
                                {city.users_count.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: `${barHeight}px`,
                                  backgroundColor: "#FF5757",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "height 0.3s ease, backgroundColor 0.2s ease",
                                  minHeight: "4px",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#ff6b6b";
                                  setHoveredBar(city);
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => {
                                  setHoveredBar(null);
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#888",
                                  marginTop: "8px",
                                  textAlign: "center",
                                  wordBreak: "break-word",
                                  textTransform: "capitalize",
                                  height: "32px",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredBar(city);
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => setHoveredBar(null)}
                              >
                                {city.city}
                              </div>
                            </div>
                          );
                        })}

                        {/* Loading indicator for pagination */}
                        {loadingMore && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0, justifyContent: "flex-end" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              border: "3px solid #333",
                              borderTop: "3px solid #FF5757",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Tooltip - Outside overflow container */}
          {hoveredBar && (
            <div
              style={{
                position: "fixed",
                left: `${tooltipPos.x + 15}px`,
                top: `${tooltipPos.y - 50}px`,
                backgroundColor: "#1e1e1e",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                zIndex: 10000,
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                border: "1px solid #FF5757",
                pointerEvents: "none"
              }}
            >
              <div style={{ marginBottom: "3px", color: "#FF5757", fontWeight: "700", fontSize: "14px" }}>
                {hoveredBar.city}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>
                {hoveredBar.users_count.toLocaleString()} users
              </div>
            </div>
          )}

          {/* CSS animation for loading spinner */}
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
