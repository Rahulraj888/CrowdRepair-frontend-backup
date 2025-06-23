import api from './api';

// Register a new user
async function register({ name, email, mobile, password }) {
  const { data } = await api.post('/auth/register', { name, email, mobile, password });
  return data;
}

// Verify email
async function verifyEmail(token) {
  const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  return data;
}

// Login user
async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  // on successful login you might store `data.token` into localStorage here
  return data;
}

// Request password reset
async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

// Reset password
async function resetPassword(token, password) {
  const { data } = await api.post(
    `/auth/reset-password?token=${encodeURIComponent(token)}`,
    { password }
  );
  return data;
}

// Resend verification
async function resendVerification(email) {
  const { data } = await api.post('/auth/resend-verification', { email });
  return data;
}

// Update profile details
async function updateProfile(updates) {
  const { data } = await api.put('/auth/me', updates);
  return data;
}

// Change password
async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}

// Get current user
async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

export default {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  resendVerification,
  getCurrentUser,
  updateProfile,
  changePassword,
};
