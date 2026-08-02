import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../NavBar';
import { useLanguage } from '../LanguageContext';
import EmotionScalePage from '../expiramentMesurmentForm/EmotionScalePage';
import PainScaleQuestion from '../expiramentMesurmentForm/PainScaleQuestion';
import Question from '../generalComponents/Question';
import ScaleLegend from '../generalComponents/ScaleLegend';
import InputQuestion from '../generalComponents/InputQuestion';
import CheckboxQuestion from '../generalComponents/CheckboxQuestion';
import PrimaryButton from '../generalComponents/PrimaryButton';
import { useNavigate } from 'react-router-dom';
import './HomePageLogin.css';

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

const HomePageLogin = () => {
    const { t, language } = useLanguage();
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    const [samLevel, setSamLevel] = useState(null);
    const [arousalLevel, setArousalLevel] = useState(null);
    const [painLevel, setPainLevel] = useState(null);
    const [energyLevel, setEnergyLevel] = useState(null);
    const [feelingLevel, setFeelingLevel] = useState(null);
    const [avatarDo, setAvatarDo] = useState([]);
    const [avatarTells, setAvatarTells] = useState([]);
    const [avatarTellsOther, setAvatarTellsOther] = useState('');
    const [avatarNeed, setAvatarNeed] = useState('');
    const [dailyAnswer, setDailyAnswer] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);

    const [avatarUrl, setAvatarUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasGeneratedToday, setHasGeneratedToday] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const user = JSON.parse(sessionStorage.getItem('user'));
    const isRtl = language === 'he';

    const energyScale = {
        1: isRtl ? 'בקושי רב' : 'With great difficulty',
        2: isRtl ? 'בקושי' : 'With difficulty',
        3: isRtl ? 'במידה מסוימת' : 'Somewhat',
        4: isRtl ? 'ברובו הצלחתי' : 'Mostly managed',
        5: isRtl ? 'תפקדתי כרגיל' : 'Functioned as usual'
    };

    useEffect(() => {
        const fetchDailyStatus = async () => {
            if (!user?.username) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/get-daily-character/${user.username}`);
                if (res.data.success) {
                    setAvatarUrl(res.data.imageUrl);
                    if (res.data.isComplete) {
                        setHasGeneratedToday(true);
                    } else {
                        // שלוף את הערכים השמורים
                        setSamLevel(res.data.samLevel);
                        setArousalLevel(res.data.arousalLevel);
                        setPainLevel(res.data.painLevel);
                        setEnergyLevel(res.data.energyLevel);
                        setCurrentStep(4);
                    }
                }
            } catch (e) { console.error("Status check failed", e); }
            finally { setIsCheckingStatus(false); }
        };

        const fetchIndex = async () => {
            const res = await axios.get(`${API_BASE_URL}/api/get-daily-question-index/${user.username}`);
            const index = res.data.index || 0;
            setQuestionIndex(index);
            if (res.data.form1Id) {
                const updatedUser = { ...user, form1Id: res.data.form1Id };
                sessionStorage.setItem('user', JSON.stringify(updatedUser));
            }
            if (index >= 14) {
                navigate('/questionnaire-after', {
                    state: { form1Id: res.data.form1Id }
                });
            }
        };

        fetchDailyStatus();
        fetchIndex();
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

    const handleGenerateAvatar = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/update-avatar-weather`, {
                username: user.username,
                samLevel,
                arousalLevel,
                painLevel,
                energyLevel,
                feelingLevel: null,
                avatarDo: [],
                avatarNeed: "",
                avatarTells: [],
                dailyAnswer: "",
                isComplete: false
            });
            if (res.data.success) {
                setAvatarUrl(res.data.avatarUrl);
                setCurrentStep(4);
            }
        } catch (e) {
            console.error("AI Error:", e);
            alert(t('errorCreateAvatar'));
        } finally { setIsLoading(false); }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/update-avatar-data`, {
                username: user.username,
                feelingLevel,
                avatarDo: [...avatarDo].filter(Boolean),
                avatarTells: [...avatarTells, avatarTellsOther].filter(Boolean),
                avatarNeed,
                dailyAnswer
            });
            if (res.data.success) {
                setHasGeneratedToday(true);
            }
        } catch (e) { console.error("Final update failed", e); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="home-container" dir={isRtl ? 'rtl' : 'ltr'}>
            <NavBar />
            <main className="home-content" style={{ textAlign: 'center', paddingTop: '20px' }}>
                <h2 className="welcome-title">{t('welcomeHome')} {user?.username}!</h2>

                {isCheckingStatus ? (
                    <div className="loading-screen"></div>
                ) : (
                    <>
                        {!hasGeneratedToday ? (
                            <div className="setup-section" style={{ maxWidth: '700px', margin: '0 auto' }}>

                                {avatarUrl && currentStep >= 4 && (
                                    <div className="fade-in" style={{ marginBottom: '20px' }}>
                                        <img src={avatarUrl} alt="New Character" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }} />
                                    </div>
                                )}

                                <div style={{ minHeight: 'auto', marginBottom: '70px' }}>
                                    {currentStep === 1 && (
                                        <div className="fade-in">
                                            <h3>{t('dailyCheckIn')}</h3>
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
                                            <p className="instructions-text" style={{ fontWeight: 'bold', margin: '20px' }}>{t('energyLevelQuestion')}</p>
                                            <Question
                                                id="energy_scale"
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
                                                onSelect={(id, val) => setAvatarDo(val)}
                                                options={avatarDoOptions[language] || avatarDoOptions.en}
                                                showOther={false}
                                                singleSelect={true}
                                            />
                                        </div>
                                    )}

                                    {currentStep === 6 && (
                                        <div className="fade-in">
                                            <InputQuestion
                                                id="avatar_need"
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

                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                                    {currentStep > 1 && !isLoading && currentStep !== 4 && (
                                        <PrimaryButton
                                            text={t('previous')}
                                            onClick={() => setCurrentStep(prev => prev - 1)}
                                            style={{ background: 'transparent', color: '#666', border: '1px solid #ccc' }}
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
                                            text={isLoading ? t('processingAI') : (isRtl ? 'צור דמות' : 'Generate')}
                                            onClick={handleGenerateAvatar}
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
                                            text={isLoading ? t('processingAI') : t('updateWeatherBtn')}
                                            onClick={handleFinalSubmit}
                                            disabled={isLoading || !isStepComplete()}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="avatar-display fade-in" style={{ marginTop: '50px' }}>
                                <img src={avatarUrl} alt="Daily Creature" style={{ maxWidth: '600px', width: '90%', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} />
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default HomePageLogin;