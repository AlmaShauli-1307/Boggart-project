import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import { getNames } from 'country-list';
import languages from 'iso-639-1';
import { useNavigate, useLocation } from 'react-router-dom';
import './PersonalQuestionnaire.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import CustomStyledSelect from "../generalComponents/CustomStyledSelect";

const PersonalQuestionnaire = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [responses, setResponses] = useState({});
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // שדה להצגת שגיאות (כמו סיסמה תפוסה)
    const location = useLocation();
    const form1Id = location.state?.form1Id || null;
    const promptText = location.state?.prompt || "";

    const countryNames = Object.values(getNames());
    const languageNames = languages.getAllNames();

    const translateOption = (optionKey) => {
        const translations = {
            'Male': t('male'), 'Female': t('female'), 'Non-binary / Third gender': t('nonBinary'),
            'Other': t('other'), 'Prefer not to say': t('preferNotToSay'),
            'Judaism': t('judaism'), 'Islam': t('islam'), 'Christianity': t('christianity'),
            'Hinduism': t('hinduism'), 'Buddhism': t('buddhism'), 'Non-religious / Atheist': t('nonReligious'),
            'Lower income': t('lowerIncome'), 'Lower-middle income': t('lowerMiddleIncome'),
            'Middle income': t('middleIncome'), 'Upper-middle income': t('upperMiddleIncome'),
            'Upper income': t('upperIncome'), 'No formal schooling': t('noFormalSchooling'),
            'Primary education': t('primaryEducation'), 'High school diploma or equivalent': t('highSchool'),
            'Some college / vocational training': t('someCollege'), "Bachelor's degree": t('bachelors'),
            "Master's degree": t('masters'), 'Doctoral degree (PhD)': t('doctorate'),
        };
        return translations[optionKey] || optionKey;
    };

    // מערך השאלות המעודכן עם שם משתמש וסיסמה בראש הרשימה
    const questions = [
        {
            id: "username",
            text: language === 'he' ? "שם משתמש" : "Username",
            options: [],
            questionType: "shortText",
        },
        {
            id: "password",
            text: language === 'he' ? "סיסמה" : "Password",
            options: [],
            questionType: "password",
        },
        { id: 82, text: t('name'), options: [], questionType: "shortText" },
        { id: 83, text: t('date'), options: [], questionType: "date" },
        { id: 84, text: t('age'), options: [], questionType: "number" },
        {
            id: 85,
            text: t('gender'),
            options: ["Male", "Female", "Non-binary / Third gender", "Other", "Prefer not to say"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 86,
            text: t('religion'),
            options: ["Judaism", "Islam", "Christianity", "Hinduism", "Buddhism", "Non-religious / Atheist", "Prefer not to say", "Other"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 87,
            text: t('nationality'),
            options: countryNames.map(country => ({ value: country, label: country })),
            questionType: "dropdown",
        },
        {
            id: 88,
            text: t('motherTongue'),
            options: languageNames.map(lang => ({ value: lang, label: lang })),
            questionType: "dropdown",
        },
        {
            id: 89,
            text: t('socioEconomic'),
            options: ["Lower income", "Lower-middle income", "Middle income", "Upper-middle income", "Upper income", "Prefer not to say"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 90,
            text: t('education'),
            options: ["No formal schooling", "Primary education", "High school diploma or equivalent", "Some college / vocational training", "Bachelor's degree", "Master's degree", "Doctoral degree (PhD)", "Prefer not to say"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 91,
            text: t('painDiagnosis'),
            options: [],
            questionType: "shortText",
        },
    ];

    useEffect(() => {
        const allAnswered = questions.every(q =>
            q.id === 91 ||
            (responses[q.id] !== undefined && responses[q.id] !== null && responses[q.id] !== "")
        );
        setAllQuestionsAnswered(allAnswered);
    }, [responses]);

    const handleOptionSelect = (questionId, value) => {
        setErrorMessage(""); // איפוס שגיאה כשמתחילים להקליד
        setResponses({
            ...responses,
            [questionId]: value
        });
    };

    const handleSubmit = async () => {
        if (!form1Id) {
            console.error('❌ Form3 - No form1Id available');
            alert(t('errorMissingConnection'));
            navigate('/questionnaire-before');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            // שימוש בכתובת לוקלית לבדיקה
            const response = await fetch('http://localhost:5000/submit-personal-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: responses,
                    form1Id: parseInt(form1Id)
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Form personal - Saved successfully:', data);
                navigate('/meet-your-pain', {
                    state: {
                        form1Id: form1Id,
                        selectedImage: location.state?.selectedImage,
                        selectedImageIndex: location.state?.selectedImageIndex,
                        prompt: promptText,
                        answers: responses,
                        detailedAnswers: location.state?.detailedAnswers,
                        allAnswers: { ...location.state?.detailedAnswers, ...responses }
                    }
                });
            } else {
                if (data.error === "USERNAME_TAKEN") {
                    setErrorMessage(language === 'he' ? "שם המשתמש כבר תפוס, בחר שם אחר" : "Username already taken. Please choose another.");
                } else if (data.error === "PASSWORD_TAKEN") {
                    setErrorMessage(language === 'he' ? "הסיסמה כבר קיימת במערכת, בחר סיסמה אחרת" : "This password is already taken. Please choose another.");
                } else {
                    setErrorMessage(data.message || "Error submitting data");
                }
            }
        } catch (error) {
            console.error('❌ Error submitting personal info:', error);
            setErrorMessage("Connection error to local server.");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="form-page" dir={language === 'he' ? 'rtl' : 'ltr'} lang={language}>
            <LanguageToggle />
            <header className="form-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>
            <div className="form-container">
                <main className="form-content">
                    <div className="instructions">
                        <p className="instructions-text">
                            {t('personalInfoInstructions')}
                        </p>
                    </div>

                    <div className="questionnaire">
                        <div className="question-item">
                            <div className="question-grid">
                                {questions.map((question) => {
                                    // טיפול בשדות טקסט וסיסמה
                                    if (question.questionType === "shortText" || question.questionType === "password") {
                                        return (
                                            <input
                                                key={question.id}
                                                id={question.id}
                                                type={question.questionType === "password" ? "password" : "text"}
                                                className="input-personal-question-field"
                                                value={responses[question.id] || ''}
                                                onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                                placeholder={question.text}
                                                style={{ textAlign: language === 'he' ? 'right' : 'left' }}
                                            />
                                        );
                                    }
                                    else if (question.questionType === "number") {
                                        return (
                                            <input
                                                key={question.id}
                                                id={question.id}
                                                type="number"
                                                className="input-personal-question-field"
                                                value={responses[question.id] || ''}
                                                onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                                placeholder={question.text}
                                                min="0"
                                                style={{ textAlign: language === 'he' ? 'right' : 'left' }}
                                            />
                                        );
                                    }
                                    else if (question.questionType === "date") {
                                        return (
                                            <input
                                                key={question.id}
                                                id={question.id}
                                                type="text"
                                                className="input-personal-question-field"
                                                value={responses[question.id] || ''}
                                                onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                                                placeholder={question.text}
                                                style={{ textAlign: language === 'he' ? 'right' : 'left' }}
                                            />
                                        );
                                    }
                                    else if (question.questionType === "dropdown") {
                                        return (
                                            <CustomStyledSelect
                                                key={question.id}
                                                question={question}
                                                value={responses[question.id]}
                                                onChange={handleOptionSelect}
                                            />
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    </div>

                    {/* הצגת הודעת שגיאה במידה והסיסמה תפוסה */}
                    {errorMessage && (
                        <div style={{ color: 'red', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
                            {errorMessage}
                        </div>
                    )}

                    <div className="navigation">
                        <PrimaryButton
                            text={isSubmitting ? t('submitting') : t('submit')}
                            onClick={handleSubmit}
                            disabled={!allQuestionsAnswered || isSubmitting}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PersonalQuestionnaire;