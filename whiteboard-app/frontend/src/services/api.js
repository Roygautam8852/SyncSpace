import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth Services ───
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  googleLogin: (data) => api.post("/auth/google", data),
};

// ─── Room Services ───
export const roomService = {
  createRoom: (data) => api.post("/rooms/create", data),
  joinRoom: (data) => api.post("/rooms/join", data),
  getUserRooms: () => api.get("/rooms"),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  saveCanvas: (roomId, canvasData) => api.put(`/rooms/${roomId}/canvas`, { canvasData }),
  leaveRoom: (roomId) => api.post(`/rooms/${roomId}/leave`),
  uploadFile: (roomId, formData) => api.post(`/rooms/${roomId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
};

// ─── AI Services ───
export const aiService = {
  generateImage: (prompt) => api.post("/ai/generate-image", { prompt }),
  agentAction: (message, context) => api.post("/ai/agent-action", { message, context }),
};

export default api;
