import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  // Form state with confirmPassword (no dob)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validation function
  const validate = () => {
    const newErrors = {};
    const nameRegex = /^[A-Za-z\s-]+$/;
    const phoneRegex = /^(\+?1\s?)?(\d{3})[\s-]?(\d{3})[\s-]?(\d{4})$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    } else if (!nameRegex.test(formData.fullName)) {
      newErrors.fullName = "Only letters, spaces, and hyphens allowed";
    }

    // Phone Number
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Enter valid Canadian phone number (e.g. 647-123-4567)";
    }

    // Email
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // Password
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password must include uppercase, lowercase, number, symbol, and be at least 8 characters";
    }

    // Confirm Password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Prepare payload (without confirmPassword)
      const { confirmPassword, ...payload } = formData;

      await axios.post('http://localhost:5000/api/auth/register', payload);
      alert('Registered successfully!');
      navigate('/');
    } catch (err) {
      alert('Registration failed.');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <form onSubmit={handleRegister} className="p-4 shadow bg-light rounded w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Register</h2>

        {/* Full Name */}
        <input
          className="form-control mb-2"
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
        />
        {errors.fullName && <div className="text-danger mb-2">{errors.fullName}</div>}

        {/* Phone */}
        <input
          className="form-control mb-2"
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
        />
        {errors.phone && <div className="text-danger mb-2">{errors.phone}</div>}

        {/* Email */}
        <input
          className="form-control mb-2"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <div className="text-danger mb-2">{errors.email}</div>}

        {/* Password */}
        <input
          className="form-control mb-2"
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <div className="text-danger mb-2">{errors.password}</div>}

        {/* Confirm Password */}
        <input
          className="form-control mb-2"
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        {errors.confirmPassword && <div className="text-danger mb-2">{errors.confirmPassword}</div>}

        <button className="btn btn-success w-100" type="submit">Register</button>
        <p className="text-center mt-3">
          Already have an account? <a href="/">Login</a>
        </p>
      </form>
    </div>
  );
}

export default Register;
