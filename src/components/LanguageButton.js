import React from 'react';
import { useLanguage } from './LanguageContext';

const LanguageButton = ({ isInNavbar }) => { // הוספת המאפיין כאן
    const { language, buttonLanguage } = useLanguage();

    const handleLanguageChange = () => {
        buttonLanguage();
        const newLang = language === 'he' ? 'en' : 'he';
        const html = document.documentElement;
        html.setAttribute('lang', newLang);
        html.setAttribute('dir', newLang === 'he' ? 'rtl' : 'ltr');
    };

    const buttonStyle = {
        // אם הוא ב-NavBar, המיקום יהיה רגיל (static). אם לא, הוא יהיה fixed
        position: isInNavbar ? 'static' : 'fixed',
        top: isInNavbar ? 'auto' : '20px',
        right: isInNavbar ? 'auto' : '20px',
        backgroundColor: '#295A4B',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 1000,
        padding: isInNavbar ? '8px 16px' : '12px 25px' // עיצוב קצת יותר עדין ל-NavBar
    };

    return (
        <button style={buttonStyle} onClick={handleLanguageChange}>
            {language === 'he' ? 'עברית' : 'English'}
        </button>
    );
};

export default LanguageButton;