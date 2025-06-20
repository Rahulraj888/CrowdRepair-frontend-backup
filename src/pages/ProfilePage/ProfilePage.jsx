import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import authService from '../../services/authService';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', mobile: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        mobile: user.mobile || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setError('');
    setSuccess('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
  
    const trimmedMobile = form.mobile.trim();
  
    if (trimmedMobile && !/^\d{10}$/.test(trimmedMobile)) {
      setError("Mobile number must be exactly 10 digits.");
      setSaving(false);
      return;
    }
  
    try {
      const updated = await authService.updateProfile({
        name: form.name.trim(),
        mobile: trimmedMobile,
        bio: form.bio.trim()
      });
      setUser(updated);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.msg ||
        err.message ||
        'Failed to update profile.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };  

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">My Profile</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form
        onSubmit={handleSubmit}
        className="d-flex flex-column mx-auto"
        style={{ maxWidth: 600 }}
      >
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-control"
            value={user.email}
            disabled
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mobile</label>
          <input
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="form-control"
            rows={3}
            maxLength={500}
            placeholder="Tell us a little about yourself (optional)"
          />
          <div className="form-text">{form.bio.length}/500 characters</div>
        </div>

        <div className="mb-4">
          <label className="form-label">Password</label>
          <div>
            <Link to="/change-password">Change your password</Link>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary align-self-center px-5"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
