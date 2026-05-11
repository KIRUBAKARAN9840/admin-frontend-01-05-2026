"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

export default function ClientPurchaseSummaryPage() {
  const { client_id } = useParams();
  const searchParams = useSearchParams();
  const clientName = searchParams.get("name") || "Client";
  const router = useRouter();

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/admin/purchases/client-purchase-summary/${client_id}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching client purchase summary:", error);
      } finally {
        setLoading(false);
      }
    };

    if (client_id) {
      fetchData();
    }
  }, [client_id]);

  const renderCategoryCards = () => {
    if (loading) {
      return (
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
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading summary...</p>
        </div>
      );
    }

    if (Object.keys(data).length === 0) {
      return (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No purchases found for this client.</p>
        </div>
      );
    }

    return (
      <div className="row g-3">
        {Object.entries(data).map(([category, items]) => {
          let totalCount = 0;
          if (Array.isArray(items)) {
            totalCount = items.reduce((sum, item) => sum + item.count, 0);
          } else if (items.count) {
            totalCount = items.count;
          }

          if (totalCount === 0) return null;

          return (
            <div className="col-12 col-md-6 col-xl-4" key={category}>
              <div
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "20px",
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h6 style={{ color: "#fff", fontSize: "16px", fontWeight: "600", margin: 0 }}>
                    {category}
                  </h6>
                  <span
                    style={{
                      backgroundColor: "rgba(255, 87, 87, 0.1)",
                      color: "#FF5757",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    {totalCount} Total
                  </span>
                </div>

                {Array.isArray(items) && items.length > 0 && (
                  <div style={{ marginTop: "12px", borderTop: "1px solid #333", paddingTop: "12px" }}>
                    <p style={{ color: "#888", fontSize: "12px", marginBottom: "8px", fontWeight: "500" }}>BREAKDOWN BY GYM</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#ccc", fontSize: "14px", textTransform: "capitalize" }}>
                            {item.gym_name || "Unknown Gym"}
                          </span>
                          <span style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "80vh", color: "white" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "1px solid #444",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <FaArrowLeft /> Back
        </button>
        <div>
          <h5 style={{ color: "#888", fontSize: "14px", fontWeight: "400", marginBottom: "0" }}>
            Purchase Summary for
          </h5>
          <p style={{ color: "#fff", fontSize: "20px", fontWeight: "600", marginBottom: "0", textTransform: "capitalize" }}>
            {clientName}
          </p>
        </div>
      </div>

      {renderCategoryCards()}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
