// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-dark text-white pt-4 pb-3 mt-5">
      <div className="container">
        <div className="row align-items-center text-center text-md-start">
          
          {/* Logo and Brand */}
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start">
              {/* You can replace the emoji with an actual logo if you have one */}
              <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🌈</span>
              <span className="fw-bold fs-5">Civic Reporter</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="col-md-4 mb-3 mb-md-0">
            <ul className="list-inline mb-0">
              <li className="list-inline-item me-3">
                <Link to="/" className="text-white text-decoration-none">Home</Link>
              </li>
              <li className="list-inline-item me-3">
                <Link to="/features" className="text-white text-decoration-none">Features</Link>
              </li>
              <li className="list-inline-item me-3">
                <Link to="/about" className="text-white text-decoration-none">About Us</Link>
              </li>
              <li className="list-inline-item me-3">
                <Link to="/feedback" className="text-white text-decoration-none">Feedback</Link>
              </li>
              <li className="list-inline-item">
                <Link to="/contact" className="text-white text-decoration-none">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Social Icons */}
          <div className="col-md-4 text-center text-md-end">
            <a href="https://twitter.com" className="text-white me-3">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://facebook.com" className="text-white me-3">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://linkedin.com" className="text-white">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;
