function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }
  return "http://localhost:5000/api";
}

const API_URL = getApiUrl();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("hms_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Parse response
  const contentType = response.headers.get("content-type");
  const data = (contentType && contentType.includes("application/json"))
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMsg = (data && data.message) || response.statusText || "Request failed";
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  get: (endpoint, headers = {}) => request(endpoint, { method: "GET", headers }),
  post: (endpoint, body, headers = {}) => request(endpoint, { method: "POST", body, headers }),
  put: (endpoint, body, headers = {}) => request(endpoint, { method: "PUT", body, headers }),
  delete: (endpoint, headers = {}) => request(endpoint, { method: "DELETE", headers }),
};

export default api;
