import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import Papa from 'papaparse';
import './QuestionnairePage.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import ProgressIndicator from '../generalComponents/ProgressIndicator';
import QuestionShell from '../generalComponents/QuestionShell';
import useQuestionnaireNav, { isAnswered } from '../generalComponents/useQuestionnaireNav';
import ScrollHint from '../generalComponents/ScrollHint';
import useQuestionScreens from '../generalComponents/useQuestionScreens';
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
    const [pageData, setPageData] = useState({ title: '', instructions: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentScale, setCurrentScale] = useState({});
    const [showScale, setShowScale] = useState(false);

    // Phones: at most 3 questions per screen (UX 3.3)
    const screens = useQuestionScreens({
        questions, currentPage, totalPages,
        keepTogether: (qs) => qs.some(q => q['Page Title'] === 'SAM'),
    });
    const { showErrors, tryAdvance } = useQuestionnaireNav(`${currentPage}-${screens.subPage}`);

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



    const getCurrentPageQuestions = () => screens.currentQuestions;

    const handleOptionSelect = (questionId, value) => {
        setResponses({ ...responses, [questionId]: value });
    };

    const handlePrevious = () => {
        if (screens.subPage > 0) {
            screens.prevSubPage();
            return;
        }
        if (currentPage > 1) {
            setCurrentPage(prev => {
                const prevPage = prev - 1;
                updatePageData(questions, prevPage);
                screens.enterPage(prevPage, true);
                return prevPage;
            });
        }
    };

    const handleNext = () => {
        if (!screens.isLastScreenOfPage) {
            screens.nextSubPage();
            return;
        }
        if (currentPage < totalPages) {
            setCurrentPage(prev => {
                const nextPage = prev + 1;
                updatePageData(questions, nextPage);
                screens.enterPage(nextPage);
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


    // End labels of the page legend, shown on mobile in place of the legend table (UX 1.1)
    const legendKeys = Object.keys(currentScale).map(Number).sort((a, b) => a - b);
    const hasLegend = showScale && !isVAS && !isSAM && legendKeys.length > 0;
    const legendLeft = hasLegend ? currentScale[legendKeys[0]] : undefined;
    const legendRight = hasLegend ? currentScale[legendKeys[legendKeys.length - 1]] : undefined;

    // Questions on this page that still need an answer (UX 1.3: "Next" stays
    // clickable and points the user to these instead of being greyed out)
    const missingIds = getCurrentPageQuestions()
        .filter(q => !isAnswered(responses[q.question_ID]))
        .map(q => q.question_ID);

    const shell = (id, element) => element && (
        <QuestionShell key={id} id={id} missing={showErrors && missingIds.includes(id)}>
            {element}
        </QuestionShell>
    );

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
                        {isVAS && formattedQuestions.map(question => shell(question.id, (
                            <PainScaleQuestion
                                key={question.id}
                                id={question.id}
                                text={question.text}
                                selectedValue={responses[question.id]}
                                onSelect={handleOptionSelect}
                                min={0}
                                max={10}
                            />
                        )))}

                        {isSAM && (
                            <EmotionScalePage
                                questions={formattedQuestions}
                                responses={responses}
                                onSelect={handleOptionSelect}
                                showErrors={showErrors}
                                missingIds={missingIds}
                            />
                        )}

                        {!isVAS && !isSAM && formattedQuestions.map(question => shell(question.id, (
                            <Question
                                key={question.id}
                                id={question.id}
                                text={question.text}
                                selectedValue={responses[question.id]}
                                onSelect={handleOptionSelect}
                                options={question.options}
                                leftLabel={question.leftLabel || legendLeft}
                                rightLabel={question.rightLabel || legendRight}
                                mobileOnlyLabels={!question.leftLabel && !question.rightLabel && hasLegend}
                            />
                        )))}
                    </div>

                    <div className="navigation">
                        {!screens.isFirstScreen && (
                            <PrimaryButton
                                text={t('previous')}
                                onClick={handlePrevious}
                                className="previous-button"
                            />
                        )}
                        {!screens.isLastScreen ? (
                            <PrimaryButton
                                text={t('next')}
                                onClick={() => tryAdvance(missingIds, handleNext)}
                            />
                        ) : (
                            <PrimaryButton
                                text={isSubmitting ? t('submitting') : t('submit')}
                                onClick={() => tryAdvance(missingIds, handleSubmit)}
                                disabled={isSubmitting}
                            />
                        )}
                    </div>

                    <ProgressIndicator current={screens.screenNumber} total={screens.screenTotal} />

                    <ScrollHint watch={`${currentPage}-${screens.subPage}`} />
                </main>
            </div>
        </div>
    );
};

export default QuestionnairePage;