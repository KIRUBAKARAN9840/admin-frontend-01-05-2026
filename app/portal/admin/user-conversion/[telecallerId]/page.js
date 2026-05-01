"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FaSearch, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function TelecallerConvertedClients() {
  const router = useRouter();
  const params = useParams();
  const telecallerId = params.telecallerId;

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [telecaller, setTelecaller] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalClients, setTotalClients] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

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

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axiosInstance.get(
        `/api/admin/user-conversion/telecallers/${telecallerId}/converted-clients`,
        { params }
      );

      if (response.data.success) {
        setClients(response.data.data.clients);
        setTelecaller(response.data.data.telecaller);
        setTotalClients(response.data.data.total);
        setTotalRevenue(response.data.data.total_revenue || 0);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [telecallerId, currentPage, itemsPerPage, debouncedSearchTerm]);

  // Fetch purchase history for a client (for toggle)
  const fetchPurchases = async (clientId) => {
    try {
      setLoadingPurchases((prev) => ({ ...prev, [clientId]: true }));

      const response = await axiosInstance.get(`/api/admin/users/${clientId}/last-purchases`);

      if (response.data.success) {
        const data = response.data.data;
        setPurchasesData((prev) => ({ ...prev, [clientId]: data }));
        return data;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching purchases for client ${clientId}:`, error);
      return null;
    } finally {
      setLoadingPurchases((prev) => ({ ...prev, [clientId]: false }));
    }
  };

  // Toggle card expansion
  const toggleCard = async (clientId) => {
    const isCurrentlyExpanded = expandedCards[clientId];

    if (isCurrentlyExpanded) {
      // Collapse
      setExpandedCards((prev) => ({ ...prev, [clientId]: false }));
    } else {
      // Expand - fetch purchases if not already loaded
      setExpandedCards((prev) => ({ ...prev, [clientId]: true }));

      if (!purchasesData[clientId]) {
        await fetchPurchases(clientId);
      }
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleBack = () => {
    router.push("/portal/admin/user-conversion");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  const totalPages = Math.ceil(totalClients / itemsPerPage);

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

  if (loading && clients.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <FaChevronLeft /> Back to Telecallers
          </button>
          <h2 className="users-title" style={{ marginLeft: "20px" }}>
            Converted Clients
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#fff")}
          onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
        >
          <FaChevronLeft /> Back to Telecallers
        </button>
        <div style={{ marginLeft: "20px", flex: 1 }}>
          <h2 className="users-title">
            {telecaller?.name && (
              <>
                <span style={{ color: "#FF5757" }}>{telecaller.name}</span>
                {" "}
                <span style={{ color: "#ccc", fontSize: "16px", fontWeight: "400" }}>
                  - Converted Clients
                </span>
              </>
            )}
          </h2>
        </div>
        <div className="users-count">Total: {totalClients} clients</div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="row pb-0">
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, mobile, or client ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
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

          <div className="col-lg-3 col-md-6 col-sm-12 ms-auto">
            <div
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#ecfdf5", marginBottom: "2px", fontWeight: "500" }}>
                  Business by {telecaller?.name || "Telecaller"}
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>
                  ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Gym</th>
                <th>Last Purchased</th>
                <th>Converted Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => {
                  const clientId = client.client_id;
                  const rows = [];

                  rows.push(
                    <tr
                      key={clientId}
                      onClick={() => router.push(`/portal/admin/users/${clientId}`)}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1f1f"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td>
                        <div className="user-name">{client.name || "-"}</div>
                        {client.email && (
                          <div className="user-contact" style={{ fontSize: "12px", color: "#888" }}>
                            {client.email}
                          </div>
                        )}
                      </td>
                      <td>{client.contact || "-"}</td>
                      <td>{client.gym_name || "-"}</td>
                      <td>
                        <span
                          className="plan-badge"
                          style={{
                            backgroundColor: "#2a2a2a",
                            borderColor: "#555",
                            color: "#ccc",
                            fontSize: "13px",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            textTransform: "capitalize",
                          }}
                        >
                          {client.latest_purchase_type || "No Data"}
                        </span>
                      </td>
                      <td>{formatDate(client.converted_at)}</td>
                      <td>
                        <button
                          className="toggle-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCard(clientId);
                          }}
                        >
                          {expandedCards[clientId] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                    </tr>
                  );

                  if (expandedCards[clientId]) {
                    rows.push(
                      <tr
                        key={`dropdown-${clientId}`}
                        style={{ cursor: "default" }}
                      >
                        <td
                          colSpan="6"
                          style={{
                            padding: "0",
                            border: "none",
                            backgroundColor: "#1a1f1f",
                          }}
                        >
                          <div className="user-row-dropdown">
                            {purchasesData[clientId] ? (
                              <div className="purchases-list">
                                <div style={{ marginBottom: "12px", fontSize: "14px", color: "#888", fontWeight: "500" }}>
                                  Purchase Details
                                </div>
                                <div style={{ display: "flex", flexDirection: "row", gap: "12px", flexWrap: "wrap" }}>
                                  {renderPurchaseItem(purchasesData[clientId].daily_pass, "daily_pass")}
                                  {renderPurchaseItem(purchasesData[clientId].session, "session")}
                                  {renderPurchaseItem(purchasesData[clientId].membership, "membership")}
                                  {renderPurchaseItem(purchasesData[clientId].subscription, "subscription")}
                                  {renderPurchaseItem(purchasesData[clientId].ai_credits, "ai_credits")}
                                </div>
                                {!purchasesData[clientId].daily_pass &&
                                  !purchasesData[clientId].session &&
                                  !purchasesData[clientId].membership &&
                                  !purchasesData[clientId].subscription &&
                                  !purchasesData[clientId].ai_credits && (
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
                                No purchase data available
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No converted clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalClients)} of {totalClients}{" "}
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
                className={`pagination-btn ${page === currentPage ? "active" : ""} ${page === "..." ? "dots" : ""}`}
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
