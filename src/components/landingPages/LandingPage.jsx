import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './LandingPage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';

const LandingPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleStartClick = () => {
        navigate('/introduction');
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <main className="landing-page" >
            <LanguageToggle />
            <div className="landing-container">
                <header className="logo-container">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="welcome-section">
                    <h2 className="welcome-title">{t('welcomeTitle')}</h2>
                    <p className="welcome-description">
                        {t('welcomeDescription')}
                    </p>
                </section>

                <section className="cta-section landing-cta">
                    <PrimaryButton text={t('letsStart')} onClick={handleStartClick} />
                    <PrimaryButton text={t('login')} onClick={handleLoginClick} />
                </section>
            </div>
        </main>
    );
};

export default LandingPage;