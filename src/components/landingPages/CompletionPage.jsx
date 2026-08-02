import React from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import { useNavigate } from 'react-router-dom';
import './CompletionPage.css';
import logo from '../../images/logo.png'; 
import PrimaryButton from '../generalComponents/PrimaryButton';

const CompletionPage = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const handleContinue = () => {
        navigate('/');
    };

    return (
        <div className="completion-page" lang={language}>
            <LanguageToggle />
            <header className="completion-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>
            <div className="completion-container">
                <main className="completion-content">
                    <h1 className="completion-title">{t('completionTitle')}</h1>
                    <p className="completion-message">{t('completionMessage')}</p>
                    <p className="completion-message">
                        {t('completionName')}
                        <br /><a href={"mailto:avital.radosher@post.runi.ac.il"} className="completion-message">
                            avital.radosher@post.runi.ac.il
                        </a>
                    </p>

                    <p className="completion-message">
                        {t('completionMessageEnd')}
                        <br /><a href={"https://sites.google.com/view/project-boggart/home"} className="completion-message">
                            https://sites.google.com/view/project-boggart/home
                        </a>
                    </p>

                    <div className="completion-cta">
                        <PrimaryButton
                            text={t('return')}
                            onClick={handleContinue}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CompletionPage;