import api from './api';

// Submits a new report via multipart form data
export async function submitReport(formData) {
  const { data } = await api.post('/reports', formData);
  return data;
}

// Fetch all reports (optionally by status)
export async function getReports(status = 'all') {
  const { data } = await api.get(`/reports?status=${status}`);
  return data;
}