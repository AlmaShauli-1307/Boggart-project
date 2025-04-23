import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPageBoggart.css';
import logo from '../../images/logo.png'; // Adjust path as needed
import PrimaryButton from '../generalComponents/PrimaryButton'; // Import the reusable button component

const LandingPageBoggart = () => {
    const navigate = useNavigate();

    const handleStartClick = () => {
        // Navigate to the IAS page
        navigate('/questionnaire-boggart');
    };

    return (
        <main className="landing-boggart-page">
            <div className="boggart-container">
                <header className="form-header">
                    <img src={logo} alt="Boggart" className="logo-image"/>
                </header>

                <section className="welcome-section">
                    <h2 className="welcome-title">Self Reflection</h2>
                    <div className="welcome-description">

                    <p className="welcome-description">
                        You will now be guided through a self-reflective questionnaire, allowing an introspective view of your ongoing pain.
                    </p>
                    <p className="welcome-description">
                        Please take a couple of minutes to sit in a quiet place and focus on your pain before we begin. Allow yourself the time to reflect deeply on each question and explore your pain to better understand it.
                    </p>
                    <p className="welcome-description">
                    Try and determine how you experience your pain, and  describe it in order to understand it in a deeper sense.
                    </p></div>

                </section>

                <section className="cta-section">
                    <PrimaryButton text="Let's Start" onClick={handleStartClick} />
                </section>
            </div>
        </main>
    );
};

export default LandingPageBoggart;