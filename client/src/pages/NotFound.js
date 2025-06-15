// src/pages/NotFound.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <h1 className="notfound-title">404</h1>
        <h2 className="notfound-subtitle">Page Not Found</h2>
        <p className="notfound-description">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
          <Link to="/search" className="btn-secondary">
            Search Transit
          </Link>
        </div>

        <div className="notfound-suggestions">
          <h3>You might be looking for:</h3>
          <ul>
            <li><Link to="/">Dashboard - Weather & Map overview</Link></li>
            <li><Link to="/search">Search - Find transit options</Link></li>
            <li><Link to="/map">Map - Interactive transit map</Link></li>
            <li><Link to="/weather">Weather - Detailed weather information</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NotFound;