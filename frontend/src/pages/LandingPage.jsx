import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import heroImage from '../assets/hero-image.png';

const LandingPage = () => {
    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="logo">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 5L35 12.5V27.5L20 35L5 27.5V12.5L20 5Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 12V28" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 20H28" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>SENTINEL GEO</span>
                </div>
                <div className="nav-links">
                    <a href="#company">Company</a>
                    <a href="#solutions">Solutions</a>
                    <a href="#blog">Blog</a>
                    <a href="#contact">Contact</a>
                </div>
                <div className="nav-auth">
                    <Link to="/login" className="login-btn">Log in</Link>
                    <Link to="/signup" className="demo-btn">Book Demo</Link>
                </div>
            </nav>

            <main className="hero-section">
                <div className="hero-content">
                    <h1>Seamless<br />Location<br />Intelligence</h1>
                    <p>Advanced geofencing for security and analytics.</p>
                    <div className="hero-ctas">
                        <Link to="/signup" className="get-started-btn">Get Started</Link>
                        <Link to="/signup" className="book-demo-btn">Book Demo</Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <img src={heroImage} alt="Sentinel Geo Visual" className="floating-asset" />
                    <div className="glow-effect"></div>
                </div>
            </main>

            <footer className="landing-footer">
                <p>&copy; 2026 Sentinel Geo. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
