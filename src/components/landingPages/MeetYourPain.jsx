import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MeetYourPain.css';
import demoBoggart from '../../images/demoBoggart.png'; // Adjust path as needed
import logo from '../../images/logo.png'; // Adjust path as needed
import PrimaryButton from '../generalComponents/PrimaryButton'; // Import the reusable button component
import LoadingPage from './LoadingPage'; // Import the LoadingPage component

const MeetYourPain = () => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 5000); // 5 seconds delay

        return () => clearTimeout(timer); // Cleanup the timer
    }, []);

    const handleStartClick = () => {
        // Navigate to the IAS page
        navigate('/questionnaire-boggart');
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    return (
        <main className="landing-meet-boggart-page">
            <div className="meet-boggart-container">
                <header className="form-meet-boggart-header">
                    <img src={logo} alt="Boggart" className="logo-image"/>
                </header>

                <section className="welcome-meet-boggart-section">
                    <h2 className="welcome-meet-boggart-title">Meet Your Pain</h2>
                    <div className="welcome-meet-boggart-description">
                        <img src={demoBoggart} className={"boggart-img"} />
                    </div>
                </section>

                <section className="cta-meet-boggart-section">
                    <PrimaryButton text="Let's talk..." onClick={handleStartClick} />
                </section>
            </div>
        </main>
    );
};

export default MeetYourPain;