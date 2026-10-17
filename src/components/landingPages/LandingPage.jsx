import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './LandingPage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import { getResumePoint, clearFirstVisitProgress } from '../generalComponents/savedProgress';

const LandingPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    // a questionnaire left in the middle on this device (see savedProgress.js)
    const [resumePoint] = useState(getResumePoint);

    const handleStartClick = () => {
        // starting again: the previous unfinished answers are deleted
        clearFirstVisitProgress();
        navigate('/introduction');
    };

    const handleResumeClick = () => {
        navigate(resumePoint.path, { state: resumePoint.state || undefined });
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

                {resumePoint && (
                    <section className="resume-box" aria-live="polite">
                        <p className="resume-title">{t('resumeTitle')}</p>
                        <p className="resume-text">{t('resumeText')}</p>
                    </section>
                )}

                <section className="cta-section landing-cta">
                    {resumePoint && (
                        <PrimaryButton text={t('resumeContinue')} onClick={handleResumeClick} />
                    )}
                    <PrimaryButton
                        text={resumePoint ? t('startOver') : t('letsStart')}
                        onClick={handleStartClick}
                    />
                    <PrimaryButton text={t('login')} onClick={handleLoginClick} />
                </section>
            </div>
        </main>
    );
};

export default LandingPage;