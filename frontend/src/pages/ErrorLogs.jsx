// import React, { useEffect, useState, useRef } from "react";
// import { fetchErrorLogs, fetchLogsByModule, runPipeline, processAutomation } from "../services/api";
// import { useLocation } from "react-router-dom";
// import { Bar } from "react-chartjs-2"; 
// import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";
// import HeatMap from "@uiw/react-heat-map";
// import moment from "moment";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// function ErrorLogs() {
//   const [errorLogs, setErrorLogs] = useState([]);
//   const [selectedModule, setSelectedModule] = useState(null);
//   const [moduleLogs, setModuleLogs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [filter, setFilter] = useState("all"); // Date filter state

//   const detailsRef = useRef(null);
//   const location = useLocation();

//   useEffect(() => {
//     loadErrorLogs();
//   }, []);

//   useEffect(() => {
//     setSelectedModule(null);
//     setModuleLogs([]);
//   }, [location.pathname]);

//   const loadErrorLogs = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const data = await fetchErrorLogs();
//       setErrorLogs(data);
//     } catch (err) {
//       setError("Failed to fetch logs.");
//     }
//     setLoading(false);
//   };

//   const handleViewDetails = async (module) => {
//     setSelectedModule(module);
//     try {
//       const data = await fetchLogsByModule(module);
//       setModuleLogs(data);

//       setTimeout(() => {
//         detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//       }, 300);
//     } catch (err) {
//       setError("Failed to fetch module logs.");
//     }
//   };

//   // ✅ Filter logs based on selected date range
//   const filterLogsByDate = (logs) => {
//     if (filter === "all") return logs;
//     const now = moment();
//     return logs.filter((log) => {
//       const logDate = moment(log.created_at);
//       if (filter === "today") {
//         return logDate.isSame(now, "day");
//       } else if (filter === "week") {
//         return logDate.isAfter(moment().subtract(7, "days"));
//       } else if (filter === "month") {
//         return logDate.isAfter(moment().subtract(30, "days"));
//       }
//       return true;
//     });
//   };

//   // ✅ Process data for Grouped View (Top 5 High-Risk Modules)
//   const topHighRiskModules = filterLogsByDate(errorLogs)
//     .filter(log => log.risk_range === "High")
//     .sort((a, b) => b.api_failed_count - a.api_failed_count)
//     .slice(0, 5);

//   const groupedData = {
//     labels: topHighRiskModules.map(log => log.module),
//     datasets: [
//       {
//         label: "High-Risk APIs",
//         data: topHighRiskModules.map(log => log.api_failed_count),
//         backgroundColor: ["#FF5733", "#FF8D1A", "#FFC300", "#E74C3C", "#C0392B"],
//       },
//     ],
//   };

//   // ✅ Process data for Heat Map View
//   const heatMapData = filterLogsByDate(errorLogs).map(log => ({
//     date: moment(log.created_at).format("YYYY-MM-DD"),
//     count: log.api_failed_count,
//   }));

//   return (
//     <div style={{ padding: "20px" }}>
//       <h2>🚨 Error Logs</h2>

//       <div style={{ marginBottom: "10px" }}>
//         <button
//           onClick={() => {
//             runPipeline();
//             setTimeout(loadErrorLogs, 3000);
//           }}
//           disabled={loading}
//           style={{ marginRight: "10px" }}
//         >
//           🔄 Refresh
//         </button>
//         <button onClick={loadErrorLogs} disabled={loading}>
//           📥 Get Logs
//         </button>
//       </div>

//       {/* ✅ Date Filter Dropdown */}
//       <div style={{ marginBottom: "10px" }}>
//         <label style={{ fontWeight: "bold", marginRight: "10px" }}>Filter by Date:</label>
//         <select onChange={(e) => setFilter(e.target.value)} value={filter}>
//           <option value="all">📅 All Logs</option>
//           <option value="today">📆 Today</option>
//           <option value="week">📅 Last 7 Days</option>
//           <option value="month">📆 Last 30 Days</option>
//         </select>
//       </div>

//       {loading && <p>Loading logs...</p>}
//       {error && <p style={{ color: "red" }}>⚠ {error}</p>}

//       {errorLogs.length === 0 && !loading ? (
//         <p>✅ No errors found! 😊</p>
//       ) : (
//         <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
//           {/* ✅ Scrollable Table */}
//           <div style={{ overflowX: "auto", maxWidth: "50%", border: "1px solid #ddd", padding: "10px" }}>
//             <p>✅ Showing {filterLogsByDate(errorLogs).length} error logs</p>
//             <table style={{ width: "50%", borderCollapse: "collapse", minWidth: "600px" }}>
//               <thead style={{ background: "#f8f9fa" }}>
//                 <tr>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Index</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Module</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Status</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Risk Range</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>API Failed Count</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Verb</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>View</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filterLogsByDate(errorLogs).map((log, index) => (
//                   <tr key={index} style={{ background: index % 2 === 0 ? "#fff" : "#f2f2f2" }}>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{index + 1}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.module}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.status}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.risk_range}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.api_failed_count}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.verb}</td>
//                     <td>
//                       <a
//                         href="#"
//                         onClick={(e) => {
//                           e.preventDefault();
//                           handleViewDetails(log.module);
//                         }}
//                         style={{ color: "blue", textDecoration: "none" }}
//                       >
//                         Click to View Details
//                       </a>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <div style={{ flex: "1", minWidth: "35%" }}>
//             <h3>⚠ Top 5 High-Risk Modules</h3>
//             <Bar data={groupedData} />
//             <h3>🔥 Heat Map View</h3>
//             <HeatMap value={heatMapData} />
//           </div>
//         </div>
//       )}

//       {selectedModule && (
//         <div ref={detailsRef} style={{ marginTop: "20px" }}>
//           <h3>📌 Details for {selectedModule}</h3>
//           <div style={{ overflowX: "auto", border: "1px solid #ddd", padding: "10px" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
//               <thead style={{ background: "#f8f9fa" }}>
//                 <tr>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Index</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Module</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>URI</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Status</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Risk Range</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Time</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Request Headers</th>
//                   <th style={{ padding: "6px", border: "1px solid #ddd" }}>Input</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {moduleLogs.map((log, index) => (
//                   <tr key={index}>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{index + 1}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.module}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.uri}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.status}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.risk_range}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.created_at}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.request_headers}</td>
//                     <td style={{ padding: "6px", border: "1px solid #ddd" }}>{log.input}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ErrorLogs;

import React, { useEffect, useState, useRef } from "react";
import { fetchErrorLogs, fetchLogsByModule, runPipeline, processAutomation } from "../services/api";
import { useLocation } from "react-router-dom";
import { Bar } from "react-chartjs-2"; 
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from "chart.js";
import HeatMap from "@uiw/react-heat-map";
import moment from "moment";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ErrorLogs() {
  const [errorLogs, setErrorLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleLogs, setModuleLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const detailsRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    loadErrorLogs();
  }, []);

  useEffect(() => {
    setSelectedModule(null);
    setModuleLogs([]);
  }, [location.pathname]);

  const loadErrorLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchErrorLogs();
      setErrorLogs(data);
      applyDateFilter(data);
    } catch (err) {
      setError("Failed to fetch logs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    applyDateFilter(errorLogs);
  }, [filter, errorLogs]);

  const applyDateFilter = (logs) => {
    if (!logs.length) return;
    const now = moment();
    const filtered = logs.filter((log) => {
      const logDate = moment(log.created_at);
      if (filter === "today") return logDate.isSame(now, "day");
      if (filter === "week") return logDate.isAfter(moment().subtract(7, "days"));
      if (filter === "month") return logDate.isAfter(moment().subtract(30, "days"));
      return true;
    });
    setFilteredLogs(filtered);
  };

  const handleViewDetails = async (module) => {
    setSelectedModule(module);
    try {
      const data = await fetchLogsByModule(module);
      setModuleLogs(data);

      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setError("Failed to fetch module logs.");
    }
  };

  // ✅ Process data for Grouped View (Top 5 High-Risk Modules)
  const topHighRiskModules = filteredLogs
    .filter(log => log.risk_range === "High")
    .sort((a, b) => b.api_failed_count - a.api_failed_count)
    .slice(0, 5);

  const groupedData = {
    labels: topHighRiskModules.map(log => log.module),
    datasets: [
      {
        label: "High-Risk APIs",
        data: topHighRiskModules.map(log => log.api_failed_count),
        backgroundColor: ["#FF5733", "#FF8D1A", "#FFC300", "#E74C3C", "#C0392B"],
      },
    ],
  };

  // ✅ Process data for Heat Map View
  const heatMapData = filteredLogs.map(log => ({
    date: moment(log.created_at).format("YYYY-MM-DD"),
    count: log.api_failed_count,
  }));

  const headerStyle = {
    padding: "8px",
    textAlign: "left",
    fontWeight: "bold",
    borderBottom: "2px solid #ddd",
    backgroundColor: "#e9ecef",
  };
  
  const cellStyle = {
    padding: "6px",
    border: "1px solid #ddd",
    textAlign: "left",
    whiteSpace: "nowrap", // Prevents long text breaking layout
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚨 Error Logs</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => { runPipeline(); setTimeout(loadErrorLogs, 3000); }} disabled={loading} style={{ marginRight: "10px" }}>
          🔄 Refresh
        </button>
        <button onClick={loadErrorLogs} disabled={loading}>
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
        <p>✅ No errors found! 😊</p>
      ) : (
        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ overflowX: "auto", maxWidth: "50%", border: "1px solid #ddd", padding: "10px" }}>
            <p>✅ Showing {filteredLogs.length} error logs</p>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th style={headerStyle}>Index</th>
                  <th style={headerStyle}>Module</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Risk Range</th>
                  <th style={headerStyle}>API Failed Count</th>
                  <th style={headerStyle}>Verb</th>
                  <th style={headerStyle}>View</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr key={index}>
                    <td style={cellStyle}>{index + 1}</td>
                    <td style={cellStyle}>{log.module}</td>
                    <td style={cellStyle}>{log.status}</td>
                    <td style={cellStyle}>{log.risk_range}</td>
                    <td style={cellStyle}>{log.api_failed_count}</td>
                    <td style={cellStyle}>{log.verb}</td>
                    <td>
                      <a href="#" onClick={(e) => { e.preventDefault(); handleViewDetails(log.module); }} style={{ color: "blue", textDecoration: "none" }}>
                        Click to View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ flex: "1", minWidth: "35%" }}>
            <h3>⚠ Top 5 High-Risk Modules</h3>
            <Bar data={groupedData} />
            <h3>🔥 Heat Map View</h3>
            <HeatMap value={heatMapData} />
          </div>
        </div>
      )}

      {/* ✅ Detailed Logs Section */}
      {selectedModule && (
        <div ref={detailsRef} style={{ marginTop: "20px", padding: "10px" }}>
          <h3>📌 Details for {selectedModule}</h3>
          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px", backgroundColor: "#fff", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead style={{ background: "#f8f9fa", position: "sticky", top: "0", zIndex: "2", borderBottom: "2px solid #ddd" }}>
                <tr>
                  <th style={headerStyle}>Index</th>
                  <th style={headerStyle}>Module</th>
                  <th style={headerStyle}>URI</th>
                  <th style={headerStyle}>Status</th>
                  <th style={headerStyle}>Risk Range</th>
                  <th style={headerStyle}>Time</th>
                  <th style={headerStyle}>Request Headers</th>
                  <th style={headerStyle}>Input</th>
                </tr>
              </thead>
              <tbody>
                {moduleLogs.map((log, index) => (
                  <tr key={index}>
                    <td style={cellStyle}>{index + 1}</td>
                    <td style={cellStyle}>{log.module}</td>
                    <td style={cellStyle}>{log.uri}</td>
                    <td style={cellStyle}>{log.status}</td>
                    <td style={cellStyle}>{log.risk_range}</td>
                    <td style={cellStyle}>{log.created_at}</td>
                    <td style={cellStyle}>{log.request_headers}</td>
                    <td style={cellStyle}>{log.input}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErrorLogs;

