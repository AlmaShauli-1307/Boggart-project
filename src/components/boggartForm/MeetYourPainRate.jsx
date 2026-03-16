import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import { useNavigate, useLocation } from 'react-router-dom'; // וודאי שיש useLocation
import '../boggartForm/MeetYourPainRate.css';
import demoBoggart from '../../images/demoBoggart.png';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';


const MeetYourPainRate = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [responses, setResponses] = useState({});
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Get form1Id from previous page
    const location = useLocation();
    const isDemo = location.state?.isDemo || false;
    const form1Id = location.state?.form1Id || null;
    const selectedImage = location.state?.selectedImage || demoBoggart;
    const pageData = { instructions: t('introMeetYourPainRate') };
    const questions = React.useMemo(() => [
        {
            question_ID: 0,
            Question: t('question0'),
            scale_min: 1,
            scale_max: 10,
            type: "scale"
        },
        {
            question_ID: 1,
            Question: t('question1'),
            scale_min: 1,
            scale_max: 10,
            type: "scale"
        },
        {
            question_ID: 2,
            Question: t('question2'),
            type: "text"
        }
    ], []);
    useEffect(() => {

        if (questions.length === 0) {
            setAllQuestionsAnswered(true);
            return;
        }

        const allAnswered = questions.every(q =>
            responses[q.question_ID] !== undefined && responses[q.question_ID] !== null && responses[q.question_ID] !== ''
        );

        setAllQuestionsAnswered(allAnswered);
    }, [responses, questions]);

    const handleOptionSelect = (questionId, value) => {
        setResponses({
            ...responses,
            [questionId]: value
        });
    };

    const handleTextChange = (questionId, value) => {
        setResponses({
            ...responses,
            [questionId]: value
        });
    };

    // Function to submit answers
    const handleSubmit = async () => {
        if (isDemo) {
            navigate('/home-login');
            return;
        }

        if (!form1Id) {
            console.error('❌ Form-meet - No form1Id available for submission');
            alert('Error: Missing connection to previous forms. Please restart the process.');
            navigate('/questionnaire-before');
            return;
        }

        setIsSubmitting(true)
        const API_BASE_URL = process.env.REACT_APP_API_URL;
        try {

            console.log('📤 Form-meet - Submitting with form1Id:', form1Id);
            console.log('📤 Form-meet - Submitting responses:', responses);
            const response = await fetch(`${API_BASE_URL}/submit-meet-your-pain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: responses,
                    form1Id: parseInt(form1Id)
                }),
            });

            const data = await response.json();
            console.log('✅ Form-meet - Response from server:', data);

            if (response.ok) {
                console.log('🎯 Form-meet - Success! Navigating to Form3 with form1Id:', form1Id);
                // 🎯 העבר את form1Id ב-state ל-QuestionnairePageAfter
                navigate('/questionnaire-after', {
                    state: { form1Id: form1Id }
                });
            } else {
                throw new Error(data.error || 'Server error');
            }

        } catch (error) {
            console.error('❌ Error submitting answers:', error);
            navigate('/questionnaire-after');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-page">
            <LanguageToggle />
            <header className="form-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>
            <div className="form-container">
                <main className="form-content">
                    {/* Show instructions if available */}
                    {pageData.instructions && (
                        <div className="instructions">
                            <p className="instructions-text">
                                {pageData.instructions}
                            </p>
                        </div>
                    )}
                    <div className="questionnaire">
                        <div className="emotion-scale-page">
                            <div className="boggart-image-container">
                                <img
                                    src={selectedImage}  // השתמש בתמונה הנבחרת
                                    alt="Selected pain visualization"
                                    className="boggart-image"
                                />
                            </div>

                            <div className="emotion-scale-questions">
                                {questions.map(question => (
                                    <div key={question.question_ID} className="emotion-question-item">
                                        <p className="emotion-question-text">{question.Question}</p>
                                        {question.type === "scale" ? (
                                            <div className="scale-with-labels">
                                                <span className="scale-label-start">{language === 'he' ? 'מאוד' : 'Not at all'}</span>
                                                <div className="rating-table-container wide-scale">
                                                    <table className="rating-table wide-scale">
                                                        <tbody>
                                                            <tr>
                                                                {Array.from({ length: question.scale_max - question.scale_min + 1 },
                                                                    (_, i) => i + question.scale_min).map(value => (
                                                                        <td
                                                                            key={`${question.question_ID}-${value}`}
                                                                            className={`rating-cell ${responses[question.question_ID] === value ? 'selected' : ''}`}
                                                                            onClick={() => handleOptionSelect(question.question_ID, value)}
                                                                        >
                                                                            {value}
                                                                        </td>
                                                                    ))}
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <span className="scale-label-end">{language === 'he' ? 'בכלל לא' : 'Very much'}</span>
                                            </div>
                                        ) : (
                                            <div className="text-input-container">
                                                <textarea
                                                    className="text-input-field"
                                                    value={responses[question.question_ID] || ''}
                                                    onChange={(e) => handleTextChange(question.question_ID, e.target.value)}
                                                    placeholder={t('write')}
                                                    rows="5"
                                                    style={{ width: "400px" }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="navigation">
                        <PrimaryButton
                            text={t('next')}
                            onClick={handleSubmit}
                            disabled={!allQuestionsAnswered || isSubmitting}
                        />
                    </div>
                </main>
            </div >
        </div >
    );
};

export default MeetYourPainRate;