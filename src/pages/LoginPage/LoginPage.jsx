import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";
import { AuthContext } from "../../context/AuthContext";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import loginImage from "../../assets/login.jpg";
import Cloud from "../../assets/cloud.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendErr, setResendErr] = useState("");
  const [resendDone, setResendDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendMsg("");
    setResendErr("");
    setResendDone(false);
    setLoading(true);

    try {
      const { token } = await authService.login(email.trim(), password.trim());
      localStorage.setItem("token", token);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      navigate("/dashboard");
    } catch (err) {
      const resp = err.response?.data;
      const msg = resp?.errors?.[0]?.msg || resp?.msg || err.message || "Login failed";
      setError(msg);
      if (msg.toLowerCase().includes("verify")) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setResendErr("");
    setResendDone(false);
    try {
      const { msg } = await authService.resendVerification(email.trim());
      setResendMsg(msg);
      setError("")
      setResendDone(true);
    } catch (err) {
      const resp = err.response?.data;
      const msg =
        resp?.errors?.[0]?.msg || resp?.msg || err.message || "Resend failed";
      setResendErr(msg);
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-2"
    >
      <Card className="shadow w-100" style={{ maxWidth: "900px" }}>
        <Row className="g-0 flex-column flex-md-row">
          {/* Left-side image */}
          <Col xs={12} md={6} className="p-0">
            <img
              src={loginImage}
              alt="Login Illustration"
              className="img-fluid w-100"
              style={{
                height: "100%",
                objectFit: "cover",
                borderRadius: "8px 0 0 8px",
                minHeight: "250px",
              }}
            />
          </Col>

          {/* Form section */}
          <Col
            xs={12}
            md={6}
            className="d-flex align-items-center justify-content-center p-4"
          >
            <div className="w-100" style={{ maxWidth: "350px", padding: "1.5rem 1rem" }}>
              <div className="text-center mb-3">
                <img src={Cloud} alt="Cloud Icon" width="50" className="mb-2" />
                <h3 className="fw-bold">Welcome Back</h3>
                <p className="text-muted">Log in to your Mobile Appz account.</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              {showResend && (
                <div className="mb-3">
                  {!resendDone && (
                    <>
                      <p>Didn't receive a verification email?</p>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleResend}
                        disabled={resendDone}
                      >
                        Resend Verification Email
                      </Button>
                    </>
                  )}
                  {resendMsg && (
                    <Alert variant="success" className="mt-2">
                      {resendMsg}
                    </Alert>
                  )}
                  {resendErr && (
                    <Alert variant="danger" className="mt-2">
                      {resendErr}
                    </Alert>
                  )}
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="name@example.com"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Password"
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <small className="text-muted">Don't have an account?</small>
                <br />
                <Link to="/register">Sign up here</Link>
                <br />
                <p className="mt-2">
                  <Link to="/forgot-password">Forgot password?</Link>
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}