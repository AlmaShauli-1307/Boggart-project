import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from '../LanguageButton';
import Papa from 'papaparse';
import './DetailedQuestionnaire.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import ProgressIndicator from '../generalComponents/ProgressIndicator';
import QuestionShell from '../generalComponents/QuestionShell';
import useQuestionnaireNav, { isAnswered } from '../generalComponents/useQuestionnaireNav';
import ScrollHint from '../generalComponents/ScrollHint';
import useQuestionScreens from '../generalComponents/useQuestionScreens';
import Question from '../generalComponents/Question';
import BodyMapQuestionnaire from "./BodyMapQuestionnaire";
import InputQuestion from "../generalComponents/InputQuestion";
import ColorWheelQuestion from "./ColorWheelQuestion";
import CheckboxQuestion from "../generalComponents/CheckboxQuestion";
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

const DetailedQuestionnairePage = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [searchParams] = useSearchParams();
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [others, setOthers] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageData, setPageData] = useState({ title: '', instructions: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBodyParts, setSelectedBodyParts] = useState([]);
    const [form1Id, setForm1Id] = useState(null);
    const [intensityFromForm1, setIntensityFromForm1] = useState(null);
    const location = useLocation();
    const isDemo = location.state?.isDemo || false;
    const API_BASE_URL = process.env.REACT_APP_API_URL;

    // Phones: at most 3 questions per screen (UX 3.3)
    const screens = useQuestionScreens({
        questions, currentPage, totalPages,
        keepTogether: () => false,
    });
    const { showErrors, tryAdvance } = useQuestionnaireNav(`${currentPage}-${screens.subPage}`);

    useEffect(() => {
        if (isDemo) {
            console.log('🎭 Demo mode - skipping form1Id check');
            setForm1Id('demo');
            return;
        }

        const urlForm1Id = searchParams.get('form1Id');
        const urlIntensity = searchParams.get('intensity');

        if (urlForm1Id) {
            setForm1Id(urlForm1Id);
            console.log('📥 Form2 - Got form1Id from URL:', urlForm1Id);
        } else {
            console.error('⚠️ Form2 - No form1Id in URL! Redirecting to Form1');
            alert('Please complete Form 1 first');
            navigate('/questionnaire-before');
        }

        if (urlIntensity) {
            setIntensityFromForm1(parseFloat(urlIntensity));
        }
    }, [searchParams, navigate, isDemo]);

    const getLatestForm1Id = async () => {

        try {
            const response = await fetch(`${API_BASE_URL}/get-latest-form1-id`);
            const data = await response.json();

            if (data.success && data.form1Id) {
                setForm1Id(data.form1Id);
                console.log('📥 Form2 - Got latest form1Id from server:', data.form1Id);
            } else {
                console.error('⚠️ Form2 - No form1Id found! Redirecting to Form1');
                alert('Please complete Form 1 first');
                navigate('/questionnaire-before');
            }
        } catch (error) {
            console.error('❌ Error getting form1Id:', error);
            alert('Error connecting to server. Please try again.');
            navigate('/questionnaire-before');
        }
    };

    // Load questions from CSV
    useEffect(() => {
        fetch('/Second_Questionnaire.csv')
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

    useEffect(() => {
        if (questions.length > 0 && currentPage > 0) {
            const currentPageQuestions = questions.filter(q => Number(q.Page) === currentPage);
            if (currentPageQuestions.length > 0) {
                const pageInfo = currentPageQuestions[0];

                setPageData(prev => ({
                    ...prev,
                    instructions: language === 'he'
                        ? (pageInfo['Instructions_Hebrew'] || pageInfo.Instructions)
                        : pageInfo.Instructions
                }));
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
        } else {
            setPageData({ title: '', instructions: '' });
        }
    };


    useEffect(() => {
        handleOptionSelect(117, selectedBodyParts);
    }, [selectedBodyParts]);


    const getCurrentPageQuestions = () => screens.currentQuestions;

    const handleOptionSelect = (questionId, value) => {
        setResponses({
            ...responses,
            [questionId]: value
        });
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
        // Process "other" values
        const updatedResponses = { ...responses };
        Object.keys(others).forEach((questionId) => {
            const otherValue = others[questionId];
            if (otherValue.trim() !== '') {
                if (Array.isArray(updatedResponses[questionId])) {
                    // Append to existing array
                    updatedResponses[questionId] = [...updatedResponses[questionId], otherValue];
                } else {
                    // Create a new array with the other value
                    updatedResponses[questionId] = [otherValue];
                }
            }
        });

        // Update responses and reset others
        setResponses(updatedResponses);
        setOthers({});

        // Next screen within the same page (phones)
        if (!screens.isLastScreenOfPage) {
            screens.nextSubPage();
            return;
        }

        // Navigate to the next page
        if (currentPage < totalPages) {
            setCurrentPage((prev) => {
                const nextPage = prev + 1;
                updatePageData(questions, nextPage);
                screens.enterPage(nextPage);
                return nextPage;
            });
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            if (isDemo) {
                console.log('🎭 Demo mode - generating image without saving');
                const response = await fetch(`${API_BASE_URL}/generate-prompt-demo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ answers: responses, intensity: 5 })
                });
                const data = await response.json();
                startImageGeneration(data.prompt, 'demo');
                navigate('/meet-your-pain', {
                    state: {
                        prompt: data.prompt,
                        detailedAnswers: responses,
                        isDemo: true,
                        form1Id: 'demo'
                    }
                });
                return;
            }

            if (!form1Id) {
                alert('Error: Form 1 ID missing.');
                navigate('/questionnaire-before');
                return;
            }
            console.log('📤 Form2 - Submitting with form1Id:', form1Id);
            console.log('📤 Form2 - Submitting responses:', responses);

            const response = await fetch(`${API_BASE_URL}/submit-form2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: responses,
                    form1Id: parseInt(form1Id),
                    intensityFromForm1: intensityFromForm1
                }),
            });

            const data = await response.json();
            console.log('✅ Form2 - Response from server:', data);

            if (response.ok) {
                if (data.prompt) {
                    startImageGeneration(data.prompt, form1Id);
                }

                navigate('/questionnaire-personal', {
                    state: {
                        form1Id: form1Id,
                        prompt: data.prompt || "",
                        detailedAnswers: responses
                    }
                });
            } else {
                throw new Error(data.message || 'Form 2 submission failed');
            }

        } catch (error) {
            console.error('❌ Error submitting Form 2:', error);
            alert('Error submitting Form 2: ' + error.message);
        }
        setIsSubmitting(false);
    };

    const startImageGeneration = async (prompt, form1Id) => {
        try {
            await fetch(`${API_BASE_URL}/api/create-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    form1Id: form1Id
                })
            });
            console.log('Image generation started in background');
        } catch (error) {
            console.error('Error starting image generation:', error);
        }
    };
    // Determine if this is a special page type
    const isPainLocationPage = pageData.title === 'Pain Location';

    // Format questions for our Question component
    const formattedQuestions = getCurrentPageQuestions().map(q => {
        let scaleOptions = [];
        let textOptions = null;

        // Determine options based on scale min/max or defined options
        if (q.scale_min !== null && q.scale_max !== null) {
            // Numeric scale (e.g., 1-5, 1-10)
            for (let i = q.scale_min; i <= q.scale_max; i++) {
                scaleOptions.push(i);
            }
        } else if (q.options || q.options_Hebrew) {
            // Text options from CSV. The saved value is always the English
            // option (same in both languages); only the label is translated.
            const englishOptions = (q.options || q.options_Hebrew || '').split(', ');
            const hebrewOptions = (q.options_Hebrew || '').split(', ');
            textOptions = englishOptions.map((value, i) => ({
                value,
                label: language === 'he' && hebrewOptions[i] ? hebrewOptions[i] : value,
            }));
        } else {
            // Default to 1-5 scale
            scaleOptions = [1, 2, 3, 4, 5];
        }

        // Get labels with fallback
        const leftLabel = language === 'he'
            ? (q.left_label_Hebrew || q.left_label)
            : q.left_label;

        const rightLabel = language === 'he'
            ? (q.right_label_Hebrew || q.right_label)
            : q.right_label;

        return {
            id: q.question_ID,
            text: language === 'he' ? (q.Question_Hebrew || q.Question) : q.Question,
            scaleOptions: scaleOptions,  // For scale questions [1,2,3,4,5]
            options: textOptions,         // For multi-choice questions or null
            questionType: q.question_type,
            left_label: leftLabel,
            right_label: rightLabel,
        };
    });


    const handleOtherOptionSelect = (questionId, value) => {
        setOthers({
            ...others,
            [questionId]: value
        });
    }


    // תצוגת השאלון הרגילה
    // Questions on this page that still need an answer (UX 1.3: "Next" stays
    // clickable and points the user to these instead of being greyed out)
    const missingIds = getCurrentPageQuestions()
        .filter(q => q.question_ID === 117
            ? selectedBodyParts.length === 0
            : !(isAnswered(responses[q.question_ID]) || isAnswered(others[q.question_ID])))
        .map(q => q.question_ID);

    const shell = (id, element) => element && (
        <QuestionShell key={id} id={id} missing={showErrors && missingIds.includes(id)}>
            {element}
        </QuestionShell>
    );

    return (
        <div className="form-page" lang={language}>
            < LanguageToggle />
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
                        {/* Special case for pain scale page */}
                        {isPainLocationPage && formattedQuestions.map(question => shell(question.id, (
                            <BodyMapQuestionnaire
                                key="body-map"
                                selectedBodyParts={selectedBodyParts}
                                setSelectedBodyParts={setSelectedBodyParts}
                            />
                        )))}
                        {/* Regular questions for all other pages */}
                        {!isPainLocationPage && formattedQuestions.map(question => shell(question.id, (() => {
                            if (question.questionType === 'scale') {
                                return (<Question
                                    key={question.id}
                                    id={question.id}
                                    text={question.text}
                                    selectedValue={responses[question.id]}
                                    onSelect={handleOptionSelect}
                                    leftLabel={question.left_label}
                                    rightLabel={question.right_label}
                                    options={question.scaleOptions}
                                />)
                            }
                            else if (question.questionType === 'number' || question.questionType === 'longText' || question.questionType === 'shortText') {
                                return (
                                    <InputQuestion
                                        key={question.id}
                                        id={question.id}
                                        text={question.text}
                                        selectedValue={responses[question.id]}
                                        onChange={handleOptionSelect}
                                        inputType={question.questionType}
                                    />
                                );
                            }
                            else if (question.questionType === 'color_select') {
                                return (
                                    <ColorWheelQuestion
                                        key={question.id}
                                        id={question.id}
                                        text={question.text}
                                        onSelect={handleOptionSelect}
                                        selectedColor={responses[question.id]} />
                                );
                            }
                            else if (question.questionType === 'multi_choice') {
                                return <CheckboxQuestion
                                    key={question.id}
                                    id={question.id}
                                    text={question.text}
                                    other={others[question.id]}
                                    selectedValues={responses[question.id]}
                                    onSelect={handleOptionSelect}
                                    onOther={handleOtherOptionSelect}
                                    options={question.options} />
                            }
                            return null;
                        })()))}
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
                                text={isSubmitting ? t('submitting') : t('visualize')}
                                onClick={() => tryAdvance(missingIds, handleSubmit)}
                                disabled={isSubmitting || (!form1Id && !isDemo)}
                            />
                        )}
                    </div>

                    <ProgressIndicator current={screens.screenNumber} total={screens.screenTotal} />

                    <ScrollHint watch={`${currentPage}-${screens.subPage}`} />
                </main>
            </div>
        </div >
    );
};

export default DetailedQuestionnairePage;