// src/api/services.js
import api from "./client";

const data = (p) => p.then((r) => r.data);

export const authApi = {
  login: (body) => data(api.post("/auth/login", body)),
  me: () => data(api.get("/auth/me")),
  changePassword: (body) => data(api.post("/auth/change-password", body)),
};

export const dashboardApi = { get: () => data(api.get("/dashboard")) };

export const candidatesApi = {
  list: (params) => data(api.get("/candidates", { params })),
  get: (id) => data(api.get(`/candidates/${id}`)),
  create: (body) => data(api.post("/candidates", body)),
  update: (id, body) => data(api.put(`/candidates/${id}`, body)),
  setStage: (id, stage) => data(api.patch(`/candidates/${id}/stage`, { stage })),
  addNote: (id, text) => data(api.post(`/candidates/${id}/notes`, { text })),
  remove: (id) => data(api.delete(`/candidates/${id}`)),
};

export const jobsApi = {
  list: (params) => data(api.get("/jobs", { params })),
  get: (id) => data(api.get(`/jobs/${id}`)),
  create: (body) => data(api.post("/jobs", body)),
  update: (id, body) => data(api.put(`/jobs/${id}`, body)),
  remove: (id) => data(api.delete(`/jobs/${id}`)),
};

export const interviewsApi = {
  list: (params) => data(api.get("/interviews", { params })),
  stats: () => data(api.get("/interviews/stats")),
  create: (body) => data(api.post("/interviews", body)),
  update: (id, body) => data(api.put(`/interviews/${id}`, body)),
  setStatus: (id, status) => data(api.patch(`/interviews/${id}/status`, { status })),
  remove: (id) => data(api.delete(`/interviews/${id}`)),
};

export const notificationsApi = {
  list: () => data(api.get("/notifications")),
  markAllRead: () => data(api.post("/notifications/read")),
};

const listCrud = (kind) => ({
  create: (body) => data(api.post(`/settings/${kind}`, body)),
  update: (id, body) => data(api.put(`/settings/${kind}/${id}`, body)),
  remove: (id) => data(api.delete(`/settings/${kind}/${id}`)),
  reorder: (ids) => data(api.put(`/settings/${kind}/reorder`, { ids })),
});

export const settingsApi = {
  get: () => data(api.get("/settings")),
  updateProfile: (body) => data(api.put("/settings/profile", body)),
  updateCompany: (body) => data(api.put("/settings/company", body)),
  updateNotifications: (body) => data(api.put("/settings/notifications", body)),
  setIntegration: (key, connected) => data(api.put(`/settings/integrations/${key}`, { connected })),
  addUser: (body) => data(api.post("/settings/users", body)),
  removeUser: (id) => data(api.delete(`/settings/users/${id}`)),
  stages: listCrud("stages"),
  sources: listCrud("sources"),
};
