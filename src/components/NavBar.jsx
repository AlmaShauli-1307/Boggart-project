import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import LanguageToggle from './LanguageButton';
import logo from '../images/logo.png';
import './NavBar.css';

const NavBar = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isAdmin = user?.role === 'admin';
    const isDemo = location.state?.isDemo || false;

    return (
        <>
            {/* הסמל יושב בפינה השמאלית, מחוץ לפס הלבן */}
            <div className="fixed-corner-logo" >
                <img src={logo} alt="Boggart" />
            </div>

            {/* ה-NavBar שמתחיל אחרי הסמל */}
            <nav className="top-navbar-short">
                <div className="nav-inner-container">
                    <div className="nav-links-left">
                        <button className="nav-btn" onClick={() => navigate('/home-login')}>{t('home')}</button>
                        <button className="nav-btn" onClick={() => navigate('/my-creature')}>{t('my_creature')}</button>

                        {/* הכפתור החדש לשינוי רקע */}
                        <button className="nav-btn change-bg-btn" onClick={() => navigate('/change-background')}>
                            {t('change_background')}
                        </button>

                        <button className="nav-btn" onClick={() => navigate('/WeeklySummary')}>{t('weekly_summary')}</button>
                        <button className="nav-btn" onClick={() => navigate('/MonthlySummary')}>{t('monthly_summary')}</button>

                        {isAdmin && (
                            <button className="nav-btn admin-badge" onClick={() => navigate('/form2', { state: { isDemo: true } })}>
                                {t('form2_button')}
                            </button>
                        )}
                    </div>

                    <div className="nav-user-actions">
                        <span className="user-display-name">{user?.username}</span>
                        <div className="nav-lang-wrapper">
                            <LanguageToggle isInNavbar={true} />
                        </div>
                        <button className="logout-nav-btn" onClick={() => { sessionStorage.clear(); navigate('/'); }}>
                            {t('logout')}
                        </button>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default NavBar;