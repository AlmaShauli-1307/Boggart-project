import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../NavBar';
import { useLanguage } from '../LanguageContext';
import EmotionScalePage from '../expiramentMesurmentForm/EmotionScalePage';
import './HomePageLogin.css';

const HomePageLogin = () => {
    const { t } = useLanguage();
    const [samLevel, setSamLevel] = useState(null);
    const [arousalLevel, setArousalLevel] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasGeneratedToday, setHasGeneratedToday] = useState(false); // מצב חדש
    const [isCheckingStatus, setIsCheckingStatus] = useState(true); // מצב טעינה ראשוני
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const user = JSON.parse(sessionStorage.getItem('user'));

    const samQuestions = [
        { id: 'sam_valence', text: t('samValenceQuestion'), options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], questionType: 'SAM' },
        { id: 'sam_arousal', text: t('samArousalQuestion'), options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], questionType: 'SAM' }
    ];

    useEffect(() => {
        const fetchDailyCharacter = async () => {
            setIsCheckingStatus(true);
            
            try {
                const response = await axios.get(`${API_BASE_URL}/api/get-daily-character/${user.username}`);

                if (response.data.success) {
                    setAvatarUrl(response.data.imageUrl);
                    setHasGeneratedToday(true);
                } else {
                    setHasGeneratedToday(false);
                }
            } catch (e) {
                console.error("Error fetching daily character:", e);
                setHasGeneratedToday(false);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        if (user?.username) fetchDailyCharacter();
    }, [user?.username]);

    // פונקציית עזר לעיבוד התמונה מהקנבס (הקוד המקורי שלך)
    const processImage = (imageUrl, index) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const w = img.width / 2;
            const h = img.height / 2;
            canvas.width = w;
            canvas.height = h;
            const col = index % 2;
            const row = Math.floor(index / 2);
            ctx.drawImage(img, col * w, row * h, w, h, 0, 0, w, h);
            setAvatarUrl(canvas.toDataURL());
        };
    };

    const handleUpdateWeather = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/update-avatar-weather`, {
                samLevel: samLevel.toString(),
                username: user.username
            });

            if (response.data.success) {
                setAvatarUrl(response.data.avatarUrl);
                // סימון שהיום המשתמש כבר יצר תמונה
                localStorage.setItem(`lastGenerated_${user.username}`, new Date().toLocaleDateString());
                setHasGeneratedToday(true);
            }
        } catch (error) {
            console.error("Error updating avatar:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="home-container">
            <NavBar />
            <main className="home-content" style={{ textAlign: 'center', paddingTop: '20px' }}>
                <h2 className="welcome-title">{t('welcomeHome')} {user?.username}!</h2>

                {/* שלב 1: בדיקה ראשונית מול השרת - מונע קפיצה של השאלון */}
                {isCheckingStatus ? (
                    <div className="loading-screen" style={{ marginTop: '50px' }}>
                    </div>
                ) : (
                    <>
                        {/* שלב 2: אם אין תמונה מהיום - הצג שאלון */}
                        {!hasGeneratedToday ? (
                            <div className="setup-section">
                                <h3>{t('dailyCheckIn') || 'איך הכאב שלך מרגיש היום?'}</h3>
                                <div className="scales-section">
                                    <EmotionScalePage
                                        questions={samQuestions}
                                        responses={{ 'sam_valence': samLevel, 'sam_arousal': arousalLevel }}
                                        onSelect={(id, value) => {
                                            if (id === 'sam_valence') setSamLevel(value);
                                            if (id === 'sam_arousal') setArousalLevel(value);
                                        }}
                                    />
                                </div>

                                <button
                                    className="btn-update-weather"
                                    onClick={handleUpdateWeather}
                                    disabled={isLoading || samLevel === null || arousalLevel === null}
                                >
                                    {isLoading ? t('processingAI') : t('updateWeatherBtn')}
                                </button>
                            </div>
                        ) : (
                            /* שלב 3: אם כבר יש תמונה מהיום - הצג אותה */
                            <div className="avatar-display" style={{ marginTop: '50px' }}>
                                {avatarUrl ? (
                                    <div className="image-wrapper">
                                        <img
                                            src={avatarUrl}
                                            alt="Your Daily Creature"
                                            className="main-avatar-img"
                                            style={{ maxWidth: '600px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                                        />
                                    </div>
                                ) : (
                                    <p>{t('loadingCreature')}</p>
                                )}
                            </div>
                        )}
                    </>
                )}
                {isLoading && (
                    <div className="loader-container">
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomePageLogin;