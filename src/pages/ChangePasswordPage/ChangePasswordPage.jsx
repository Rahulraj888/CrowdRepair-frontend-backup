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

// regex for password strength: at least 6 chars, 1 uppercase, 1 lowercase, 1 digit
const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

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
    setError("");
    setSuccess("");

    // 1. new password strength
    if (!pwdRegex.test(form.newPassword)) {
      setError(
        "New password must be at least 6 characters and include uppercase, lowercase, and a number"
      );
      return;
    }

    // 2. confirm match
    if (form.newPassword !== form.confirm) {
      setError("New passwords do not match");
      return;
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
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form
                onSubmit={handleSubmit}
                className="d-flex flex-column mx-auto"
                style={{ maxWidth: 400 }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    name="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}"
                    title="At least 6 characters, including uppercase, lowercase, and a number"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    name="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving…" : "Change Password"}
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
