import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './IntroductionPage.css'; // תצטרכי ליצור קובץ CSS
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';

const IntroductionPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage(); // הוספנו את זה

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        date: '',
        consent: false
    });
    const [isValid, setIsValid] = useState(false);

    // עדכון השדות
    const handleInputChange = (field, value) => {
        const updatedData = {
            ...formData,
            [field]: value
        };
        setFormData(updatedData);

        // בדיקה שהשדות מלאים
        setIsValid(
            updatedData.fullName.trim() !== '' &&
            updatedData.phoneNumber.trim() !== '' &&
            updatedData.date !== '' &&
            updatedData.consent === true
        );
    };

    const handleContinue = () => {
        if (isValid) {
            // העבר את הנתונים לשאלון הראשון
            navigate('/questionnaire-before', {
                state: {
                    introData: formData
                }
            });
        }
    };

    return (
        <div className="intro-page">
            <LanguageToggle /> {}
            <header className="intro-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>

            <div className="intro-container">
                <main className="intro-content">
                    <div className="intro-text-section">
                        <h1 className="intro-title">{t('introTitle')}</h1>

                        <div className="consent-header">
                            <p><strong>{t('researchTopic')}</strong>{t('researchText')}</p>
                            <p><strong>{t('headOfLaboratoryTopic')}</strong>{t('headOfLaboratoryText')}</p>
                            <p><strong>{t('researcherTopic')}</strong>{t('researcherText')}</p>
                        </div>

                        <div className="consent-content">
                            <p id="declare"><strong>{t('declareTopic')}</strong></p>

                            <ul className="consent-list">
                                <li>{t('declareText1')}</li>
                                <li>{t('declareText2')}</li>
                                <li>{t('declareText3')}</li>
                                <li>{t('declareText4')}</li>
                                <li>{t('declareText5')}</li>
                                <li>{t('declareText6')}</li>
                                <li>{t('declareText7')}</li>
                                <li>{t('declareText8')}</li>
                            </ul>

                            <p className="consent-declaration">
                                <strong>{t('declareText8')}</strong>
                            </p>

                            <p>{t('introAgree')}</p>
                        </div>
                    </div>

                    <div className="intro-form-section">
                        <div className="form-group">
                            <label htmlFor="fullName" className="form-label">
                                {t('introName')}
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                className="form-input"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber" className="form-label">
                                {t('introPhoneNumber')}
                            </label>
                            <input
                                id="phoneNumber"
                                type="text"
                                className="form-input"
                                value={formData.phoneNumber}
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date" className="form-label">
                                {t('introDate')}
                            </label>
                            <input
                                id="date"
                                type="text"
                                className="form-input"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                placeholder="DD/MM/YYYY"
                                required
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.consent}
                                    onChange={(e) => handleInputChange('consent', e.target.checked)}
                                    required
                                />
                                <span className="checkmark"></span>
                                {t('introAgree')}
                            </label>
                        </div>

                        <div className="form-actions">
                            <PrimaryButton
                                text={t('introBegin')}
                                onClick={handleContinue}
                                disabled={!isValid}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default IntroductionPage;