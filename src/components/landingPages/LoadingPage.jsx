import React from 'react';
import './LoadingPage.css';
import logo from '../../images/logo.png'; // Adjust path as needed

const LoadingPage = () => {
    return (
        <main className="landing-boggart-page">
            <div className="boggart-container">
                <header className="form-header">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="welcome-section">
                    <h2 className="welcome-title">In a few moments you will meet your pain</h2>
                </section>
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        </main>
    );
};

export default LoadingPage;