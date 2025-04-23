import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MeetYourPain.css';
import demoBoggart from '../../images/demoBoggart.png'; // Adjust path as needed
import logo from '../../images/logo.png'; // Adjust path as needed
import PrimaryButton from '../generalComponents/PrimaryButton'; // Import the reusable button component

const MeetYourPain = () => {
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
                    <h2 className="welcome-title">Meet Your Pain</h2>
                    <div className="welcome-description">
<img src={demoBoggart} className={"boggart-img"}/>

                    </div>

                </section>

                <section className="cta-section">
                    <PrimaryButton text="Let's talk..." onClick={handleStartClick} />
                </section>
            </div>
        </main>
    );
};

export default MeetYourPain;