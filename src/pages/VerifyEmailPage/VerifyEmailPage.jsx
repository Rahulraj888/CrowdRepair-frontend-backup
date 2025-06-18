import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
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

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendErr, setResendErr] = useState("");
  const [resendDone, setResendDone] = useState(false); // ✅ New state
  const calledOnce = useRef(false);
  const token = new URLSearchParams(useLocation().search).get("token");

  useEffect(() => {
    if (calledOnce.current) return;
    calledOnce.current = true;

    (async () => {
      try {
        await authService.verifyEmail(token);
        setMessage("Email successfully verified! You can now log in.");
        setStatus("success");
      } catch (err) {
        const errMsg =
          err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.msg ||
          err.message ||
          "Token is invalid or expired.";
        setMessage(errMsg);
        setStatus("error");
      }
    })();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendMsg("");
    setResendErr("");
    // setMessage("");      
    setStatus("");       
  
    try {
      const { msg } = await authService.resendVerification(email.trim());
      setResendMsg(msg);
      setResendDone(true);
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.msg ||
        err.message;
      setResendErr(msg);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="shadow w-100" style={{ maxWidth: "900px" }}>
        <Row className="g-0 flex-column flex-md-row">
          {/* Left Image */}
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

          {/* Right Panel */}
          <Col
            xs={12}
            md={6}
            className="d-flex align-items-center justify-content-center p-4"
          >
            <div className="w-100" style={{ maxWidth: "360px" }}>
              <h2 className="mb-3">Email Verification</h2>

              {status === "loading" && (
                <div className="d-flex flex-column align-items-center text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">
                    Verifying your email, please wait…
                  </p>
                </div>
              )}

              {status === "success" && (
                <>
                  <Alert variant="success" className="text-center">
                    {message}
                  </Alert>
                  <div className="d-grid">
                    <Link to="/login">
                      <Button variant="primary" className="w-100">
                        Go to Login
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {status === "error" && message && (
                <Alert variant="danger">{message}</Alert>
              )}

              {status === "error" &&
                message.toLowerCase().includes("expired") &&
                !resendDone && (
                  <Form onSubmit={handleResend}>
                    <Form.Group className="mb-3" controlId="formEmail">
                      <Form.Label>
                        Enter your email to resend verification:
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setResendMsg("");
                          setResendErr("");
                        }}
                        placeholder="you@example.com"
                        required
                      />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="w-100" disabled={resendDone}>
                      {resendDone ? "Verification Sent" : "Resend Email"}
                    </Button>
                  </Form>
                )}

              {/* Success message after resend */}
              {resendMsg && (
                <Alert className="mt-3" variant="success">
                  {resendMsg}
                </Alert>
              )}

              {/* Resend error */}
              {resendErr && (
                <Alert className="mt-3" variant="danger">
                  {resendErr}
                </Alert>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}