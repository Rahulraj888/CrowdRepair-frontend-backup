import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import logo from "/logo.jpeg";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      return setError("New passwords do not match");
    }
    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess("Password changed! Redirecting to profile…");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.msg ||
        err.message ||
        "Failed to change password";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="shadow w-100" style={{ maxWidth: "900px" }}>
        <Row className="g-0 flex-column flex-md-row">
          <Col xs={12} md={6}>
            <img
              src={logo}
              alt="Login Illustration"
              className="img-fluid h-100"
              style={{
                objectFit: "cover",
                borderTopLeftRadius: "0.5rem",
                borderBottomLeftRadius: "0.5rem",
                height: "100%",
                minHeight: "300px",
              }}
            />
          </Col>
          <Col
            xs={12}
            md={6}
            className="d-flex align-items-center justify-content-center p-4"
          >
            <div className="container py-4">
              <h2 className="mb-4 text-center">Change Password</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form
                onSubmit={handleSubmit}
                className="d-flex flex-column mx-auto"
                style={{ maxWidth: 400 }}
              >
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    name="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    className="form-control"
                    required
                    minLength={6}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Change Password"}
                </button>
              </form>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
