import React from 'react';
import './LoadingPage.css';
import logo from '../../images/logo.png'; // Adjust path as needed

const LoadingPage = () => {
    return (
        <main className="loading-boggart-page">
            <div className="loading-boggart-container">
                <header className="form-loading-header">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="loading-content">
                    <h2 className="loading-message">In a few moments you will meet your pain</h2>
                    <div className="loading-spinner"></div>
                </section>
            </div>
        </main>
    );
};

export default LoadingPage;