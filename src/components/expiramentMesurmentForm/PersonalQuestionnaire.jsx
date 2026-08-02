import React, { useState, useEffect, useMemo } from 'react';
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
    const [errorMessage, setErrorMessage] = useState("");
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 2;
    const location = useLocation();
    const form1Id = location.state?.form1Id || null;
    const promptText = location.state?.prompt || "";

    const languageNames = languages.getAllNames();

    const translateOption = useMemo(() => (optionKey) => {
        const translations = {
            'Male': t('male'), 'Female': t('female'), 'Intersex': t('intersex'),
            'Other': t('other'), 'Prefer not to say': t('preferNotToSay'),
            'Judaism': t('judaism'), 'Islam': t('islam'), 'Christianity': t('christianity'),
            'Hinduism': t('hinduism'), 'Buddhism': t('buddhism'), 'Non-religious / Atheist': t('nonReligious'),
            'Lower income': t('lowerIncome'), 'Lower-middle income': t('lowerMiddleIncome'),
            'Middle income': t('middleIncome'), 'Upper-middle income': t('upperMiddleIncome'),
            'Upper income': t('upperIncome'), 'No formal schooling': t('noFormalSchooling'),
            'Primary education': t('primaryEducation'), 'High school diploma or equivalent': t('highSchool'),
            'Some college / vocational training': t('someCollege'), "Bachelor's degree": t('bachelors'),
            "Master's degree": t('masters'), 'Doctoral degree (PhD)': t('doctorate'),
            'Full-time': language === 'he' ? 'משרה מלאה' : 'Full-time',
            'Part-time': language === 'he' ? 'משרה חלקית' : 'Part-time',
            'Student': language === 'he' ? 'סטודנט/ית' : 'Student',
            'Unemployed': language === 'he' ? 'מובטל/ת' : 'Unemployed',
            'Retired': language === 'he' ? 'גמלאי' : 'Retired',
            'Single': language === 'he' ? 'רווק/ה' : 'Single',
            'Partnered': language === 'he' ? 'בזוגיות' : 'Partnered',
            'Married': language === 'he' ? 'נשוי/אה' : 'Married',
            'Separated or divorced': language === 'he' ? 'פרוד/ה או גרוש/ה' : 'Separated or divorced',
            'Widowed': language === 'he' ? 'אלמן/ה' : 'Widowed',
            '3–6 months': language === 'he' ? '3–6 חודשים' : '3–6 months',
            '6–12 months': language === 'he' ? '6–12 חודשים' : '6–12 months',
            '1–3 years': language === 'he' ? '1–3 שנים' : '1–3 years',
            '3–10 years': language === 'he' ? '3–10 שנים' : '3–10 years',
            '>10 years': language === 'he' ? 'יותר מ-10 שנים' : '>10 years',
            'Lower back': language === 'he' ? 'גב תחתון' : 'Lower back',
            'Neck': language === 'he' ? 'צוואר' : 'Neck',
            'Head or migraine': language === 'he' ? 'ראש או מיגרנה' : 'Head or migraine',
            'Limbs': language === 'he' ? 'גפיים' : 'Limbs',
            'Widespread': language === 'he' ? 'כאב נרחב' : 'Widespread',
            'Abdomen or pelvis': language === 'he' ? 'בטן או אגן' : 'Abdomen or pelvis',
            'Analgesics': language === 'he' ? 'משככי כאבים' : 'Analgesics',
            'Antidepressants': language === 'he' ? 'נוגדי דיכאון' : 'Antidepressants',
            'Anxiolytics': language === 'he' ? 'נוגדי חרדה' : 'Anxiolytics',
            'Sleep aids': language === 'he' ? 'תרופות שינה' : 'Sleep aids',
            'Opioids': language === 'he' ? 'אופיואידים' : 'Opioids',
            'Yes': language === 'he' ? 'כן' : 'Yes',
            'No': language === 'he' ? 'לא' : 'No',
        };
        return translations[optionKey] || optionKey;
    }, [language, t]);

    const step1Questions = useMemo(() => [
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
        { id: 136, text: t('name'), options: [], questionType: "shortText" },
        { id: 137, text: t('date'), options: [], questionType: "date" },
        { id: 138, text: t('age'), options: [], questionType: "number" },
        {
            id: 139,
            text: t('sex'),
            options: ["Male", "Female", "Intersex", "Prefer not to say"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 140,
            text: t('religion'),
            options: [],
            questionType: "shortText",
        },
        {
            id: 141,
            text: t('nationality'),
            options: [],
            questionType: "shortText",
        },
        {
            id: 142,
            text: t('motherTongue'),
            options: languageNames.map(lang => ({ value: lang, label: lang })),
            questionType: "dropdown",
        },
        {
            id: 143,
            text: t('socioEconomic'),
            options: ["Lower income", "Lower-middle income", "Middle income", "Upper-middle income", "Upper income", "Prefer not to say"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 144,
            text: t('education'),
            options: ["No formal schooling", "Primary education", "High school diploma or equivalent", "Some college / vocational training", "Bachelor's degree", "Master's degree", "Doctoral degree (PhD)", "Prefer not to say"]
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
    ], [language, t, translateOption]);

    const step2Questions = useMemo(() => [
        {
            id: 145,
            text: t('employment'),
            options: ['Full-time', 'Part-time', 'Student', 'Unemployed', 'Retired', 'Prefer not to say']
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 146,
            text: t('relationship'),
            options: ['Single', 'Partnered', 'Married', 'Separated or divorced', 'Widowed', 'Prefer not to say']
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 147,
            text: t('chronicPain'),
            options: ['Yes', 'No'].map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "yesno",
        },
        {
            id: 148,
            text: t('painDuration'),
            options: ['3–6 months', '6–12 months', '1–3 years', '3–10 years', '>10 years']
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 149,
            text: t('painLocation'),
            options: ['Lower back', 'Neck', 'Head or migraine', 'Limbs', 'Widespread', 'Abdomen or pelvis', 'Other']
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 150,
            text: t('medication'),
            options: ['Yes', 'No'].map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "yesno",
        },
        {
            id: 151,
            text: t('medicationType'),
            options: ['Analgesics', 'Antidepressants', 'Anxiolytics', 'Sleep aids', 'Opioids', 'Other']
                .map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "dropdown",
        },
        {
            id: 152,
            text: t('psychological'),
            options: ['Yes', 'No'].map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "yesno",
        },
        {
            id: 153,
            text: t('medicalFollowUp'),
            options: ['Yes', 'No'].map(opt => ({ value: opt, label: translateOption(opt) })),
            questionType: "yesno",
        },
        {
            id: 154,
            text: t('painDiagnosis'),
            options: [],
            questionType: "shortText",
        },
    ], [language, t, translateOption]);

    const questions = currentStep === 1 ? step1Questions : step2Questions;

    const optionalQuestionIds = [155];

    const step1RequiredIds = step1Questions.map(q => q.id);
    const step2RequiredIds = step2Questions
        .filter(q => !optionalQuestionIds.includes(q.id))
        .map(q => q.id);

    const isStep1Complete = step1RequiredIds.every(id =>
        responses[id] !== undefined && responses[id] !== null && responses[id] !== ""
    );

    const isStep2Complete = step2RequiredIds.every(id =>
        responses[id] !== undefined && responses[id] !== null && responses[id] !== ""
    );

    useEffect(() => {
        setAllQuestionsAnswered(currentStep === 1 ? isStep1Complete : isStep2Complete);
    }, [responses, currentStep]);

    const handleOptionSelect = (questionId, value) => {
        setErrorMessage("");
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (isStep1Complete) {
            setCurrentStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        const API_BASE_URL = process.env.REACT_APP_API_URL;

        try {
            const response = await fetch(`${API_BASE_URL}/submit-personal-info`, {
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

    const renderQuestion = (question) => {
        if (question.questionType === "shortText" || question.questionType === "password") {
            return (
                <div key={question.id} className="field-wrapper">
                    <label className="field-label">{question.text}</label>
                    <input
                        id={question.id}
                        type={question.questionType === "password" ? "password" : "text"}
                        className="input-personal-question-field"
                        value={responses[question.id] || ''}
                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                        style={{ textAlign: language === 'he' ? 'right' : 'left' }}
                    />
                </div>
            );
        }
        else if (question.questionType === "number") {
            return (
                <div key={question.id} className="field-wrapper">
                    <label className="field-label">{question.text}</label>
                    <input
                        id={question.id}
                        type="number"
                        className="input-personal-question-field"
                        value={responses[question.id] || ''}
                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                        min="0"
                        style={{ textAlign: language === 'he' ? 'right' : 'left' }}
                    />
                </div>
            );
        }
        else if (question.questionType === "date") {
            return (
                <div key={question.id} className="field-wrapper">
                    <label className="field-label">{question.text}</label>
                    <input
                        id={question.id}
                        type="text"
                        className="input-personal-question-field"
                        value={responses[question.id] || ''}
                        onChange={(e) => handleOptionSelect(question.id, e.target.value)}
                        style={{ textAlign: language === 'he' ? 'right' : 'left' }}
                    />
                </div>
            );
        }
        else if (question.questionType === "dropdown") {
            return (
                <div key={question.id} className="field-wrapper">
                    <label className="field-label">{question.text}</label>
                    <CustomStyledSelect
                        question={{ ...question, text: '' }}
                        value={responses[question.id]}
                        onChange={handleOptionSelect}
                    />
                </div>
            );
        }
        else if (question.questionType === "yesno") {
            return (
                <div key={question.id} className="field-wrapper">
                    <label className="field-label">{question.text}</label>
                    <div className="rating-table-container">
                        <table className="rating-table">
                            <tbody>
                                <tr>
                                    {question.options.map(opt => (
                                        <td
                                            key={opt.value}
                                            className={`rating-cell ${responses[question.id] === opt.value ? 'selected' : ''}`}
                                            onClick={() => handleOptionSelect(question.id, opt.value)}
                                        >
                                            {opt.label}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
        return null;
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
                        <div className="question-grid">
                            {questions.map((question) => renderQuestion(question))}
                        </div>
                    </div>

                    {errorMessage && (
                        <div style={{ color: 'red', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>
                            {errorMessage}
                        </div>
                    )}

                    <div className="navigation step-navigation">
                        {currentStep === 2 && (
                            <PrimaryButton
                                text={t('previous')}
                                onClick={handleBack}
                                className="previous-button"
                            />
                        )}

                        {currentStep === 1 ? (
                            <PrimaryButton
                                text={t('next')}
                                onClick={handleNext}
                                disabled={!allQuestionsAnswered}
                            />
                        ) : (
                            <PrimaryButton
                                text={isSubmitting ? t('submitting') : t('submit')}
                                onClick={handleSubmit}
                                disabled={!isStep2Complete || isSubmitting}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PersonalQuestionnaire;