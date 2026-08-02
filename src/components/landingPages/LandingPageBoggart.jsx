import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './LandingPageBoggart.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';

const LandingPage = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    const handleStartClick = () => {
        navigate('/questionnaire-boggart');
    };

    return (
        <main className="landing-boggart-page">
            <LanguageToggle />
            <div className="boggart-container">
                <header className="form-boggart-header">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="boggart-welcome-section">
                    <h2 className="boggart-welcome-title">{t('boggartWelcomeTitle')}</h2>

                    <p className="boggart-welcome-description">
                        {t('boggartWelcomeDescription1')}
                    </p>
                    <p className="boggart-welcome-description">
                        {t('boggartWelcomeDescription2')}
                    </p>
                    <p className="boggart-welcome-description">
                        {t('boggartWelcomeDescription3')}
                    </p>
                </section>

                <section className="cta-section">
                    <PrimaryButton text={t('letsStart')} onClick={handleStartClick} />
                </section>
            </div>
        </main>
    );
};

export default LandingPage;