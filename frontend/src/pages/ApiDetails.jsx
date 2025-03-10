import React, { useEffect, useState } from "react";
import { fetchAllLogs, runPipeline } from "../services/api";
import moment from "moment";

function ApiDetails() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // Default: Show all logs

  // Function to fetch logs
  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllLogs();
      console.log("✅ API Response:", data);
      if (Array.isArray(data) && data.length > 0) {
        setLogs([...data]);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("❌ Error fetching logs:", error);
      setError("Failed to fetch logs. Please try again.");
    }
    setLoading(false);
  };

  // Function to trigger pipeline and fetch logs after completion
  const handleRefresh = async () => {
    setLoading(true);
    try {
      console.log("🔄 Running pipeline...");
      await runPipeline();
      console.log("✅ Pipeline completed. Fetching logs...");
      setTimeout(() => loadLogs(), 3000);
    } catch (error) {
      console.error("❌ Error running pipeline:", error);
      setError("Pipeline execution failed.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // ✅ Filter logs based on selected filter (Today, Last 7 Days, Last 30 Days)
  const filteredLogs = logs.filter((log) => {
    const logDate = moment(log.created_at);
    const today = moment().startOf("day");
    if (filter === "today") {
      return logDate.isSame(today, "day");
    } else if (filter === "week") {
      return logDate.isAfter(moment().subtract(7, "days").startOf("day"));
    } else if (filter === "month") {
      return logDate.isAfter(moment().subtract(30, "days").startOf("day"));
    }
    return true; // Default: Show all logs
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 API Details</h2>

      {/* Buttons for Refresh & Get Logs */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={handleRefresh} disabled={loading} style={{ marginRight: "10px" }}>
          🔄 Refresh
        </button>
        <button onClick={loadLogs} disabled={loading}>
          📥 Get Logs
        </button>
      </div>

      {/* ✅ Date Filter Dropdown */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontWeight: "bold", marginRight: "10px" }}>Filter by Date:</label>
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="all">📅 All Logs</option>
          <option value="today">📆 Today</option>
          <option value="week">📅 Last 7 Days</option>
          <option value="month">📆 Last 30 Days</option>
        </select>
      </div>
      
      {loading && <p>Loading logs...</p>}
      {error && <p style={{ color: "red" }}>⚠ {error}</p>}

      {filteredLogs.length === 0 && !loading ? (
        <p>🚀 No logs available!</p>
      ) : (
        <>
          <p>✅ Showing {filteredLogs.length} logs</p>

          {/* ✅ Scrollable & Responsive Table */}
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              fontSize: "13px",
              textAlign: "left",
              minWidth: "600px", // Ensure minimum width
              border: "1px solid #ddd"
            }}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "15%" }}>Index</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "15%" }}>Module</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "25%" }}>URI</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "20%" }}>Created At</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "10%" }}>Status</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "15%" }}>Risk Range</th>
                  <th style={{ padding: "6px", border: "1px solid #ddd", width: "10%" }}>Verb</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index} style={{ background: index % 2 === 0 ? "#fff" : "#f2f2f2" }}>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{index + 1}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.module}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.uri}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{moment(log.created_at).format("YYYY-MM-DD HH:mm")}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.status}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.risk_range}</td>
                    <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.verb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ApiDetails;
