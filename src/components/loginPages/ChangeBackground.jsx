import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../NavBar';
import { useLanguage } from '../LanguageContext';
import EmotionScalePage from '../expiramentMesurmentForm/EmotionScalePage';
import PainScaleQuestion from '../expiramentMesurmentForm/PainScaleQuestion';
import Question from '../generalComponents/Question';
import InputQuestion from '../generalComponents/InputQuestion';
import PrimaryButton from '../generalComponents/PrimaryButton';
import CheckboxQuestion from '../generalComponents/CheckboxQuestion';
import { useNavigate } from 'react-router-dom';
import '../landingPages/HomePageLogin.css';

const dailyQuestions = [
    { en: "What was the first thing that came to mind when you saw your figure?", he: "מה הדבר הראשון שעלה לך כשראית את הדמות שלך?" },
    { en: "What would you name your figure?", he: "איך היית קורא/ת לדמות שלך?" },
    { en: "When is your figure strongest? When is it quietest?", he: "מתי הדמות שלך הכי חזקה? מתי הכי שקטה?" },
    { en: "What is your figure's secret?", he: "מה הסוד של הדמות שלך?" },
    { en: "What is your figure afraid of?", he: "ממה הדמות שלך מפחדת?" },
    { en: "Why does the figure come to visit you?", he: "למה היא מגיעה לבקר אותך?" },
    { en: "What can your figure NOT control?", he: "מה הדמות שלך לא יכולה לשלוט בו?" },
    { en: "If the figure had met you 10 years ago — what would it have said?", he: "אם הדמות הייתה פוגשת אותך לפני 10 שנים — מה היא הייתה אומרת לך?" },
    { en: "How can you make the figure smaller?", he: "איך אפשר להקטין את הדמות?" },
    { en: "What does your figure know about you that nobody else knows?", he: "מה הדמות שלך יודעת עלייך שאף אחד אחר לא יודע?" },
    { en: "What has changed about your figure since you first met?", he: "מה השתנה בדמות שלך מאז שנפגשתם?" },
    { en: "How will you feel about your figure a year from now?", he: "איך תרגיש/י לגבי הדמות שלך בעוד שנה?" },
    { en: "If your figure could write you a letter — what would it say?", he: "אם הדמות שלך יכלה לכתוב לך מכתב — מה היא הייתה כותבת?" },
    { en: "What would you say to your figure on the day you part ways?", he: "מה היית אומר/ת לדמות שלך ביום שתיפרדו?" },
];

const avatarDoOptions = {
    he: ['לחבק', 'לדבר', 'להתבונן', 'לשבת בשקט', 'להרחיק', 'להתעלם', 'לצעוק'],
    en: ['Hug it', 'Talk to it', 'Observe it', 'Sit quietly with it', 'Push it away', 'Ignore it', 'Yell at it']
};

const avatarTellsOptions = {
    he: ['משהו כואב', 'אני צריכה מנוחה', 'משהו מדאיג אותי', 'צריך שתשים לב אליי', 'הכל בסדר, אני כאן', 'זה יעבור', 'אני רק חלק קטן מהחיים שלך', 'אחר'],
    en: ['Something hurts', 'I need rest', 'Something worries me', 'I need attention', "It's OK, I'm here", 'This will pass', "I'm only a small part of your life", 'Other']
};

const ChangeBackgroundPage = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    const [samLevel, setSamLevel] = useState(null);
    const [arousalLevel, setArousalLevel] = useState(null);
    const [painLevel, setPainLevel] = useState(null);
    const [energyLevel, setEnergyLevel] = useState(null);
    const [feelingLevel, setFeelingLevel] = useState(null);
    const [avatarDo, setAvatarDo] = useState([]);
    const [avatarTells, setAvatarTells] = useState([]);
    const [avatarTellsOther, setAvatarTellsOther] = useState('');
    const [avatarDoOther, setAvatarDoOther] = useState('');
    const [avatarNeed, setAvatarNeed] = useState('');
    const [dailyAnswer, setDailyAnswer] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [newAvatarUrl, setNewAvatarUrl] = useState(null);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isRtl = language === 'he';

    useEffect(() => {
        const fetchIndex = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/get-daily-question-index/${user.username}`);
                setQuestionIndex(res.data.index || 0);
            } catch (e) {
                console.error("Failed to fetch question index", e);
            }
        };
        if (user?.username) fetchIndex();
    }, [user?.username]);

    const dailyQuestion = dailyQuestions[questionIndex % dailyQuestions.length];

    const isStepComplete = () => {
        switch (currentStep) {
            case 1: return painLevel !== null;
            case 2: return samLevel !== null && arousalLevel !== null;
            case 3: return energyLevel !== null;
            case 4: return feelingLevel !== null;
            case 5: return avatarDo.length > 0;
            case 6: return (avatarNeed || '').trim() !== '';
            case 7: return avatarTells.length > 0;
            case 8: return (dailyAnswer || '').trim() !== '';
            default: return false;
        }
    };

    const generateNewAvatar = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/update-avatar-weather`, {
                username: user.username,
                painLevel,
                samLevel,
                arousalLevel,
                energyLevel,
                feelingLevel: "Processing...",
                avatarDo: [...avatarDo, avatarDoOther].filter(Boolean),
                avatarNeed: "Processing...",
                avatarTells: [...avatarTells, avatarTellsOther].filter(Boolean),
                dailyAnswer: "Processing..."
            });

            if (response.data.success) {
                setNewAvatarUrl(response.data.avatarUrl);
                setCurrentStep(4);
            }
        } catch (error) {
            console.error("AI Generation failed:", error);
            alert(t('errorCreateAvatar'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/update-avatar-data`, {
                username: user.username,
                feelingLevel,
                avatarDo: [...avatarDo, avatarDoOther].filter(Boolean),
                avatarNeed,
                avatarTells: [...avatarTells, avatarTellsOther].filter(Boolean),
                dailyAnswer
            });
            if (response.data.success) {
                const updatedUser = { ...user, creature_image: newAvatarUrl };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
                navigate('/home-login');
            }
        } catch (error) {
            console.error("Final submit failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="home-container" dir={isRtl ? 'rtl' : 'ltr'}>
            <NavBar />
            <main style={{ textAlign: 'center', padding: '20px', maxWidth: '800px', margin: '100px auto' }}>

                {newAvatarUrl && currentStep >= 4 && (
                    <div className="fade-in" style={{ marginBottom: '30px', animation: 'fadeIn 0.8s ease-in' }}>
                        <h3 style={{ color: '#000000' }}>{t('yourCreature')}</h3>
                        <img src={newAvatarUrl} alt="New Avatar" style={{
                            width: '350px', borderRadius: '20px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            border: '4px solid white', margin: '15px',
                        }} />
                    </div>
                )}

                <div className="question-container" style={{ minHeight: 'auto', marginBottom: '70px' }}>
                    {currentStep === 1 && (
                        <div className="fade-in">
                            <h3 style={{ marginBottom: '30px' }}>{t('dailyCheckIn')}</h3>
                            <PainScaleQuestion
                                id="pain_level"
                                text={t('painLevelQuestion')}
                                selectedValue={painLevel}
                                onSelect={(id, val) => setPainLevel(val)}
                            />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="fade-in">
                            <EmotionScalePage
                                questions={[
                                    { id: 'sam_v', text: t('samValenceQuestion') },
                                    { id: 'sam_a', text: t('samArousalQuestion') }
                                ]}
                                responses={{ 'sam_v': samLevel, 'sam_a': arousalLevel }}
                                onSelect={(id, val) => id === 'sam_v' ? setSamLevel(val) : setArousalLevel(val)}
                            />
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="fade-in">
                            <Question
                                id="energy_scale"
                                text={t('energyLevelQuestion')}
                                selectedValue={energyLevel}
                                onSelect={(id, val) => setEnergyLevel(val)}
                                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                                leftLabel={t('notAtAll')}
                                rightLabel={t('fully')}
                            />
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="fade-in">
                            <Question
                                id="feeling_after_figure"
                                text={t('feeling_after_figure')}
                                selectedValue={feelingLevel}
                                onSelect={(id, val) => setFeelingLevel(val)}
                                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                                leftLabel={t('uncomfortable')}
                                rightLabel={t('happy')}
                            />
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="fade-in">
                            <CheckboxQuestion
                                id="avatar_do"
                                text={t('avatar_do')}
                                selectedValues={avatarDo}
                                other={avatarDoOther}
                                onSelect={(id, val) => setAvatarDo(val)}
                                onOther={(id, val) => setAvatarDoOther(val)}
                                options={avatarDoOptions[language] || avatarDoOptions.en}
                                showOther={false}
                                singleSelect={true}
                            />
                        </div>
                    )}

                    {currentStep === 6 && (
                        <div className="fade-in">
                            <InputQuestion
                                id="avatar_need_text"
                                text={t('whatAvatarNeed')}
                                selectedValue={avatarNeed}
                                onChange={(id, val) => setAvatarNeed(val)}
                                inputType="longText"
                            />
                        </div>
                    )}

                    {currentStep === 7 && (
                        <div className="fade-in">
                            <CheckboxQuestion
                                id="avatar_tells"
                                text={t('avatar_tells')}
                                selectedValues={avatarTells}
                                other={avatarTellsOther}
                                onSelect={(id, val) => setAvatarTells(val)}
                                onOther={(id, val) => setAvatarTellsOther(val)}
                                options={avatarTellsOptions[language] || avatarTellsOptions.en}
                                showOther={false}
                                singleSelect={true}
                            />
                        </div>
                    )}

                    {currentStep === 8 && (
                        <div className="fade-in">
                            <InputQuestion
                                id="daily_question"
                                text={isRtl ? dailyQuestion.he : dailyQuestion.en}
                                selectedValue={dailyAnswer}
                                onChange={(id, val) => setDailyAnswer(val)}
                                inputType="longText"
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
                    {currentStep > 1 && !isLoading && currentStep != 4 && (
                        <PrimaryButton
                            text={t('previous')}
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            style={{ background: 'transparent', border: '1px solid #ccc', color: '#666' }}
                        />
                    )}

                    {currentStep < 3 && (
                        <PrimaryButton
                            text={t('next')}
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            disabled={!isStepComplete()}
                        />
                    )}

                    {currentStep === 3 && (
                        <PrimaryButton
                            text={isLoading ? t('processingAI') : (isRtl ? 'צור דמות חדשה' : 'Generate Avatar')}
                            onClick={generateNewAvatar}
                            disabled={isLoading || !isStepComplete()}
                        />
                    )}

                    {currentStep >= 4 && currentStep < 8 && (
                        <PrimaryButton
                            text={t('next')}
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            disabled={!isStepComplete()}
                        />
                    )}

                    {currentStep === 8 && (
                        <PrimaryButton
                            text={isLoading ? t('processingAI') : (isRtl ? 'סיום ועדכון' : 'Finish & Update')}
                            onClick={handleFinalSubmit}
                            disabled={isLoading || !isStepComplete()}
                        />
                    )}
                </div>

                {isLoading && <div style={{ marginTop: '20px', color: '#888' }} />}
            </main>
        </div>
    );
};

export default ChangeBackgroundPage;