import React, { useState } from 'react';
import axios from 'axios';
import NavBar from '../NavBar';
import { useLanguage } from '../LanguageContext';
import EmotionScalePage from '../expiramentMesurmentForm/EmotionScalePage';
import { useNavigate } from 'react-router-dom';

const ChangeBackgroundPage = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [samLevel, setSamLevel] = useState(null);
    const [arousalLevel, setArousalLevel] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const user = JSON.parse(sessionStorage.getItem('user'));

    const samQuestions = [
        { id: 'sam_valence', text: t('samValenceQuestion'), options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], questionType: 'SAM' },
        { id: 'sam_arousal', text: t('samArousalQuestion'), options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], questionType: 'SAM' }
    ];

    const handleUpdateWeather = async () => {
        setIsLoading(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL;
        try {
            const response = await axios.post(`${API_BASE_URL}/update-avatar-weather`, {
                samLevel: samLevel.toString(),
                username: user.username
            });

            if (response.data.success) {
                // עדכון ה-session storage עם התמונה החדשה
                const updatedUser = { ...user, creature_image: response.data.avatarUrl };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));

                // אחרי ההצלחה, מחזירים אותו לדף הבית לראות את התוצאה
                navigate('/home-login');
            }
        } catch (error) {
            console.error("Error updating avatar:", error);
            alert(t('weatherUpdateError') || "שגיאה בעדכון");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="home-container">
            <NavBar />
            <main style={{ textAlign: 'center', paddingTop: '40px', marginTop: '50px' }}>
                <h3>{t('dailyCheckIn')}</h3>
                <EmotionScalePage
                    questions={samQuestions}
                    responses={{ 'sam_valence': samLevel, 'sam_arousal': arousalLevel }}
                    onSelect={(id, value) => {
                        if (id === 'sam_valence') setSamLevel(value);
                        if (id === 'sam_arousal') setArousalLevel(value);
                    }}
                />
                <button
                    className="btn-update-weather"
                    onClick={handleUpdateWeather}
                    disabled={isLoading || samLevel === null || arousalLevel === null}
                >
                    {isLoading ? t('processingAI') : t('updateWeatherBtn')}
                </button>

                {isLoading && (
                    <div className="loader-section" style={{ marginTop: '20px' }}>
                        <p>🔄 {t('creatingAtmosphere')}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChangeBackgroundPage;