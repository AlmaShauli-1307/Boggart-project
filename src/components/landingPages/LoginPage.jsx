import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import './LandingPage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';

const API_URL = process.env.REACT_APP_API_URL;

const LoginPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            setError(t('loginError'));
            return;
        }

        setIsLoading(true);
        setError('');
        const API_BASE_URL = process.env.REACT_APP_API_URL;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // שמירת המשתמש ב-sessionStorage
                sessionStorage.setItem('user', JSON.stringify(data.user));

                // מעבר לדף הבית עם המידע האם המשתמש הוא אדמין
                navigate('/home-login', {
                    state: { isAdmin: data.user.role === 'admin' }
                });
            } else {
                setError(t('loginError'));
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            setError(t('loginError'));
        }

        setIsLoading(false);
    };

    return (
        <main className="landing-page">
            <LanguageToggle />
            <div className="landing-container">
                <header className="logo-container">
                    <img src={logo} alt="Boggart" className="logo-image" />
                </header>

                <section className="welcome-section">
                    <h2 className="welcome-title">{t('loginTitle')}</h2>
                </section>

                <section className="cta-section">
                    <div className="login-form">
                        <input
                            className="login-input"
                            type="text"
                            placeholder={t('loginUsername')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            className="login-input"
                            type="password"
                            placeholder={t('loginPassword')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />

                        {error && <p className="login-error">{error}</p>}

                        <PrimaryButton
                            text={isLoading ? '...' : t('loginButton')}
                            onClick={handleLogin}
                            disabled={isLoading}
                        />
                        <button
                            className="login-link-button"
                            onClick={() => navigate('/')}
                        >
                            {t('backToLanding')}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default LoginPage;