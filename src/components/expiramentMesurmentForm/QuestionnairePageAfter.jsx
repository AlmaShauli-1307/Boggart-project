import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import { useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import axios from 'axios';
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
const CREATURE_IMAGE_QUESTION_PAGE = 3;

const QuestionnairePageAfter = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const location = useLocation();
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
    const [form1Id, setForm1Id] = useState(null);
    const [creatureImageUrl, setCreatureImageUrl] = useState(null);

    const [selectedBodyParts, setSelectedBodyParts] = useState([]);
    const [mostPainfulPart, setMostPainfulPart] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const id = location.state?.form1Id || null;
        if (!id) {
            alert('Error: Missing connection to previous forms. Please restart.');
            navigate('/home-login');
            return;
        }
        setForm1Id(id);

        // שלוף את תמונת הדמות האחרונה
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user?.username) {
            axios.get(`${API_BASE_URL}/api/get-last-creature/${user.username}`)
                .then(res => {
                    if (res.data.success && res.data.imageUrl) {
                        setCreatureImageUrl(res.data.imageUrl);
                    }
                })
                .catch(e => console.error('Failed to fetch creature image', e));
        }
    }, [location, navigate]);

    useEffect(() => {
        fetch('/Third_Questionnaire.csv')
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
                const labelsColumn = language === 'he'
                    ? (pageInfo.scale_labels_Hebrew || pageInfo.scale_labels)
                    : pageInfo.scale_labels;
                const labels = labelsColumn.split(',');
                for (let i = 0; i < labels.length; i++) {
                    scaleObj[min + i] = labels[i].trim();
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

    useEffect(() => {
        const currentPageQuestions = getCurrentPageQuestions();
        if (currentPageQuestions.length === 0) {
            setAllQuestionsAnswered(true);
            return;
        }
        const allAnswered = currentPageQuestions.every(q => {
            if (q.question_ID === BODY_MAP_QUESTION_ID) {
                return selectedBodyParts.length > 0 && mostPainfulPart !== null;
            }
            return responses[q.question_ID] !== undefined && responses[q.question_ID] !== null;
        });
        setAllQuestionsAnswered(allAnswered);
    }, [responses, currentPage, questions, selectedBodyParts, mostPainfulPart]);

    useEffect(() => {
        if (selectedBodyParts.length > 0 || mostPainfulPart) {
            setResponses(prev => ({
                ...prev,
                [BODY_MAP_QUESTION_ID]: { painAreas: selectedBodyParts, mostPainful: mostPainfulPart }
            }));
        }
    }, [selectedBodyParts, mostPainfulPart]);


    const getCurrentPageQuestions = () => questions.filter(q => Number(q.Page) === currentPage);

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
        if (!form1Id) {
            alert('Error: Form 1 ID missing. Please restart from Form 1.');
            navigate('/home-login');
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/submit-form3`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: responses, form1Id: parseInt(form1Id) }),
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/home-login');
            } else {
                throw new Error(data.message || 'Form 3 submission failed');
            }
        } catch (error) {
            console.error('❌ Error submitting Form 3:', error);
            alert('Error submitting Form 3: ' + error.message);
        }
        setIsSubmitting(false);
    };

    const isVAS = pageData.title === 'VAS';
    const isSAM = pageData.title === 'SAM';

    const currentPageQuestions = getCurrentPageQuestions();
    const hasBodyMap = currentPageQuestions.some(q => q.question_ID === BODY_MAP_QUESTION_ID);

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
                    for (let i = parseInt(minStr); i <= parseInt(maxStr); i += 10) options.push(`${i}%`);
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

                    {/* הצגת דמות מעל שאלה 116 בעמוד 3 */}
                    {currentPage === CREATURE_IMAGE_QUESTION_PAGE && creatureImageUrl && (
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <img
                                src={creatureImageUrl}
                                alt="Your creature"
                                style={{
                                    maxWidth: '300px',
                                    width: '80%',
                                    borderRadius: '15px',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                                }}
                            />
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
                            <PrimaryButton text={t('previous')} onClick={handlePrevious} className="previous-button" />
                        )}
                        {currentPage < totalPages ? (
                            <PrimaryButton text={t('next')} onClick={handleNext} disabled={!allQuestionsAnswered} />
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

export default QuestionnairePageAfter;