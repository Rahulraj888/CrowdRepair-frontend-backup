import api from './api';

// Dashboard stats
export function getAdminDashboard() {
  return api.get('/admin/dashboard').then(res => res.data);
}

// List reports
export function listReports({ status, type, page, limit }) {
  return api
    .get('/admin/reports', { params: { status, type, page, limit } })
    .then(res => res.data);
}

// Update report status
export function updateReportStatus(id, status) {
  return api.patch(`/admin/reports/${id}/status`, { status }).then(res => res.data);
}
