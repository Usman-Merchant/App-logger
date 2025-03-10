// import React from "react";
// import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
// import ErrorLogs from "./pages/ErrorLogs";
// import ApiDetails from "./pages/ApiDetails";

// function App() {
//   return (
//     <Router>
//       <div className="container">
//         <h1>📊 API Logger Dashboard</h1>
//         <nav>
//           <Link to="/">Error Logs</Link> | <Link to="/api-details">API Details</Link>
//         </nav>
//         <Routes>
//           <Route path="/" element={<ErrorLogs />} />
//           <Route path="/api-details" element={<ApiDetails />} />
//         </Routes>
//       </div>
//     </Router>
//   );
// }

// export default App;

import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom";
import ErrorLogs from "./pages/ErrorLogs"; // Ensure this file exists
import ApiDetails from "./pages/ApiDetails"; // Ensure this file exists

function App() {
  const [activeTab, setActiveTab] = useState("error-metrics");

  return (
    <Router>
      <div style={{ display: "flex" }}>
        {/* ✅ Sidebar Navigation */}
        <nav
          style={{
            width: "200px",
            height: "100vh",
            background: "#282c34",
            padding: "15px",
            color: "white",
            position: "fixed",
            left: 0,
            top: 0,
            overflowY: "auto",
          }}
        >
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>📊 Highlands Brain</h2>

          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>
              <Link
                to="/error-metrics"
                onClick={() => setActiveTab("error-metrics")}
                style={{
                  display: "block",
                  padding: "10px",
                  color: activeTab === "error-metrics" ? "#61dafb" : "white",
                  textDecoration: "none",
                  fontWeight: activeTab === "error-metrics" ? "bold" : "normal",
                }}
              >
                🚨 Error Metrics
              </Link>
            </li>
          </ul>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>
              <Link
                to="/api-details"
                onClick={() => setActiveTab("api-details")}
                style={{
                  display: "block",
                  padding: "10px",
                  color: activeTab === "api-details" ? "#61dafb" : "white",
                  textDecoration: "none",
                  fontWeight: activeTab === "api-details" ? "bold" : "normal",
                }}
              >
                📝 API Details
              </Link>
            </li>
          </ul>
        </nav>

        {/* ✅ Main Content Area */}
        <div style={{ marginLeft: "250px", padding: "20px", width: "100%" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/error-metrics" />} />
            <Route path="/error-metrics" element={<ErrorLogs />} />
            <Route path="/api-details" element={<ApiDetails />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
