import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import logo from '../../images/logo.png'; // Adjust path as needed
import PrimaryButton from '../generalComponents/PrimaryButton'; // Import the reusable button component

const LandingPage = () => {
    const navigate = useNavigate();

    const handleStartClick = () => {
        // Navigate to the IAS page
        navigate('/questionnaire-before');
    };

    return (
        <main className="landing-page">
            <div className="landing-container">
                <header className="logo-container">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="welcome-section">
                    <h2 className="welcome-title">Welcome to the Boggart project!</h2>

                    <p className="welcome-description">
                        As part of a research study, you will first complete a series of
                        questionnaires that will contribute to our understanding of chronic pain.
                        Following this, you will experience an interactive session designed to
                        explore and address your chronic pain in a unique and innovative way
                    </p>
                </section>

                <section className="cta-section">
                    <PrimaryButton text="Let's Start" onClick={handleStartClick} />
                </section>
            </div>
        </main>
    );
};

export default LandingPage;