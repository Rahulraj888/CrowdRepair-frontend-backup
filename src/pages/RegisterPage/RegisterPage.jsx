import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import styles from "./RegisterPage.module.css";
import registerImage from "../../assets/register.png";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }
    if (!termsAgreed) {
      alert("You must agree to the terms and conditions.");
      return;
    }
    // Submit logic here
  };

  return (
    <Container fluid className="px-0 mx-0">
      <Row className="g-0 align-items-center" style={{ minHeight: "100vh" }}>
        {/* Left Image Section */}
        <Col
          md={6}
          className="d-none d-md-flex justify-content-center align-items-center"
          style={{ padding: 0, margin: 0 }}
        >
          <img
  src={registerImage}
  alt="Register"
  style={{
    height: "100vh",
    width: "100vw",
    objectFit: "cover",
    display: "block",
    margin: "0",
    padding: "0",
    border: "none",
  }}
/>

        </Col>

        {/* Right Form Section */}
        <Col
          xs={12}
          md={6}
          className="d-flex justify-content-center align-items-center"
          style={{ padding: 0, margin: 0 }}
        >
          <div style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <h2 className="mb-3 text-center">Welcome to Civic Reporter!</h2>
            <p className="text-muted text-center mb-4">
              Let’s create your account and get started.
            </p>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formName">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formConfirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm Password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label={
                    <>
                      I agree to the{" "}
                      <a href="#" className="text-primary">
                        Terms and Conditions
                      </a>
                    </>
                  }
                  checked={termsAgreed}
                  onChange={() => setTermsAgreed(!termsAgreed)}
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100">
                Sign Up
              </Button>

              <p className="mt-3 text-center">
                Already have an account? <Link to="/login">Log In</Link>
              </p>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
