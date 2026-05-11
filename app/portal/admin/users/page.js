"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

export default function Users() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gymFromUrl = searchParams.get("gym") || "";

  // State variables
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(gymFromUrl);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(gymFromUrl);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const [exportLoading, setExportLoading] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [clientCounts, setClientCounts] = useState({
    active_clients: 0,
    inactive_clients: 0,
    total_clients: 0,
    imported_clients: 0
  });
  const [onlineOfflineCounts, setOnlineOfflineCounts] = useState({
    online_members: 0,
    offline_members: 0,
    total_members: 0
  });
  const [platformCounts, setPlatformCounts] = useState({
    android: 0,
    ios: 0,
    total_platform_users: 0
  });
  // Active users metrics state
  const [activeUsersMetrics, setActiveUsersMetrics] = useState({
    monthly_average_users: 0,
    weekly_average_users: 0,
    daily_average_users: 0,
  });
  // Track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  // Track if we've completed the initial mount phase
  const isInitialMount = useRef(true);
  // Track expanded cards and their purchase data
  const [expandedCards, setExpandedCards] = useState({});
  const [purchasesData, setPurchasesData] = useState({});
  const [loadingPurchases, setLoadingPurchases] = useState({});

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Add spinner animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Track if we've already fetched initial data to prevent duplicate calls
  const hasFetchedInitialData = useRef(false);

  // Fetch initial data - memoized to prevent re-creation on every render
  const fetchInitialData = useCallback(async () => {
    // Prevent duplicate calls
    if (hasFetchedInitialData.current) {
      console.log("[fetchInitialData] Skipping - already fetched");
      return;
    }

    try {
      setLoading(true);

      const params = {
        page: 1,
        limit: 10,
        sort_order: "desc",
      };

      if (gymFromUrl) {
        params.gym = gymFromUrl;
      }

      console.log("[fetchInitialData] Calling /api/admin/users/overview with params:", params);

      // Single API call to get all initial data
      const response = await axiosInstance.get("/api/admin/users/overview", { params });

      if (response.data.success) {
        const data = response.data.data;

        // Set all data from single response
        setUsers(data.users);
        setTotalUsers(data.total);
        setFilteredTotal(data.total);

        setClientCounts(data.clientCounts);
        setOnlineOfflineCounts(data.onlineOfflineCounts);
        setPlatformCounts(data.platformCounts || { android: 0, ios: 0, total_platform_users: 0 });
        setActiveUsersMetrics(data.activeUsersMetrics || {
          monthly_average_users: 0,
          weekly_average_users: 0,
        });
        setInitialDataLoaded(true);
        hasFetchedInitialData.current = true;

        // Note: isInitialMount stays true until the second useEffect runs
      }
    } catch (error) {
      console.error("[fetchInitialData] Error fetching initial data:", error);
      console.error("[fetchInitialData] Error response:", error.response?.data);
      // Fall back to individual API calls if overview endpoint fails
      console.warn("[fetchInitialData] Overview endpoint failed, falling back to individual calls");
      // You can add fallback logic here if needed
    } finally {
      setLoading(false);
    }
  }, [gymFromUrl]);

  const fetchUsers = useCallback(async () => {
    // Skip if initial mount - fetchInitialData will handle it
    if (isInitialMount.current) {
      return;
    }

    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort_order: sortOrder,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }



      if (platformFilter && platformFilter !== "all") {
        params.platform = platformFilter;
      }

      if (dateFilter && dateFilter !== "all") {
        params.date_filter = dateFilter;
        if (dateFilter === "custom" && customStartDate && customEndDate) {
          params.custom_start_date = customStartDate;
          params.custom_end_date = customEndDate;
        }
      }

      if (gymFromUrl) {
        params.gym = gymFromUrl;
      }

      // Use the overview endpoint for all user fetches
      const response = await axiosInstance.get("/api/admin/users/overview", { params });

      if (response.data.success) {
        const data = response.data.data;
        setUsers(data.users);
        setFilteredTotal(data.total); // Only update the filtered total for pagination
        // NOTE: Do NOT update totalUsers, clientCounts, onlineOfflineCounts here
        // These should remain constant and only be set by fetchInitialData
        // The filtered counts should only affect the user list, not the cards
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, platformFilter, debouncedSearchTerm, sortOrder, dateFilter, customStartDate, customEndDate, gymFromUrl]);

  // Fetch initial data and restore state if returning - only run once on mount
  useEffect(() => {
    // Check if we're returning from user detail page
    const savedState = sessionStorage.getItem('usersListState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.isReturning) {
          // console.log("[Users] Restoring state from session storage");

          // Restore all state in a batch
          const restoredSearchTerm = state.searchTerm || gymFromUrl;

          const restoredPlatformFilter = state.platformFilter || "all";
          const restoredDateFilter = state.dateFilter || "all";
          const restoredCustomStartDate = state.customStartDate || "";
          const restoredCustomEndDate = state.customEndDate || "";
          const restoredSortOrder = state.sortOrder || "desc";
          const restoredCurrentPage = state.currentPage || 1;
          const restoredItemsPerPage = state.itemsPerPage || 10;

          // Clear the returning flag immediately
          sessionStorage.removeItem('usersListState');

          // Mark as NOT initial mount so fetchUsers will work
          isInitialMount.current = false;
          // Mark as fetched to skip initial fetch
          hasFetchedInitialData.current = true;

          // Restore all state - use batched state updates
          setSearchTerm(restoredSearchTerm);
          setDebouncedSearchTerm(restoredSearchTerm);

          setPlatformFilter(restoredPlatformFilter);
          setDateFilter(restoredDateFilter);
          setCustomStartDate(restoredCustomStartDate);
          setCustomEndDate(restoredCustomEndDate);
          setSortOrder(restoredSortOrder);
          setCurrentPage(restoredCurrentPage);
          setItemsPerPage(restoredItemsPerPage);
          setInitialDataLoaded(true);

          if (state.clientCounts) setClientCounts(state.clientCounts);
          if (state.onlineOfflineCounts) setOnlineOfflineCounts(state.onlineOfflineCounts);
          if (state.platformCounts) setPlatformCounts(state.platformCounts);
          if (state.activeUsersMetrics) setActiveUsersMetrics(state.activeUsersMetrics);
          if (state.totalUsers !== undefined) setTotalUsers(state.totalUsers);
          if (state.filteredTotal !== undefined) setFilteredTotal(state.filteredTotal);

          // Fetch users with the restored parameters directly
          // We need to construct the params manually since we just updated state
          const fetchUsersWithRestoredState = async () => {
            try {
              setLoading(true);

              const params = {
                page: restoredCurrentPage,
                limit: restoredItemsPerPage,
                sort_order: restoredSortOrder,
              };

              if (restoredSearchTerm) {
                params.search = restoredSearchTerm;
              }


              if (restoredPlatformFilter && restoredPlatformFilter !== "all") {
                params.platform = restoredPlatformFilter;
              }

              if (restoredDateFilter && restoredDateFilter !== "all") {
                params.date_filter = restoredDateFilter;
                if (restoredDateFilter === "custom" && restoredCustomStartDate && restoredCustomEndDate) {
                  params.custom_start_date = restoredCustomStartDate;
                  params.custom_end_date = restoredCustomEndDate;
                }
              }

              if (gymFromUrl) {
                params.gym = gymFromUrl;
              }

              const response = await axiosInstance.get("/api/admin/users/overview", { params });

              if (response.data.success) {
                const data = response.data.data;
                setUsers(data.users);
                setFilteredTotal(data.total); // Update the filtered total for pagination
                // NOTE: Do NOT update card counts when restoring state with filters
                // The card counts should remain at their global values from fetchInitialData
              }
            } catch (error) {
              setUsers([]);
            } finally {
              setLoading(false);
            }
          };

          // Call the fetch with restored values
          fetchUsersWithRestoredState();

          return;
        }
      } catch (e) {
        console.error("[Users] Error restoring state:", e);
      }
    }

    // If not returning, fetch initial data
    fetchInitialData().finally(() => {
      isInitialMount.current = false;
    });
  }, [gymFromUrl]);

  // Fetch users when filters change - but skip on initial mount
  useEffect(() => {
    // Skip if initial mount
    if (isInitialMount.current) {
      return;
    }

    // Only fetch after initial data is loaded
    if (initialDataLoaded) {
      fetchUsers();
    }
  }, [fetchUsers, initialDataLoaded]);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      searchTerm,

      platformFilter,
      dateFilter,
      customStartDate,
      customEndDate,
      sortOrder,
      currentPage,
      itemsPerPage,
      initialDataLoaded,
      isReturning: false,
      clientCounts,
      onlineOfflineCounts,
      platformCounts,
      activeUsersMetrics,
      totalUsers,
      filteredTotal
    };
    sessionStorage.setItem('usersListState', JSON.stringify(stateToSave));
  }, [
    searchTerm, platformFilter, dateFilter, customStartDate, customEndDate, 
    sortOrder, currentPage, itemsPerPage, initialDataLoaded,
    clientCounts, onlineOfflineCounts, platformCounts, activeUsersMetrics, totalUsers, filteredTotal
  ]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  };

  // Fetch purchases for a specific user
  const fetchUserPurchases = async (clientId) => {
    // Return cached data if available
    if (purchasesData[clientId]) {
      return purchasesData[clientId];
    }

    setLoadingPurchases(prev => ({ ...prev, [clientId]: true }));

    try {
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/last-purchases`);
      if (response.data.success) {
        const data = response.data.data;
        setPurchasesData(prev => ({ ...prev, [clientId]: data }));
        return data;
      }
    } catch (error) {
      console.error(`Error fetching purchases for user ${clientId}:`, error);
    } finally {
      setLoadingPurchases(prev => ({ ...prev, [clientId]: false }));
    }

    return null;
  };

  // Toggle card expansion
  const toggleCard = async (clientId) => {
    const isCurrentlyExpanded = expandedCards[clientId];

    if (isCurrentlyExpanded) {
      // Collapse
      setExpandedCards(prev => ({ ...prev, [clientId]: false }));
    } else {
      // Expand and fetch purchases if not already loaded
      setExpandedCards(prev => ({ ...prev, [clientId]: true }));
      if (!purchasesData[clientId]) {
        await fetchUserPurchases(clientId);
      }
    }
  };

  // Render purchase item for dropdown
  const renderPurchaseItem = (purchase, type) => {
    if (!purchase) return null;

    // Only show amount for subscription, membership and AI credits types
    const showAmount = type === "subscription" || type === "membership" || type === "ai_credits";

    return (
      <div
        key={type}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "20px",
          padding: "12px 16px",
          backgroundColor: "#2a2a2a",
          borderRadius: "8px",
          border: "1px solid #333",
          flex: "1 1 0",
          minWidth: "0",
        }}
      >
        <div style={{ flex: 1, minWidth: "0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ color: "#28a745", fontWeight: "600", fontSize: "14px" }}>
              {purchase.type === "Session" ? "Fitness class" : purchase.type}
            </span>
            {purchase.gym_name && (
              <>
                <span style={{ color: "#666" }}>•</span>
                <span style={{ color: "#ccc", fontSize: "13px" }}>{purchase.gym_name}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            Last Purchase: {formatDate(purchase.purchase_date)}
          </div>
        </div>
        {showAmount && purchase.amount_paid !== undefined && (
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", flexShrink: 0 }}>
            ₹{purchase.amount_paid?.toFixed(0) || 0}
          </div>
        )}
        {showAmount && purchase.payable_rupees !== undefined && (
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", flexShrink: 0 }}>
            ₹{purchase.payable_rupees?.toFixed(0) || 0}
          </div>
        )}
      </div>
    );
  };

  const handleExportClick = () => {
    setShowExportConfirm(true);
  };

  const handleExportUsers = async () => {
    try {
      setShowExportConfirm(false);
      setExportLoading(true);

      const response = await axiosInstance.get("/api/admin/users/export/all");

      if (response.data.success) {
        // Dynamically import xlsx library
        const XLSX = await import("xlsx");

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Prepare data for export
        const headers = ["Name", "Mobile", "Gym Name", "AI Credits", "Joined Date"];
        const rows = response.data.data.map((user) => [
          user.name || "-",
          user.contact || "-",
          user.gym_name || "-",
          user.ai_credits || 0,
          user.created_at
            ? new Date(user.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-",
        ]);
        const sheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // Download file
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "users_all_time.xlsx");
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(response.data.message || "Failed to export users");
      }
    } catch (error) {
      alert("Failed to export users data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredTotal / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading && users.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Users
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            padding: "40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      {/* Export Confirmation Modal */}
      {showExportConfirm && (
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
                marginBottom: "1rem",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Export Users Data
            </h3>
            <p
              style={{
                color: "#ccc",
                fontSize: "14px",
                marginBottom: "2rem",
                lineHeight: "1.5",
              }}
            >
              Do you want to export all users data? This will download an Excel
              file containing all user records.
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowExportConfirm(false)}
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
                onClick={handleExportUsers}
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
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
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
              Custom Date Range
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "14px",
                  marginBottom: "0.5rem",
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "14px",
                  marginBottom: "0.5rem",
                }}
              >
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  borderRadius: "6px",
                  color: "white",
                  fontSize: "14px",
                  boxSizing: "border-box",
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
                  setShowCustomDateModal(false);
                  setCustomStartDate("");
                  setCustomEndDate("");
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
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setDateFilter("custom");
                    setCurrentPage(1);
                    setShowCustomDateModal(false);
                  }
                }}
                disabled={!customStartDate || !customEndDate}
                style={{
                  background:
                    customStartDate && customEndDate
                      ? "#FF5757"
                      : "#666",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor:
                    customStartDate && customEndDate
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Users
          {gymFromUrl && (
            <span
              style={{ fontSize: "14px", color: "#666", marginLeft: "10px" }}
            >
              - {gymFromUrl}
            </span>
          )}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={handleExportClick}
            disabled={exportLoading}
            style={{
              background: exportLoading ? "#666" : "#FF5757",
              border: "none",
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: exportLoading ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {exportLoading ? (
              <>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid white",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Exporting...
              </>
            ) : (
              <>
                <span style={{ fontSize: "16px" }}>📥</span>
                Export
              </>
            )}
          </button>
          <div className="users-count">Total: {totalUsers} users</div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "6px 12px",
            backgroundColor: "#2a2a2a",
            borderRadius: "6px",
            border: "1px solid #444"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#4caf50" }}></div>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>Android:</span>
              <span style={{ color: "#4caf50", fontSize: "13px", fontWeight: "600" }}>{platformCounts.android.toLocaleString()}</span>
            </div>
            <div style={{ width: "1px", height: "16px", backgroundColor: "#444" }}></div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#5097c8" }}></div>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>iOS:</span>
              <span style={{ color: "#5097c8", fontSize: "13px", fontWeight: "600" }}>{platformCounts.ios.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Counts Cards */}
      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        {/* Gym Active Clients - Commented out as requested
        <div
          onClick={() => router.push("/portal/admin/active-clients")}
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Gym Active Clients
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {clientCounts.active_clients.toLocaleString()}
          </div>
        </div>
        */}

        {/* Gym Inactive Clients - Commented out as requested
        <div
          onClick={() => router.push("/portal/admin/inactive-clients")}
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Gym Inactive Clients
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {clientCounts.inactive_clients.toLocaleString()}
          </div>
        </div>
        */}

        {/* 1. Total Clients Card */}
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Total Clients
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {totalUsers.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Total registered users
          </div>
        </div>

        {/* 2. Organic clients Card */}
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Organic clients
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {(totalUsers - (onlineOfflineCounts.offline_members || 0)).toLocaleString()}
          </div>
        </div>

        {/* 3. Gym Fymble Members Card */}
        <div
          onClick={() => router.push("/portal/admin/online-members")}
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Gym Fymble Members
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {onlineOfflineCounts.online_members.toLocaleString()}
          </div>
        </div>

        {/* 4. Imported Clients Count Card */}
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Imported Clients Count
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {(clientCounts.imported_clients || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Second Row of Cards */}
      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        {/* 5. Gym Offline Members Card */}
        <div
          onClick={() => router.push("/portal/admin/offline-members")}
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Gym Offline Members
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {onlineOfflineCounts.offline_members.toLocaleString()}
          </div>
        </div>

        {/* 6. Monthly Average Users Card */}
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Monthly Average Users
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {Math.round(activeUsersMetrics.monthly_average_users).toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Last 3 months average
          </div>
        </div>

        {/* 7. Weekly Average Users Card */}
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Weekly Average Users
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {activeUsersMetrics.weekly_average_users.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Last 3 weeks average
          </div>
        </div>

        {/* 8. Daily Average Users Card */}
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
            border: "1px solid #444",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2a2a2a";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Daily Average Users
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {activeUsersMetrics.daily_average_users.toLocaleString()}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            Last 3 days average
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <div style={{ flex: "2 1 200px", minWidth: "160px" }}>
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, mobile, gym..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>



          <div style={{ flex: "1 1 130px", minWidth: "120px" }}>
            <select
              className="filter-select"
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>

          <div style={{ flex: "1 1 130px", minWidth: "120px" }}>
            <select
              className="filter-select"
              value={dateFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "custom") {
                  setShowCustomDateModal(true);
                } else {
                  setDateFilter(value);
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setCurrentPage(1);
                }
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div style={{ flex: "1 1 110px", minWidth: "100px" }}>
            <button
              className="sort-btn"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
              Sort Date
            </button>
          </div>

          <div style={{ flex: "1 1 110px", minWidth: "100px" }}>
            <select
              className="filter-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="table-container">
        {/* Table Header */}
        <div className="users-table-header">
          <div className="table-header-cell table-col-name">Name</div>
          <div className="table-header-cell table-col-gym">Gym</div>
          <div className="table-header-cell table-col-ai-credits">AI Credits</div>
          <div className="table-header-cell table-col-platform">Platform</div>
          <div className="table-header-cell table-col-joined">Joined Date</div>
          <div className="table-header-cell table-col-action"></div>
        </div>

        {/* Table Body */}
        <div className="users-table-body">
          {users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.client_id}
                className="user-table-row"
                onClick={() => {
                  const currentState = {
                    searchTerm,

                    platformFilter,
                    dateFilter,
                    customStartDate,
                    customEndDate,
                    sortOrder,
                    currentPage,
                    itemsPerPage,
                    isReturning: true,
                    clientCounts,
                    onlineOfflineCounts,
                    platformCounts,
                    activeUsersMetrics,
                    totalUsers,
                    filteredTotal
                  };
                  sessionStorage.setItem('usersListState', JSON.stringify(currentState));
                  router.push(`/portal/admin/users/${user.client_id}`);
                }}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1f1f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                {/* Name Column */}
                <div className="table-cell table-col-name" data-label="Name">
                  <div className="user-name">{user.name || "-"}</div>
                  <div className="user-contact">{user.contact || "-"}</div>
                </div>

                {/* Gym Column */}
                <div className="table-cell table-col-gym" data-label="Gym">
                  <div className="cell-value">{user.gym_name || "-"}</div>
                </div>

                {/* AI Credits Column */}
                <div className="table-cell table-col-ai-credits" data-label="AI Credits">
                  <div className="cell-value">{user.ai_credits || 0}</div>
                </div>

                {/* Platform Column */}
                <div className="table-cell table-col-platform" data-label="Platform">
                  <span
                    className="platform-badge"
                    style={{
                      color: user.platform === "android" ? "#a8d5a2" : user.platform === "ios" ? "#a2c4d5" : "#888",
                      backgroundColor: user.platform === "android" ? "rgba(100, 200, 80, 0.1)" : user.platform === "ios" ? "rgba(80, 150, 200, 0.1)" : "rgba(128,128,128,0.1)",
                      border: `1px solid ${user.platform === "android" ? "#4caf50" : user.platform === "ios" ? "#5097c8" : "#555"}`,
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "12px",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {user.platform || "-"}
                  </span>
                </div>

                {/* Joined Date Column */}
                <div className="table-cell table-col-joined" data-label="Joined Date">
                  <div className="cell-value">{formatDate(user.created_at)}</div>
                </div>

                {/* Action Column */}
                <div className="table-cell table-col-action" data-label="">
                  <button
                    className="toggle-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCard(user.client_id);
                    }}
                  >
                    {expandedCards[user.client_id] ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>
                </div>

                {/* Dropdown Content - Purchase Details */}
                {expandedCards[user.client_id] && (
                  <div className="user-row-dropdown">
                    {loadingPurchases[user.client_id] ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "20px",
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            border: "3px solid #3a3a3a",
                            borderTop: "3px solid #FF5757",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      </div>
                    ) : purchasesData[user.client_id] ? (
                      <div className="purchases-list">
                        <div style={{ marginBottom: "12px", fontSize: "14px", color: "#888", fontWeight: "500" }}>
                          Purchase Details
                        </div>
                        <div style={{ display: "flex", flexDirection: "row", gap: "12px", flexWrap: "wrap" }}>
                          {renderPurchaseItem(purchasesData[user.client_id].daily_pass, "daily_pass")}
                          {renderPurchaseItem(purchasesData[user.client_id].session, "session")}
                          {renderPurchaseItem(purchasesData[user.client_id].membership, "membership")}
                          {renderPurchaseItem(purchasesData[user.client_id].subscription, "subscription")}
                          {renderPurchaseItem(purchasesData[user.client_id].ai_credits, "ai_credits")}
                        </div>
                        {!purchasesData[user.client_id].daily_pass &&
                          !purchasesData[user.client_id].session &&
                          !purchasesData[user.client_id].membership &&
                          !purchasesData[user.client_id].subscription && 
                          !purchasesData[user.client_id].ai_credits && (
                          <div
                            style={{
                              padding: "20px",
                              textAlign: "center",
                              color: "#666",
                              fontSize: "14px",
                            }}
                          >
                            No purchase history found
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        Failed to load purchase details
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-data">No users found matching your criteria</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {filteredTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredTotal)} of {filteredTotal}{" "}
            entries
          </div>

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>

            {getPaginationNumbers().map((page, index) => (
              <button
                key={index}
                className={`pagination-btn ${
                  page === currentPage ? "active" : ""
                } ${page === "..." ? "dots" : ""}`}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                disabled={page === "..."}
              >
                {page}
              </button>
            ))}

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
  
