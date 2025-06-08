import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './DetailedQuestionnaire.css';
import logo from '../../images/logo.png';
import PrimaryButton from '../generalComponents/PrimaryButton';
import Question from '../generalComponents/Question';
import BodyMapQuestionnaire from "./BodyMapQuestionnaire";
import InputQuestion from "../generalComponents/InputQuestion";
import ColorWheelQuestion from "./ColorWheelQuestion";
import CheckboxQuestion from "../generalComponents/CheckboxQuestion";

const DetailedQuestionnairePage = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState({});
    const [others, setOthers] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageData, setPageData] = useState({ title: '', instructions: '' });
    const [totalPages, setTotalPages] = useState(1);
    const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBodyParts, setSelectedBodyParts] = useState([]);

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

    const updatePageData = (data, page) => {
        const pageQuestions = data.filter(q => Number(q.Page) === page);

        if (pageQuestions.length > 0) {
            const pageInfo = pageQuestions[0];
            setPageData({
                title: pageInfo['Page Title'] || '',
                instructions: pageInfo.Instructions || ''
            });
        } else {
            setPageData({ title: '', instructions: '' });
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

    useEffect(() => {
        handleOptionSelect(63, selectedBodyParts);
    }, [selectedBodyParts]);

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

        // Navigate to the next page
        if (currentPage < totalPages) {
            setCurrentPage((prev) => {
                const nextPage = prev + 1;
                updatePageData(questions, nextPage);
                return nextPage;
            });
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/submit-form2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: responses }),
            });

            const data = await response.json();
            console.log('✅ Response from server:', data);

            // במקום להציג MidjourneyViewer, נווט ל-MeetYourPain עם הנתונים
            navigate('/meet-your-pain', {
                state: {
                    answers: responses,
                    prompt: data.prompt || "",
                    apiKey: "70413a13-f6fb-a48d-37fd-a74fbf384e00"
                }
            });

        } catch (error) {
            console.error('❌ Error submitting answers:', error);

            // גם במקרה של שגיאה, נווט ל-MeetYourPain
            navigate('/meet-your-pain', {
                state: {
                    answers: responses,
                    prompt: "",  // פרומפט ריק יגרום לקומפוננטה ליצור פרומפט מקומי
                    apiKey: "70413a13-f6fb-a48d-37fd-a74fbf384e00"
                }
            });
        }
        setIsSubmitting(false);
    };

    // Determine if this is a special page type
    const isPainLocationPage = pageData.title === 'Pain Location';

    // Format questions for our Question component
    const formattedQuestions = getCurrentPageQuestions().map(q => {
        let options = [];

        // Determine options based on scale min/max or defined options
        if (q.scale_min !== null && q.scale_max !== null) {
            for (let i = q.scale_min; i <= q.scale_max; i++) {
                options.push(i);
            }
        } else if (q.options) {
            options = q.options.split(', ')
        } else {
            // Default to 1-5 scale
            options = [1, 2, 3, 4, 5];
        }

        return {
            id: q.question_ID,
            text: q.Question,
            options: options,
            questionType: q.question_type,
            left_label: q.left_label,
            right_label: q.right_label
        };
    });

    const handleOtherOptionSelect = (questionId, value) => {
        setOthers({
            ...others,
            [questionId]: value
        });
    }

    // Calculate progress percentage
    const progressPercentage = (currentPage / totalPages) * 100;

    // תצוגת השאלון הרגילה
    return (
        <div className="form-page">
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
                        {isPainLocationPage && formattedQuestions.map(question => (
                            <BodyMapQuestionnaire
                                key="body-map"
                                selectedBodyParts={selectedBodyParts}
                                setSelectedBodyParts={setSelectedBodyParts}
                            />
                        ))}
                        {/* Regular questions for all other pages */}
                        {!isPainLocationPage && formattedQuestions.map(question => {
                            if (question.questionType === 'scale') {
                                return (<Question
                                    key={question.id}
                                    id={question.id}
                                    text={question.text}
                                    selectedValue={responses[question.id]}
                                    onSelect={handleOptionSelect}
                                    leftLabel={question.left_label}
                                    rightLabel={question.right_label}
                                    options={question.options}
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
                        })}
                    </div>

                    <div className="navigation">
                        {currentPage > 1 && (
                            <PrimaryButton
                                text="PREVIOUS"
                                onClick={handlePrevious}
                                className="previous-button"
                            />
                        )}

                        {currentPage < totalPages ? (
                            <PrimaryButton
                                text="NEXT"
                                onClick={handleNext}
                                disabled={!allQuestionsAnswered}
                            />
                        ) : (
                            <PrimaryButton
                                text={isSubmitting ? "SUBMITTING..." : "VISUALIZE PAIN"}
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

export default DetailedQuestionnairePage;