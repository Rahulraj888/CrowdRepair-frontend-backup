import api from './api';

// Dashboard stats
export function getAdminDashboard() {
  return api.get('/admin/dashboard').then(res => res.data);
}

// List reports
export function listReports({ status, type, page, limit, sortBy, sortOrder }) {
  return api
    .get('/admin/reports', {
      params: { status, type, page, limit, sortBy, sortOrder }
    })
    .then(res => res.data);
}

// Update report status
export function updateReportStatus(id, status, rejectReason) {
  return api.patch(`/admin/reports/${id}/status`, { status, rejectReason }).then(res => res.data);
}
