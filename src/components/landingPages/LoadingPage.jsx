import React from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './LoadingPage.css';
import logo from '../../images/logo.png';

const LoadingPage = () => {
    const { t } = useLanguage();
    return (
        <main className="loading-boggart-page">
            <div className="loading-boggart-container">
                <header className="form-loading-header">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="loading-content">
                    <h2 className="loading-message">{t('wait')}</h2>
                    <div className="loading-spinner"></div>
                </section>
            </div>
        </main>
    );
};

export default LoadingPage;