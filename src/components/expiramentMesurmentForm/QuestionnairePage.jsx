import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const QuestionnairePage = ({ csvName }) => {
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

    useEffect(() => {
        fetch(`/${csvName}.csv`)
            .then(response => response.text())
            .then(text => {
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        console.log('CSV Loaded:', results.data);
                        setQuestions(results.data);
                        const maxPage = Math.max(...results.data.map(q => Number(q.Page)));
                        setTotalPages(maxPage);
                        updatePageData(results.data, 1);
                    }
                });
            })
            .catch(error => console.error('❌ Error loading CSV:', error));
    }, []);

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

            // ScaleLegend רק כשיש scale_labels — לא כשיש רק left/right label
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

    useEffect(() => {
        const currentPageQuestions = getCurrentPageQuestions();
        if (currentPageQuestions.length === 0) {
            setAllQuestionsAnswered(true);
            return;
        }
        const allAnswered = currentPageQuestions.every(q =>
            responses[q.question_ID] !== undefined && responses[q.question_ID] !== null
        );
        setAllQuestionsAnswered(allAnswered);
    }, [responses, currentPage, questions]);


    const getCurrentPageQuestions = () => {
        return questions.filter(q => Number(q.Page) === currentPage);
    };

    const handleOptionSelect = (questionId, value) => {
        setResponses({ ...responses, [questionId]: value });
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
        setIsSubmitting(true);
        const API_BASE_URL = process.env.REACT_APP_API_URL;

        try {
            let endpoint = 'submit-form1';
            if (csvName === 'Third_Questionnaire') endpoint = 'submit-form3';

            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: responses, beforeAfter: 'Before' }),
            });

            const data = await response.json();

            if (data.form1Id) {
                navigate(`/form2?form1Id=${data.form1Id}`);
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

    const formattedQuestions = getCurrentPageQuestions().map(q => {
        let options = [];
        if (q.scale_min !== undefined && q.scale_max !== undefined) {
            for (let i = q.scale_min; i <= q.scale_max; i++) options.push(i);
        } else if (q.options) {
            options = q.options.split(',').map(opt => opt.trim());
        } else {
            options = [1, 2, 3, 4, 5];
        }

        return {
            id: q.question_ID,
            text: language === 'he' ? q.Question_Hebrew : q.Question,
            options,
            questionType: q.question_type,
            scaleMin: q.scale_min,
            scaleMax: q.scale_max,
            leftLabel: language === 'he' ? (q.left_label_Hebrew || q.left_label) : q.left_label,
            rightLabel: language === 'he' ? (q.right_label_Hebrew || q.right_label) : q.right_label,
        };
    });


    return (
        <div className="form-page">
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

                    {/* ScaleLegend רק כשיש scale_labels */}
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

                        {!isVAS && !isSAM && formattedQuestions.map(question => (
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
                        ))}
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

export default QuestionnairePage;