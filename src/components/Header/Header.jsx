// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpg';
 // Replace with your actual logo path

function Header() {
  return (
    <header className="shadow-sm">
      <nav className="navbar navbar-expand-lg navbar-light bg-white px-4">
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src={logo} alt="Civic Reporter" style={{ height: '30px', marginRight: '10px' }} />
            <span className="fw-bold text-primary">Civic Reporter</span>
          </Link>

          {/* Toggler for mobile */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Nav links */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/features">Features</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/about">About Us</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/feedback">Feedback</Link>
              </li>
              <li className="nav-item ms-3">
                <Link className="btn btn-primary px-4" to="/register">Sign Up</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
