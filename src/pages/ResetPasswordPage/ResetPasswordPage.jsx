import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/authService";
import styles from "./ResetPasswordPage.module.css";
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await authService.resetPassword(token, password);
      setMessage("Password has been reset. You can now log in.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const resp = err.response?.data;
      const msg =
        resp?.errors?.[0]?.msg ||
        resp?.msg ||
        err.message ||
        "Failed to reset password";
      setError(msg);
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
            <div className={styles.container}>
              <h2>Reset Password</h2>
              {message && <p className={styles.success}>{message}</p>}
              {error && <p className={styles.error}>{error}</p>}
              <form onSubmit={handleSubmit} className={styles.form}>
                <label>
                  New Password:
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                <button type="submit">Set New Password</button>
              </form>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}