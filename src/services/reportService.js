import api from './api';

// Fetch reports with optional filters
export async function getReports({ status = 'all', type = 'all' } = {}) {
  const { data } = await api.get(`/reports?status=${status}&type=${type}`);
  return data;
}

// Delete a report
export async function deleteReport(id) {
  const { data } = await api.delete(`/reports/${id}`);
  return data;
}

// (Optional) fetch a single report for editing
export async function getReportById(id) {
  const { data } = await api.get(`/reports/${id}`);
  return data;
}

// Submit a new report (FormData)
export async function submitReport(formData) {
  const { data } = await api.post('/reports', formData);
  return data;
}

// Update an existing report (only pending)
export async function updateReport(id, formData) {
  const { data } = await api.put(`/reports/${id}`, formData);
  return data;
}

// Upvote a report
export async function upvoteReport(reportId) {
  const { data } = await api.post(`/reports/${reportId}/upvote`);
  return data.upvotes;
}

// Get comments for a report
export async function getComments(reportId) {
  const { data } = await api.get(`/reports/${reportId}/comments`);
  return data;
}

// Add a comment to a report
export async function addComment(reportId, text) {
  const { data } = await api.post(`/reports/${reportId}/comments`, { text });
  return data;
}