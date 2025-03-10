import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000"; // FastAPI backend

export const fetchErrorLogs = async () => {
  return axios.get(`${API_BASE_URL}/error_logs/`).then((res) => res.data);
};

export const fetchLogsByModule = async (module) => {
  return axios.get(`${API_BASE_URL}/error_logs/${module}`).then((res) => res.data);
};

export const fetchAllLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs/`);
      console.log("✅ fetchAllLogs Response:", response.data); // 🔍 Debugging API response
      return response.data; // ✅ Ensure it returns an array
    } catch (error) {
      console.error("❌ Error fetching logs:", error);
      return []; // ✅ Return empty array to prevent crashes
    }
  };

export const runPipeline = async () => {
  return axios.post(`${API_BASE_URL}/run_pipeline/`).then((res) => res.data);
};

export const processAutomation = async () => {
  return axios.post(`${API_BASE_URL}/process-automation/`).then((res) => res.data);
};
