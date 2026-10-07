import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import Papa from 'papaparse';
import './QuestionnairePage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import ProgressIndicator from '../generalComponents/ProgressIndicator';
import useQuestionnaireNav from '../generalComponents/useQuestionnaireNav';
import ScaleLegend from '../generalComponents/ScaleLegend';
import Question from '../generalComponents/Question';
import PainScaleQuestion from './PainScaleQuestion';
import EmotionScalePage from './EmotionScalePage';
import BodyMapQuestionnaire from '../boggartForm/BodyMapQuestionnaire';
import InputQuestion from '../generalComponents/InputQuestion';

const YES_NO_QUESTION_ID = 101;
const BODY_MAP_QUESTION_ID = 102;

const QuestionnairePageBefore = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    useQuestionnaireNav(currentPage);
    const [pageData, setPageData] = useState({ title: '', instructions: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentScale, setCurrentScale] = useState({});
    const [showScale, setShowScale] = useState(false);

    // מצב לשאלת BodyMap
    const [selectedBodyParts, setSelectedBodyParts] = useState([]);
    const [mostPainfulPart, setMostPainfulPart] = useState(null);

    const location = useLocation();
    const introData = location.state?.introData || null;

    useEffect(() => {
        if (!introData) {
            console.warn('⚠️ No introData found, redirecting to introduction page');
            navigate('/introduction');
            return;
        }
    }, [introData, navigate]);

    useEffect(() => {
        fetch(`/First_Questionnaire.csv`)
            .then(response => response.text())
            .then(text => {
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const validQuestions = results.data.filter(q => q.question_ID !== null && q.question_ID !== undefined);
                        setQuestions(validQuestions);
                        const maxPage = Math.max(...validQuestions.map(q => Number(q.Page)));
                        setTotalPages(maxPage);
                        updatePageData(validQuestions, 1);
                    }
                });
            })
            .catch(error => console.error('❌ Error loading CSV:', error));
    }, []);

    useEffect(() => {
        if (questions.length > 0 && currentPage > 0) {
            const currentPageQuestions = questions.filter(q => Number(q.Page) === currentPage);
            if (currentPageQuestions.length > 0) {
                const pageInfo = currentPageQuestions[0];
                const pageTitle = pageInfo['Page Title'];

                setPageData(prev => ({
                    ...prev,
                    instructions: language === 'he'
                        ? (pageInfo['Instructions_Hebrew'] || pageInfo.Instructions)
                        : pageInfo.Instructions
                }));

                if (pageTitle !== 'VAS' && pageTitle !== 'SAM' && pageInfo.scale_labels) {
                    const scaleObj = {};
                    let min = pageInfo.scale_min || 1;
                    const labelsColumn = language === 'he'
                        ? (pageInfo.scale_labels_Hebrew || pageInfo.scale_labels)
                        : pageInfo.scale_labels;
                    const labels = labelsColumn.split(',');
                    for (let i = 0; i < labels.length; i++) {
                        scaleObj[min + i] = labels[i].trim();
                    }
                    setCurrentScale(scaleObj);
                }
            }
        }
    }, [language]);

    const updatePageData = (data, page) => {
        const pageQuestions = data.filter(q => Number(q.Page) === page);

        if (pageQuestions.length > 0) {
            const pageInfo = pageQuestions[0];
            setPageData({
                title: pageInfo['Page Title'] || '',
                instructions: language === 'he'
                    ? (pageInfo['Instructions_Hebrew'] || pageInfo.Instructions)
                    : pageInfo.Instructions
            });

            const hasScaleLabels = !!pageInfo.scale_labels;
            setShowScale(hasScaleLabels);

            if (hasScaleLabels) {
                const scaleObj = {};
                let min = pageInfo.scale_min !== undefined ? pageInfo.scale_min : 1;
                let max = pageInfo.scale_max !== undefined ? pageInfo.scale_max : 5;

                if (pageInfo.scale_labels) {
                    const labelsColumn = language === 'he'
                        ? (pageInfo.scale_labels_Hebrew || pageInfo.scale_labels)
                        : pageInfo.scale_labels;
                    const labels = labelsColumn.split(',');
                    for (let i = 0; i < labels.length; i++) {
                        scaleObj[min + i] = labels[i].trim();
                    }
                } else {
                    for (let i = min; i <= max; i++) {
                        if (i === min) scaleObj[i] = pageInfo.left_label || 'Strongly Disagree';
                        else if (i === max) scaleObj[i] = pageInfo.right_label || 'Strongly Agree';
                        else if (i === Math.floor((min + max) / 2)) scaleObj[i] = 'Neither agree nor disagree';
                        else if (i < Math.floor((min + max) / 2)) scaleObj[i] = 'Disagree';
                        else scaleObj[i] = 'Agree';
                    }
                }
                setCurrentScale(scaleObj);
            } else {
                setCurrentScale({});
            }
        } else {
            setPageData({ title: '', instructions: '' });
            setCurrentScale({});
            setShowScale(false);
        }
    };

    // בדיקת השלמת שאלות בעמוד הנוכחי
    useEffect(() => {
        const currentPageQuestions = getCurrentPageQuestions();

        if (currentPageQuestions.length === 0) {
            setAllQuestionsAnswered(true);
            return;
        }

        const allAnswered = currentPageQuestions.every(q => {
            if (q.question_ID === BODY_MAP_QUESTION_ID) {
                // BodyMap — צריך לפחות אזור אחד וגם אזור הכי כואב
                return selectedBodyParts.length > 0 && mostPainfulPart !== null;
            }
            return responses[q.question_ID] !== undefined && responses[q.question_ID] !== null;
        });

        setAllQuestionsAnswered(allAnswered);
    }, [responses, currentPage, questions, selectedBodyParts, mostPainfulPart]);

    // סנכרון BodyMap לתוך responses
    useEffect(() => {
        if (selectedBodyParts.length > 0 || mostPainfulPart) {
            setResponses(prev => ({
                ...prev,
                [BODY_MAP_QUESTION_ID]: {
                    painAreas: selectedBodyParts,
                    mostPainful: mostPainfulPart
                }
            }));
        }
    }, [selectedBodyParts, mostPainfulPart]);


    const getCurrentPageQuestions = () => {
        return questions.filter(q => Number(q.Page) === currentPage);
    };

    const handleOptionSelect = (questionId, value) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => {
                const prevPage = prev - 1;
                updatePageData(questions, prevPage);
                return prevPage;
            });
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => {
                const nextPage = prev + 1;
                updatePageData(questions, nextPage);
                return nextPage;
            });
        }
    };

    const handleSubmit = async () => {
        if (!introData) {
            alert('Error: Missing consent data. Please start from the beginning.');
            navigate('/introduction');
            return;
        }

        setIsSubmitting(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL;

        try {
            const requestBody = { answers: responses, introData };
            const response = await fetch(`${API_BASE_URL}/submit-form1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (data.form1Id) {
                navigate(`/form2?form1Id=${data.form1Id}&intensity=${responses[24]}`);
            } else {
                alert('Form 1 submitted but no ID received');
                navigate('/landing-boggart');
            }
        } catch (error) {
            console.error('❌ Error submitting Form 1:', error);
            alert('An error occurred while submitting Form 1.');
            navigate('/landing-boggart');
        }
        setIsSubmitting(false);
    };

    const isVAS = pageData.title === 'VAS';
    const isSAM = pageData.title === 'SAM';

    const currentPageQuestions = getCurrentPageQuestions();
    const hasBodyMap = currentPageQuestions.some(q => q.question_ID === BODY_MAP_QUESTION_ID);
    const hasYesNo = currentPageQuestions.some(q => q.question_ID === YES_NO_QUESTION_ID);

    const formattedQuestions = currentPageQuestions
        .filter(q => q.question_ID !== BODY_MAP_QUESTION_ID)
        .map(q => {
            let options = [];
            if (q.question_ID === YES_NO_QUESTION_ID) {
                options = language === 'he' ? ['כן', 'לא'] : ['Yes', 'No'];
            } else if (q.scale_min !== undefined && q.scale_max !== undefined) {
                const minStr = String(q.scale_min);
                const maxStr = String(q.scale_max);
                const isPercent = minStr.includes('%') || maxStr.includes('%');
                if (isPercent) {
                    const min = parseInt(minStr);
                    const max = parseInt(maxStr);
                    for (let i = min; i <= max; i += 10) options.push(`${i}%`);
                } else {
                    for (let i = q.scale_min; i <= q.scale_max; i++) options.push(i);
                }
            } else if (q.options) {
                options = q.options.split(',').map(opt => opt.trim());
            } else {
                options = [1, 2, 3, 4, 5];
            }

            return {
                id: q.question_ID,
                text: language === 'he' ? q.Question_Hebrew : q.Question,
                options,
                questionType: q.question_ID === YES_NO_QUESTION_ID ? 'yes_no' : q.question_type,
                scaleMin: q.scale_min,
                scaleMax: q.scale_max,
                leftLabel: language === 'he' ? (q.left_label_Hebrew || q.left_label) : q.left_label,
                rightLabel: language === 'he' ? (q.right_label_Hebrew || q.right_label) : q.right_label,
            };
        });


    return (
        <div className="form-page" lang={language}>
            <LanguageToggle />
            <header className="form-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>
            <div className="form-container">
                <main className="form-content">
                    {!isSAM && pageData.instructions && (
                        <div className="instructions">
                            <p className="instructions-text">{pageData.instructions}</p>
                        </div>
                    )}

                    {showScale && !isVAS && !isSAM && Object.keys(currentScale).length > 0 && (
                        <ScaleLegend scale={currentScale} />
                    )}

                    <div className="questionnaire">
                        {isVAS && formattedQuestions.map(question => (
                            <PainScaleQuestion
                                key={question.id}
                                id={question.id}
                                text={question.text}
                                selectedValue={responses[question.id]}
                                onSelect={handleOptionSelect}
                                min={0}
                                max={10}
                            />
                        ))}

                        {isSAM && (
                            <EmotionScalePage
                                questions={formattedQuestions}
                                responses={responses}
                                onSelect={handleOptionSelect}
                            />
                        )}

                        {!isVAS && !isSAM && formattedQuestions.map(question => {
                            if (question.questionType === 'yes_no') {
                                return (
                                    <div key={question.id} className="question-item">
                                        <p className="question-text">{question.text}</p>
                                        <div className="rating-table-container">
                                            <table className="rating-table">
                                                <tbody>
                                                    <tr>
                                                        {question.options.map(opt => (
                                                            <td
                                                                key={opt}
                                                                className={`rating-cell ${responses[question.id] === opt ? 'selected' : ''}`}
                                                                onClick={() => handleOptionSelect(question.id, opt)}
                                                            >
                                                                {opt}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            }
                            if (question.questionType === 'shortText') {
                                return (
                                    <InputQuestion
                                        key={question.id}
                                        id={question.id}
                                        text={question.text}
                                        selectedValue={responses[question.id]}
                                        onChange={handleOptionSelect}
                                        inputType="shortText"
                                    />
                                );
                            }
                            return (
                                <Question
                                    key={question.id}
                                    id={question.id}
                                    text={question.text}
                                    selectedValue={responses[question.id]}
                                    onSelect={handleOptionSelect}
                                    options={question.options}
                                    leftLabel={question.leftLabel}
                                    rightLabel={question.rightLabel}
                                />
                            );
                        })}

                        {hasBodyMap && (
                            <BodyMapQuestionnaire
                                selectedBodyParts={selectedBodyParts}
                                setSelectedBodyParts={setSelectedBodyParts}
                                mostPainfulPart={mostPainfulPart}
                                setMostPainfulPart={setMostPainfulPart}
                                showMostPainful={true}
                            />
                        )}
                    </div>

                    <div className="navigation">
                        {currentPage > 1 && (
                            <PrimaryButton
                                text={t('previous')}
                                onClick={handlePrevious}
                                className="previous-button"
                            />
                        )}
                        {currentPage < totalPages ? (
                            <PrimaryButton
                                text={t('next')}
                                onClick={handleNext}
                                disabled={!allQuestionsAnswered}
                            />
                        ) : (
                            <PrimaryButton
                                text={isSubmitting ? t('submitting') : t('submit')}
                                onClick={handleSubmit}
                                disabled={!allQuestionsAnswered || isSubmitting}
                            />
                        )}
                    </div>

                    <ProgressIndicator current={currentPage} total={totalPages} />
                </main>
            </div>
        </div>
    );
};

export default QuestionnairePageBefore;