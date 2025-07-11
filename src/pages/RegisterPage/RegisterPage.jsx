import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";
import { Container, Row, Col, Form, Button, Alert, Card } from "react-bootstrap";
import registerImage from "../../assets/register.jpg";
import Cloud from "../../assets/cloud.jpg";

// regex for validating most email addresses
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // validate email on every change
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setError("");
    setEmailError(
      val && !emailRegex.test(val)
        ? "Please enter a valid email address"
        : ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // email match
    if (emailError || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address before submitting.");
      setLoading(false);
      return;
    }

    // password match
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // mobile validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile.trim())) {
      setError("Mobile number must be exactly 10 digits");
      setLoading(false);
      return;
    }

    // password strength
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!pwdRegex.test(password)) {
      setError("Password must be at least 6 characters and include uppercase, lowercase, and a number");
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
      });
      setSuccess("Registration successful! Please verify your email before logging in.");
    } catch (err) {
      const resp = err.response?.data;
      const msg = resp?.errors?.[0]?.msg || resp?.msg || err.message || "Failed to Register Account";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-2"
    >
      <Card className="shadow w-100" style={{ maxWidth: "900px" }}>
        <Row className="g-0 flex-column flex-md-row">
          {/* Left Image */}
          <Col
            xs={12}
            md={6}
            className="p-0 position-relative d-flex flex-column"
            style={{ minHeight: "300px" }}
          >
            <img
              src={registerImage}
              alt="Register"
              className="img-fluid h-100 w-100"
              style={{
                objectFit: "cover",
                flex: 1,
                borderRadius: "8px 0 0 8px",
              }}
            />
          </Col>

          {/* Form Section */}
          <Col
            xs={12}
            md={6}
            className="d-flex align-items-center justify-content-center p-4"
          >
            <div className="w-100" style={{ maxWidth: "350px", padding: "1.5rem 1rem" }}>
              <div className="text-center mb-3">
                <img src={Cloud} alt="Cloud Icon" width="50" className="mb-2" />
                <h4 className="fw-bold">Welcome to Mobile Appz!</h4>
                <p className="text-muted">Let's create your account and get started.</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success ? (
                <>
                  <Alert variant="success">{success}</Alert>
                  <p className="text-center">
                    Already verified? <Link to="/login">Log in here</Link>
                  </p>
                </>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      required
                    />
                  </Form.Group>

                  {/* Email with regex validation */}
                  <Form.Group controlId="formEmail" className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      title="Enter a valid email address"
                      isInvalid={!!emailError}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {emailError}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* Mobile */}
                  <Form.Group className="mb-3">
                    <Form.Label>Mobile</Form.Label>
                    <Form.Control
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        setError("");
                      }}
                      pattern="\d{10}"
                      title="Enter exactly 10 digits"
                      required
                    />
                  </Form.Group>

                  {/* Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}"
                      title="At least 6 characters, including uppercase, lowercase, and a number"
                      required
                    />
                  </Form.Group>

                  {/* Confirm Password */}
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setError("");
                      }}
                      required
                    />
                  </Form.Group>

                  {/* Terms & Conditions */}
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label={
                        <span>
                          I agree to the <a href="#">Terms and Conditions</a>
                        </span>
                      }
                      required
                    />
                  </Form.Group>

                  {/* Submit */}
                  <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                    {loading ? "Registering..." : "Sign Up"}
                  </Button>

                  <div className="text-center mt-2">
                    Already have an account? <Link to="/login">Log In</Link>
                  </div>
                </Form>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
