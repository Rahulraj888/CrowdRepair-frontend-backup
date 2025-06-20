import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-dark text-white pt-4 pb-3">
      <div className="container">
        <div className="row align-items-center text-center text-md-start">

          {/* Logo and Brand */}
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start">
              <img
                src="/logo.jpeg"
                alt="Logo"
                style={{ width: '32px', height: '32px', marginRight: '10px' }}
              />
              <span className="fw-bold fs-5">Mobile Appz</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="col-md-4 mb-3 mb-md-0">
            <ul className="list-inline mb-0">
              <li className="list-inline-item me-3">
                <Link to="/" className="text-white text-decoration-none">Home</Link>
              </li>
              <li className="list-inline-item me-3">
                <Link to="/about" className="text-white text-decoration-none">About Us</Link>
              </li>
              <li className="list-inline-item">
                <Link to="/contact" className="text-white text-decoration-none">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Social Icons */}
          <div className="col-md-4 text-center text-md-end">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-white me-3">
              <FaTwitter />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-white me-3">
              <FaFacebookF />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-white">
              <FaLinkedinIn />
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}
