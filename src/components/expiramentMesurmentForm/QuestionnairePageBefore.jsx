import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import Papa from 'papaparse';
import './QuestionnairePage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import ScaleLegend from '../generalComponents/ScaleLegend';
import Question from '../generalComponents/Question';
import PainScaleQuestion from './PainScaleQuestion';
import EmotionScalePage from './EmotionScalePage';

const QuestionnairePageBefore = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageData, setPageData] = useState({ title: '', instructions: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentScale, setCurrentScale] = useState({});
    const [showScale, setShowScale] = useState(false);
    const location = useLocation();
    const introData = location.state?.introData || null;

    useEffect(() => {
        if (!introData) {
            console.warn('⚠️ No introData found, redirecting to introduction page');
            navigate('/introduction');
            return;
        }
        console.log('✅ IntroData received:', introData);
    }, [introData, navigate]);

    // Load questions from CSV
    useEffect(() => {
        fetch(`/First_Questionnaire.csv`)
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

    // עדכן רק כשהשפה משתנה - אבל שמור על הדף הנוכחי!
    useEffect(() => {
        if (questions.length > 0 && currentPage > 0) {
            console.log('🔍 Language changed to:', language);
            console.log('🔍 Current page:', currentPage);

            const currentPageQuestions = questions.filter(q => Number(q.Page) === currentPage);
            if (currentPageQuestions.length > 0) {
                const pageInfo = currentPageQuestions[0];
                const pageTitle = pageInfo['Page Title'];

                console.log('🔍 Current page title:', pageTitle);

                // רק עדכן את ההוראות - אל תקראי ל-updatePageData!
                setPageData(prev => ({
                    ...prev,  // ✅ שמור הכל כמו שהיה
                    instructions: language === 'he'
                        ? (pageInfo['Instructions_Hebrew'] || pageInfo.Instructions)
                        : pageInfo.Instructions
                }));

                // עדכן את ה-scale labels רק אם יש scale וזה לא VAS/SAM
                if (pageTitle !== 'VAS' && pageTitle !== 'SAM' && pageInfo.scale_labels) {
                    const scaleObj = {};
                    let min = pageInfo.scale_min || 1;
                    let max = pageInfo.scale_max || 5;

                    const labelsColumn = language === 'he'
                        ? (pageInfo.scale_labels_Hebrew || pageInfo.scale_labels)
                        : pageInfo.scale_labels;

                    const labels = labelsColumn.split(',');
                    for (let i = 0; i < labels.length; i++) {
                        scaleObj[min + i] = labels[i].trim();
                    }

                    setCurrentScale(scaleObj);
                }
                // ✅ אל תשני את showScale!
            }
        }
    }, [language]); // רק language!

    // Update page data when current page changes
    const updatePageData = (data, page) => {
        const pageQuestions = data.filter(q => Number(q.Page) === page);

        if (pageQuestions.length > 0) {
            const pageInfo = pageQuestions[0];
            console.log('Page title:', pageInfo['Page Title']);
            setPageData({
                title: pageInfo['Page Title'] || '',
                instructions: language === 'he'
                    ? (pageInfo['Instructions_Hebrew'] || pageInfo.Instructions)
                    : pageInfo.Instructions
            });

            // Check if we should show scale based on CSV data
            const hasScaleLabels = !!pageInfo.scale_labels;
            const hasLeftRightLabels = !!pageInfo.left_label && !!pageInfo.right_label;
            const shouldShowScale = hasScaleLabels || hasLeftRightLabels;

            setShowScale(shouldShowScale);

            // Only set up scale if we should show it
            if (shouldShowScale) {
                // Set up the scale for the current page
                const scaleObj = {};
                let min = 1;
                let max = 5;

                // Find representative scale from first question
                if (pageInfo.scale_min !== undefined && pageInfo.scale_max !== undefined) {
                    min = pageInfo.scale_min;
                    max = pageInfo.scale_max;
                }

                // Try to get scale labels if available
                if (pageInfo.scale_labels) {
                    // ✅ בחר את העמודה הנכונה לפי השפה
                    const labelsColumn = language === 'he'
                        ? (pageInfo.scale_labels_Hebrew || pageInfo.scale_labels)
                        : pageInfo.scale_labels;

                    const labels = labelsColumn.split(',');
                    for (let i = 0; i < labels.length; i++) {
                        scaleObj[min + i] = labels[i].trim();
                    }
                } else {

                    // Create default scale from min to max
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

    // Check if all questions on current page are answered
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
        setResponses({
            ...responses,
            [questionId]: value
        });
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

        try {
            const requestBody = {
                answers: responses,
                introData: introData,
            };

            console.log('📤 Form1 - Sending to server:', JSON.stringify(requestBody, null, 2));

            const response = await fetch('http://localhost:5000/submit-form1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            console.log('✅ Form1 - Response from server:', JSON.stringify(data, null, 2));

            if (data.form1Id) {
                console.log('✅ Form1 - Success! form1Id:', data.form1Id);
                navigate(`/form2?form1Id=${data.form1Id}&intensity=${responses[24]}`);
            } else {
                console.error('❌ Form1 - No form1Id received from server:', data);
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

    // Determine if this is a special page type
    const isVAS = pageData.title === 'VAS';
    const isSAM = pageData.title === 'SAM';

    // Format questions for our Question component
    const formattedQuestions = getCurrentPageQuestions().map(q => {
        let options = [];

        // Determine options based on scale min/max or defined options
        if (q.scale_min !== undefined && q.scale_max !== undefined) {
            for (let i = q.scale_min; i <= q.scale_max; i++) {
                options.push(i);
            }
        } else if (q.options) {
            options = q.options.split(',').map(opt => opt.trim());
        } else {
            // Default to 1-5 scale
            options = [1, 2, 3, 4, 5];
        }

        return {
            id: q.question_ID,
            text: language === 'he' ? q.Question_Hebrew : q.Question,
            options: options,
            questionType: q.question_type,
            scaleMin: q.scale_min,
            scaleMax: q.scale_max
        };
    });

    // Calculate progress percentage
    const progressPercentage = (currentPage / totalPages) * 100;

    return (
        <div className="form-page" lang={language}>
            <LanguageToggle />
            <header className="form-header">
                <img src={logo} alt="Boggart" className="logo-image" />
            </header>
            <div className="form-container">
                <main className="form-content">
                    {/* Show instructions if available */}
                    {!isSAM && pageData.instructions && (
                        <div className="instructions">
                            <p className="instructions-text">
                                {pageData.instructions}
                            </p>
                        </div>
                    )}

                    {/* Show scale legend only when we have scale data and it's not a special page */}
                    {showScale && !isVAS && !isSAM && Object.keys(currentScale).length > 0 && (
                        <ScaleLegend scale={currentScale} />
                    )}

                    <div className="questionnaire">
                        {/* Special case for pain scale page */}
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

                        {/* Special case for emotion scale page */}
                        {isSAM && (
                            <EmotionScalePage
                                questions={formattedQuestions}
                                responses={responses}
                                onSelect={handleOptionSelect}
                            />
                        )}

                        {/* Regular questions for all other pages */}
                        {!isVAS && !isSAM && formattedQuestions.map(question => (
                            <Question
                                key={question.id}
                                id={question.id}
                                text={question.text}
                                selectedValue={responses[question.id]}
                                onSelect={handleOptionSelect}
                                options={question.options}
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

                    <div className="progress-bar">
                        <div
                            className="progress-indicator"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default QuestionnairePageBefore;