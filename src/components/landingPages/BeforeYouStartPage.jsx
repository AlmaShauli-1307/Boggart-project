import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './IntroductionPage.css';
import './BeforeYouStartPage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';

// "Before you start": shown after the landing page and before the consent form,
// so participants know what to expect (three parts, it takes a while, no saving
// mid-way). Nothing is saved on this page.
//
// How long the whole study takes, in minutes. Leave null to hide the line;
// set a number (e.g. 30) once the team has timed it.
export const STUDY_MINUTES = null;

const BeforeYouStartPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="intro-page">
            <LanguageToggle />
            <header className="intro-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>

            <div className="intro-container">
                <main className="intro-content before-start">
                    <h1 className="intro-title">{t('beforeStartTitle')}</h1>

                    <p className="before-start-lead">{t('beforeStartLead')}</p>

                    <ol className="before-start-parts">
                        <li>
                            <strong>{t('beforeStartPart1Title')}</strong>
                            <span>{t('beforeStartPart1Text')}</span>
                        </li>
                        <li>
                            <strong>{t('beforeStartPart2Title')}</strong>
                            <span>{t('beforeStartPart2Text')}</span>
                        </li>
                        <li>
                            <strong>{t('beforeStartPart3Title')}</strong>
                            <span>{t('beforeStartPart3Text')}</span>
                        </li>
                    </ol>

                    {STUDY_MINUTES && (
                        <p className="before-start-time">
                            {t('beforeStartTime').replace('{minutes}', STUDY_MINUTES)}
                        </p>
                    )}

                    <div className="before-start-tips">
                        <p className="before-start-tips-title">{t('beforeStartTipsTitle')}</p>
                        <ul>
                            <li>{t('beforeStartTip1')}</li>
                            <li>{t('beforeStartTip2')}</li>
                            <li>{t('beforeStartTip3')}</li>
                        </ul>
                    </div>

                    <div className="before-start-actions">
                        <PrimaryButton text={t('beforeStartContinue')} onClick={() => navigate('/introduction')} />
                        <PrimaryButton
                            text={t('beforeStartBack')}
                            onClick={() => navigate('/')}
                            className="secondary-button"
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BeforeYouStartPage;
