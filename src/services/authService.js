import api from './api';

// Register a new user
async function register({ name, email, mobile, password }) {
  const { data } = await api.post('/register', { name, email, mobile, password });
  return data;
}

// Verify email
async function verifyEmail(token) {
  const { data } = await api.get(`/verify-email?token=${encodeURIComponent(token)}`);
  return data;
}

// Login user
async function login(email, password) {
  const { data } = await api.post('/login', { email, password });
  return data;
}

// Request password reset
async function forgotPassword(email) {
  const { data } = await api.post('/forgot-password', { email });
  return data;
}

// Reset password
async function resetPassword(token, password) {
  const { data } = await api.post(
    `/reset-password?token=${encodeURIComponent(token)}`,
    { password }
  );
  return data;
}

// src/services/authService.js
async function resendVerification(email) {
  const { data } = await api.post('/resend-verification', { email });
  return data;
}

//update profile details
async function updateProfile(data) {
  const { data: user } = await api.put('/me', data);
  return user;
}

//change password
async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.post('/change-password', { currentPassword, newPassword });
  return data;
}

// Get current user
async function getCurrentUser() {
  const { data } = await api.get('/me');
  return data;
}
//store infrastructure issues details
async function submitReport(formData)
{
  console.log('📤 Submitting report with the following data:');
    
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // Simulate a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Mock report submitted!');
        resolve({ msg: 'Mock submission successful!' });
      }, 1000);
    });
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
  submitReport
};