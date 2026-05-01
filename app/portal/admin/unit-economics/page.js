"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

export default function UnitEconomicsPage() {
  const [loading, setLoading] = useState(true);
  const [unitEconomicsData, setUnitEconomicsData] = useState(null);
  const [dateFilter, setDateFilter] = useState("overall");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Initialize dates based on the initial filter
  const getInitialDates = () => {
    const today = new Date();

    if (dateFilter === "today") {
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    } else if (dateFilter === "last_7") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        start: sevenDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    } else if (dateFilter === "last_30") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    } else if (dateFilter === "last_month") {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
      const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
      return {
        start: firstDayOfLastMonth.toISOString().split('T')[0],
        end: lastDayOfLastMonth.toISOString().split('T')[0]
      };
    } else if (dateFilter === "current_month") {
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: firstDayOfCurrentMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }
    // Default to last_30
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const initialDates = getInitialDates();
  const [currentStartDate, setCurrentStartDate] = useState(initialDates.start);
  const [currentEndDate, setCurrentEndDate] = useState(initialDates.end);

  useEffect(() => {
    // Set date range based on filter selection
    const today = new Date();

    if (dateFilter === "today") {
      setCurrentEndDate(today.toISOString().split('T')[0]);
      setCurrentStartDate(today.toISOString().split('T')[0]);
    } else if (dateFilter === "last_7") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setCurrentEndDate(today.toISOString().split('T')[0]);
      setCurrentStartDate(sevenDaysAgo.toISOString().split('T')[0]);
    } else if (dateFilter === "last_30") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setCurrentEndDate(today.toISOString().split('T')[0]);
      setCurrentStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    } else if (dateFilter === "last_month") {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
      const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
      setCurrentEndDate(lastDayOfLastMonth.toISOString().split('T')[0]);
      setCurrentStartDate(firstDayOfLastMonth.toISOString().split('T')[0]);
    } else if (dateFilter === "current_month") {
      const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setCurrentEndDate(today.toISOString().split('T')[0]);
      setCurrentStartDate(firstDayOfCurrentMonth.toISOString().split('T')[0]);
    }
  }, [dateFilter]);

  const fetchUnitEconomicsAnalytics = async (isOverall = false) => {
    setLoading(true);
    try {
      let url = "/api/admin/unit-economics/data";
      const params = [];

      if (!isOverall) {
        if (dateFilter === "custom" && startDate && endDate) {
          params.push(`start_date=${startDate}`, `end_date=${endDate}`);
        } else if (dateFilter !== "overall") {
          params.push(`start_date=${currentStartDate}`, `end_date=${currentEndDate}`);
        }
      }

      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const response = await axiosInstance.get(url);
      if (response.data && response.data.success) {
        setUnitEconomicsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching unit economics data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter === "overall") {
      fetchUnitEconomicsAnalytics(true);
    } else if (dateFilter === "custom" && startDate && endDate) {
      fetchUnitEconomicsAnalytics(false);
    } else if (["today", "last_7", "last_30", "last_month", "current_month"].includes(dateFilter)) {
      fetchUnitEconomicsAnalytics(false);
    }
  }, [dateFilter, currentStartDate, currentEndDate, startDate, endDate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      {/* CAC Card and Supporting Metrics */}
      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : unitEconomicsData ? (
        <div className="section-container">
          <div className="row g-4">
            {/* Main CAC Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Customer Acquisition Cost</h6>
                </div>
                <div className="card-body-custom">
                  {/* Date Filter Inside Card */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
                      Date Filter
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{
                        backgroundColor: "#374151",
                        border: "1px solid #4b5563",
                        borderRadius: "6px",
                        color: "white",
                        padding: "0.5rem 0.75rem",
                        fontSize: "0.875rem",
                        width: "100%",
                      }}
                    >
                      <option value="today">Today</option>
                      <option value="last_7">Last 7 Days</option>
                      <option value="last_30">Last 30 Days</option>
                      <option value="last_month">Last Month</option>
                      <option value="current_month">Current Month</option>
                      <option value="overall">Overall</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    {dateFilter === "custom" && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          max={endDate || new Date().toISOString().split('T')[0]}
                          style={{
                            backgroundColor: "#374151",
                            border: "1px solid #4b5563",
                            borderRadius: "6px",
                            color: "white",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.875rem",
                            flex: 1,
                          }}
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          max={new Date().toISOString().split('T')[0]}
                          style={{
                            backgroundColor: "#374151",
                            border: "1px solid #4b5563",
                            borderRadius: "6px",
                            color: "white",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.875rem",
                            flex: 1,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {formatCurrency(unitEconomicsData.cac)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Cost to acquire one customer
                  </div>
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                      <span>Total Expenses</span>
                      <span style={{ color: "white", fontWeight: "600" }}>{formatCurrency(unitEconomicsData.totalExpenses)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                      <span>Total New Users</span>
                      <span style={{ color: "white", fontWeight: "600" }}>{unitEconomicsData.totalNewUsers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LTV Card */}
            {unitEconomicsData && unitEconomicsData.ltv !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Lifetime Value (LTV)</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                      {unitEconomicsData.ltv > 0 ? unitEconomicsData.ltv.toFixed(2) : "N/A"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Customer lifetime value
                    </div>
                    {unitEconomicsData.ltv > 0 && (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                          <span>Cohort Retention Rate</span>
                          <span style={{ color: "white", fontWeight: "600" }}>{(unitEconomicsData.cohortRetentionRate * 100).toFixed(2)}%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                          <span>Retained Users</span>
                          <span style={{ color: "white", fontWeight: "600" }}>{unitEconomicsData.retainedUsers.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LTV / CAC Ratio Card */}
            {unitEconomicsData && unitEconomicsData.ltv !== undefined && unitEconomicsData.cac !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">LTV / CAC Ratio</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#3b82f6" }}>
                      {unitEconomicsData.cac > 0 ? (unitEconomicsData.ltv / unitEconomicsData.cac).toFixed(2) : "N/A"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Lifetime value to acquisition cost ratio
                    </div>
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                        <span>LTV</span>
                        <span style={{ color: "white", fontWeight: "600" }}>{unitEconomicsData.ltv.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                        <span>CAC</span>
                        <span style={{ color: "white", fontWeight: "600" }}>{formatCurrency(unitEconomicsData.cac)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* D30 Retention Card */}
            {unitEconomicsData && unitEconomicsData.retainedUsers !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">D30 Retention</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#8b5cf6" }}>
                      {unitEconomicsData.retainedUsers.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Retained Users from previous month
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* D7 Retention Card */}
            {unitEconomicsData && unitEconomicsData.d7_retained_users !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">D7 Retention</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#06b6d4" }}>
                      {unitEconomicsData.d7_retained_users.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Retained Users from previous weeks
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Churn Rate Card */}
            {unitEconomicsData && unitEconomicsData.cohortRetentionRate !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">User Churn Rate</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>
                      {((1 - unitEconomicsData.cohortRetentionRate) * 100).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Percentage of users who churned
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GMV Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">GMV</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ color: "#888", fontSize: "14px" }}>Loading...</div>
                  ) : unitEconomicsData?.gmv ? (() => {
                    const gmvData = unitEconomicsData.gmv;
                    const totalRevenue =
                      (gmvData.daily_pass?.total_revenue || 0) +
                      (gmvData.session?.total_revenue || 0) +
                      (gmvData.nutrition_plan?.total_revenue || 0) +
                      (gmvData.gym_membership?.total_revenue || 0) +
                      (gmvData.ai_credits?.total_revenue || 0);

                    return (
                      <>
                        <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#FF5757" }}>
                          {formatCurrency(totalRevenue)}
                        </div>
                        <div style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                          Total Gross Merchandise Value
                        </div>
                      </>
                    );
                  })() : (
                    <div style={{ color: "#888", fontSize: "14px" }}>No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* GMV / Bookings Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">GMV / Bookings</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ color: "#888", fontSize: "14px" }}>Loading...</div>
                  ) : unitEconomicsData?.gmv ? (() => {
                    const gmvData = unitEconomicsData.gmv;
                    const totalRevenue =
                      (gmvData.daily_pass?.total_revenue || 0) +
                      (gmvData.session?.total_revenue || 0) +
                      (gmvData.nutrition_plan?.total_revenue || 0) +
                      (gmvData.gym_membership?.total_revenue || 0) +
                      (gmvData.ai_credits?.total_revenue || 0);
                    const totalBookings =
                      (gmvData.daily_pass?.count || 0) +
                      (gmvData.session?.count || 0) +
                      (gmvData.nutrition_plan?.count || 0) +
                      (gmvData.gym_membership?.count || 0) +
                      (gmvData.ai_credits?.count || 0);
                    const revenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

                    return (
                      <>
                        <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b" }}>
                          {formatCurrency(revenuePerBooking)}
                        </div>
                        <div style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                          Revenue per booking &nbsp;·&nbsp;
                          <span style={{ color: "#9ca3af" }}>{totalBookings.toLocaleString()} total bookings</span>
                        </div>
                      </>
                    );
                  })() : (
                    <div style={{ color: "#888", fontSize: "14px" }}>No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Cohort Retention Card */}
            {unitEconomicsData && unitEconomicsData.cohortRetentionRate !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Cohort Retention</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                      {(unitEconomicsData.cohortRetentionRate * 100).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Retention rate from previous month
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>No data available</div>
        </div>
      )}
    </div>
  );
}
